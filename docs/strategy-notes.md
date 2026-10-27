# Strategy notes behind the coach

These notes are what the coach's rules are built on. Engine facts come from OpenFront's source (`main`, read 2026-10-26); community advice is linked. The balance changes often, so re-check engine numbers against `packages/engine/src/configuration/EngineConfig.ts` and `packages/engine-lib/src/configuration/Config.ts` on each release. The coach keeps its numbers in one place: `src/analysis/rules.ts`.

## Engine facts the coach relies on

- **Troop cap.** For humans it's `2 × (tiles^0.6 × 1000 + 50,000)`, plus 250k per completed City level. Bots get a third of that. Nations get ×0.5, 0.75, 1 or 1.25 by difficulty.
- **Troop regen per tick.** It's `(10 + troops^0.73 / 4) × (1 − troops / cap)`, ten ticks a second. It peaks with troops at 0.73 / 1.73 ≈ **42% of the cap** and is zero at the cap. This drives the troop-efficiency score and the "idle army" moments.
- **Gold.** A flat 100 per tick (60k/min) for humans. Conquering a bot or nation transfers all its gold; a human gives half. Trade-ship gold follows a sigmoid in distance, so routes under ~300 tiles pay very little.
- **Costs.** All values come from `EngineConfig.unitCost`.
  - City: 125k × 2ⁿ, max 1M.
  - Port and Factory: one shared ladder, same curve.
  - Defense Post: 50k × (n+1), max 250k.
  - Warship: 250k × (n+1), max 1M.
  - Missile Silo: 1M.
  - SAM: 1.5M, then 3M.
  - Atom bomb: 750k. Hydrogen bomb: 5M.
  - MIRV: 25M + 15M per MIRV already launched.
- **Attacks.** An attack sends `troops / 5` by default (the 20% attack ratio).
  - Losses per tile scale with `clamp(defender's total troops / your stack, 0.6, 2)`, so a stack under ~60% of the defender's army pays up to double. This is why the attack ledger compares your stack with their army.
  - Retreating from a player forfeits 25% of the surviving troops.
- **Betrayal.** Breaking an alliance makes you a traitor for 30 s: attackers lose half as many troops against you.
- **Win condition.** More than 80% of non-fallout land.
- **Spawn phase.** 100 turns in single player, 150 with random spawn, 200 otherwise.

## Community guidance (version-dependent)

- **Opening.** Full-send at the very start, then about 60–70% while expanding into unclaimed land. Use two expansion lanes, not three fronts. ([openfront.fyi: FFA opening](https://openfront.fyi/strategies/ffa-opening/), [attack ratio](https://openfront.fyi/guides/attack-ratio/))
- **Troop bands.** Keep troops at 35–50% of the cap on quiet borders and 50–70% under pressure. Above 80%, convert troops into land or raise the cap. ([openfront.fyi: economy](https://openfront.fyi/mechanics/economy/))
- **First City.** It usually comes first, in the interior, because the early cap is small and +250k more than doubles it. ([openfront.wiki: Buildings](https://openfront.wiki/Buildings))
- **Nukes.** Economy only before minute 3; a Silo and SAM at 3–5; bank for a Hydrogen bomb at 5–8. A level-1 SAM covers 70 tiles. ([openfront.fyi: nukes](https://openfront.fyi/mechanics/nukes/))
- **Nation behaviour.** Hard and Impossible nations may betray an ally whose troops fall below about 20% of its cap. ([openfront.fyi: nations](https://openfront.fyi/mechanics/nations/))
- **Common mistakes.**
  - Sitting at the cap.
  - Mid-game full sends.
  - Retreating.
  - Banking gold.
  - Two-front wars.
  - Short trade routes.
  - Big boats into warship patrols.
  - Building SAMs only after launches start.

## Coaching patterns borrowed from other games

| From | Pattern | Here |
| --- | --- | --- |
| chess.com / Lichess | Moves classified by their effect on winning chances; key moments on an eval graph | `!! ! ?! ? ??` moments pinned on the front-line chart |
| AoE2 "five numbers" | A short triage card before the deep dive | Key numbers on the debrief tab |
| StarCraft spending quotient | Penalise unspent resources relative to income | "Gold sitting unspent", in minutes of income |
| OpenDota / sc2replaystats | Benchmarks against peers | Lobby median, best human and percentile on every metric |
| Mobalytics GPI | Skill axes and trends | Category grades and the Progress page |
| chess.com Retry / Lichess "learn from mistakes" | Drills from your own errors | Next-game drills with checkable goals |
