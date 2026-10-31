# OpenFront.io gameplay and balance history, January 2025 to October 2026, and the strategy advice each change invalidated or created

Method note (applies to every section). The primary sources are:
- the GitHub release notes for v0.23 to v0.35.9 (`gh api repos/openfrontio/OpenFrontIO/releases`);
- the config files at each tag, read from a blobless clone and diffed function by function: `src/core/configuration/DefaultConfig.ts` up to v0.31.x, `src/core/configuration/Config.ts` for v0.32–v0.34, and `packages/engine/src/configuration/EngineConfig.ts` plus `packages/engine-lib/src/configuration/Config.ts` from v0.35.0;
- the config-file commit history.

There are no GitHub releases before v0.23 (May 2025). Early-2025 entries therefore rely on tag dates and the commit messages and values in `DefaultConfig.ts`.

Abbreviations: "tick" = 100 ms, so 10 ticks per second. `d` = trade-route distance in tiles. "Repo" = https://github.com/openfrontio/OpenFrontIO.

Correction to the brief: the file move was not in October 2025. `DefaultConfig.ts` was folded into `src/core/configuration/Config.ts` at v0.32.0 (2026-06-17). The `packages/engine` / `packages/engine-lib` split happened at v0.35.0 (2026-10-16). Both points are confirmed by the file layout at those tags ([v0.31.12 tree](https://github.com/openfrontio/OpenFrontIO/tree/v0.31.12/src/core/configuration), [v0.32.0 tree](https://github.com/openfrontio/OpenFrontIO/tree/v0.32.0/src/core/configuration), [v0.35.0 EngineConfig.ts](https://github.com/openfrontio/OpenFrontIO/blob/v0.35.0/packages/engine/src/configuration/EngineConfig.ts)).

---

## Q1. Dated timeline of gameplay-relevant changes (version, date, before → after, link, and the advice each one changed)

### Takeaway
There were three eras.
- **Population and workers, until v0.25.0 (2025-08-21).** Gold came from workers, and you split population between troops and workers with a slider.
- **Flat gold plus trade and trains, v0.25 to v0.29.** Gold became a flat 100 per tick, and Factories and trains went public. Trade gold had a per-port multiplier. From 2025-10-31, short routes were penalized.
- **Trade-flow economy, v0.30.0 (2026-03-12) onward.** The port multiplier was removed. The trade-ship cap rose from about 100 to about 400, then gave way to saturation curves (v0.34). Small economies got a spawn boost (v0.35).

Meanwhile:
- SAMs became deterministic (v0.28.1). Their range now grows with level.
- MIRVs got escalating prices (v0.28) and became interceptable warheads (v0.33).
- Attack losses were rebuilt around troop ratio × defender density (v0.34).
- Alliances fell to 5 minutes (July 2025).
- Conquest of a human now yields half their gold (v0.31).
- Team games now need 80% land, not 95% (v0.34).

### Cited Findings

**Early 2025: the population/worker era (v0.14–v0.23)**
- **v0.14.1 (tag 2025-02-12): baseline.**
  - Gold per tick = `sqrt(workers × tiles) / 200`.
  - Max population = `2·(tiles^0.6·1000 + 50k) + cities × cityPopulationIncrease`.
  - Troops move toward `population × targetTroopRatio`, the slider.
  - Trade-ship gold = `10k + 100·d^1.1`. Port cost = `250k·2^n`. Alliance = 10 minutes. Win = 95% of land. Multiplayer spawn phase = 300 turns.
  - Advice it supported: "balance the troop/worker slider", "more land means more gold", "cities raise population and so gold".
  - Source: [v0.14.1 DefaultConfig.ts](https://github.com/openfrontio/OpenFrontIO/blob/v0.14.1/src/core/configuration/DefaultConfig.ts)
- **2025-02-13 to 02-15: attack and nuke tuning.** The commits "greatly reduce attack bonus for large attacks", "make h-bomb smaller, make mirv 15 million" and "rebalance: attackers lose fewer troops" — [commit 2f8a746a](https://github.com/openfrontio/OpenFrontIO/commit/2f8a746a), [0d4f91a5](https://github.com/openfrontio/OpenFrontIO/commit/0d4f91a5), [d08b984c](https://github.com/openfrontio/OpenFrontIO/commit/d08b984c)
- **v0.15.0 (2025-02-23): cheaper ports, lower win bar.**
  - Port base cost 250k → 125k ("make ports cheaper to encourage more trades").
  - Win threshold 95% → 80%.
  - Defense-post range 40 → 30.
  - Sources: [commit e2185b62](https://github.com/openfrontio/OpenFrontIO/commit/e2185b62), [v0.15.0 DefaultConfig.ts](https://github.com/openfrontio/OpenFrontIO/blob/v0.15.0/src/core/configuration/DefaultConfig.ts)
- **2025-03-03: traitor debuff.** Traitors get a 0.8 defense debuff — [commit 49a54cd8](https://github.com/openfrontio/OpenFrontIO/commit/49a54cd8). The same day, a commit "reduce alliance to 4 minutes" landed ([ccebe866](https://github.com/openfrontio/OpenFrontIO/commit/ccebe866)). However, the config at v0.18.0–v0.24.0 still reads 10 minutes, so it did not stick (see Gaps).
- **2025-03-06 to 03-12 (v0.17.x–v0.18.0): warships and trade.**
  - The Destroyer and Battleship were replaced by one Warship at `250k × (n+1)`, capped at 1M ([commit df2bb36a](https://github.com/openfrontio/OpenFrontIO/commit/df2bb36a)).
  - Trade was nerfed ("1/500 => 1/700", [c5151b45](https://github.com/openfrontio/OpenFrontIO/commit/c5151b45)).
  - Trade gold became `10k + 150·d^1.1` at v0.18.0 ([v0.18.0 config](https://github.com/openfrontio/OpenFrontIO/blob/v0.18.0/src/core/configuration/DefaultConfig.ts)).
- **2025-03-09: SAM launcher added** ([PR #176](https://github.com/openfrontio/OpenFrontIO/pull/176)). At v0.20.0 (2025-03-31) it cost `(n+1)·1.5M`, capped at 4.5M ([v0.20.0 config](https://github.com/openfrontio/OpenFrontIO/blob/v0.20.0/src/core/configuration/DefaultConfig.ts)). It was nerfed on 2025-03-16 ([PR #258](https://github.com/openfrontio/OpenFrontIO/pull/258)), and the cap fell to 3M on 2025-04-17 ([PR #529](https://github.com/openfrontio/OpenFrontIO/pull/529)).
- **v0.19.0 (2025-03-18): trade-ship spawn rate now depends on how many ports you own** ([v0.19.0 config](https://github.com/openfrontio/OpenFrontIO/blob/v0.19.0/src/core/configuration/DefaultConfig.ts)).
- **2025-04-02 to 04-09: costs and win bar.**
  - MIRV 25M ([f09801fe](https://github.com/openfrontio/OpenFrontIO/commit/f09801fe)).
  - Team games need 95% to win ([1e480b79](https://github.com/openfrontio/OpenFrontIO/commit/1e480b79)).
  - City cost capped at 1M ([76e066c7](https://github.com/openfrontio/OpenFrontIO/commit/76e066c7)).
  - Atom bomb briefly 500k, then back to 750k ([9837401a](https://github.com/openfrontio/OpenFrontIO/commit/9837401a), [89fb1c0f](https://github.com/openfrontio/OpenFrontIO/commit/89fb1c0f)).
- **2025-04-17/18: traitor rule and SAM versus MIRVs.**
  - "Traitor only lasts 30 seconds, 50% defense debuff" ([ae4f4d3e](https://github.com/openfrontio/OpenFrontIO/commit/ae4f4d3e); later "increase traitor duration 15s => 30s", [ea323f91](https://github.com/openfrontio/OpenFrontIO/commit/ea323f91)).
  - SAMs protect against MIRV warheads ([PR #376](https://github.com/openfrontio/OpenFrontIO/pull/376)).
  - The 30 s / 0.5 values are still current ([v0.35.9 Config.ts](https://github.com/openfrontio/OpenFrontIO/blob/v0.35.9/packages/engine-lib/src/configuration/Config.ts)).
- **2025-04-15 to 05-05: team modes.**
  - Up to seven teams ([PR #445](https://github.com/openfrontio/OpenFrontIO/pull/445)).
  - Duos ([PR #630](https://github.com/openfrontio/OpenFrontIO/pull/630)).
  - "Double the player count of team games (max 150), and do 3:1 ffa:team ratio" ([c97eca0e](https://github.com/openfrontio/OpenFrontIO/commit/c97eca0e)).
- **2025-05-18 to 06-01 (v0.23.x): the "new meta".**
  - Gold formula changed to `0.045 × workers^0.7` per tick ([PR #757](https://github.com/openfrontio/OpenFrontIO/pull/757)).
  - v0.23.1 (2025-05-31) briefly used a linear max population of `tiles×30 + 50k`. It was reverted on 2025-06-01 ("Revert meta", [PR #1002](https://github.com/openfrontio/OpenFrontIO/pull/1002)); by v0.23.19 it was back to `2·(tiles^0.6·1000+50k)`.
  - Lobby sizes were capped at 150 ([PR #984](https://github.com/openfrontio/OpenFrontIO/pull/984)).
  - Sources: [v0.23.1 config](https://github.com/openfrontio/OpenFrontIO/blob/v0.23.1/src/core/configuration/DefaultConfig.ts), [v0.23.19 config](https://github.com/openfrontio/OpenFrontIO/blob/v0.23.19/src/core/configuration/DefaultConfig.ts)
- **2025-06-09/10: speed and upgrades.** Nuke speed 4 → 6 tiles per tick ([PR #1125](https://github.com/openfrontio/OpenFrontIO/pull/1125)). Upgradable (stackable) Cities, Ports, SAMs and Silos ([PR #1012](https://github.com/openfrontio/OpenFrontIO/pull/1012)).

**v0.24 (July 2025): Factories, trains, stacking**
- **v0.24.0 (2025-07-18).**
  - Factories and trains arrive, in private lobbies and single player only.
  - Structures can be upgraded by building on top of them. Building discounts can be used only once.
  - Trade ships capped at 150. Trade gold = `(50k + 100·d) × (1 + Σ 0.25·0.9^i over ports)`, so each extra port raised the gold per ship.
  - MIRV 25M → 35M. Warships prioritize transports.
  - SAMs target only nukes threatening nearby areas. SAM range 80.
  - Trios and Quads added.
  - Source: [v0.24.0 release](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.24.0), [v0.24.0 config](https://github.com/openfrontio/OpenFrontIO/blob/v0.24.0/src/core/configuration/DefaultConfig.ts)
  - Advice it created: "more ports = more gold per ship" and "stack structures".
- **v0.24.x (2025-07-19 to 07-24).**
  - Bot troop regen ×0.7 → ×0.6 ([PR #1503](https://github.com/openfrontio/OpenFrontIO/pull/1503)).
  - "Reduce traitor debuff": the traitor speed debuff went 0.6 → 0.8 ([52734505](https://github.com/openfrontio/OpenFrontIO/commit/52734505)).
  - **Alliance 10 → 5 minutes** ([PR #1535](https://github.com/openfrontio/OpenFrontIO/pull/1535); config at [v0.24.13](https://github.com/openfrontio/OpenFrontIO/blob/v0.24.13/src/core/configuration/DefaultConfig.ts)).
  - MIRV damage asymptotes to about 5% of population ([PR #1570](https://github.com/openfrontio/OpenFrontIO/pull/1570)).
- **2025-07-27: "Attack Meta Test" beta** — "Nerf attack & defense for larger players to reduce snowballing" ([release v0.24.0-beta-meta-test](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.24.0-beta-meta-test)). It shipped in v0.25.0.

**v0.25 (August 2025): workers removed; flat gold; Factories go public**
- **v0.25.0 (2025-08-21).** The "Remove workers & troop ratio bar, only have troops" change merged on 2025-08-01 ([PR #1676](https://github.com/openfrontio/OpenFrontIO/pull/1676)).
  - "Players earn 1k gold per second, bots earn 500 gold per second" (flat 100 and 50 per tick).
  - Factories and trains go into public matches.
  - Trade-ship spawn depends on your ports and the total ships on the map.
  - Ports and Factories share one price ladder.
  - Large players get a defense debuff. No traitor debuff for betraying an inactive player. SAM smart targeting.
  - Source: [v0.25.0 release](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.25.0)
  - Config changes ([v0.25.0 config](https://github.com/openfrontio/OpenFrontIO/blob/v0.25.0/src/core/configuration/DefaultConfig.ts)):
    - Bot troop cap = cap/2 → cap/3.
    - SAM range 80 → 70.
    - Trade gold = `(50k + 50·d) × (1 + 2·(ports−1)/(ports+4))`, up to 3× for many ports.
    - Train gold: 50k ally, 25k other, 10k own station.
  - **Invalidated:** the troop/worker slider, "land and population make gold", "cities raise gold".
- **v0.25.4 (2025-08-25).**
  - "Halved trade ship spawn rate but doubled the gold per trade ship": base 100k + 100·d ([PR #1934](https://github.com/openfrontio/OpenFrontIO/pull/1934)).
  - Teammate train gold 50k → 25k ([PR #1933](https://github.com/openfrontio/OpenFrontIO/pull/1933)).
  - Source: [v0.25.4 release](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.25.4)

**v0.26 to v0.28 (October–December 2025): anti-cheese trade, SAM changes, MIRV price**
- **v0.26.0 (2025-10-14).** Improved nation AI. You can capture territory from AFK teammates. A "delete unit" feature. Train tracks go over rivers — [v0.26.0 release](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.26.0)
- **v0.26.12 (2025-10-31): anti-cheese trade.**
  - "Anti-cheese formula that heavily reduces gold rewards for short-distance trade ship routes". Trains spawn 20% more often.
  - Formula = `100k/(1+e^(−0.03·(d−200))) + 100·d` ([PR #2337](https://github.com/openfrontio/OpenFrontIO/pull/2337), [6fd1576d](https://github.com/openfrontio/OpenFrontIO/commit/6fd1576d), [release](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.26.12)).
  - **Created:** the "short trade routes" mistake.
- **v0.26.14 (2025-11-05).** Short-range midpoint 200 → 300 ([d6f5ae73](https://github.com/openfrontio/OpenFrontIO/commit/d6f5ae73)). Trade ships avoid nearby ports ([PR #2381](https://github.com/openfrontio/OpenFrontIO/pull/2381)). Delete-unit cooldown 30 s — [v0.26.14 release](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.26.14)
- **v0.27.0 (2025-11-22).**
  - "SAM range increases when stacked": `samRange(level) = 150 − 480/(level+5)`, so level 1 = 70, level 2 ≈ 81, level 3 = 90 ([PR #2351](https://github.com/openfrontio/OpenFrontIO/pull/2351)).
  - "Added troop penalty when transport ship retreats to nerf boat banking" ([PR #2389](https://github.com/openfrontio/OpenFrontIO/pull/2389)).
  - Nations send retaliation warships.
  - Source: [v0.27.0 release](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.27.0)
- **v0.27.1 (2025-11-23).** Humans vs Nations removed from public games — [release](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.27.1)
- **v0.27.9 (2025-12-12).** Train spawn frequency about −10%: the spawn-rate constant went `(factories+10)·16` → `·18` — [release](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.27.9), [v0.27.10 config](https://github.com/openfrontio/OpenFrontIO/blob/v0.27.10/src/core/configuration/DefaultConfig.ts)
- **v0.28.0 (2025-12-18).**
  - "MIRVs start at 25M and increase 15M with each MIRV launched by any player" (was 35M flat).
  - "Reduced train gold from allies from 50k to 35k".
  - Nation configs rebalanced. Nation troop-cap multipliers changed from Easy 0.5 / Medium 1 / Hard 1.5 / Impossible 2 to 0.75 / 1 / 1.25 / 1.5.
  - Sources: [v0.28.0 release](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.28.0), [v0.28.0 config](https://github.com/openfrontio/OpenFrontIO/blob/v0.28.0/src/core/configuration/DefaultConfig.ts)
- **v0.28.1 (2025-12-23).** "Remove RNG from SAM launchers" ([PR #2665](https://github.com/openfrontio/OpenFrontIO/pull/2665)). Before this, SAMs hit nukes 80% of the time and MIRV warheads 50% (`samHittingChance` / `samWarheadHittingChance` in the [v0.23.19 config](https://github.com/openfrontio/OpenFrontIO/blob/v0.23.19/src/core/configuration/DefaultConfig.ts); both are absent by [v0.28.7](https://github.com/openfrontio/OpenFrontIO/blob/v0.28.7/src/core/configuration/DefaultConfig.ts)).
- **v0.28.5 (2026-01-06).** "Trade ships now provide 50% more gold from distance-based bonuses": 100·d → 150·d — [release](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.28.5). The [v0.29.0 config](https://github.com/openfrontio/OpenFrontIO/blob/v0.29.0/src/core/configuration/DefaultConfig.ts) is back to 100·d; that reversion is not mentioned in any notes I found.

**v0.29 to v0.31 (January–May 2026): ranked, the new trade economy, combat retune**
- **v0.29.0 (2026-01-19).**
  - Ranked 1v1 Elo matchmaking. Humans vs Nations returns (nation count = human count, Hard).
  - Public modifiers: Random Spawn, Compact Map, 5M Starting Gold.
  - Alliances destroy incoming nukes between the new allies.
  - Public player counts come from land tiles, max 125.
  - Nations: less "cheating", better nukes and betrayal logic, more SAMs in team games.
  - Source: [v0.29.0 release](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.29.0)
- **v0.29.5 / v0.29.11 (2026-01-26 / 01-30).**
  - "Nations donate troops now (in team games)". 1v1 spawn immunity 30 s.
  - Easy nations made weaker: cap ×0.75 → ×0.5, regen ×0.95 → ×0.9.
  - Sources: [v0.29.5](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.29.5), [v0.29.11](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.29.11), [v0.29.21 config](https://github.com/openfrontio/OpenFrontIO/blob/v0.29.21/src/core/configuration/DefaultConfig.ts)
- **v0.30.0 (2026-03-12): the trade-flow economy.** Source: [v0.30.0 release](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.30.0)
  - **Public lobbies:** three of them (FFA, Teams, Special).
  - **Trade ships:**
    - "Trade ship cap raised from ~100 to ~400".
    - Trade gold changed to `50k/(1+e^(−0.03·(d−300))) + 50·d`, and the **per-port gold multiplier was removed** ([PR #3232](https://github.com/openfrontio/OpenFrontIO/pull/3232)).
    - Spawning became a per-port roll, slowed by a sigmoid at 200 ships plus a rejection ("pity") modifier.
  - **Trains:** "Railroad income now decreases after the 5th city stop" (−5k per extra city, floor 5k; [PR #3400](https://github.com/openfrontio/OpenFrontIO/pull/3400)). By [v0.30.28](https://github.com/openfrontio/OpenFrontIO/blob/v0.30.28/src/core/configuration/DefaultConfig.ts) the penalty starts after the 9th city.
  - **Combat:** "Attacker troop loss rebalance". The loss is now 0.7 × the old ratio-based term + 0.3 × (1.3 × defender troops per tile × terrain) ([d09cc10b](https://github.com/openfrontio/OpenFrontIO/commit/d09cc10b)).
  - **SAMs:** cooldown 7.5 → 12 s.
  - **Nations:** public difficulty Easy → Medium. Medium/Hard cap multipliers 1 / 1.125 → 0.75 / 1.0.
  - **Conquest and bots:** no gold from conquering never-active players. Bots delete captured structures.
  - Source for the formulas: [v0.30.0 config](https://github.com/openfrontio/OpenFrontIO/blob/v0.30.0/src/core/configuration/DefaultConfig.ts)
- **v0.30.2 (2026-03-13).** Trade base 50k → 75k ([97fa8473](https://github.com/openfrontio/OpenFrontIO/commit/97fa8473)). Train spawn +20% (constant ×18 → ×15) — [release](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.30.2)
- **v0.30.10 (2026-03-17).** Random-spawn spawn phase 300 → 150 turns ([PR #3437](https://github.com/openfrontio/OpenFrontIO/pull/3437)).
- **v0.31.0 (2026-05-03).** Source: [v0.31.0 release](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.31.0)
  - **Conquest:** the conqueror gets 50% of a conquered human's gold, down from 100% ([PR #3818](https://github.com/openfrontio/OpenFrontIO/pull/3818)).
  - **Bots:** "Tribes are slightly weaker" — bot regen ×0.6 → ×0.5, and the loss multiplier when a human or nation attacks a bot went from 0.8·0.8 to 0.7 in the config ([v0.31.0 config](https://github.com/openfrontio/OpenFrontIO/blob/v0.31.0/src/core/configuration/DefaultConfig.ts)).
  - **Nukes and SAMs:** SAM cooldown 12 → 9 s. Silo cooldown 7.5 → 9 s. Nuke speed 6 → 8.
  - **Ports:** build time 2 → 5 s.
  - **Combat:** attacker loss mix 70/30 → 60/40.
  - **Water:** trading in lakes. Water-nukes option.
  - **Warships:** retreat when damaged, heal at ports, target priority transport > warship > trade.
  - **Alliances:** a request is auto-rejected when you send a transport ship at that player.
  - **Clans:** the clan system arrives.

**v0.32 to v0.35 (June–October 2026)**
- **v0.32.0 (2026-06-17).** "Meta tuning: nuke speed 8 → 10 tiles per tick, trade-ship sigmoid midpoint 200 → 400" (this is the spawn-throttle midpoint). Higher trade-ship cap. Reserved clan tags; tags hidden in FFA — [v0.32.0 release](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.32.0)
- **v0.32.8 (2026-07-09).** Custom alliance duration lobby control (1–15 min) ([PR #4522](https://github.com/openfrontio/OpenFrontIO/pull/4522)).
- **v0.33.0 (2026-08-03).**
  - Ranked 2v2.
  - "MIRV warheads are now standard nukes: real flight, normal SAM interception, per-type speeds". The silo goes on cooldown after a MIRV.
  - Warship veterancy. Impassable terrain. Doomsday Clock mode. Ports-disabled modifier removed.
  - Source: [v0.33.0 release](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.33.0)
- **v0.33.11 (2026-08-24).** Overtime mode: "shrink the win threshold late-game" — [release](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.33.11)
- **v0.34.0 (2026-09-14).** Source: [v0.34.0 release](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.34.0)
  - **Economy:** "Gold generation is a bit higher in the early game, but slows down mid-late game". This is spawn-rate saturation for trade (`tradeShipSaturation`, early ×1.45 boost, damping midpoint 230 ships) and trains (`trainSaturation`, midpoint 300 train units) ([PR #5302](https://github.com/openfrontio/OpenFrontIO/pull/5302)).
  - **Attack loss rebuilt:** "troop ratio × defender density". The large-territory speed bonus is "capped at roughly 3.3× a small player's rate instead of running away at 9×" ([PR #5173](https://github.com/openfrontio/OpenFrontIO/pull/5173), [PR #5189](https://github.com/openfrontio/OpenFrontIO/pull/5189)).
  - **Win condition:** team games use the 80% threshold, not 95% ([PR #5223](https://github.com/openfrontio/OpenFrontIO/pull/5223)).
  - **Spawn phase:** multiplayer 30 s → 20 s ([PR #5347](https://github.com/openfrontio/OpenFrontIO/pull/5347)).
  - **SAMs:** dynamic range scaling on upgrade ([PR #5040](https://github.com/openfrontio/OpenFrontIO/pull/5040)).
  - **Nations:** Hard and Impossible nations hunt the "juiciest" safe target and betray only when retaliation stays small.
  - **Lobbies:** trusted-only lobbies.
  - **Steam:** launch on 2026-09-17.
- **v0.34.2 (2026-09-15).** "meta: speed up attacks ~10%" ([PR #5425](https://github.com/openfrontio/OpenFrontIO/pull/5425)).
- **v0.34.5 (2026-09-16).** "Increase train spawn rate mid-late game": train midpoint 300 → 500 units ([PR #5462](https://github.com/openfrontio/OpenFrontIO/pull/5462)).
- **v0.34.12 (2026-09-21).** "meta: increase trade ship and train spawn rate early-mid game": trade 230 → 330 ships, trains 500 → 560 units ([PR #5587](https://github.com/openfrontio/OpenFrontIO/pull/5587)).
- **v0.34.24 (2026-10-06).** Fixed an exploit that grew troops past the cap — [release](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.34.24)
- **v0.35.0 (2026-10-16).** Source: [v0.35.0 release](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.35.0)
  - **Small-economy boost:** "Faster trade ships and trains for players with only a few ports or factories (a 1-port player sends a ship every ~8 s instead of ~12 s); the boost fades out by 6 levels and replaces the old fleet-size boost" ([PR #5907](https://github.com/openfrontio/OpenFrontIO/pull/5907)).
  - **Lobbies:** the 125-player cap is removed; size now comes from the map (The Box 210, Alps 185, Middle East 170).
  - **Nukes:** they annex cut-off land again.
  - **Trade toggle:** "Stop Trading with All" → "Stop Trading with Enemies".
  - **Ranked:** Ranked FFA and Clan Wars.
  - **Nations play more like winning humans:** they save later and keep building, put defense posts behind the front, send 1% beachhead boats, retaliate, and gang up on a runaway FFA leader.
- **v0.35.3 (2026-10-23).**
  - Fixed a troop duplication exploit.
  - "Tribes now break their alliance with a neighbour who turned traitor and attack it".
  - Hard and Impossible nations stop refusing every renewal in small games.
  - Source: [release](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.35.3)
- **v0.35.9 (2026-10-30).** Latest release: the tutorial now covers nukes and conquering nations — [release](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.35.9)

### Inferences
- The two largest discontinuities for a coach are v0.25.0 (2025-08-21) and v0.30.0 (2026-03-12).
  - v0.25.0 removed workers and the troop slider, so gold no longer comes from land or population.
  - v0.30.0 removed the port-count gold multiplier and replaced the hard trade cap with per-port-level spawn rolls.
  - A guide written before 2025-08-21 is wrong on the economy almost everywhere. A guide written between August 2025 and March 2026 is wrong on how ports scale.
- Since September 2026 (v0.34.x) the team has been tuning trade and train spawn curves almost weekly. Any hard number about trade income should be read from the engine for the exact build being coached.

### Gaps
- There are no GitHub release notes before v0.23 (May 2025), so the early-2025 entries come from commit messages and config diffs. I did not check Reddit, Discord or Steam news.
- Alliance duration: a commit on 2025-03-03 says "reduce alliance to 4 minutes", but `allianceDuration()` reads 10 minutes at the v0.18.0–v0.24.0 tags. Something reverted it; I did not find what.
- Why the trade-ship distance term went back to 100·d at v0.29.0 after v0.28.5's 150·d is undocumented.

---

## Q2. When were Factories, trains/railroads and the current trade-ship formula introduced or rebalanced, and how did that change the City/Port/Factory build order?

### Takeaway
Trains were added on 2025-06-22 (PR #1159). Factories that spawn trains arrived on 2025-07-14 and shipped in v0.24.0 (2025-07-18) for private and single-player games. Both went public in v0.25.0 (2025-08-21), when workers were removed.

The current trade formula took shape in stages:
- 2025-10-31: the sigmoid short-route penalty.
- 2026-03-12 (v0.30): no per-port gold multiplier; each port level rolls for spawns.
- 2026-03-13: 75k base.
- 2026-09 (v0.34): saturation pacing.
- 2026-10-16 (v0.35.0): small-economy boost.

The current formula is `75k/(1+e^(−0.03·(d−300))) + 50·d`, paid in full to **both** the sending and receiving port owners.

Build order consequence: the City is no longer an economic building. Gold now comes from Ports (and their levels) with long-distance partners, and from Factories linking stations, especially other players' or allies' stations. The City's value is +250k troop cap and acting as a rail station.

### Cited Findings
- **Trains and Factories history:**
  - Trains added 2025-06-22 ([PR #1159](https://github.com/openfrontio/OpenFrontIO/pull/1159)).
  - "Factory spawns trains" 2025-07-14 ([PR #1408](https://github.com/openfrontio/OpenFrontIO/pull/1408)).
  - Marked experimental for private lobbies and single player in v0.24.0 ([release](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.24.0)).
  - "Added Factories & Trains to public matches" in v0.25.0 ([release](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.25.0)).
  - "Rework trains to encourage alliances" 2025-08-04 ([PR #1697](https://github.com/openfrontio/OpenFrontIO/pull/1697)).
- **Train gold per station visit, by era:**
  - v0.24.0: 10k flat.
  - v0.25.0: ally 50k / other 25k / own 10k.
  - v0.25.4: teammates 50k → 25k ([PR #1933](https://github.com/openfrontio/OpenFrontIO/pull/1933)).
  - v0.28.0: ally 50k → 35k ([release](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.28.0)).
  - v0.30.0: −5k per city after the 5th, floor 5k ([PR #3400](https://github.com/openfrontio/OpenFrontIO/pull/3400)).
  - Current: after the 9th city. In the current code, when a train stops at someone else's station, both the station owner and the train owner are credited (`TrainStation.ts` lines 43 and 47 in [v0.35.9 TrainStation.ts](https://github.com/openfrontio/OpenFrontIO/blob/v0.35.9/packages/engine/src/game/TrainStation.ts); current values in [v0.35.9 EngineConfig.ts](https://github.com/openfrontio/OpenFrontIO/blob/v0.35.9/packages/engine/src/configuration/EngineConfig.ts)).
  - Per the v0.25.1 notes, factories build tracks to "Other factories" and "Ports" ([v0.25.1 release](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.25.1)).
- **Train spawn rate:**
  - `(factories+10)·20` at v0.25.0, `·16` at v0.26.x, `·18` at v0.27.9, and `·15` from v0.30.2. Larger means rarer.
  - v0.34.0 divides this by `trainSaturation(units)`, a boost of up to ×1.5 early that is damped past a midpoint of 300, then 500, then 560 units ([PR #5302](https://github.com/openfrontio/OpenFrontIO/pull/5302), [#5462](https://github.com/openfrontio/OpenFrontIO/pull/5462), [#5587](https://github.com/openfrontio/OpenFrontIO/pull/5587)).
  - v0.35.0 adds `smallEconomySpawnBoost(factories) = 1 + 0.5·clamp((6−n)/5, 0, 1)/n` ([PR #5907](https://github.com/openfrontio/OpenFrontIO/pull/5907)).
- **Trade-ship gold formula by era** (configs at each tag):
  - Feb 2025: `10k + 100·d^1.1`.
  - Mar 2025: `10k + 150·d^1.1`.
  - v0.24.0 (2025-07-18): `(50k + 100·d) × port multiplier` (+25% for the first port, decaying ×0.9 per extra port), with a 150-ship cap ([v0.24.0 config](https://github.com/openfrontio/OpenFrontIO/blob/v0.24.0/src/core/configuration/DefaultConfig.ts)).
  - v0.25.0: `(50k + 50·d) × (1 + 2·(ports−1)/(ports+4))`, up to 3×.
  - v0.25.4: `(100k + 100·d) × same` ([PR #1934](https://github.com/openfrontio/OpenFrontIO/pull/1934)).
  - v0.26.12/14 (2025-10-31 / 11-05): `100k/(1+e^(−0.03(d−300))) + 100·d`, × port bonus ([PR #2337](https://github.com/openfrontio/OpenFrontIO/pull/2337), [d6f5ae73](https://github.com/openfrontio/OpenFrontIO/commit/d6f5ae73)).
  - v0.30.0: `50k/(1+e^(−0.03(d−300))) + 50·d`, **no port bonus** ([PR #3232](https://github.com/openfrontio/OpenFrontIO/pull/3232)).
  - v0.30.2 onward: 75k base ([97fa8473](https://github.com/openfrontio/OpenFrontIO/commit/97fa8473)), unchanged through [v0.35.9](https://github.com/openfrontio/OpenFrontIO/blob/v0.35.9/packages/engine/src/configuration/EngineConfig.ts).
- **Who gets paid.** A completed trade adds the full `gold` to **both** `srcPort.owner()` and `dstPort.owner()` ([v0.35.9 TradeShipExecution.ts](https://github.com/openfrontio/OpenFrontIO/blob/v0.35.9/packages/engine/src/execution/TradeShipExecution.ts) lines 213–216). It was the same at [v0.24.0](https://github.com/openfrontio/OpenFrontIO/blob/v0.24.0/src/core/execution/TradeShipExecution.ts). A captured ship pays its new owner, which is "piracy gold".
- **Trade-ship spawning (current).**
  - `PortExecution` loops `for i < port.level()` and rolls `chance(tradeShipSpawnRate(...))` once per level.
  - Destination ports are weighted by level (`new Array(otherPort.level()).fill(otherPort)`).
  - Source: [v0.35.9 PortExecution.ts](https://github.com/openfrontio/OpenFrontIO/blob/v0.35.9/packages/engine/src/execution/PortExecution.ts)
  - v0.34.0 notes: "Trade ship spawn rate is recalculated on each port level roll" ([release](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.34.0)).
  - Global throttle: `tradeShipSaturation` damping midpoint 230 → 330 ships, with a 0.25 plateau out to about 800 ([v0.34.25 config](https://github.com/openfrontio/OpenFrontIO/blob/v0.34.25/src/core/configuration/Config.ts)).
- **Cap history.** 150 ships (v0.24.0) → a sigmoid around 100 (v0.25.0), then around 55 per player once you have three ships (v0.25.23) → "raised from ~100 to ~400" in v0.30.0 → saturation curves in v0.34.0 ([v0.30.0 release](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.30.0)).
- **Shared price ladder.** "Ports and Factories share same price scaling" from v0.25.0: 125k × 2^(ports+factories), max 1M ([v0.25.0 release](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.25.0)). Port build time 2 → 5 s in v0.31.0 ([release](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.31.0)).
- **openfront.fyi today.** Its economy page says "the old fixed build timetable was replaced by a decision guide". It warns against "Port spam" and recommends "a protected coastal route with a reliable partner". It labels its trade data "v32" and gives "Applies to: v33.1 / Last verified: Aug 5, 2026" ([openfront.fyi economy](https://openfront.fyi/mechanics/economy/)).
- **openfront.wiki today.** The Buildings page (figures "as of Update 34.0") still says the City is "usually the first thing to build" ([openfront.wiki Buildings](https://openfront.wiki/Buildings)).

### Inferences
- **Worked numbers for the current trade formula** (my calculation from the v0.35.9 formula; gold to each side):

  | Route length | Gold |
  | --- | --- |
  | 100 tiles | ≈5.2k |
  | 200 tiles | ≈13.6k |
  | 300 tiles | ≈52.5k |
  | 400 tiles | ≈91k |
  | 500 tiles | ≈100k |

  Passive income is 60k per minute (100 per tick). A single 400-tile delivery therefore equals about 1.5 minutes of passive income for both partners. With several port levels each rolling for spawns, trade dwarfs the flat rate.
- That fits the user's finding: the median Team-game human got about 92% of their gold from trade ships and trains on the 2026-10-31 build.
- In Team games, teammates are natural, safe, long-distance partners. Train visits to teammates' and allies' stations pay 25–35k against 10k for your own. Both effects push team players toward trade.
- **Build-order implications for v0.35.x:**
  - **Coastal start.** An early Port is the core economic building, provided reachable partner ports are 300+ tiles away. Upgrading it adds spawn rolls, and the v0.35 boost makes the first 1–5 levels unusually productive.
  - **Factory.** Worth it once there are stations (your Cities and Ports, and above all allied or team stations) within rail reach.
  - **City.** Mainly for the +250k cap when the cap is limiting, and as a train station. It has not raised gold since v0.25.0.
  - The coach's "First City usually comes first" rule predates these economics. At minimum it should be conditional on cap pressure and the absence of coastal or rail partners.
- More ports no longer raises gold per ship (since v0.30.0). It raises how many ships spawn, which is linear in port levels until global saturation, and each port is also a capture target.

### Gaps
- I did not calculate the exact per-second spawn probability (`chance(rate)` semantics) or the steady-state trade income for a typical 3–5-port player.
- The exact station-visit rule (does the train owner earn at its own stations, and does an ally's station pay both sides on every stop?) is from a grep of `TrainStation.ts`, not a full read.

---

## Q3. What changed in troop cap, troop regen, gold income (flat vs population/worker based), attack loss formulas, defense posts, terrain, and bot/nation behaviour?

### Takeaway
**Unchanged since early 2025:**
- The troop cap formula `2·(tiles^0.6·1000 + 50k) + 250k per City level`.
- The regen curve `(10 + t^0.73/4)·(1 − t/cap)`, peaking near 42% of cap.

**Changed:**
- Until v0.25.0 these applied to *population*, which was split into troops and gold-producing workers. Since 2025-08-21 they apply to troops directly, and gold is a flat 100 per tick.
- Attack losses were reworked repeatedly: large-player debuffs (v0.25), a density-based alternative cost (v0.30/v0.31), and the two-ratio formula plus a capped large-territory bonus (v0.34).
- Defense posts and terrain constants have barely moved.
- Bots and nations: bots got weaker (cap/3, regen ×0.5, cheaper to attack). Nations were rebalanced repeatedly and are much smarter in v0.34–v0.35.

### Cited Findings
- **Population and worker era.**
  - Gold per tick = `sqrt(workers·tiles)/200` (v0.14–v0.20), then `0.045·workers^0.7` (v0.23, [PR #757](https://github.com/openfrontio/OpenFrontIO/pull/757)).
  - Troops moved toward `population × targetTroopRatio` (`troopAdjustmentRate`).
  - Sources: [v0.14.1 config](https://github.com/openfrontio/OpenFrontIO/blob/v0.14.1/src/core/configuration/DefaultConfig.ts), [v0.23.19 config](https://github.com/openfrontio/OpenFrontIO/blob/v0.23.19/src/core/configuration/DefaultConfig.ts)
  - Removed in v0.25.0: "Removed workers & troop ratio bar. Players earn 1k gold per second, bots earn 500 gold per second" ([release](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.25.0), [PR #1676](https://github.com/openfrontio/OpenFrontIO/pull/1676)).
  - Since v0.29.0 the flat rate is multiplied by a lobby `goldMultiplier`, used for example by the "x2 Gold" public modifier from v0.30 ([v0.29.0 config](https://github.com/openfrontio/OpenFrontIO/blob/v0.29.0/src/core/configuration/DefaultConfig.ts), [v0.30.0 release](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.30.0)).
- **Troop cap.**
  - The formula `2·(tiles^0.6·1000+50k)` appears in v0.15.0 and in every later tag (v0.23.1 briefly used `tiles·30+50k`, reverted). Cities add 250k per level (`cityTroopIncrease`), counted per level since v0.24.0. Under-construction cities stopped counting in v0.31.0.
  - Bot cap: /2 → /3 in v0.25.0.
  - Nation cap multipliers by version:

    | Version | Easy | Medium | Hard | Impossible |
    | --- | --- | --- | --- | --- |
    | v0.25.0 | 0.5 | 1 | 1.5 | 2 |
    | v0.28.0 | 0.75 | 1 | 1.25 | 1.5 |
    | v0.29.0 | 0.75 | 1 | 1.125 | 1.25 |
    | v0.29.11 | 0.5 | 1 | 1.125 | 1.25 |
    | v0.30.0 → current | 0.5 | 0.75 | 1 | 1.25 |

  - Sources: config at [v0.25.0](https://github.com/openfrontio/OpenFrontIO/blob/v0.25.0/src/core/configuration/DefaultConfig.ts), [v0.30.0](https://github.com/openfrontio/OpenFrontIO/blob/v0.30.0/src/core/configuration/DefaultConfig.ts), [v0.35.9 Config.ts](https://github.com/openfrontio/OpenFrontIO/blob/v0.35.9/packages/engine-lib/src/configuration/Config.ts)
- **Regen multipliers.** Bots ×0.7 (2025) → ×0.6 ([PR #1503](https://github.com/openfrontio/OpenFrontIO/pull/1503), 2025-07-19) → ×0.5 (v0.31.0, "tribes slightly weaker", [1be19722](https://github.com/openfrontio/OpenFrontIO/commit/1be19722)). Nation regen multipliers by version:

  | Version | Easy | Medium | Hard | Impossible |
  | --- | --- | --- | --- | --- |
  | v0.25 | 0.9 | 1 | 1.1 | 1.2 |
  | v0.28 | 0.95 | 1 | 1.05 | 1.1 |
  | v0.29 | 0.95 | 1 | 1.025 | 1.05 |
  | v0.30 → current | 0.9 | 0.95 | 1 | 1.05 |

  Configs as above.
- **Attack-loss formula history:**
  - **v0.23–v0.29:** attacker loss per tile = `mag · clamp(defenderTroops/attackStack, 0.6, 2) · 0.8 · traitorMod`.
    - Terrain mag / speed: Plains 80 (85 in v0.23.x) / 16.5, Highland 100 / 20, Mountain 120 / 25.
    - Defense post: ×5 loss and ×5 speed until v0.24.0, which split the speed bonus to ×3.
  - **v0.25.0** added large-defender debuffs (0.7 + 0.3·sigmoid) and a large-attacker loss bonus `sqrt(100k/tiles)^0.7` above 100k tiles ([v0.25.0 config](https://github.com/openfrontio/OpenFrontIO/blob/v0.25.0/src/core/configuration/DefaultConfig.ts)).
  - **v0.30.0:** loss = 0.7·(old term) + 0.3·(1.3·defenderTroopsPerTile·mag/100) ([d09cc10b](https://github.com/openfrontio/OpenFrontIO/commit/d09cc10b)).
  - **v0.31.0:** 0.6 / 0.4 ([22dbc4fb](https://github.com/openfrontio/OpenFrontIO/commit/22dbc4fb)).
  - **v0.34.0:** "Rebuilt attack loss around two ratios (troop ratio × defender density), so overwhelming stacks stop paying the full turtle tax and dense land stays expensive to take" ([PR #5173](https://github.com/openfrontio/OpenFrontIO/pull/5173), [PR #5189](https://github.com/openfrontio/OpenFrontIO/pull/5189)).
  - **Current code:**
    - Loss = `mag · traitorMod · clamp(defTroops/stack, 0.6, 2) · (0.463·largeAttackerBonus·largeDefenderBonus + 0.0039·defenderTroopsPerTile)`.
    - Large-territory bonuses are a log-space sigmoid with midpoint 300k tiles (attacker floor 0.3×, defender 0.7×).
    - Speed divisor 8.55, which is "~10% faster" from [PR #5425](https://github.com/openfrontio/OpenFrontIO/pull/5425).
    - Humans or nations attacking a bot pay ×0.7.
    - Source: [v0.35.9 EngineConfig.ts](https://github.com/openfrontio/OpenFrontIO/blob/v0.35.9/packages/engine/src/configuration/EngineConfig.ts)
- **Large-player snowball cap.** "The giant-empire speed bonus is smoothed and capped at roughly 3.3× a small player's rate instead of running away at 9×" ([v0.34.0 release](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.34.0)).
- **Defense post (current).** ×5 attacker loss, ×3 tile cost (slower), range 30, cost 50k·(n+1) up to 250k. Unchanged since v0.24/v0.25 ([v0.35.9 EngineConfig.ts](https://github.com/openfrontio/OpenFrontIO/blob/v0.35.9/packages/engine/src/configuration/EngineConfig.ts); [openfront.wiki Buildings](https://openfront.wiki/Buildings) agrees: "attackers lose 5× as many troops per tile and advance 3× slower", 30-tile radius).
- **Retreat.** Retreating a land attack still costs 25% (`malusForRetreat = 25` in [v0.35.9 AttackExecution.ts](https://github.com/openfrontio/OpenFrontIO/blob/v0.35.9/packages/engine/src/execution/AttackExecution.ts)). Transport retreats have carried a troop penalty since v0.27.0 ([PR #2389](https://github.com/openfrontio/OpenFrontIO/pull/2389)).
- **Terrain additions.**
  - "Terrain manipulation for attack advantage" (v0.24.0 notes).
  - Impassable terrain (v0.33.0), which acts like the map edge and blocks rails since v0.34.0.
  - Water nukes as a game option (v0.31.0).
  - Sources: [v0.33.0](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.33.0), [v0.34.0](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.34.0), [v0.31.0](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.31.0)
- **Conquest gold.** The conqueror receives 50% of a human's gold, down from 100% ([PR #3818](https://github.com/openfrontio/OpenFrontIO/pull/3818), v0.31.0). Conquering players with 0 attacks gives no gold (v0.30.0). Bots try to delete captured structures to stop farming (v0.30.0) ([v0.30.0 release](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.30.0)).
- **Nation behaviour milestones:**
  - v0.28: smarter alliances, parallel attacks, donation requirements.
  - v0.29: SAM-avoiding nukes, ganging up on AFK players and traitors, counter-warships; Easy/Medium less aggressive.
  - v0.30: Impossible nations overwhelm SAMs with salvos; nations upgrade buildings.
  - v0.31: team cooperation; Easy never betrays.
  - v0.34: "juicy()" targeting; betray only when "retaliation they'd face stays safely small".
  - v0.35: save later, keep building, defense posts behind the front, 1% beachhead boats with a land follow-up, gang up on the runaway FFA leader, nuke back.
  - Sources: [v0.28.0](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.28.0), [v0.29.0](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.29.0), [v0.30.0](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.30.0), [v0.31.0](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.31.0), [v0.34.0](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.34.0), [v0.35.0](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.35.0)
- **Public-lobby nations and bots.**
  - 400 bots (100 on compact maps) in public games in both v0.29 and v0.35.9 `MapPlaylist.ts`. The v0.23.19 file also sets `bots: 400`.
  - Public nation difficulty: Medium (v0.23), Easy (v0.29), Medium from v0.30.0. Hard in Humans vs Nations.
  - Sources: [v0.35.9 MapPlaylist.ts](https://github.com/openfrontio/OpenFrontIO/blob/v0.35.9/src/server/MapPlaylist.ts), [v0.30.0 release](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.30.0)

### Inferences
- The coach's troop-cap and regen facts, including the 42% optimum, are still correct for v0.35.9. The troop-band guidance (35–50% quiet, 50–70% under pressure) still follows from the same curve.
- The coach's attack-ledger rule ("stack under ~60% of the defender's army pays up to double") is imprecise for v0.34+:
  - The ratio clamp is `defenderTroops/stack` in [0.6, 2]. Losses stop falling once your stack is ≥1.67× their army and hit the 2× ceiling when your stack is ≤50% of their army.
  - There is now a density term (0.0039 × defender troops per tile), so attacking densely packed land costs more regardless of stack.
  - Attacks on bots cost ×0.7.
- "Large empires steamroll" snowball heuristics from 2025 overstate late-game speed; the speed bonus is now capped at about 3.3×.

### Gaps
- I did not check when `malusForRetreat = 25` was introduced.
- I did not verify the current nation betrayal threshold (the coach's "below ~20% of cap"). v0.34.0 describes a juiciness and retaliation test, which suggests the old rule is outdated, but I did not read the nation AI code.

---

## Q4. What changed for nukes, SAMs (ranges, levels, hit chance), MIRVs, warships, transport boats and trade-ship capture?

### Takeaway
- **Nukes are faster:** 4 tiles per tick in early 2025, now 10 for atom and hydrogen bombs, 15 for the MIRV carrier and 22 for warheads.
- **SAMs are deterministic** (no 80% / 50% RNG since 2025-12-23). Their range scales with level (70 → ~81 → 90 → ~97 → ~102, approaching 150), and their cooldown is 9 s.
- **MIRVs:** 15M → 25M → 35M → 25M + 15M per MIRV already launched by anyone (2025-12-18). Since v0.33 (2026-08-03) warheads are ordinary SAM-interceptable nukes.
- **Warships** prioritize transports (since v0.24), retreat and heal at ports (v0.31), and gain veterancy (v0.33).
- **Transport boats:** retreat penalty (v0.27), retreat to the nearest shore (v0.30), and alliance requests auto-rejected when you boat someone (v0.31).

### Cited Findings
- **Nuke speed:**
  - 4 → 6 on 2025-06-09 ([PR #1125](https://github.com/openfrontio/OpenFrontIO/pull/1125)), in v0.24.0.
  - 6 → 8 in v0.31.0 ([release](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.31.0)).
  - 8 → 10 in v0.32.0 ([release](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.32.0)).
  - Per-type speeds since v0.33.0. Current code: Atom/Hydrogen 10, MIRV 15, MIRVWarhead 22 ([v0.35.9 EngineConfig.ts](https://github.com/openfrontio/OpenFrontIO/blob/v0.35.9/packages/engine/src/configuration/EngineConfig.ts)).
- **Nuke costs.** Atom bomb 750k and Hydrogen bomb 5M throughout, apart from a 2-day 500k atom bomb in April 2025 ([89fb1c0f](https://github.com/openfrontio/OpenFrontIO/commit/89fb1c0f)). Silo 1M.
- **MIRV price history:**

  | Version (date) | Price |
  | --- | --- |
  | v0.17.7 (Mar 2025) | 15M |
  | v0.20.0 (2025-03-31) | 25M |
  | v0.24.0 (2025-07-18, [PR #1487](https://github.com/openfrontio/OpenFrontIO/pull/1487)) | 35M |
  | v0.28.0 (2025-12-18) | `25M + 15M × MIRVs launched in the game` |

  Sources: configs, [v0.28.0 release](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.28.0). A flat 25M price with a 60 s global cooldown was merged and reverted the same day, 2026-09-10 ([PR #5281](https://github.com/openfrontio/OpenFrontIO/pull/5281), [revert #5349](https://github.com/openfrontio/OpenFrontIO/pull/5349)). The current code is `25_000_000n + mirvsLaunched·15_000_000n`.
- **MIRV mechanics:**
  - "MIRV warheads are now standard nukes: real flight, normal SAM interception, per-type speeds". Silos go on cooldown when launching a MIRV (v0.33.0, [PR #4706](https://github.com/openfrontio/OpenFrontIO/pull/4706)).
  - "Normalized MIRV warhead speed and removed MIRV map-edge benefits" (v0.34.0).
  - Alliance acceptance cancels in-flight MIRVs and warheads (v0.34.0).
  - Sources: [v0.33.0](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.33.0), [v0.34.0](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.34.0)
- **SAM history:**
  - Added 2025-03-09 ([PR #176](https://github.com/openfrontio/OpenFrontIO/pull/176)).
  - Hit chance 0.8 against nukes and 0.5 against MIRV warheads ([v0.23.19 config](https://github.com/openfrontio/OpenFrontIO/blob/v0.23.19/src/core/configuration/DefaultConfig.ts)), until "Remove RNG from SAM launchers" in v0.28.1, 2025-12-23 ([PR #2665](https://github.com/openfrontio/OpenFrontIO/pull/2665)).
  - Range: 80 (v0.24.0) → 70 (v0.25.0). Since v0.27.0, `150 − 480/(level+5)` ([PR #2351](https://github.com/openfrontio/OpenFrontIO/pull/2351)), with dynamic growth during the upgrade since v0.34.0 ([PR #5040](https://github.com/openfrontio/OpenFrontIO/pull/5040)).
  - Cost: 1.5M, then 3M (cap set 2025-04-17, [PR #529](https://github.com/openfrontio/OpenFrontIO/pull/529)).
  - Smart (predictive) targeting since v0.25.0 ([PR #1618](https://github.com/openfrontio/OpenFrontIO/pull/1618)).
- **SAM and silo cooldowns.** SAM 7.5 s → 12 s (v0.30.0, "to compensate for previous SAM targeting improvements") → 9 s (v0.31.0). Silo 7.5 s → 9 s (v0.31.0). Sources: [v0.30.0](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.30.0), [v0.31.0](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.31.0)
- **openfront.fyi nukes page.**
  - It still gives timing advice: "Before 3 minutes: don't build nukes ... 3-5 minutes: one Missile Silo and one SAM ... 5-8 minutes: save up 5M gold for a Hydrogen Bomb".
  - It cites mixed versions (v0.34.11, v33, v35), recommends SAMs at level 3 or higher (about 90+ tiles), and says it was "generated Oct 31, 2026" ([openfront.fyi nukes](https://openfront.fyi/mechanics/nukes/)).
- **Alliance and nuke interaction:**
  - Alliances destroy incoming nukes between the new allies (v0.29.0).
  - Nukes are cancelled however an alliance is accepted, and nuke trajectories show alliance breaks (v0.30.0).
  - Launches are blocked in the half-second after accepting an alliance (v0.34.0).
  - Nuking teammate structures is blocked (v0.30.0).
  - Sources: [v0.29.0](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.29.0), [v0.30.0](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.30.0), [v0.34.0](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.34.0)
- **Nukes annex land again.** Cut-off land goes to the surrounding enemy; this had stopped working for coastal empires (v0.35.0/v0.35.1, [release](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.35.0)).
- **Warships:**
  - One Warship type at 250k·(n+1), max 1M, since March 2025.
  - "Warships prioritize enemy transport ships over warships. Reload instantly after shooting a transport ship" (v0.24.0).
  - Retreat when damaged, heal at ports, target priority transport > warship > trade, and "improve trade ship capture reliability" (v0.31.0).
  - Multi-select (v0.31.0). Veterancy (v0.33.0).
  - Pirating is disabled when the owner has no port in that body of water (v0.33.0).
  - Nations build counter-warships (v0.29) and send warship squads at blockades (v0.35).
  - Sources: [v0.24.0](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.24.0), [v0.31.0](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.31.0), [v0.33.0](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.33.0)
- **Transport boats:**
  - Max 3 at a time (unchanged); each sends troops/5 (bots troops/20).
  - Retreat troop penalty since v0.27.0 ([PR #2389](https://github.com/openfrontio/OpenFrontIO/pull/2389)).
  - Retreat to the nearest owned shore (v0.30.0).
  - Boats can be disabled as a lobby option (v0.30.0).
  - Sending a boat auto-rejects a pending alliance request (v0.31.0).
  - Sources: [v0.35.9 EngineConfig.ts](https://github.com/openfrontio/OpenFrontIO/blob/v0.35.9/packages/engine/src/configuration/EngineConfig.ts), releases above.
- **Trade-ship capture.** A captured trade ship pays its new owner and is recorded as piracy ([v0.35.9 TradeShipExecution.ts](https://github.com/openfrontio/OpenFrontIO/blob/v0.35.9/packages/engine/src/execution/TradeShipExecution.ts)). "Stop crediting you with a capture ... when you retake your own trade ship" (v0.34.11, [release](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.34.11)).

### Inferences
- The 2025 advice that SAMs are a coin flip against MIRVs, so you need many of them, has been obsolete twice over: RNG was removed (Dec 2025), and warheads became normal interceptable nukes (Aug 2026). Upgrading SAM level for range and stacking for coverage is now the meaningful choice.
- The MIRV is now an escalating-price, game-wide-scarce weapon: the first costs 25M, the second 40M, the third 55M. That changes "bank for a MIRV" advice in long games.
- Faster nukes (10 tiles per tick versus 4 in early 2025) cut reaction time. Pre-building SAMs before launches start is more important than in 2025, which supports the coach's "Building SAMs only after launches start" mistake.
- Warships now exist mostly to escort and protect trade routes and to pirate. In a trade-dominated economy, losing trade ships to pirates is a major gold leak; the coach should track it.

### Gaps
- I did not extract the history of nuke blast radii (`nukeMagnitudes`) or SAM missile speed.
- I did not quantify the warship veterancy numbers.

---

## Q5. What changed in alliances (duration, renewal, betrayal penalties), team mode, donations of troops and gold, ranked/1v1 modes, clans, and lobby sizes/bot counts?

### Takeaway
- **Alliances:** the default dropped from 10 to 5 minutes on 2025-07-24. They have been extendable since July 2025, and hosts can set 1–15 minutes since July 2026.
- **Betrayal:** 30 s traitor status, during which attackers take 50% losses and get faster tile costs. This has stood since April 2025, with the speed debuff set to 0.8 from July 2025.
- **Team mode:**
  - Duos (Apr 2025), Trios/Quads (Jul 2025).
  - Humans vs Nations: added Oct 2025, removed from public Nov 2025, back Jan 2026.
  - Win threshold 95% → 80% (Sept 2026).
- **Ranked:** 1v1 (Jan 2026), 2v2 (Aug 2026), FFA and Clan Wars (Oct 2026).
- **Clans:** full system in v0.31 (May 2026), with tags reserved in v0.32.
- **Lobby caps:** 150 (2025), map-derived up to 125 (Jan 2026), map-derived without the 125 cap (Oct 2026). 400 tribes per public game (100 on compact maps).

### Cited Findings
- **Alliance duration and renewal:**
  - 10 minutes at v0.18.0–v0.24.0. "Alliance Time to 5 minutes", 2025-07-24 ([PR #1535](https://github.com/openfrontio/OpenFrontIO/pull/1535)).
  - "allow alliance extension" 2025-07-02 ([PR #1314](https://github.com/openfrontio/OpenFrontIO/pull/1314)). Renew notification (v0.27.0). Renewal in the radial menu (v0.30.0).
  - Custom lobby duration 1–15 min ([PR #4522](https://github.com/openfrontio/OpenFrontIO/pull/4522), v0.32.8). Current default 300·10 ticks ([v0.35.9 Config.ts](https://github.com/openfrontio/OpenFrontIO/blob/v0.35.9/packages/engine-lib/src/configuration/Config.ts)).
  - Alliance request window 20 s; request cooldown 30 s.
- **Betrayal:**
  - Traitor defense debuff 0.8 (2025-03-03) → 0.5 with a 30 s duration (2025-04-17) ([ae4f4d3e](https://github.com/openfrontio/OpenFrontIO/commit/ae4f4d3e)).
  - Traitor speed debuff added at 0.6 in v0.24.0, then 0.8 ("reduce traitor debuff", 2025-07-23).
  - No traitor debuff when betraying an inactive player (v0.25.0).
  - Betrayal timer and icon (v0.27.0).
  - Tribes now break alliances with traitors and attack them (v0.35.3).
  - Sources: [v0.25.0](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.25.0), [v0.27.0](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.27.0), [v0.35.3](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.35.3)
- **Alliance modifiers.** Alliances-disabled modifier and private option (v0.30.0). Hotkeys K/L (v0.31.0). "Stop Trading with Enemies" keeps ally trade (v0.35.0). Sources: [v0.30.0](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.30.0), [v0.35.0](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.35.0)
- **Team mode:**
  - Up to 7 teams ([PR #445](https://github.com/openfrontio/OpenFrontIO/pull/445), Apr 2025). Duos ([PR #630](https://github.com/openfrontio/OpenFrontIO/pull/630)). Trios/Quads (v0.24.0). Team sizes equalized (v0.24.0).
  - Nations vs Players mode ([PR #2233](https://github.com/openfrontio/OpenFrontIO/pull/2233), Oct 2025). Removed from public in v0.27.1, back in v0.29.0.
  - You can capture land from AFK teammates (v0.26.0) and get AFK teammates' ships (v0.27.0).
  - Team win 95% → 80% (v0.34.0, [PR #5223](https://github.com/openfrontio/OpenFrontIO/pull/5223)).
  - Duo/trio/quad forming fixed so humans are placed together (v0.34.0).
  - Three separate public lobbies including Teams (v0.30.0). Team-game frequency increased (v0.29.6).
- **Donations:**
  - Troops: the default amount is a third of your troops, with a 10 s cooldown (unchanged). Quick donate in the radial menu (v0.29.0).
  - Gold donation can be toggled in private lobbies ([PR #1752](https://github.com/openfrontio/OpenFrontIO/pull/1752)). A gold-donation validation exploit was fixed (v0.24.0).
  - Nations donate troops to teammates in team games (v0.29.5) and keep donating after the game is decided (v0.35.0).
  - Sources: configs, [v0.29.5](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.29.5), [v0.35.0](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.35.0)
- **Ranked:**
  - 1v1 Elo matchmaking (v0.29.0, 2026-01-19). Config switched to a tournament map pool in v0.30.0; compact chance 50% → 20% in v0.33.0.
  - Ranked 2v2 (v0.33.0, 2026-08-03).
  - Ranked FFA (4–10 players, 20 min timer) and Clan Wars (2–5 a side, up to four clans) in v0.35.0, 2026-10-16. Ranked now requires a trusted account.
  - Sources: [v0.29.0](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.29.0), [v0.33.0](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.33.0), [v0.35.0](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.35.0)
- **Clans:**
  - Clan stats modal (v0.27.0). Full clan system (v0.31.0).
  - Reserved tags (you must be a member), hidden in FFA "to help prevent clan teaming" (v0.32.0).
  - Clan tournaments advertised in the in-game news (`news.json` in the local v0.35.9 engine copy: "Spring Clan Tournament ... 2v2 clan battles", "Clan Tournaments ... weekly tournaments on Discord") ([v0.32.0 release](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.32.0), [news.json at v0.35.9](https://github.com/openfrontio/OpenFrontIO/blob/v0.35.9/src/resources/news.json)).
- **Lobby sizes:**
  - "Cap lobby sizes at 150" (2025-06-01, [PR #984](https://github.com/openfrontio/OpenFrontIO/pull/984)).
  - From land tiles, max 125 (v0.29.0, [PR #2874](https://github.com/openfrontio/OpenFrontIO/pull/2874)).
  - "Crowded" modifier crams 125 players onto a small map (v0.30.0).
  - 125 cap removed, size from map land, e.g. The Box 210 (v0.35.0).
  - Public games have 400 tribes (bots), 100 on compact maps ([v0.35.9 MapPlaylist.ts](https://github.com/openfrontio/OpenFrontIO/blob/v0.35.9/src/server/MapPlaylist.ts)).
- **Spawn phase (multiplayer):**
  - 300 turns (30 s) through 2025.
  - 150 with random spawn (v0.30.10).
  - 200 (20 s) normal since v0.34.0 ([PR #5347](https://github.com/openfrontio/OpenFrontIO/pull/5347)).
  - Single player 100. Single player has started immediately on spawn choice since v0.32.0.

### Inferences
- 5-minute alliances that expire unless renewed shift advice from "ally and forget" to "track renewals". Breaking an alliance only marks you for 30 s and makes the betrayed side attack you more cheaply. The cost of betrayal is mainly diplomatic: nations gang up on traitors (v0.29), and tribes break alliances with traitors (v0.35.3).
- The 80% team win threshold (since 2026-09) means team games end earlier than in 2025. Coaching about "closing out" a team game should use 80%, not 95%.

### Gaps
- I found no source for "lobby sizes/bot counts" per map in late October 2026 beyond the three examples in the v0.35.0 notes.
- I did not investigate what `teamLandShareWinThresholdTenths() = 7` in v0.35.9 `EngineConfig.ts` does.

---

## Q6. Which version numbers do public lobbies run in late October 2026?

### Takeaway
Public play in late October 2026 is on the v0.35.x line. Releases in the last two weeks of October: v0.35.0 (10-16), v0.35.1 and v0.35.2 (10-17), v0.35.3 (10-23), v0.35.4 (10-24), v0.35.5 (10-26), v0.35.6 (10-27), v0.35.7 (10-29) and v0.35.9 (10-30). The coach's local engine copies match v0.35.4, v0.35.5, v0.35.7 and v0.35.9.

### Cited Findings
- The GitHub releases list shows v0.35.0 published 2026-10-16T17:06Z and v0.35.9 published 2026-10-30T22:56Z. There is no v0.35.8 release ([releases](https://github.com/openfrontio/OpenFrontIO/releases)).
- The local engine directories map to tags as follows (`git describe --tags`):
  - `14ba82b…` = v0.35.4 (2026-10-24)
  - `bf0ac8a…` = v0.35.5 (2026-10-26)
  - `c144d13…` = v0.35.7 (2026-10-29)
  - `7ee9686…` = v0.35.9 (2026-10-30)
  - Sources: [v0.35.4](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.35.4), [v0.35.9](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.35.9)
- openfront.fyi labels its "site baseline" as "v0.35.9" with an extraction date of "Oct 31, 2026", while also saying some pages apply to "v33.1" ([openfront.fyi economy](https://openfront.fyi/mechanics/economy/)).
- The v0.35.x patches after v0.35.0 contain few balance changes: v0.35.1 nuke annexation fix; v0.35.3 exploit fix plus tribe and nation alliance behaviour; the rest are maps, tutorial and UI ([v0.35.3](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.35.3)).

### Inferences
- The user's "2026-10-31 build" is most likely v0.35.9 (released 2026-10-30, about 23:00 UTC) or a hotfix on top of it. Balance-wise it is equivalent to v0.35.0 plus the v0.35.3 alliance-behaviour change.

### Gaps
- I could not confirm which build openfront.io actually served on any date. The brief forbids visiting the site, and there is no public version endpoint I could use. Steam and web builds can lag the GitHub release by hours to days.

---

## Q7. "Advice that was true in 2025 but is wrong now" (with a check of the coach's current claims)

### Takeaway
Most of the 2025 economy advice is obsolete. That covers the troop/worker slider, "land and cities make gold", "more ports = more gold per ship", "any route pays" and train gold numbers. Nukes, SAMs and MIRVs, alliance length, conquest gold, the team win threshold and the large-empire attack math all changed too.

The coach's engine facts in `rules.ts` are almost all still correct for v0.35.9. The stale parts are three community-derived rules: "City first", the nuke timetable and the nation betrayal threshold. The coach also does not model that trade income is paid to both sides and scales with port levels.

### Cited Findings
**2025 advice, the change that broke it, and the current rule**
1. **"Set the troop/worker ratio slider (e.g. lower troops to earn more gold)."** Workers and the ratio bar were removed in v0.25.0 (2025-08-21). Now: all population is troops, and gold is flat ([v0.25.0](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.25.0), [PR #1676](https://github.com/openfrontio/OpenFrontIO/pull/1676)).
2. **"Expand and grow population to raise gold income."** In 2025 gold was `0.045·workers^0.7` or `sqrt(workers·tiles)/200`. Now: 100 gold per tick, flat, whatever your size. Land only raises troop cap and regen ([v0.23.19 config](https://github.com/openfrontio/OpenFrontIO/blob/v0.23.19/src/core/configuration/DefaultConfig.ts) vs [v0.35.9](https://github.com/openfrontio/OpenFrontIO/blob/v0.35.9/packages/engine/src/configuration/EngineConfig.ts)).
3. **"Build a City first; cities boost your economy."** Before v0.25 a City raised max population, which fed workers and therefore gold. Now: a City gives +250k cap and is a rail station, with no direct gold. The wiki still says City is "usually the first thing to build" ([openfront.wiki Buildings](https://openfront.wiki/Buildings)).
4. **"Each extra port increases gold per trade ship."** True from v0.24.0 to v0.29.x (+25%·0.9^i, then up to 3×). Removed in v0.30.0 (2026-03-12, [PR #3232](https://github.com/openfrontio/OpenFrontIO/pull/3232)). Now: gold per ship depends only on distance; port *levels* add spawn rolls and destination weight ([v0.35.9 PortExecution.ts](https://github.com/openfrontio/OpenFrontIO/blob/v0.35.9/packages/engine/src/execution/PortExecution.ts)).
5. **"Any trade route is worth it; short routes are fine."** In August 2025 a trade paid `100k + 100·d` (×port bonus) even for short routes. Since v0.26.12 (2025-10-31) a sigmoid makes routes under about 250 tiles pay 5–14k, and ships avoid very near ports ([PR #2337](https://github.com/openfrontio/OpenFrontIO/pull/2337), [PR #2381](https://github.com/openfrontio/OpenFrontIO/pull/2381)).
6. **"Trade ships are capped at 150 or about 100, so don't overbuild ports."** The cap was raised to about 400 (v0.30.0). Since v0.34.0 there are soft saturation curves (midpoint 330 ships), and small economies get a spawn boost (v0.35.0) ([v0.30.0](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.30.0), [PR #5907](https://github.com/openfrontio/OpenFrontIO/pull/5907)).
7. **"Train stops pay 50k at allies / long city chains print money."** Now: 35k ally, 25k team or other, 10k own, −5k per city after the 9th, floor 5k ([v0.28.0](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.28.0), [PR #3400](https://github.com/openfrontio/OpenFrontIO/pull/3400)).
8. **"Factories and trains are experimental, private only."** Public since v0.25.0 ([release](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.25.0)).
9. **"SAMs hit 80% of the time (50% vs MIRV warheads), so stack many SAMs."** RNG removed in v0.28.1 (2025-12-23, [PR #2665](https://github.com/openfrontio/OpenFrontIO/pull/2665)). Now: deterministic interception; range grows with level (`150 − 480/(level+5)`); cooldown 9 s.
10. **"SAM range is 80 / fixed."** 80 in v0.24 → 70 in v0.25 → level-scaled since v0.27.0 ([PR #2351](https://github.com/openfrontio/OpenFrontIO/pull/2351)).
11. **"A MIRV costs a flat 25M or 35M and its warheads mostly get through."** Now: 25M + 15M per MIRV launched by anyone (v0.28.0). Warheads have been normal SAM-interceptable nukes since v0.33.0, and the silo goes on cooldown ([v0.33.0](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.33.0)).
12. **"Nukes are slow (4–6 tiles per tick), so you can react."** Now: 10 tiles per tick for atom and hydrogen bombs, 15 for the MIRV carrier, 22 for warheads ([v0.35.9 EngineConfig.ts](https://github.com/openfrontio/OpenFrontIO/blob/v0.35.9/packages/engine/src/configuration/EngineConfig.ts)).
13. **"Alliances last 10 minutes."** 5 minutes since 2025-07-24 ([PR #1535](https://github.com/openfrontio/OpenFrontIO/pull/1535)), renewable. Hosts can change it (v0.32.8).
14. **"Nuke an ally right after allying / fire a nuke and ally before it lands."** Alliance acceptance now cancels incoming nukes and MIRVs, and launches are blocked for 0.5 s after accepting (v0.29.0, v0.30.0, v0.34.0).
15. **"Killing a human gives you all their gold."** 50% since v0.31.0 (2026-05-03, [PR #3818](https://github.com/openfrontio/OpenFrontIO/pull/3818)). Players who never attacked give nothing (v0.30.0).
16. **"Team games need 95% of the land."** 80% since v0.34.0 (2026-09-14, [PR #5223](https://github.com/openfrontio/OpenFrontIO/pull/5223)). The Overtime mode can lower it further ([v0.33.11](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.33.11)).
17. **"Spawn phase is 30 s in multiplayer."** 20 s since v0.34.0, 15 s with random spawn ([PR #5347](https://github.com/openfrontio/OpenFrontIO/pull/5347), [PR #3437](https://github.com/openfrontio/OpenFrontIO/pull/3437)).
18. **"Giant empires attack absurdly fast; you can't stop a snowball" and "attack cost depends only on the troop ratio".** Since v0.34.0 the large-empire speed bonus is capped at about 3.3× (was up to 9×), and losses also scale with defender troop density ([v0.34.0](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.34.0)).
19. **"Boat banking: send boats and retreat them for free."** Retreat troop penalty since v0.27.0 ([PR #2389](https://github.com/openfrontio/OpenFrontIO/pull/2389)).
20. **"Public lobbies have Easy nations; Hard nations have ×1.5–2 troop caps."** Public nations are Medium since v0.30.0 (Hard in Humans vs Nations). The Hard cap multiplier is 1.0 and Impossible 1.25 ([v0.30.0](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.30.0)).
21. **"Nations are dumb: they waste nukes, don't defend boats and don't gang up."** v0.29–v0.35 nations avoid SAMs, salvo against SAMs (Impossible), defend beachheads, retaliate, and gang up on traitors, AFK players and the runaway FFA leader ([v0.35.0](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.35.0)).
22. **"Lobbies max out at 150 or 125 players."** Map-derived with no cap since v0.35.0, up to 210 ([v0.35.0](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.35.0)).
23. **"Ports are instant (2 s) emergency builds."** 5 s since v0.31.0 ([release](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.31.0)).

**Advice created by the changes (true now, not in early 2025)**
- Trade with distant partners (300+ tiles), ideally allies or teammates; both sides get the full payout ([TradeShipExecution.ts](https://github.com/openfrontio/OpenFrontIO/blob/v0.35.9/packages/engine/src/execution/TradeShipExecution.ts)).
- Upgrade ports for more spawn rolls; the first few levels are boosted (v0.35.0).
- Link Factories to teammates' or allies' stations (25–35k per stop versus 10k for your own).
- Use "Stop Trading with Enemies", not "with All" (v0.35.0).
- Protect trade from piracy with warships, and use warships to pirate.
- Upgrade SAMs for range rather than counting on hit chance.
- Account for the escalating global MIRV price.
- Attack bots cheaply (×0.7 losses).
- Avoid attacking densely packed defenders (density term, v0.34).
- Renew alliances every 5 minutes.

**Coach-claim check against v0.35.9** (from `docs/strategy-notes.md` and `src/analysis/rules.ts`)

Still correct:
- The troop cap formula, the bot /3 cap and the nation multipliers 0.5 / 0.75 / 1 / 1.25.
- The regen formula and the 42% peak.
- Flat 100 gold per tick. Bot and nation gold transferred in full; human gold halved.
- The trade sigmoid around 300 tiles.
- All unit costs, including the MIRV at 25M + 15M per launch.
- The 20% attack ratio default (`troops/5` for boats).
- The 25% retreat malus.
- 30 s traitor status with 50% losses for attackers.
- 80% win threshold (now for teams too).
- Spawn phase 100 / 150 / 200 turns.
- Level-1 SAM range 70.

Sources: [v0.35.9 EngineConfig.ts](https://github.com/openfrontio/OpenFrontIO/blob/v0.35.9/packages/engine/src/configuration/EngineConfig.ts), [v0.35.9 Config.ts](https://github.com/openfrontio/OpenFrontIO/blob/v0.35.9/packages/engine-lib/src/configuration/Config.ts)

Outdated or imprecise:
- **"First City usually comes first."** This comes from the pre-v0.25 economy; see items 3–4.
- **"Nukes: economy only before minute 3; Silo + SAM at 3–5; bank for an H-bomb at 5–8."** This comes from openfront.fyi, which itself mixes v33–v35 labels. It does not account for the trade economy's faster gold, MIRV price escalation, or deterministic, level-scaled SAMs ([openfront.fyi nukes](https://openfront.fyi/mechanics/nukes/)).
- **"Hard and Impossible nations betray allies below about 20% of cap."** Superseded by v0.34.0's juiciness and retaliation logic ([v0.34.0](https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.34.0)).
- **The attack-ledger wording** ("stack under ~60% pays up to double"). The current clamp reaches 2× at a stack ≤50% of the defender's army, and there is now a defender-density term plus a 0.7× discount against bots ([v0.35.9 EngineConfig.ts](https://github.com/openfrontio/OpenFrontIO/blob/v0.35.9/packages/engine/src/configuration/EngineConfig.ts)).
- **Missing from the coach:** both partners earn each trade; spawns scale with port *level*; first-port and first-factory boosts (v0.35.0); train payouts by relationship (10k / 25k / 35k); trade-ship piracy.

### Inferences
- A coach that grades a v0.35 player on 2025 economic advice will mislabel good play. Examples: building a Port or Factory before a City, keeping gold flowing into port upgrades, prioritizing far-away allies as trade partners.
- The user's 92% trade/train gold share is consistent with the current formula. One 400-tile delivery (≈91k to each side) equals about 1.5 minutes of flat income (60k per minute), and each port level spawns ships independently. "Gold sitting unspent" and economy grades should therefore be benchmarked against trade-driven income, not the 1,000 gold per second base.
- The main economy-related mistakes to coach in v0.35:
  - short routes (under ~250 tiles);
  - few port levels on a coastal start;
  - not trading with allies and teammates, or toggling trade off with everyone;
  - losing trade ships to pirates;
  - city-first builds with no cap pressure.

### Gaps
- I did not verify community or Reddit discussion of each change, or player-perceived meta shifts (e.g., whether top players now open Port → Port → Factory). The build-order inferences come from the engine math, not from observed top-player replays.
- I did not compute exact current trade income for a typical Team-game player to set a coach benchmark. The user's replay data should be used for that.
