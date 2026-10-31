# Replay evidence: what the strongest humans actually did in 28 public OpenFront games (October 2026 builds), and how the coach's rules hold up

How to read this: every number comes from re-running the coach's own replay output (harness v10, or v6–v8 for 7 older files) and the OpenFront archive records in `/Users/justinhein/Development/openFrontCoach/data`. Sources are local files. "S" below is the scratchpad `/private/tmp/claude-501/-Users-justinhein-Development-openFrontCoach--claude-worktrees-openfront-coaching-research-36333c/0a6aa421-0e8a-4d79-9dac-5316864f0a94/scratchpad`. The extractor is `S/extract.mts`. It imports the coach's unmodified `computeMetrics`, `analyzeGame` and `overallOf` and runs the full coach for every human in every game as if that human were the user. The aggregators are `S/agg.js`, `S/agg2.js`, `S/checks.js` and `S/pergame.js`, and their outputs are `S/results2.txt`, `S/results3.txt`, `S/results4.txt` and `S/pergame.md`.

Group definitions used throughout:
- **TOP5**: the 5 humans with the highest peak land share in each game. In Team games this is across all teams.
- **TOP1**: the human with the highest peak land share in each game.
- **WIN**: every member of the winning team (Team), or the single winner (FFA).
- **REST_ACTIVE** ("median human"): humans ranked below 5th who placed at least 5 attack orders and lived at least 2 minutes.
- **ME**: AStrongerFellow.

Times are seconds after the spawn phase ends. Values are medians, unless a line says pooled.

## Which games, builds and players does the evidence cover?

### Takeaway
The analysis uses 28 public games played on four October 2026 builds: 22 Team and 6 FFA, with 1,482 spawned human rows. All 28 replays ran to the last recorded tick with no desync. AStrongerFellow spawned in 18 of them (15 Team, 3 FFA). The richest data, with structures and per-source income series, covers 21 games (18 Team, 3 FFA), so the FFA conclusions rest on very few games.

### Cited Findings
- Builds and dates:
  - 14ba82ba (Oct 26 UTC): 12 games, 10 Team and 2 FFA.
  - bf0ac8a1 (Oct 27): 10 games, 7 Team and 3 FFA.
  - c144d134 (Oct 30): 4 games, 3 Team and 1 FFA.
  - 7ee96860 (Oct 31 UTC, i.e. Oct 30 evening local): 2 Team games, c5VZsHpTtU Luna and crJ3gmswTb Strait of Hormuz.
  - Sources: [inventory in results2.txt](replay_data/results2.txt), [inv.js](replay_data/inv.js).
- Two single-player games were excluded: pq6snb3p has no replay, and c8LVKn4b is single-player against nations. — [inv.js output](replay_data/inv.js)
- Every replay's final tick equals the record's `num_turns`, with `desync: null` and `stoppedEarly: null`. — [inv.js](replay_data/inv.js)
- Harness versions:
  - 21 games have h10 replays, with structures, placement context and trade/train/piracy gold series.
  - 7 games have older h6/h7/h8 replays: cVvdYSEELT, dbXdHy9nHt, drwVKuaAVZ (FFA) and dkzu4msdkv, dcYgWMDP85, dnZM5CTAN3, dZyzmw8z8n (Team). These have no structures and no income-source series, but do have land, troops, attacks with exact `tilesCaptured`, actions and donation events.
  - Source: [inv.js](replay_data/inv.js)
- AStrongerFellow's games:
  - He spawned in 18 games: 15 Team and 3 FFA (cKhB25trk9, dTiXXa4VeA, dDSzeH2bKu).
  - He is listed in the records of 3 more Team games but never spawned (cqzxy8JuWm, cm1Ncf1hdJ, cRKgaFDAbF). That matches the coach DB's stats-only analyses for those games.
  - The 7 older-harness games do not include him.
  - Source: [results2.txt inventory](replay_data/results2.txt)
- Lobby makeup:
  - Every Team game had nations disabled (0 nations) and mostly 400 bots. FFA games had 6–82 nations.
  - Team formats were 2-team (7 games), 3, 4 (2), 5 (4), 6, 7 (4), Trios (1) and Quads (2).
  - Lobbies had 18–92 humans.
  - Source: [results2.txt inventory](replay_data/results2.txt), [results3.txt section D](replay_data/results3.txt)
- Group sizes:
  - Team h10: TOP5 n=90, TOP1 n=18, WIN n=261, REST_ACTIVE n=756.
  - FFA h10: TOP5 n=15 and WIN n=3.
  - Source: [results2.txt](replay_data/results2.txt)

### Inferences
- The Team results rest on 18–22 games and roughly 1,000 players, enough for stable medians. The FFA results rest on 3 games with structures (6 in total) and only 3–6 winners. Every FFA "winner" number is anecdotal.
- Each record carries its exact engine commit, and the replays ran on that commit. So this is behaviour on the builds the user actually plays, not a reconstruction.

### Gaps
- There are no games from before October 26, so the data cannot show how the meta changed relative to the build the coach's thresholds were written for.
- Elo or skill ratings are not in the records. "Strongest" is approximated by peak land, which favours survivors of long games.

## Economy: when did the top players build each structure, what did they build in the first 10 minutes, where did their gold come from, and how much did they float?

### Takeaway
In current Team games, gold comes almost entirely from Ports (trade ships) and Factories (trains). From minute 5 on, trade plus trains make up 92–98% of income for every group, while workers pay a flat 60k/min. Top players are not dramatically earlier with their first City (about 1:36 vs 1:46). What sets them apart:
- They build far more in the first 10 minutes: 19 orders and 13M gold, against 10 orders and 3.9M for the median human.
- More of them build Ports, Factories, SAMs and Warships.
- They earn 2–3× the income from minute 5 onward.
- They hold far more gold in absolute terms (1.5M average) but about the same number of minutes of their own income (0.7 min).

### Cited Findings
- **First build times, Team h10** (TOP5 / TOP1 / REST_ACTIVE / ME):
  - City: 1:36 / 1:38 / 1:46 / 1:48.
  - Port: 2:00 / 2:00 / 1:58 / 2:07.
  - Factory: 2:52 / 2:40 / 2:53 / 4:10.
  - Defense Post: 4:37 / 3:56 / 2:58 / 3:36.
  - Missile Silo: 8:04 / 9:29 / 7:27 / 6:43.
  - SAM: 6:07 / 5:44 / 6:28 / 8:28.
  - Warship: 4:36 / 4:35 / 4:30 / 5:11.
  - First Atom Bomb order: 8:43 / 8:04 / 8:30 / 10:50.
  - Source: [results2.txt, TEAM h10 "First build"](replay_data/results2.txt)
- **Who builds each structure at all, Team h10** (TOP5 vs REST_ACTIVE vs ME):
  - City by 10:00: 100% vs 90% vs 80%.
  - City by 2:30: 80% vs 70% vs 73%.
  - Port by 10:00: 90% vs 74% vs 73%.
  - Factory by 10:00: 79% vs 66% vs 67%.
  - Defense Post by 10:00: 60% vs 51% vs 60%.
  - Silo ever: 61% vs 36%.
  - SAM ever: 74% vs 41% vs 40%.
  - Warship ever: 66% vs 41%.
  - Source: [results2.txt](replay_data/results2.txt)
- **FFA h10** (3 games):
  - TOP5 first City at 1:16 vs 1:28 for the rest.
  - 100% of TOP5 built a Port by 10:00, and 100% built a Silo.
  - 93% built a SAM and 93% a Warship, against 19–39% of the rest.
  - FFA winners placed 27 build orders in the first 10 minutes and spent 24.3M gold.
  - Source: [results2.txt FFA h10](replay_data/results2.txt)
- **First-10-minute composition, Team h10** (orders including upgrades; TOP5 vs REST_ACTIVE vs ME):
  - Total orders: 19 vs 10 vs 11.
  - New Cities: 4 vs 2 vs 2.
  - Ports: 2 vs 1 vs 1.
  - Factories: 2 vs 1 vs 1.
  - Defense Posts: 1 vs 1 vs 1.
  - Silo + SAM: 1 vs 0 vs 1.
  - Warships: 1 vs 0 vs 0.
  - Gold spent: 13.0M vs 3.9M vs 3.7M.
  - Share of spending on Factory + Port: 18% (TOP1 11%) vs 26% vs 35%. City share: 25% vs 26% vs 23%.
  - City upgrades in the first 10 minutes: median 0 for every group.
  - Source: [results2.txt](replay_data/results2.txt)
- **Opening sequences** (first build / first three builds):
  - Team TOP5 first build: City 58%, Port 34%, Defense Post 6%. The most common first three are City > Port > City (13%), Port > City > Port (8%) and City > Port > Factory (7%).
  - Team rest first build: City 51%, Port 34%, Defense Post 6%, Factory 6%.
  - FFA TOP5 first build: City 80%, Port 20%.
  - Source: [results3.txt section F](replay_data/results3.txt)
- **Workers pay a flat 60k/min.** Lifetime worker gold divided by minutes alive is 60k for every group, Team and FFA. That matches the coach's "Base income is 60k/min". — [results2.txt "workers per min"](replay_data/results2.txt), [scoring.ts](/Users/justinhein/Development/openFrontCoach/.claude/worktrees/openfront-coaching-research-36333c/src/analysis/scoring.ts)
- **Lifetime gold by source, Team h10** (record stats; TOP5 / REST_ACTIVE / ME):
  - Trade ships: 59% / 37% / 56%.
  - Trains: 24% / 21% / 10%.
  - Workers: 3% / 9% / 12%.
  - Conquest: 6% / 6% / 3%.
  - Piracy: 0% for all.
  - Donations received: about 0% for all.
  - Income per minute alive: TOP5 2.10M, TOP1 2.90M, REST_ACTIVE 661k, ME 511k.
  - Source: [results2.txt](replay_data/results2.txt)
- **Lifetime gold by source, FFA h10** (winners): trade 78%, trains 5%, workers 0%, conquest 1%. Income was 15.0M per minute alive, against 344k for the rest. — [results2.txt](replay_data/results2.txt)
- **Income over time, Team h10** (per minute; TOP5 / REST_ACTIVE / ME):
  - 0–5 min: 653k / 322k / 255k. Of that, trade 185k / 46k / 48k and trains 97k / 45k / 0.
  - 5–10 min: 2.84M / 1.50M / 1.17M, with TOP1 at 4.28M. Trade plus trains are 93% of income for every group.
  - 10–15 min: 2.73M / 1.98M, with winners at 3.52M.
  - Source: [results2.txt income windows](replay_data/results2.txt)
- **Float, Team h10** (TOP5 / TOP1 / REST_ACTIVE / ME):
  - Average gold banked: 1.50M / 1.84M / 488k / 423k.
  - The same as minutes of own income (the coach's "float" metric): 0.68 / 0.74 / 0.77 / 0.61.
  - Share of life with more than 1.5M banked: 35% / 41% / 3% / 3%.
  - Peak gold: 7.76M / 10.0M / 1.86M / 2.04M.
  - Source: [results2.txt "Gold float"](replay_data/results2.txt)
- **Float, FFA h10 winners**: 25.8M banked on average, 79% of life above 1.5M, 1.45 minutes of income, peak gold 108M. — [results2.txt](replay_data/results2.txt)
- **Correlation with peak land rank** (per-game Spearman, median across games):
  - Average gold banked: ρ = +0.61 (Team, 22 games) and +0.73 (FFA, 6 games).
  - The coach's float in minutes: ρ = −0.13 (Team) and +0.09 (FFA).
  - First City time: ρ = −0.14 (Team) and −0.24 (FFA). Earlier is mildly better.
  - Source: [results2.txt Spearman section](replay_data/results2.txt)

### Inferences
- Since trade and trains are 90%+ of income after minute 5, the economy coaching should centre on getting Ports and Factories up early, keeping them alive and building enough of them. Timing the first City is a second-order lever: top players are only about 10 seconds earlier.
- "Unspent gold" is not a losing habit in today's game when measured in minutes of income: top players hold the same 0.7 minutes as everyone else. Their large absolute banks follow from large incomes, and also look like saving for 1.5M SAMs, Silos and nukes.
- The spending mix differs mainly in breadth. Top players spend relatively less on Ports and Factories (18% vs 26%) because they also buy Silos, SAMs, Warships and Defense Posts, not because they skip economy buildings.

### Gaps
- Records only give income by source as lifetime totals. Conquest and donation gold over time can only be estimated as "other" (earned minus trade, trains and piracy).
- Build orders are intents (`build_unit` actions). Structure timing uses the harness's first sample of the structure, which has 1–5 s resolution and may include construction time.
- The engine's trade-ship and train payout formulas were not re-checked against `rules.ts`.

## Troops and attacks: time near the regen peak vs the cap, attack size relative to the defender, send ratios, efficiency

### Takeaway
In Team games, the coach's troop model holds up directionally:
- Top players spend more time in the 30–55% band (31% vs 20%) and much less time near the cap in mid-game (14% vs 34%).
- They attack with stacks close to or above the defender's whole army (TOP1 median 1.5×), against about 0.5× for the median human.
- Large stacks are 2–3× more efficient per troop.

In long FFA games the pattern flips: the eventual giants sit near their cap 37% of the time.

Nearly everyone, winners included, clicks at the default 20% send ratio. Openings are 4–5 quick 20% clicks, not one big send.

### Cited Findings
- **Engine check.** In the newest engine (7ee96860), regen is `(10 + troops^0.73/4) × (1 − troops/max)` and the human troop cap is `2 × (tiles^0.6 × 1000 + 50000)` plus City levels × cityTroopIncrease. That matches `rules.ts`, so peak regen at about 42% of cap is still correct. — [Config.ts lines 335–396](/Users/justinhein/Development/openFrontCoach/data/engines/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/src/packages/engine-lib/src/configuration/Config.ts), [rules.ts](/Users/justinhein/Development/openFrontCoach/.claude/worktrees/openfront-coaching-research-36333c/src/analysis/rules.ts)
- **Troop bands, Team h10** (share of life; TOP5 / TOP1 / REST_ACTIVE / ME):
  - 30–55% of cap: 31% / 30% / 20% / 14%.
  - At or above 88%: 12% / 7% / 21% / 17%.
  - Below 15%: 6% / 5% / 7% / 14%.
  - Average troops/cap: 51% / 49% / 57% / 49%.
  - Mid-game (5–15 min) at or above 88%: 14% / 5% / 34% / 34%.
  - The coach's regen efficiency: 74% / 77% / 61% / 58%.
  - Source: [results2.txt Troops](replay_data/results2.txt)
- **Correlation with peak land rank, Team** (22 games): time near the regen peak ρ = +0.33; time at or above 88% ρ = −0.13; average troop ratio ρ = −0.09; the coach's troop efficiency ρ = +0.28. — [results2.txt Spearman](replay_data/results2.txt)
- **Older Team games** (4 games, h6/h7): TOP5 30–55% share 23% vs 16% for the rest, and at or above 88% 25% vs 31%. Same direction. — [results2.txt](replay_data/results2.txt)
- **FFA h10** (3 long games, 36–45 min):
  - At or above 88%: TOP5 37% vs rest 24%.
  - Idle at cap (≥88% with no attack running): TOP5 840 s, winners 988 s, rest 116 s.
  - Correlation with peak rank: time at or above 88% ρ = +0.24 and the coach's troop efficiency ρ = −0.10 (FFA, 6 games).
  - The 3 short older FFA games (10–42 min) go the other way: winners at or above 88% only 6% of the time.
  - Source: [results2.txt](replay_data/results2.txt)
- **Stack size relative to the defender's army** (attacks on players, merged reinforcements excluded; Team h10; TOP1 / TOP5 / REST_ACTIVE / ME):
  - Median stack ÷ defender army: 1.53 / 0.99 / 0.53 / 0.45.
  - Share of stacks at least 1.7×: 48% / 32% / 10% / 3%.
  - Share of stacks below 0.6×: 18% / 29% / 53% / 59%.
  - Correlation with peak rank: ρ = +0.44 (Team) and +0.56 (FFA).
  - Source: [results2.txt](replay_data/results2.txt)
- **Efficiency by stack bucket, pooled tiles taken per 1,000 troops** (Team, 22 games, 13,939 attacks; elimination rate in brackets):
  - 0–0.3×: 8.3 (0%).
  - 0.3–0.6×: 6.7 (1%).
  - 0.6–1×: 8.0 (2%).
  - 1–1.7×: 13.3 (5%).
  - 1.7–3×: 17.6 (9%).
  - 3× or more: 22.4 (13%).
  - FFA: 6.9 / 5.2 / 8.7 / 12.7 / 22.7 / 27.2.
  - Top-5 attackers are more efficient within every bucket: 8.6–25.0 against 5.8–17.3 for others.
  - Source: [results3.txt section A](replay_data/results3.txt)
- **Overall attack efficiency vs players** (pooled tiles per 1,000 troops, Team h10): TOP1 16.3, TOP5 12.4, REST_ACTIVE 8.7, ME 4.7. — [results2.txt](replay_data/results2.txt)
- **Bots.** Share of troops spent on bots: TOP5 7%, TOP1 3%, rest 29% (Team); FFA TOP5 1% vs 18%. — [results2.txt](replay_data/results2.txt)
- **Send ratio per click** (`sent ÷ troops` at the click):
  - The median is 20% for every group, Team and FFA, for the first send, opening sends, attacks on bots and attacks on players before 15:00.
  - Team TOP5 raise it to 30% after 15:00, and TOP1 to 35%.
  - Pooled share of clicks at 18–22%: Team TOP5 36%, rest 40%. Share at 60% or more: 6% vs 4%.
  - FFA top players often go below 12%: 37% of TOP5 clicks and 48% of TOP1 clicks.
  - Source: [results2.txt Send ratios](replay_data/results2.txt), [results3.txt section B](replay_data/results3.txt)
- **Opening clicks.** In the first 15 s after spawn, players place a median of 4–5 attack orders, which together commit 110% (Team TOP5), 117% (rest) and 123% (ME) of the troops held at the first click. — [results3.txt section B](replay_data/results3.txt)
- **Attack frequency and retreats.** Attack orders per minute, Team: TOP1 10.5, TOP5 7.5, rest 6.5. FFA TOP5: 2.6. Retreats have a median of 0 in every group. — [results2.txt](replay_data/results2.txt)

### Inferences
- "Keep troops near 42%" and "don't idle at the cap" are sound for Team games, especially between minutes 5 and 15. They are wrong as blanket rules for long FFA endgames, where the leaders bank at their cap, presumably to deter other giants and nukes.
- The coach's attack-size claims hold up: small stacks cost about twice as many troops per tile, and 1.7× or more roughly doubles efficiency. They are also the clearest controllable difference between top players and the median human, yet the coach has no metric for them.
- Advice to make a "60–100%" or "60–70%" opening send describes a habit nobody shows. Players reach the same total commitment by repeated 20% clicks, so the per-click average the coach checks is about 20% for winners and losers alike.

### Gaps
- The defender's whole army is a weak proxy for the troops actually defending the attacked border. Local density, Defense Posts and terrain are not captured.
- The share of tiles taken from each target could not be computed reliably, so that column is blank in `results3.txt`.
- It is not known whether the 20% clicks come from the client's default slider. The number is consistent with that.

## Expansion: land share at 1, 2, 5 and 10 minutes vs final placement, and whether seconds-to-first-expansion matters

### Takeaway
Land share at 2:00 and especially at 5:00 strongly predicts who ends up on top (per-game ρ about 0.70 and 0.84). Land at 0:30 does not (ρ about 0.07). Seconds to first expansion has essentially no relationship with outcome: almost everyone sends within 1–2 s, and the 23% who are slower than 3 s are equally common among top players.

### Cited Findings
- **Land share after spawn, Team h10** (TOP5 / TOP1 / REST_ACTIVE / ME):
  - 0:30: 0.28% / 0.27% / 0.25% / 0.27%.
  - 1:00: 0.70% / 0.76% / 0.63% / 0.47%.
  - 2:00: 2.04% / 2.23% / 1.37% / 1.10%.
  - 5:00: 4.77% / 7.03% / 1.97% / 1.44%.
  - 10:00: 6.95% / 13.2% / 1.86% / 1.32%.
  - Median human rank: TOP5 18th at 1:00, 11th at 2:00, 5th at 5:00. ME 32nd, 32nd, 31st.
  - Source: [results2.txt Expansion](replay_data/results2.txt)
- **Correlation with peak land rank** (per-game Spearman, median across games; Team, 22 games / FFA, 6 games):
  - 0:30: 0.07 / 0.13.
  - 1:00: 0.35 / 0.50.
  - 2:00: 0.70 / 0.79.
  - 5:00: 0.84 / 0.88.
  - 10:00: 0.72 / 0.75.
  - Source: [results2.txt Spearman](replay_data/results2.txt)
- **Seconds to first expansion:**
  - Median 1.5 s for TOP5, 1.3 s for TOP1, 1.7 s for REST_ACTIVE and 2.1 s for ME (Team h10).
  - Correlation with peak rank: ρ = −0.09 (Team) and +0.06 (FFA).
  - Share slower than 3 s: 23% of TOP5 and 23% of the rest (Team). In FFA, 10% of TOP5 and 20% of the rest.
  - Source: [results2.txt](replay_data/results2.txt), [results3.txt section E](replay_data/results3.txt)
- **The coach's "relative land" metrics** (TOP5 vs REST_ACTIVE AUC, Team h10): share at 1:00 0.57, at 2:00 0.70, at 5:00 0.82. — [results3.txt section H](replay_data/results3.txt)
- **Spawn timing:** spawn pick time is about 16 s for every group. — [results2.txt](replay_data/results2.txt)

### Inferences
- The opening window that matters is about 1–5 minutes: land at 2:00, and above all 5:00. A 0–3 s delay to the first click is noise.
- Because land at 0:30 is equal across groups, the gap at 2:00 and 5:00 comes from what players do in minutes 1–5: where they expand, bot clearing, early fights. It does not come from reaction time.

### Gaps
- Spawn quality was not measured: open land nearby, bots, neighbours, coast. It is a likely driver of the 1:00–2:00 gap that this analysis cannot separate from skill.

## Team games: do winners donate or receive troops and gold, and how does individual land share relate to the team result?

### Takeaway
Team games are carried. The eventual biggest human was on the winning team in 19 of 22 games, and these carries are fed by teammates: TOP1 received a median 16.7M troops by donation (Team h10). Net of what they sent, that is about 185% of their own peak army, and gross it is 237% across all 22 Team games. Most winning-team members are small and donate. In 2-team lobbies, a player's own land share tells you almost nothing about whether their team won (AUC 0.48). Gold donations are rare.

### Cited Findings
- **Donations, Team h10** (TOP1 / TOP5 / REST_ACTIVE / WIN / ME):
  - Troops received: 16.74M / 6.42M / 207k / 523k / 0.
  - Number of troop donations received: 31 / 12 / 1 / 2 / 0.
  - Net troops (received minus sent) as a share of own peak troops: +185% / +66% / 0% / −13% / 0%.
  - Received any troops: 94% / 88% / 59% / 67% / 40%.
  - Troops sent: 17k / 902k / 318k / 1.68M / 288k.
  - Sent any troops: 50% / 66% / 60% / 69% / 60%.
  - Source: [results2.txt Donations](replay_data/results2.txt)
- **Gold donations** are rare: 10–28% of any group sent or received gold, the median is 0, and donation gold is about 0% of income in record stats. — [results2.txt](replay_data/results2.txt)
- **Donation timing** (Team, 22 games):
  - TOP1 first received troops at a median 204 s.
  - TOP1 had received 761k by 5:00 and 8.0M by 10:00, and 45% of TOP1 had received over 1M by 5:00.
  - The eventual TOP1 was already their team's land leader at 5:00 in 12 of 22 games.
  - Source: [results3.txt section D](replay_data/results3.txt)
- **Correlation with peak land rank** (Team, 22 games): troops received by donation ρ = +0.51; troops sent ρ = +0.29. — [results2.txt Spearman](replay_data/results2.txt)
- **The biggest human usually wins:**
  - The peak-land #1 human was on the winning team in 19 of 22 Team games.
  - The human with the most land at 5:00 was on the winning team in only 9 of 22.
  - The team with the most summed land at 5:00 won 9 of 22.
  - Source: [results2.txt TEAM GAMES section](replay_data/results2.txt)
- **Own land vs team result** (AUC of individual peak share, winners vs losers, active players):
  - Overall: 0.53.
  - 2-team lobbies (7 games): 0.48.
  - 5-team lobbies (4 games): 0.63.
  - 7-team lobbies (4 games): 0.58.
  - Trios and Quads (3 games): 0.88–0.95.
  - Source: [results3.txt section D](replay_data/results3.txt)
- **Concentration:** on the winning team, the biggest member held a median 33% of the team's summed peak land. The range runs from 15% (2-team lobbies) to 92% (one 7-team game). — [results3.txt section D](replay_data/results3.txt)
- **The coach does not score donations.** No metric or moment in `scoring.ts` or `moments.ts` reads donations, and `metrics.ts` only reads the record's gold-received donation index. — [scoring.ts](/Users/justinhein/Development/openFrontCoach/.claude/worktrees/openfront-coaching-research-36333c/src/analysis/scoring.ts), [metrics.ts](/Users/justinhein/Development/openFrontCoach/.claude/worktrees/openfront-coaching-research-36333c/src/analysis/metrics.ts)

### Inferences
- In big-team public lobbies, many "winners" are passengers who donated troops to a carry. Judging them on personal land, as the coach's placement and land metrics do, misreads their contribution.
- A team-aware coach should ask two things:
  - Did you feed the right teammate early (by about 3–5 minutes)?
  - If you were the carry, did you convert donations into land?
- Small-squad formats (Trios and Quads) behave more like FFA, where personal land does matter.

### Gaps
- Causality runs both ways: teammates may donate because a player is already leading. That player was their team's leader at 5:00 in only 12 of 22 games, so donations probably help create leaders too, but this data cannot settle it.
- Coordination through chat and Discord is not visible.

## Nukes and SAMs: when did the first enemy Silo appear compared with the winners' first SAM, and who got nuked?

### Takeaway
An enemy Silo exists by about 4:40 in a typical Team game, and the first nukes land at 4–7 minutes. Top players build their first SAM about 1 minute after the first enemy Silo, at around 6:07. Nukes go overwhelmingly to the land leaders: 94% of TOP1 players were nuked, typically while ranked 1st. So "you were nuked without a SAM" mostly describes being the leader.

### Cited Findings
- **Timing, Team h10:**
  - The first enemy Silo (any player not on your team) appeared at a median 4:44.
  - Per game, the first Silo ranged from 2:09 (Caspian Sea) to 5:30, and the first nuke at a human from 4:23 to 7:35.
  - Source: [results2.txt Nukes](replay_data/results2.txt)
- **First SAM:**
  - TOP5 built theirs at 6:07, TOP1 at 5:44, REST_ACTIVE at 6:28 and ME at 8:28.
  - Lag after the first enemy Silo: TOP5 66 s, REST_ACTIVE 103 s, ME 191 s.
  - 49% of TOP5 had a SAM within 2 minutes of the first enemy Silo, and 26% never built one.
  - FFA TOP5 lagged 232 s.
  - Source: [results2.txt](replay_data/results2.txt), [results3.txt section G](replay_data/results3.txt)
- **Who gets nuked, Team** (22 games, 3,247 nukes at humans):
  - TOP5 players are 9% of humans and received 33% of the nukes; TOP1 received 7%.
  - 83% of TOP5 and 94% of TOP1 were nuked at least once. 41% of TOP5 received 5 or more nukes.
  - Land rank at first hit: TOP1 1st, TOP5 3rd, REST_ACTIVE 15th.
  - Only 50% of TOP5 had a SAM when first nuked.
  - Source: [results2.txt](replay_data/results2.txt), [results3.txt section G](replay_data/results3.txt)
- **Who gets nuked, FFA** (6 games, 618 nukes at humans): TOP5 players are 10% of humans and received 74% of the nukes. All 15 h10 TOP5 players were nuked. — [results3.txt section G](replay_data/results3.txt)
- **Nuke-heavy games:** Luna (c5VZsHpTtU, 7ee96860) saw 960 nukes at humans, Madagascar 502 and Luna (dwpL9q7jim) 208. — [results2.txt per-game nukes](replay_data/results2.txt)
- **Launches:** TOP5 launched a median of 2 nukes (62% launched any); REST_ACTIVE launched 0 (28% any). — [results2.txt](replay_data/results2.txt)

### Inferences
- "Have a SAM over your core shortly after the first enemy Silo appears" is consistent with what top players do. In practice that means about 5–6 minutes, which is a better trigger than a fixed "minute ~5".
- The coach's `nukesTaken` metric (fewer is better) and its "N nukes launched at you with no SAM cover" moment both penalise being the leader. TOP5 score worse than the rest on `nukesTaken` (directional AUC 0.37 in Team, 0.05 in FFA).

### Gaps
- The Silo timing for the 7 older-harness games is unknown: they lack structures, and the build-order fallback was not used for this table.
- The harness does not record whether each nuke was intercepted per target. Interception totals exist only per launcher.

## Coach rules tested against the winners: which fire on top players as often as on losers (false positives), and which miss what separated winners

### Takeaway
Most of the coach's "mistake" moments fire as often or more often on the top-5 players as on everyone else. These include:
- "Attack(s) went badly"
- "City bought Ns after you could afford it"
- "Army idle at the troop cap"
- "Trade ships captured"
- "Spend <40% on economy"
- "Slow first expansion"
- the nuke-without-SAM moments

Only a few rules separate winners from losers: "Opening fell behind", "City lost Ns after built", "Port lost Ns after built" (weakly), and the trade-share benchmark advice. The coach does not measure what most clearly separated top players:
- stack size relative to the defender
- troop donations received or given
- land at 5:00 as a headline target
- trade and train income ramp in minutes 5–10
- SAM timing relative to enemy Silos

### Cited Findings
- **Share of players each rule fires on at least once** (Team h10, 18 games; TOP5 / TOP1 / REST_ACTIVE / LOSE_ACTIVE). Source for all of these: [results2.txt COACH RULES TEAM h10](replay_data/results2.txt).
  - "Attack(s) went badly": 88% / 94% / 59% / 64%.
  - "City bought Ns after you could afford it": 59% / 61% / 31% / 29%.
  - "Army idle at the troop cap": 60% / 50% / 63% / 62%.
  - "Trade ships captured": 71% / 72% / 49% / 53%.
  - Advice "Only X% of your spending went to the economy": 54% / 44% / 22% / 22%.
  - "Structure nuked with no SAM": 39% / 28% / 18% / 21%.
  - "Structure N tiles from X's border": 24% / 28% / 11% / 13%.
  - "N nukes launched at you with no SAM cover": 22% / 22% / 9% / 12%.
  - "Slow first expansion": 23% / 11% / 23% / 25%.
  - Advice "Your first City came at …" (after 2:30): 20% / 17% / 21% / 18%.
  - "Caught with an empty army": 20% / 28% / 17% / 21%.
  - "Defense Post lost Ns after built": 26% / 17% / 28% / 33%.
  - "Factory with almost no rail links": 17% / 11% / 19% / 16%.
  - "Gold piled up unspent": 6% / 17% / 6% / 5%.
  - "Lost N% of your territory in a minute": 61% / 28% / 81% / 93%.
- **Rules that do separate** (same column order):
  - "Opening fell behind": 4% / 0% / 23% / 22%.
  - "City lost Ns after built": 16% / 6% / 23% / 26%.
  - "Port lost Ns after built": 11% / 11% / 17% / 20%.
  - "Factory lost Ns after built": 7% / 0% / 12% / 13%.
  - Trade-share benchmark advice: 11% / 6% / 40% / 45%.
  - "No Port while the lobby traded": 9% / 17% / 25% / 28%.
  - "Late first City": 10% / 11% / 13% / 10%. Weak.
- **FFA** (6 games; TOP5 vs REST_ACTIVE). Source: [results2.txt COACH RULES FFA all harness](replay_data/results2.txt).
  - "Army idle at the troop cap": 87% vs 57%.
  - "Gold piled up unspent": 33% vs 5% (TOP1 67%).
  - "<40% spend on economy" advice: 70% vs 18%.
  - "City bought Ns after affordable": 57% vs 17%.
  - "Nukes at you with no SAM": 43% vs 7%.
  - "You betrayed": 73% vs 24%.
  - "Opening fell behind": 3% vs 21%. This one does separate.
- **Why "City bought Ns after affordable" fires on top players:**
  - Top players' first City waits a median of only 9 s (rest 12 s).
  - The moment fires on a later City, at a median 467 s into the game, with a median 92 s wait.
  - The wait counts any time the bank exceeded the City price, even when that gold was going to Ports, Factories and SAMs.
  - In FFA, top players' new-City waits have a median of 298 s, with 60% over 60 s.
  - Source: [results4.txt](replay_data/results4.txt), [results3.txt section E](replay_data/results3.txt), [economy.ts](/Users/justinhein/Development/openFrontCoach/.claude/worktrees/openfront-coaching-research-36333c/src/analysis/economy.ts)
- **Why "Gold piled up unspent" fires on top players:** when it fires on TOP5, their median peak gold is 56.7M (rest 6.8M). That is FFA giants saving for MIRVs and Hydrogen Bombs. — [results4.txt](replay_data/results4.txt)
- **"Opening fell behind" gives the wrong advice:**
  - 258 of its 292 firings (88%) had an average opening ratio below 0.4 (median 0.21), which switches its suggestion to "Open with bigger sends into unclaimed land (60–70%, or 100% on the very first click)".
  - Every group's per-click opening ratio is about 20%, and top players commit about 110% in 15 s through repeated clicks.
  - The "Slow first expansion" suggestion ("first big send (60–100%) queued the moment the spawn timer ends") has the same problem.
  - Source: [results4.txt](replay_data/results4.txt), [moments.ts lines 227–270](/Users/justinhein/Development/openFrontCoach/.claude/worktrees/openfront-coaching-research-36333c/src/analysis/moments.ts)
- **"Attack went badly" is not specific to bad players.** Per attack, the coach's ledger marks blunder, mistake or inaccuracy on 9.1% of TOP5 attacks on players against 9.7% for the rest (Team). The flag rate per player is higher for top players simply because they attack 5× more often (28 vs 5 attacks). — [results3.txt section C](replay_data/results3.txt)
- **The coach's overall score:**
  - The base score separates TOP5 from REST_ACTIVE with AUC 0.86. That is partly circular: it includes peak share (AUC 0.98), eliminations, survival and drawdown.
  - It separates team winners from losers with only AUC 0.69.
  - By category, for team-win AUC: troops 0.49, expansion 0.52, combat 0.56, diplomacy 0.49.
  - The nuclear category scores TOP5 below the rest (AUC 0.39).
  - Source: [results2.txt coach scores](replay_data/results2.txt)
- **Metrics where top players score worse by the coach's own direction** (directional AUC below 0.5, TOP5 vs rest, Team h10):
  - placeBad 0.28
  - structuresLost 0.23
  - nukesTaken 0.37
  - fullSends 0.43
  - lostEarly 0.43
  - tradePerShip 0.45
  - boatSuccess 0.42
  - Additional ones in FFA h10: troopEff 0.39, atCap 0.34, float 0.40, betrayedBy 0.20, structuresLost 0.05, nukesTaken 0.05.
  - Source: [results3.txt section H](replay_data/results3.txt)
- **Saturated income curve.** The coach's `goldPerMin` absolute curve tops out at 500k/min, and 60% of the 1,186 Team player rows are already at or above it. So the absolute part of the economy score no longer separates players. — [results4.txt](replay_data/results4.txt), [scoring.ts](/Users/justinhein/Development/openFrontCoach/.claude/worktrees/openfront-coaching-research-36333c/src/analysis/scoring.ts)
- **Things that separated top players and are missing from the coach** (per-game Spearman with peak rank, Team):
  - Stack ÷ defender: ρ = +0.44 (FFA +0.56).
  - Troops received by donation: ρ = +0.51.
  - Average gold banked: ρ = +0.61. The coach treats banking as bad.
  - Land at 5:00: ρ = +0.84. The coach does use this, at a 1.5 weight.
  - Plus the descriptive gaps shown above: share of troops spent on bots (7% vs 29%), Silo/SAM/Warship adoption, and mid-game time at the cap (14% vs 34%).
  - Source: [results2.txt Spearman](replay_data/results2.txt)

### Inferences
- The rules that fire on top players more than on the rest are mostly measuring activity, wealth or being the leader:
  - more attacks → more "bad attacks"
  - more gold → "City bought late" and "gold piled up"
  - more land → more nukes and more border-adjacent buildings
  - more diverse spending → "<40% on economy"
- These need to be normalised per attack or per minute, or compared against top players' own rates, before they are shown as mistakes.
- Opening coaching should drop the per-click ratio advice. It should focus on land share at 2:00 and 5:00 relative to the lobby (this already separates) and on what limited the player in minutes 1–5.
- For Team mode the coach needs team-aware rules:
  - donations (who fed whom, and when)
  - not judging passengers on personal land
  - nuke exposure framed as the price of leading

### Gaps
- Building-related rules can only be tested on the 21 h10 games. On older replays without structures, "no Port while the lobby traded" fires falsely, so FFA all-harness rates for building rules should be ignored.
- The analysis tests whether a rule fires, not whether its advice would have helped. No counterfactual is possible from replays.

## How does AStrongerFellow compare with the top-5 and the median human?

### Takeaway
Across his 15 Team games, AStrongerFellow falls behind early. He holds:
- 0.47% of the land at 1:00 (rank 32), against 0.70% for the top 5 and 0.63% for the median.
- 1.44% at 5:00, against 4.77% and 1.97%.

His troop habits are close to the top players' (average 49% of cap). His attack efficiency is about half the median human's:
- 4.7 tiles per 1,000 troops, against 8.7 for the median human and 12.4 for the top 5.
- 59% of his attacks on players use stacks below 0.6× the defender's army, and only 3% reach 1.7×.

His first Factory comes late (4:10 vs 2:52), and so does his first SAM (8:28, about 3 minutes after enemy Silos appear). In a median game he receives no donated troops.

### Cited Findings
- **Team h10, ME vs TOP5 vs REST_ACTIVE.** Source for all of these: [results2.txt](replay_data/results2.txt).
  - Land share at 1:00 / 2:00 / 5:00 / 10:00: 0.47 / 1.10 / 1.44 / 1.32% (ME), 0.70 / 2.04 / 4.77 / 6.95% (TOP5), 0.63 / 1.37 / 1.97 / 1.86% (REST_ACTIVE).
  - First expansion: 2.1 s vs 1.5 s vs 1.7 s.
  - Time below 15% of cap: 14% vs 6% vs 7%.
  - Stack ÷ defender: 0.45 vs 0.99 vs 0.53.
  - Tiles per 1,000 troops vs players: 4.7 vs 12.4 vs 8.7.
  - Tiles per 1,000 troops vs bots: 32.4 vs 45.0 vs 40.8.
  - First Factory: 4:10 vs 2:52 vs 2:53.
  - First SAM: 8:28 vs 6:07 vs 6:28.
  - Income at 5–10 min: 1.17M vs 2.84M vs 1.50M per minute.
  - Troops received by donation: median 0 vs 6.42M vs 207k.
- **Attack verdicts:** the coach's ledger marked 13.2% of ME's 385 attacks on players as blunder, mistake or inaccuracy (6.2% blunders), against 9.7% (2.1% blunders) for the rest. — [results3.txt section C](replay_data/results3.txt)
- **Clicking:** ME clicks at the 20% default like everyone else, but 62% of his games include a send of 60% or more, against 47% of TOP5 and 30% of the rest. — [results3.txt section B](replay_data/results3.txt)
- **Results:**
  - Team games: on the winning team 4 times (c56VtSBKyc, cYyGhNKL9s, de53VV1rMa, dFcHig8HFW), but his best peak-land rank was 12th of 21 (Levant).
  - Eliminated within 5 minutes in 9 of 18 spawned games. His lifespans were 0:47, 1:31, 1:35, 1:35, 2:30, 3:20, 4:35, 4:53 and 4:59.
  - FFA: eliminated at 0:47, 1:31 and 19:32.
  - Source: [results2.txt USER PER GAME](replay_data/results2.txt), [pergame.md](replay_data/pergame.md)
- **Per-game numbers.** Table below; source [pergame.md](replay_data/pergame.md). "T5" is the top-5 median and "med" the median of active humans (top 5 included). "Income" is per minute over minutes 5–10 and needs h10 replays.

| Game | Build | Mode | Map | Humans | Length | Share at 2:00 % (T5 / med / me) | Share at 5:00 % (T5 / med / me) | First City (T5 / med / me) | Avg troops/cap % (T5 / med / me) | Tiles per 1k troops vs players (T5 / med / me) | Income 5–10 min (T5 / med / me) | Me |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| cVvdYSEELT | 14ba82ba (h8) | FFA | San Francisco | 25 | 11:25 | 2.52 / 1.88 / — | 6.10 / 3.48 / — | 1:25 / 1:30 / — | 52 / 53 / — | 17.4 / 12.5 / — | n/a | not in game |
| cKhB25trk9 | 14ba82ba | FFA | Gulf Of Guinea | 64 | 45:03 | 1.70 / 1.36 / — | 4.38 / 2.59 / — | 1:16 / 1:28 / — | 67 / 57 / 6 | 20.3 / 14.6 / 4.6 | 5.3M / 2.4M / — | 63/64, out at 0:47 |
| c56VtSBKyc | 14ba82ba | Team 5 | Balkans | 65 | 25:13 | 1.10 / 1.10 / 0.84 | 1.91 / 1.71 / 1.66 | 2:16 / 1:58 / 2:01 | 58 / 59 / 70 | 16.3 / 9.0 / 7.5 | 1.8M / 1.1M / 503k | 38/65, team won |
| cMcVMHf42A | 14ba82ba | Team 5 | Nile Delta | 46 | 10:34 | 2.37 / 1.69 / 1.41 | 4.65 / 3.50 / 1.62 | 1:32 / 1:32 / 1:32 | 44 / 51 / 62 | 11.0 / 9.5 / 6.7 | 3.8M / 1.4M / 956k | 25/46, lost |
| cbRJTdWa3Y | 14ba82ba | Team 7 | Levant | 21 | 16:14 | 4.92 / 5.11 / 5.18 | 13.61 / 5.56 / — | 2:08 / 1:55 / 1:54 | 73 / 56 / 54 | 11.4 / 9.5 / 5.1 | 3.8M / 1.6M / — | 12/21, out at 4:35 |
| cYyGhNKL9s | 14ba82ba | Team 4 | Giant World Map | 83 | 12:54 | 1.33 / 1.07 / 1.16 | 3.93 / 1.66 / 1.66 | 1:16 / 1:46 / 1:58 | 49 / 54 / 60 | 13.9 / 10.1 / 10.0 | 2.4M / 1.4M / 1.7M | 16/83, team won |
| cqzxy8JuWm | 14ba82ba | Team Quads | Rio de Janeiro | 66 | 23:33 | 1.79 / 1.60 / — | 1.93 / 2.15 / — | 1:55 / 1:25 / — | 57 / 59 / — | 24.8 / 12.0 / — | 3.9M / 2.4M / — | did not spawn |
| c3Mby39o1q | 14ba82ba | Team Trios | Los Angeles | 39 | 10:50 | 1.70 / 1.35 / — | 6.37 / 2.42 / — | 1:21 / 1:33 / — | 47 / 54 / 18 | 15.0 / 12.4 / 3.5 | 4.9M / 1.4M / — | 36/39, out at 1:35 |
| cm1Ncf1hdJ | 14ba82ba | Team 5 | Gateway to the Atlantic | 60 | 15:08 | 1.58 / 1.33 / — | 4.44 / 1.94 / — | 1:36 / 1:58 / — | 42 / 49 / — | 11.3 / 11.3 / — | 1.2M / 1.5M / — | did not spawn |
| cH1VKYQefz | 14ba82ba | Team Quads | China | 50 | 12:29 | 2.19 / 1.47 / 1.23 | 6.45 / 2.59 / — | 1:26 / 1:30 / 1:18 | 44 / 60 / 48 | 13.9 / 10.4 / 3.3 | 1.9M / 1.0M / — | 32/50, out at 4:59 |
| cRKgaFDAbF | 14ba82ba | Team 2 | Pluto | 45 | 9:37 | 2.44 / 1.59 / — | 4.30 / 2.44 / — | 1:37 / 2:08 / — | 50 / 55 / — | 14.0 / 9.3 / — | 3.3M / 2.0M / — | did not spawn |
| cjBAe3NtkU | 14ba82ba | Team 4 | Pluto | 92 | 9:11 | 1.44 / 1.14 / 0.67 | 2.48 / 1.35 / 0.93 | 1:14 / 1:37 / 2:21 | 46 / 50 / 49 | 16.1 / 9.7 / 3.0 | 3.6M / 1.3M / 1.0M | 65/92, lost |
| dbXdHy9nHt | bf0ac8a1 (h6) | FFA | Great Lakes | 23 | 9:59 | 6.52 / 3.72 / — | 12.61 / 5.40 / — | 1:20 / 1:32 / — | 62 / 56 / — | 13.7 / 10.1 / — | n/a | not in game |
| dkzu4msdkv | bf0ac8a1 (h7) | Team 5 | Russia | 71 | 14:28 | 0.99 / 0.96 / — | 2.77 / 1.51 / — | 1:39 / 1:48 / — | 59 / 56 / — | 13.8 / 8.7 / — | n/a | not in game |
| dcYgWMDP85 | bf0ac8a1 (h6) | Team 7 | Middle East | 39 | 21:29 | 1.17 / 1.16 / — | 3.81 / 2.58 / — | 1:37 / 1:23 / — | 49 / 60 / — | 21.5 / 10.4 / — | n/a | not in game |
| drwVKuaAVZ | bf0ac8a1 (h7) | FFA | Dyslexdria | 91 | 42:33 | 1.29 / 0.77 / — | 4.54 / 1.45 / — | 1:16 / 1:31 / — | 77 / 56 / — | 16.0 / 10.5 / — | n/a | not in game |
| dnZM5CTAN3 | bf0ac8a1 (h7) | Team 7 | Baikal Nuke Wars | 79 | 25:04 | 1.86 / 1.08 / — | 2.52 / 1.96 / — | 1:21 / 1:37 / — | 66 / 54 / — | 19.0 / 10.6 / — | n/a | not in game |
| dZyzmw8z8n | bf0ac8a1 (h7) | Team 2 | Strait of Gibraltar | 91 | 15:53 | 1.00 / 0.98 / — | 1.72 / 1.05 / — | 1:19 / 2:16 / — | 70 / 74 / — | 10.2 / 7.9 / — | n/a | not in game |
| dwpL9q7jim | bf0ac8a1 | Team 2 | Luna | 36 | 16:35 | 2.33 / 2.09 / 1.19 | 3.46 / 2.70 / 1.64 | 3:38 / 1:54 / 1:44 | 66 / 69 / 78 | outlier / 8.0 / — | 1.1M / 2.1M / 1.6M | 29/36, lost |
| dU2gif7fPz | bf0ac8a1 | Team 6 | Asia | 49 | 13:24 | 3.00 / 2.02 / 0.89 | 6.97 / 2.96 / — | 1:32 / 1:32 / — | 53 / 54 / 48 | 14.6 / 9.8 / 0.6 | 2.7M / 1.7M / — | 44/49, out at 4:53 |
| de53VV1rMa | bf0ac8a1 | Team 2 | Caspian Sea | 36 | 8:33 | 3.19 / 2.80 / 1.66 | 6.96 / 3.44 / — | 1:26 / 1:33 / 1:13 | 42 / 49 / 39 | 10.0 / 9.5 / 11.1 | 4.4M / 1.9M / — | 29/36, team won (he was out at 3:20) |
| dTiXXa4VeA | bf0ac8a1 | FFA | Faroe Islands | 19 | 36:16 | 4.65 / 4.35 / 2.74 | 5.37 / 4.51 / 4.48 | 1:12 / 1:16 / 1:32 | 57 / 57 / 79 | 14.9 / 5.9 / 4.7 | 3.7M / 2.0M / 1.5M | 14/19, out at 19:32 |
| dDSzeH2bKu | c144d134 | FFA | Northwest Passage | 74 | 41:31 | 2.10 / 1.18 / — | 5.16 / 1.73 / — | 1:20 / 1:32 / — | 71 / 63 / 17 | 13.0 / 9.7 / 8.7 | 4.4M / 887k / — | 66/74, out at 1:31 |
| dDFmY5EPcD | c144d134 | Team 3 | South America | 21 | 17:31 | 2.36 / 2.01 / 0.99 | 7.37 / 5.27 / 1.27 | 1:36 / 1:39 / 1:42 | 55 / 58 / 45 | 9.7 / 6.5 / 9.8 | 2.2M / 2.0M / 1.3M | 16/21, lost |
| ddV94jDU7G | c144d134 | Team 7 | Balkans | 18 | 14:58 | 1.37 / 1.44 / 0.57 | 8.76 / 5.69 / — | 1:32 / 1:46 / 1:46 | 40 / 50 / 13 | 51.2 / 18.1 / — | 2.2M / 1.6M / — | 17/18, out at 2:30 |
| dFcHig8HFW | c144d134 | Team 2 | Madagascar | 66 | 34:01 | 1.59 / 1.10 / 1.10 | 3.30 / 1.85 / 1.10 | 1:37 / 1:59 / 2:46 | 78 / 79 / 84 | 35.7 / 13.2 / 1.2 | 1.9M / 2.1M / 2.8M | 44/66, team won |
| c5VZsHpTtU | 7ee96860 | Team 2 | Luna | 51 | 47:41 | 2.44 / 1.93 / 1.00 | 3.27 / 2.14 / 1.15 | 1:40 / 1:50 / 1:50 | 60 / 69 / 66 | 5.3 / 5.3 / 1.8 | 3.4M / 1.9M / 118k | 27/51, lost |
| crJ3gmswTb | 7ee96860 | Team 2 | Strait of Hormuz | 62 | 5:28 | 2.28 / 1.39 / — | 6.59 / 1.72 / — | 2:40 / 2:08 / — | 42 / 44 / 6 | 17.4 / 7.5 / 18.5 | — | 60/62, out at 1:35 |

### Inferences
- His biggest measurable gaps line up with the factors that most separated top players:
  - land by 2:00–5:00
  - stack size and attack efficiency against players
  - an early Factory, Port and SAM economy
  - being fed in Team games
- Troop-ratio discipline and first-City timing, which the coach stresses, are not where he loses ground.
- The early eliminations (9 of 18 games before 5:00) suggest that early fights against stronger neighbours with small stacks are costly. That fits his 59% share of stacks below 0.6× and his 14% of time below 15% of cap.

### Gaps
- His sample is 15 Team and 3 FFA games, so per-game numbers are noisy.
- His spawn locations and neighbours were not analysed, and they could explain part of the 1:00–2:00 land gap.
- The "outlier" cell for dwpL9q7jim is a median over a few players with almost no troops used, so it is not meaningful.
