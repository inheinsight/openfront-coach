# Strategy notes behind the coach

These notes are what the coach's rules are built on. They were rebuilt on 2026-10-30 from deep research: the engine source, the patch history, 2026 player guides and videos, and a replay study of 28 public games. The full report, with sources and a rule-by-rule verdict, is [reports/OpenFront current meta coaching.md](../reports/OpenFront%20current%20meta%20coaching.md).

Engine facts come from the **v35 release branch** (v0.35.9, commit `7ee96860`), which is what public lobbies run; `main` has diverged from it. The balance changes often, so re-check engine numbers against `packages/engine/src/configuration/EngineConfig.ts` and `packages/engine-lib/src/configuration/Config.ts` at the commit in a new game record. The coach keeps its numbers in one place: `src/analysis/rules.ts`.

## Engine facts the coach relies on

- **Troop cap.** For humans it's `2 × (tiles^0.6 × 1000 + 50,000)`, plus 250k per completed City level. Bots get a third of that. Nations get ×0.5, 0.75, 1 or 1.25 by difficulty.
- **Troop regen per tick.** It's `(10 + troops^0.73 / 4) × (1 − troops / cap)`, ten ticks a second. It peaks with troops at 0.73 / 1.73 ≈ **42% of the cap** and is zero at the cap. Troops away on an attack don't regrow.
- **Gold.** A flat 100 per tick (60k/min) for humans and nations, 50 for bots. Cities produce no gold.
  - **Trade ships** pay `75k / (1 + e^(−0.03(d − 300))) + 50·d` to *both* port owners: about 5k at 100 tiles, 14k at 200, 52k at 300, 100k at 500, 150k at 1,500. Each Port level rolls for its own ships; v0.35 speeds up ships and trains for players with few Ports or Factories.
  - **Train stops** pay the train owner and the station owner: 10k at your own station, 25k at a teammate's or anyone else's, 35k at an ally's. A Factory links any player's Cities and Ports within 110 tiles.
  - **Conquest** gold is paid only by the hit that eliminates a target (under 100 tiles): all of a bot's or nation's gold, half of a human's.
  - In current public lobbies trade ships and trains supply 92–98% of everyone's income after minute 5.
- **Costs.** All values come from `EngineConfig.unitCost`.
  - City: 125k × 2ⁿ, max 1M.
  - Port and Factory: one shared ladder, same curve.
  - Defense Post: 50k × (n+1), max 250k.
  - Warship: 250k × (n+1), max 1M.
  - Missile Silo: 1M.
  - SAM: 1.5M, then 3M.
  - Atom bomb: 750k. Hydrogen bomb: 5M.
  - MIRV: 25M + 15M per MIRV anyone in the lobby has launched.
- **Attacks.** The slider defaults to 20%.
  - Losses per tile scale with `clamp(defender's home troops / your stack, 0.6, 2)`, plus a term for how densely the defender packs troops. You pay **double at half their home troops or less**, and losses are **cheapest from about 1.67×**. "Home troops" excludes troops the defender has out on attacks, so hitting someone right after they send their army elsewhere is cheap.
  - Against a bot you lose only 70% of the usual troops per tile.
  - Expansion into plains stops speeding up once an attack holds about 6,600 troops (8k highland, 10k mountain), so big opening sends buy no speed.
  - Opposing attacks cancel troop for troop before land changes hands.
  - Retreating from a player forfeits 25% of the surviving troops; retreating from open land is free.
  - Attacking a human makes them embargo you for 5 minutes, which stops trade between you.
- **Defense Posts.** Attackers lose about 5× as many troops and move 3× slower within 30 tiles of one; on mountains the losses climb to about 7.5× plains. Posts are destroyed when their land is taken; other buildings are captured with their level.
- **SAMs.** Level 1 covers 70 tiles (about 81 and 90 at levels 2 and 3), never misses, holds one missile per level and reloads in 9 s. A SAM shoots down any enemy nuke whose path enters its range, whoever it's aimed at, so a teammate's SAM covers you. A SAM takes 30 s to build; a Hydrogen bomb crosses 1,000 tiles in about 10.
- **Nukes.** Losing a share *x* of your land to a nuke kills about 1 − (1 − *x*)⁵ of your troops: 20% of the land costs about two-thirds of the army.
- **Betrayal.** Breaking an alliance makes you a traitor for 30 s: attackers lose half as many troops against you and take your land about 25% faster. A nuke that hits an ally's land breaks the alliance too.
- **Nations.** Medium nations betray an ally once they hold 10× its troops, or 3× when it is their only neighbour, or when it is a traitor with under 1.2× their troops. There is no "betray below 20% of cap" rule.
- **Win condition.** More than 80% of non-fallout land, summed across a team in team games. Public FFA runs **Overtime**: from minute 30 the bar drops 2 points a minute. Team games have a 170-minute limit.
- **Spawn phase.** 100 turns in single player, 150 with random spawn, 200 otherwise.

## Game modes

The coach picks its rule set from the record (`src/analysis/mode.ts`).

| Mode | Rule set | Why |
| --- | --- | --- |
| Free For All | Individual | Your land is your result. Nations, alliances and Overtime matter. |
| Duos, Trios, Quads | Individual, plus donations and teammate SAMs | Many small teams play close to FFA: your own land predicts the result. |
| 2–3 teams, Humans vs Nations | Team | The team's land wins; your own land share doesn't predict whether your team won. Diplomacy with the other side is moot. |
| 4–7 teams | Blend | Teammates and donations, but also cross-team alliances. |

Public Team lobbies have no nations (except Humans vs Nations, with Hard nations), 400 bots, troop and gold donations on, and no timer.

- **Donations.** The default gift is a third of your troops or gold. A troop gift is capped at the room left under the receiver's cap, and you keep the rest. Gold and troop gifts to the same teammate share one 10 s cooldown. You can't give to a disconnected teammate.
- **Win credit.** Every teammate who spawned shares the win if still connected or already eliminated. A player who leaves while alive keeps it only if the team already held 70% of the land.
- **Feeding.** In the replay study the biggest player in a Team game received a median 16.7M troops from teammates, and troops received track finishing rank (ρ +0.51). For a backline player, troops in a front-liner's stack lose fewer troops per tile than a second small stack, and troops at the cap don't regrow, so the surplus belongs in someone else's attack.
- **Trade.** A ship pays both ends the same, so in a two-sided game trade with the enemy team pays them as much as you. Turn on Stop Trading with Enemies and trade with teammates; their train stops pay 25k to both sides.

## What winners do in current public lobbies

From 28 public games on October 2026 builds (22 Team, 6 FFA), comparing each lobby's top five by peak land with everyone else:

- **Land at 5:00** predicts the final rank best (ρ 0.84); land at 0:30 and the delay before the first click don't (ρ 0.07 and −0.09).
- **Everyone clicks about 20%** at a time, winners included: openings are four or five quick clicks.
- **Stack size** is the clearest controllable difference: a median 1.53× the defender's army for each game's top player, 0.99× for the top five and 0.53× for the median human.
- **Income in minutes 5–10**: 2.84M/min for the top five against 1.50M for the median. They build twice as much in the first ten minutes, with the first Port at about 2:00 and the first Factory at about 2:52. First-City timing barely matters (ρ −0.14).
- **SAM cover** came about 66 s after the first enemy Silo for the top five, 103 s for the rest (own SAMs). Measured the coach's way, as the first SAM over any of your Cities, the medians are about 2 minutes against 5½, and 19% of top players against 45% of the rest never had cover.
- **Banking**: top players hold more gold in absolute terms, the same in minutes of their own income. Late in FFA, leaders bank for Hydrogen bombs and MIRVs and keep a full army as a deterrent.

`npx tsx scripts/rule-audit.ts [--team | --ffa]` re-runs every rule for every human in the cached games and reports how often each fires on the top five against the rest. Run it after changing a rule: one that fires on winners as often as on the rest measures activity or wealth, not mistakes. A few rules fire on leaders by design because leaders are the targets: the late-SAM moment (nukes land before cover more often on the players being nuked, while the SAM delay itself still separates winners), nukes shot down and structures lost near the front. Only nuke-related moments that depend on what *you* did are kept; "nukes launched at you" and "nukes aimed at uncovered land" were dropped as grades because attackers pick the leader and aim at gaps on purpose.

## Advice the coach no longer gives

- **"Full-send at the start, then 60–70%."** No winner does it, the engine gives big sends no extra speed, and every 2026 teacher clicks 10–30%.
- **"First City by 2:30."** Cities stopped producing gold in v0.25 (August 2025). The coach now grades the first Port or Factory, and flags a late City only when the troop cap was holding you back.
- **"SAMs from minute 5" and the minute-3/5/8 nuke timetable.** SAM timing is now tied to the first enemy Silo.
- **"Unspent gold is always a mistake."** Only idle gold with nothing to save for, before 15:00, is flagged.
- **"Retreating is a mistake."** Retreats are rare for everyone; they're a cost, not an error.
- **"Hard nations betray allies below about 20% of their cap."** No such rule exists.
- **"Slow first expansion."** It fired on winners and losers alike.
- **"Under 40% of spending on the economy."** Winners spend more on SAMs, Silos and warships, not less on the economy.

## Community guidance (version-dependent)

- **Opening.** Click about 20% into open land each time the bar refills, along two lanes, and keep at least a quarter of your cap at home in the first three minutes. Hit bots with about twice their troops. ([openfront.fyi: opening](https://openfront.fyi/strategies/ffa-opening/), Goodkat's Ultimate Beginner's Guide, Ash, Sinful73)
- **Troop bands.** 35–50% of the cap on quiet borders, 50–70% under pressure; above that, attack or donate. ([openfront.fyi: economy](https://openfront.fyi/mechanics/economy/))
- **Build order.** City-first is still the majority written view; Port-first and alternating City/Port are common in team play. The evidence supports building both within a minute and having a Port and a Factory earning by about 3:00.
- **Nukes.** Have a Silo and Hydrogen-bomb money once rivals do; SAMs over your densest Cities within a minute of the first enemy Silo. ([openfront.fyi: nukes](https://openfront.fyi/mechanics/nukes/))
- **Team roles.** Front-liners hold the border and attack with fed stacks; backliners keep troops near 40–50% of the cap, donate 30–40% to the front each time they pass half, and build Ports and Factories that link to teammates. (Lonely_Millennial's team guide, openfront.fyi)
- **Under attack by someone bigger.** Don't counter with your whole army: wear the push down with small clicks, drop Defense Posts on high ground, then offer an alliance (FFA) or ask for troops (Team).
- **Common mistakes.** Big opening sends; attacking players with a stack smaller than their home army; a late first Port or Factory; no SAM after the first enemy Silo; idling at the cap while a teammate is fighting; leaving a team game early; trading with the enemy team.

## Coaching patterns borrowed from other games

| From | Pattern | Here |
| --- | --- | --- |
| chess.com / Lichess | Moves classified by their effect on winning chances; key moments on an eval graph | `!! ! ?! ? ??` moments pinned on the front-line chart |
| AoE2 "five numbers" | A short triage card before the deep dive | Key numbers on the debrief tab |
| StarCraft spending quotient | Penalise unspent resources relative to income | "Gold sitting unspent", in minutes of income (low weight; banks for SAMs and bombs are fine) |
| OpenDota / sc2replaystats | Benchmarks against peers | Lobby median, best human and percentile on every metric |
| Mobalytics GPI | Skill axes and trends | Category grades and the Progress page |
| chess.com Retry / Lichess "learn from mistakes" | Drills from your own errors | Next-game drills with checkable goals |
