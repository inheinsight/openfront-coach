/**
 * Jev (TypeSafe's System One model) as the coach's judge.
 *
 * The rule engine finds key moments and does all the arithmetic. Jev reads
 * each moment's situation in plain language and returns calibrated,
 * typed judgments: how severe it was (chess-style), whether it was
 * avoidable, and which lesson it teaches. A second request picks the one
 * area the player should focus on next game. Jev's confidence gates how
 * much it can override the rules. About $0.001 a game.
 *
 * Following TypeSafe's guidance for jev-1.13/1.14: keep numbers in code,
 * give the state pre-digested qualitative facts, one narrow question each,
 * and small per-moment states rather than one huge one.
 */
import { choice, noul, TypeSafeClient } from "@typesafe-ai/sdk";
import { config } from "../config.js";
import { clock } from "../analysis/rules.js";
import type { Analysis, KeyMoment, Severity } from "../analysis/types.js";

const SEVERITY_CRITERIA = {
  brilliant: "An unusually strong decision or outcome that sharply improved the player's position, the kind a strong player would be proud of.",
  good: "A sound decision or a clearly positive outcome for the player.",
  inaccuracy: "A small, recoverable error: some troops, gold, time or land wasted, without changing the course of the game.",
  mistake: "A clear error that cost a significant amount of land, troops or tempo and made the game noticeably harder.",
  blunder: "A severe error that lost the player most of their position, or directly led to elimination or a lost game.",
} as const;

const LESSONS = {
  expansion_speed: "Expand faster or earlier into unclaimed land and weak bots.",
  troop_reserve: "Keep a troop reserve at home (about 35-60% of the cap) instead of emptying the army or idling at the cap.",
  target_selection: "Choose better attack targets: weaker, distracted or isolated enemies rather than strong, focused ones.",
  attack_sizing: "Size attacks correctly: big enough stacks relative to the defender's army, no mid-game full sends.",
  two_front: "Avoid fighting on two fronts at once.",
  economy_spending: "Spend gold promptly on Cities, Ports and Factories instead of banking it.",
  defense_structures: "Use Defense Posts and defensive positioning on threatened borders.",
  nuke_defense: "Build SAM launchers before rivals start launching nukes.",
  diplomacy: "Use alliances and betrayals more carefully.",
  naval_safety: "Protect transport boats and naval landings.",
  keep_doing: "Nothing to fix: this was good play to repeat.",
} as const;

const RANK: Record<Severity, number> = { blunder: 0, mistake: 1, inaccuracy: 2, info: 3, good: 4, brilliant: 5 };

export interface JevSummary {
  used: boolean;
  model?: string;
  questions?: number;
  tokens?: number;
  error?: string;
  focus?: { area: string; confidence: number };
  decider?: { label: string; confidence: number };
  lessons?: Record<string, number>;
}

function client() {
  return new TypeSafeClient({
    apiKey: config.typesafeApiKey,
    ...(config.typesafeBaseUrl ? { baseURL: config.typesafeBaseUrl } : {}),
    defaultModel: config.jevModel,
    timeout: 20_000,
    retry: { maxRetries: 2 },
    logLevel: "off",
  });
}

export function jevAvailable() {
  return !!config.typesafeApiKey;
}

function gameContext(a: Analysis) {
  return {
    game: `${a.game.mode} ${a.game.type} game on the ${a.game.map} map with ${a.game.humans} human players, ${a.game.nations} AI nations and ${a.game.bots} bot tribes; difficulty ${a.game.difficulty}.`,
    player: a.me.name,
    finalResult: `${a.me.result}${a.me.placement ? `, placed ${a.me.placement} of ${a.me.placementOf}` : ""}; peaked at ${(a.me.peakLandShare * 100).toFixed(1)}% of the map.`,
    rulesOfThumb: [
      "Troop growth is fastest when troops sit around 40% of the troop cap and stops at the cap.",
      "Attacking with a stack smaller than about 60% of the defender's whole army costs up to double losses per tile.",
      "Retreating from a player forfeits 25% of the surviving troops.",
      "Breaking an alliance makes you a traitor for 30 seconds: attackers lose half as many troops against you.",
      "Cities raise the troop cap by 250k per level; gold that sits unspent does nothing.",
    ],
  };
}

function momentState(a: Analysis, m: KeyMoment) {
  return {
    ...gameContext(a),
    moment: {
      time: clock(m.tick),
      category: m.kind,
      whatHappened: `${m.title}. ${m.detail}`,
      landShareChangeOverNextMinute: m.landShareDelta === undefined ? "unknown" : `${m.landShareDelta >= 0 ? "+" : ""}${m.landShareDelta.toFixed(1)} percentage points`,
      facts: m.evidence,
      ruleEngineVerdict: m.severity,
    },
  };
}

/** Ask Jev about each key moment and the game overall; mutates `analysis` in place. */
export async function judgeWithJev(analysis: Analysis): Promise<JevSummary> {
  if (!jevAvailable()) return { used: false, error: "TYPESAFE_API_KEY not set" };
  const c = client();
  const judged = analysis.moments.filter((m) => m.kind !== "death" && m.severity !== "info").slice(0, 14);
  let tokens = 0;
  let questions = 0;
  let model: string | undefined;
  const lessons: Record<string, number> = {};
  try {
    const results = await Promise.all(
      judged.map((m) =>
        c
          .systemOne({
            state: momentState(analysis, m) as never,
            questions: {
              severity: choice(
                "How should this moment in the player's OpenFront game be classified, judged by its effect on the player's chances in this game?",
                SEVERITY_CRITERIA,
              ),
              avoidable: noul(
                "The negative outcome in this moment was mainly caused by the player's own decision, and a better decision was available to them at the time. Answer no if the moment was positive or the player had no realistic alternative.",
              ),
              lesson: choice("Which single lesson does this moment teach the player most directly?", LESSONS),
            },
          })
          .then((r) => ({ m, r })),
      ),
    );
    for (const { m, r } of results) {
      model = r.model;
      tokens += r.usage.input_tokens;
      questions += 3;
      const sev = r.answers.severity;
      const label = sev.choice as Severity;
      const diff = Math.abs(RANK[label] - RANK[m.severity]);
      // The further Jev's label is from the rules', the surer it must be.
      const adopt = diff <= 1 ? sev.confidence >= 0.6 : diff === 2 ? sev.confidence >= 0.85 : sev.confidence >= 0.95;
      m.jev = {
        label,
        confidence: +sev.confidence.toFixed(3),
        probabilities: Object.fromEntries(Object.entries(sev.probabilities).map(([k, v]) => [k, +Number(v).toFixed(3)])),
        agreedWithRules: label === m.severity,
      };
      (m.evidence as Record<string, unknown>).jevAvoidable = +r.answers.avoidable.noul.toFixed(3);
      (m.evidence as Record<string, unknown>).jevLesson = r.answers.lesson.choice;
      if (adopt && label !== m.severity) m.severity = label;
      if (r.answers.lesson.choice !== "keep_doing" && RANK[m.severity] <= RANK.inaccuracy) {
        lessons[r.answers.lesson.choice] = (lessons[r.answers.lesson.choice] ?? 0) + (RANK.inaccuracy + 1 - RANK[m.severity]) * r.answers.lesson.confidence;
      }
    }

    // One overall request: what decided the game, and what to focus on next.
    const overall = await c.systemOne({
      state: {
        ...gameContext(analysis),
        categoryGrades: Object.fromEntries(analysis.categories.map((k) => [k.label, `${k.grade} — ${k.summary}`])),
        keyMoments: analysis.moments.map((m) => `${clock(m.tick)} [${m.severity}] ${m.title}`),
        weaknesses: analysis.weaknesses,
      } as never,
      questions: {
        focus: choice(
          "Which one area should this player practise before their next game to improve their results the most?",
          Object.fromEntries(analysis.categories.map((k) => [k.key, `${k.label}: ${k.summary}`])) as Record<string, string>,
        ),
        decider: choice("What decided how this game went for the player?", {
          opening: "The opening: how fast they expanded in the first minutes.",
          economy: "Economy: how well they turned gold into Cities, trade and troop cap.",
          single_collapse: "One big collapse or defeat in a single fight.",
          outscaled: "A bigger player simply outgrew and overran them.",
          diplomacy: "Alliances or betrayals.",
          nukes: "Nuclear weapons.",
          strong_play: "Their own strong play carried the game.",
        }),
      },
    });
    tokens += overall.usage.input_tokens;
    questions += 2;
    const focus = { area: overall.answers.focus.choice, confidence: +overall.answers.focus.confidence.toFixed(3) };
    const decider = { label: overall.answers.decider.choice, confidence: +overall.answers.decider.confidence.toFixed(3) };

    // Put the drill for Jev's focus area first when it's confident.
    if (focus.confidence >= 0.5) {
      const keyToMetric: Record<string, string[]> = {
        troops: ["troopEff"],
        expansion: ["share120"],
        economy: ["firstCity", "float"],
        combat: ["attackEff"],
        defense: ["drawdown"],
        nuclear: ["nukesTaken"],
      };
      const keys = keyToMetric[focus.area] ?? [];
      analysis.drills.sort((x, y) => Number(keys.includes(y.metricKey ?? "")) - Number(keys.includes(x.metricKey ?? "")));
    }
    return { used: true, model, questions, tokens, focus, decider, lessons };
  } catch (e) {
    return { used: false, error: e instanceof Error ? e.message : String(e), questions, tokens };
  }
}

export const LESSON_TEXT = LESSONS;
