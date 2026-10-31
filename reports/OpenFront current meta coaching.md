# OpenFront v0.35 rewards stacks, trade and teammates

In today's OpenFront (the v0.35 line, live since 16 October 2026), the advice that actually helps is to expand with repeated small clicks instead of big sends, to attack players only with a stack at or above the troops they hold at home, to have a Port and a Factory earning by about the three-minute mark while building broadly, to put a SAM up within about a minute of the first enemy Missile Silo, and, in the public 2-team games you mostly play, to treat troop donations, teammate trade and shared SAM cover as core skills rather than extras. The coach gets the engine's numbers almost entirely right, but its advice layer rests on 2025-era community rules and FFA assumptions: it tells you to open with a 60–100% send that no winner in your lobbies uses, quotes a nation-betrayal threshold that does not exist in the code (and public Team lobbies contain no nations at all), describes the attack-loss and bot-loss rules wrongly, and runs on clock timers such as "City by 2:30" and "SAMs from minute 5" that neither the engine nor the replays support. Running 28 public games from October 2026 builds through the coach's own analyzer shows most of its "mistake" moments firing as often or more often on each lobby's top five players as on everyone else, while the habits that actually separated winners (land at 5:00, stack size against the defender, income in minutes 5–10, SAM timing after enemy Silos, and being fed troops by teammates) go mostly unmeasured. Your own numbers sit on those gaps rather than on the coach's favourite topics: your troop discipline and first-City timing match the lobby, but your stacks against players average 0.45× the defender's army, you take about half as many tiles per 1,000 troops as the median human, your first Factory comes at 4:10, and you were eliminated before 5:00 in 9 of 18 games. The rule-by-rule review at the end keeps 19 of the coach's rules (the engine model and the troop-band core), revises 40, drops 6 and adds 17, most of the additions forming a team-mode rule set the coach does not have today.

## The engine numbers hold, but the advice built on them has drifted

I checked every number the coach uses against the v35 release branch at commit 7ee96860, the build tagged v0.35.9 on 30 October and the one your newest replays ran on, and the core model is exact. The human troop cap `2 × (tiles^0.6 × 1000 + 50,000)` plus **250k per City level**, the regen curve that **peaks at about 42% of the cap**, the **flat 100 gold per tick** (60k a minute), every cost ladder, the 25% retreat penalty, the 30-second traitor window, the 80% win bar and the spawn-phase lengths all match the code ([troop cap][c-cap], [regen][c-regen], [gold][e-gold]). The replays confirm the gold figure from the other direction: base income came to exactly 60k per minute alive for every group of players ([replay analysis][r2]).

The errors are in how the coach explains and applies those numbers. Attack losses now follow `clamp(defender troops ÷ your stack, 0.6, 2) × (0.463 × territory-size bonuses + 0.0039 × defender troops per tile)`, and "defender troops" means the troops the defender holds **at home** at that tick, not its whole army ([EngineConfig.ts][e-loss], [AttackExecution.ts][a-home]). The 2× penalty therefore applies once your stack is **half or less** of their home troops, losses bottom out once your stack reaches **about 1.67×**, and a stack at 60% pays 1.67× rather than "up to double". The density term makes small, tightly packed defenders expensive per tile whatever the ratio, and attacking a player who has just sent a big attack elsewhere is genuinely cheaper because their home troops are low. The coach's bot sentence is backwards: you lose **70% of normal troops** per bot tile, rather than the bots taking 70% losses ([EngineConfig.ts][e-bot]). Its advice to "let a stalled attack burn out against unclaimed land" describes a mechanic that does not exist, because each attack has a fixed target and cannot switch ([AttackExecution.ts][a-target]). Conquest gold arrives only with the hit that eliminates a target, when it drops under 100 tiles, and a human who never attacked yields nothing, so "taking land hands you their gold" is wrong ([AttackExecution.ts][a-elim], [GameImpl.ts][gi-never]). Defense Posts are destroyed rather than captured when their land falls ([PlayerExecution.ts][dp-destroyed]).

Two omissions matter more than any wording. The coach says Hard and Impossible nations betray allies whose troops fall below about 20% of their cap, but the code has no such rule: Medium nations betray when their troops reach **10× yours**, when you are a traitor with under 1.2× their troops, or when you are their only neighbour and they hold more than 3× your troops, while Hard and Impossible nations betray their "juiciest" ally once every nearby threat is under a third of their size ([NationAllianceBehavior.ts][n-betray]). Public Team lobbies also turn nations off entirely unless the format is Humans vs Nations ([MapPlaylist.ts][mp-nations]), and your Luna record confirms that "Medium" was only the lobby's difficulty label. Public FFA, meanwhile, runs **Overtime**: after 30 minutes the 80% win bar drops 2 points a minute with no floor, reaching 60% at minute 40 and 40% at minute 50 ([Config.ts][c-overtime], [MapPlaylist.ts][mp-overtime]). The coach models neither the missing nations nor Overtime.

Patch history explains where the stale advice came from, because six releases since mid-2025 each retired a piece of advice that the coach or its sources still repeat.

| Version | Change | What it broke or created |
| --- | --- | --- |
| v0.25.0 (Aug 2025) | Removed workers and the troop slider ([release][v25]) | Cities stopped producing gold |
| v0.26.12 | Added the short-route trade penalty ([PR #2337][pr2337]) | Short trade routes became a mistake |
| v0.28.1 | Removed SAM hit chance ([PR #2665][pr2665]) | SAMs became deterministic |
| v0.30.0 (Mar 2026) | Removed the per-port gold multiplier ([PR #3232][pr3232]) | Extra Port levels add more ship spawns, not more gold per ship |
| v0.34.0 | Rebuilt attack losses, cut the team win bar from 95% to 80%, shortened the spawn phase ([release][v34]) | Old loss rules and old team-endgame advice |
| v0.35.0 | Faster trade ships and trains for small economies; lobby cap lifted ([release][v35], [PR #5907][pr5907]) | A one-Port player ships every ~8 s instead of ~12 s; maps now hold up to 210 players |

The coach's "City usually comes first" cites a wiki page that still says so ([openfront.wiki][wiki-buildings]), and its nuke timetable and 60–70% opening quote openfront.fyi pages that the site has since rewritten into loose checkpoints. Version pinning is the last structural issue: [rules.ts](../src/analysis/rules.ts) says it mirrors `main`, but the live game runs the v35 release branch, which main is now 133 commits ahead of and 64 behind ([GitHub compare][compare]), so the coach's numbers should be pinned to the engine commit each replay ran on.

## Winners click at 20%, attack at 1.5× and build twice as much

The replay evidence covers 28 public games played on four builds between 26 and 31 October 2026, 22 Team games and 6 FFA with 1,482 spawned humans, each re-run on its exact engine commit with no desyncs and scored by running the coach's unmodified analyzer for every human as if that human were you ([replay analysis][r2]). "Top five" means the five humans with the highest peak land share in each game, and "median human" means the active players ranked below them. The Team medians rest on roughly 1,000 player-games, while FFA rests on only 3–6 games, so the FFA findings are anecdotes. Correlations are per-game Spearman ρ against final land rank, which shows what goes with winning rather than what causes it, and spawn quality, likely a large factor, was not measured. These aggregates and the `extract.mts` script that produced them are saved in `research_notes/OpenFront current meta coaching/replay_data/`.

Land share at **2:00 (ρ 0.70)**, and even more at **5:00 (ρ 0.84)**, predicts final placement, while land at 0:30 (ρ 0.07) and the delay before your first click (ρ −0.09) do not ([replay analysis][r2]). Almost everyone sends within 1–2 seconds, so the gap opens during minutes one to five, and nobody wins it with big sends: the median click is **20% of troops in every group**, for the first send, the opening, attacks on bots and attacks on players before 15:00, and openings are four or five quick clicks that together commit about 110% of starting troops within 15 seconds ([replay analysis][r2], [r3]). The engine explains why. Expansion into plains stops speeding up once an attack holds about 6,600 troops, roughly a quarter of your 25,000 starting troops, and troops inside an attack do not regenerate, so a full send drops regen from roughly 350 to 10 troops per tick while buying no extra speed ([EngineConfig.ts][e-unclaimed], [regen][c-regen]). Every 2026 teacher who gives numbers agrees: Ash sends 10% each time troops grow by 1,000 ([Ash][ash-simple]), Sinful73 clicks 12% every two seconds and raises the ratio only for tribes ([Sinful73][sinful]), Goodkat clicks 20% at 4k, 5.5k and 7k troops to stay near 42% ([Goodkat][goodkat]), Enzo blamed a lost opening on pushing with 100% ([Enzo Plays][enzo-econ]), and openfront.fyi now treats 60–70% as a beginner default rather than an optimum, with its newest guide falling back to 20% ([openfront.fyi opening][fyi-opening], [first match][fyi-first]). Habits carried over from Territorial.io point the wrong way, since there every attack costs a fee and growth peaks near two-thirds full, while OpenFront has no attack fee and peaks at 42% ([Territorial tutorial](https://territorial.io/tutorial)).

The clearest difference a player can control is stack size. In Team games the top player in each game attacked with a median stack of **1.53× the defender's army**, against 0.99× for the top five and 0.53× for the median human, and the correlation with rank is ρ +0.44 in Team and +0.56 in FFA ([replay analysis][r2]). Efficiency follows the same pattern: pooled across 13,939 Team attacks, stacks of 0.3–0.6× took 6.7 tiles per 1,000 troops, 1–1.7× took 13.3, 1.7–3× took 17.6, and 3× or more took 22.4 ([replay analysis][r3]). The coach's 1.7× rule is therefore right, but the biggest jump comes once you match the defender, and going beyond 1.7× still pays. Top players also spent only 7% of their troops on bots against 29% for the median human, and retreats were a median of zero in every group, so the coach's retreat penalty measures something almost nobody does ([replay analysis][r2]).

After minute 5, trade ships and trains supply **92–98% of income** in every group; top-five players took 59% of lifetime gold from trade and 24% from trains, and earned 2.10M per minute alive against 661k for the median human ([replay analysis][r2]). What separates them is not when the first City lands (1:36 against 1:46, with ρ only −0.14) but how much gets built in the first ten minutes.

| First ten minutes, Team games | Top five | Median human |
| --- | --- | --- |
| Build orders | **19** | 10 |
| Gold spent | **13.0M** | 3.9M |
| Income in minutes 5–10 | **2.84M/min** | 1.50M/min |

The top five's builds included four Cities, two Ports, two Factories, a Defense Post, a Silo or SAM and a warship, with the first Port at 2:00 and the first Factory at 2:52 ([replay analysis][r2]). They also held more gold, 1.5M on average and above 1.5M for 35% of their lives, but the same 0.7 minutes of their own income as everyone else, so the coach's float measure (ρ −0.13) cannot tell them apart while absolute gold banked (ρ +0.61) goes with winning ([replay analysis][r2]).

Team games back the coach's troop model: top-five players spent 31% of their lives in the 30–55% band against 20% for the median human, and only 14% of minutes 5–15 near the cap against 34% ([replay analysis][r2]). Long FFA games flip this, with the eventual giants sitting at 88% of their cap or higher 37% of the time and idling there for about 14 minutes, presumably holding a deterrent army. In a Team game the first enemy Silo appeared at a median **4:44** (as early as 2:09), the first nuke at a human landed between 4:23 and 7:35, and top players finished a SAM about **66 seconds** after that first enemy Silo ([replay analysis][r2], [r3]). Nukes chase leaders: the top five were 9% of Team humans but took 33% of the nukes (74% in FFA), and 94% of each game's top player was nuked at least once ([replay analysis][r3]).

Run against every human, most of the coach's mistake moments fire as often or more often on the top five as on everyone else.

| Coach rule | Fires on top five | Fires on everyone else |
| --- | --- | --- |
| Attack went badly | 88% | 59% |
| City bought after you could afford it | 59% | 31% |
| Army idle at the troop cap | 60% | 63% |
| Trade ships captured | 71% | 49% |
| Under 40% of spending on economy | 54% | 22% |
| Nukes launched at you with no SAM cover | 22% | 9% |
| Slow first expansion | 23% | 23% |

These rules measure activity, wealth and being the leader ([replay analysis][r2]). Per attack, the ledger flags 9.1% of top-five attacks and 9.7% of everyone else's; the top five simply attack five times as often ([replay analysis][r3]). The rules that do separate winners from the rest are "opening fell behind" (4% against 23%), territory collapses (61% against 81%), Cities and Ports lost soon after building, "no Port while the lobby traded" (9% against 25%) and the trade-share benchmark (11% against 40%), yet 88% of "opening fell behind" firings come with the wrong fix, the 60–70% send advice ([replay analysis][r2], [r4]). The overall score separates the top five from the rest well (AUC 0.86), partly by construction because it includes peak land share, but separates Team winners from losers only weakly (AUC 0.69); its nuclear category grades top players below the rest (AUC 0.39), and its income curve tops out at 500k a minute, which 60% of Team players already exceed ([replay analysis][r2], [r4]).

## Ten disagreements, and what the engine and replays settle

The sources split on most of the questions you asked about. The table sets each side against the engine and the replay evidence, and three of the disputes get fuller treatment below it.

| Question | One side | Other side | Engine says | Replays say | Verdict |
| --- | --- | --- | --- | --- | --- |
| Opening send size | Full send, then 60–70% (the coach; one openfront.fyi page, for the first click only) ([attack ratio][fyi-ratio]) | Small sends of 10–40% (Ash, Sinful73, Goodkat, Enzo, newest openfront.fyi) | Plains expansion stops speeding up at ~6.6k troops; troops sent out don't regenerate ([EngineConfig.ts][e-unclaimed]) | Every group clicks 20%; the per-click ratio doesn't separate winners ([r2]) | **Small sends.** Both engine and replays contradict the coach. |
| First building | City (Goodkat, Ash, Sinful73, ranked players, openfront.wiki) | Port or Factory (Reddit, Lonely_Millennial for teams, openfront.fyi after v0.34.12) | A City only adds troop cap; a Port pays both ends and rolls once per level; v0.35 boosts the first few levels ([boost][e-boost]) | City 1:36, Port 2:00, Factory 2:52; City timing ρ −0.14 ([r2]) | **Both within about a minute.** Grade the first income building, not the City clock. |
| Banking gold | Spend it all (the coach, Lonely_Millennial, on1kson) | Hold 5M for a Hydrogen bomb, or MIRV money (Goodkat, a Steam guide, Rex) | A SAM takes 30 s to build; the MIRV price rises lobby-wide ([Config.ts][c-sam-build], [MIRV][e-mirv]) | Float in minutes is the same for all; absolute bank ρ +0.61 ([r2]) | **Don't penalise purposeful banks.** |
| Allying nations | Never ([Goodkat][goodkat], [Sinful73][sinful]) | Effectively forced to ([issue #4650][gh4650]) | Medium nations betray only at 10:1, or 3:1 as your only neighbour; none in public Team lobbies ([n-betray], [mp-nations]) | Team games had zero nations ([r2]) | **Moot in Team; a sound hedge in FFA.** |
| SAM timing | Minute 5 (the coach, an older openfront.fyi page), or skip early and build 2–4 mid-game (Goodkat) | When a neighbour gets a Silo ([openfront.fyi][fyi-timing], [R3RE5][r3re5]) | 30 s to build; a Hydrogen bomb arrives in ~10 s; SAMs never miss and cover teammates ([SAM][sam-friendly]) | Enemy Silo at 4:44; top players' SAM 66 s later ([r2]) | **Trigger on the enemy Silo.** |
| Retreating | A mistake (the coach) | Routine damage control ([Goodkat][goodkat], [openfront.fyi][fyi-recovery]) | Costs 25% of surviving troops against players only; free against unclaimed land or when an alliance forms ([AttackExecution.ts][a-retreat]) | Median 0 retreats in every group ([r2]) | **Neutral.** Remove it from the mistakes list. |
| Stack needed to attack | About 2× (most community guides) | 1.67× (openfront.fyi); 2.2× for speed (Goodkat) | Losses bottom out at 1.67× home troops; speed peaks at 1.22× ([speed][e-speed]) | Efficiency keeps rising beyond 3× ([r3]) | **At least 1.7× home troops; more is better.** |
| Boat size | Several smaller boats (the coach) | 1% foothold boats ([Goodkat][goodkat], [Sinful73][sinful]); big boats to keep troops growing ([vari][vari]) | Max 3 transports at once; warships shoot transports first and reload instantly ([transports][e-transports]) | Not measured | **1% boats for footholds;** big boats only where no warship patrols. |
| Short trade routes | Under 300 tiles pay little (the coach) | Short routes pay about 82k (a newer openfront.fyi page, [frontload][fyi-frontload]) | 5.2k at 100 tiles, 13.6k at 200, 52.5k at 300, 100k at 500 ([EngineConfig.ts][e-trade]) | Not measured | **The coach is right.** |
| Defense Posts | Only when needed ([Goodkat][goodkat], [openfront.fyi][fyi-timing]) | Spam them under siege ([R3RE5][r3re5]) | 5× losses and 3× slower within 30 tiles; destroyed on capture; on a mountain, 7.5× plains losses ([terrain][e-terrain], [post][e-dp]) | Top five build their first later, 4:37 against 2:58 ([r2]) | **Build reactively,** on the threatened front, on high ground. |

### City or Port first: build both within a minute, and let the Port decide income

City-first is the majority written view in 2026: Goodkat, on1kson, Ash and Sinful73 all build the City first because the early troop cap is the bottleneck, and in ranked 1v1 deshack skips Ports and Factories entirely ([Goodkat][goodkat], [on1kson][on1kson], [Ash][ash-econ], [Sinful73][sinful], [deshack][deshack]). A Port-first minority on Reddit rushes a Port near another player, Lonely_Millennial alternates City and Port, and openfront.fyi's guidance after v0.34.12 warns against putting off the first Port ([Reddit][reddit-port2], [Lonely_Millennial][lm-beginner], [openfront.fyi][fyi-frontload]). The engine gives each side half the argument. A City adds 250k troop cap and produces no gold; that 250k is 2.4× the entire cap of a 500-tile player but less than double it beyond about 1,000 tiles. A Port pays the full route value to both ends of every trade and rolls once per level for a new ship, and the v0.35 boost makes the first few levels unusually productive ([trade payout][ts-both], [Port rolls][port-rolls], [boost][e-boost]). The replays show top players doing both within 25 seconds, City at 1:36, Port at 2:00 and Factory at 2:52, with the City first in 58% of their openings and the Port first in 34%; first-City timing barely matters (ρ −0.14), while income in minutes 5–10 matters a great deal ([replay analysis][r2], [r3]). The verdict is to build first whatever your position supports, but to have a working Port (with a partner 300+ tiles away) and a Factory by about three minutes, and the coach should grade that rather than a City clock. The exception is small ranked games with no trade partners, where Cities into a Silo is correct.

### Banking gold is neutral against your income and useful once Silos appear

The coach borrows StarCraft's spending quotient and penalises unspent gold, and Lonely_Millennial and on1kson agree with it ([Lonely_Millennial][lm-beginner], [on1kson][on1kson]). On the other side, Goodkat holds 5M for a Hydrogen bomb from mid-game so that weaker players don't try one on you, a Steam guide says to start saving as soon as rivals do, and Rex keeps counter-MIRV money above 55–70M in tournaments ([Goodkat][goodkat], [Steam][steam-sweats], [Rex][rex-sleeper]). The engine sides with the savers in specific cases: a SAM costs 1.5M and takes 30 seconds to build while a Hydrogen bomb crosses 1,000 tiles in about ten, and the MIRV price rises 15M for every MIRV anyone in the lobby launches ([Config.ts][c-sam-build], [EngineConfig.ts][e-mirv]). The replays settle the rest, because float measured in minutes of income is nearly identical for winners and the rest (0.68 against 0.77) while absolute gold held correlates +0.61 with rank, and FFA winners averaged 25.8M banked ([replay analysis][r2]). Banking is not the losing habit the coach says it is. The coach should flag only gold with nothing to buy, meaning no Silo, SAM, Hydrogen bomb or MIRV pending and no teammate who could use it, and should never flag on the flat 1.5M threshold alone.

### Allying nations is moot in your Team games and a safe hedge in FFA

Goodkat and Sinful73 say never ally nations early, because they are your best targets and an alliance locks their land away for five minutes; GitHub complaints after v35 point the other way, one saying Medium nations harass you every 30 seconds unless you ally them and another saying there is no reason to ally them at all ([Goodkat][goodkat], [Sinful73][sinful], [issue #4650][gh4650], [issue #5969][gh5969]). The engine's Medium nation accepts 70% of alliance requests in its first three minutes, refuses a runaway leader holding 3× the runner-up's land, and betrays only when it outnumbers you 10:1, or 3:1 when you are its only neighbour ([acceptance][n-accept], [runaway][n-runaway], [betrayal][n-betray]). Allying a nation you cannot yet finish is therefore mechanically safe as long as your army stays above a tenth of theirs, and eating the ones you can finish is better still, because nations hand over all their gold when eliminated ([EngineConfig.ts][e-conquer]). None of this applies to your 2-team games, which have no nations. It applies in FFA and in Humans vs Nations, which uses Hard nations and makes up about a fifth of the Team lobby rotation ([MapPlaylist.ts][mp-teamcount]).

## Public two-team games reward feeding the front, not personal land

Luna, Madagascar and Pluto force two teams 75% of the time, which is why you see so many 2-team games ([Maps.gen.ts][maps-gen]). Every public Team lobby has no nations, 400 bots (100 on compact maps), troop and gold donations switched on, and neither a timer nor Overtime; a team wins when its members' summed tiles exceed 80% of non-fallout land, with a 170-minute hard limit ([MapPlaylist.ts][mp-team], [WinCheckExecution.ts][wc-team], [time limit][wc-limit]). Every teammate who spawned shares the win if still connected or already eliminated, but a player who leaves while still alive keeps credit only if the team already held 70% of the land ([GameImpl.ts][gi-credit]).

Team games are carried, and the carry is fed. The biggest human ended on the winning team in 19 of 22 Team games, and that player received a median **16.7M troops by donation**, which net of what they sent is 185% of their own peak army; troops received correlate +0.51 with rank ([replay analysis][r2]). Feeding starts early, with the eventual top player first receiving troops at a median 3:24 and holding 761k in donations by 5:00 ([replay analysis][r3]). In 2-team lobbies specifically, your own peak land share says nothing about whether your team won (AUC 0.48), and the team's biggest member held only about 15% of the team's land, so these games are won by many contributors rather than one giant ([replay analysis][r3]). Gold donations were rare in every group. What actually wins a 2-team game remains an open question, since only 7 of the 28 games were 2-team and the team with the most land at 5:00 won just 9 of 22 Team games. Clan tags keep clanmates on one team, and organised clans tend to dominate public team lobbies, so some losses reflect the opposition rather than your play ([Lonely_Millennial][lm-team]).

The donation rules shape how to feed. A troop donation defaults to a third of your troops and is capped at the room left under the recipient's troop cap, with you keeping the excess (one openfront.fyi page says the excess is lost, but the code says otherwise); troop and gold donations to the same teammate share one 10-second cooldown, and you cannot donate to a disconnected player ([DonateTroopExecution.ts][donate-clamp], [cooldown][e-donate-cd], [PlayerImpl.ts][playerimpl]). Inferring from the engine math, feeding usually beats fighting for a backline player: a small player's 20% stack pays close to the 2× loss ceiling against an enemy human's whole army, the same troops added to a big teammate's stack push that stack toward the cheapest loss rate, and troops at the cap do not regenerate, so a backline player's surplus troops are usually best spent in someone else's attack. Lonely_Millennial's team guide turns this into a rhythm in which backliners send 30–40% of their troops each time they reach about half their cap, frontliners keep troops near 42% and launch the next push before the last one returns so that returning troops don't overflow the cap, and a backliner sitting on a full bar is costing the team ([Lonely_Millennial][lm-team]). Ash's winning clan match fed one designated frontliner from everyone else ([Ash][ash-clan]).

Teammate economics follow the same logic. A train stop at a teammate's City or Port pays 25k to both of you against 10k at your own station, and a Factory links any player's stations within 110 tiles, not just yours ([EngineConfig.ts][e-train], [FactoryExecution.ts][factory-any]). Trade with the enemy team pays both sides equally, so in a two-team game it nets to zero, which is why "Stop Trading with Enemies" (which spares teammates and allies) should go on early ([PR #5919][pr-stop-trading]); attacking any non-bot player also makes the target embargo you for five minutes ([AttackExecution.ts][a-embargo], [EngineConfig.ts][e-embargo]). Protection is shared too. A SAM shoots down any non-friendly nuke whose path enters its range, whoever the nuke is aimed at, so one SAM over a cluster of teammates protects all of them ([SAMLauncherExecution.ts][sam-friendly]); a disconnected teammate's land can be taken at zero troop cost ([EngineConfig.ts][e-afk]); and Ports and Cities belong in the backline, because buildings on land the enemy takes change hands with their levels ([openfront.fyi][fyi-naval], [PlayerExecution.ts][dp-destroyed]).

For a 2-team game, then, the best-supported advice runs in a clear order. Survive the first five minutes, because a dead teammate contributes nothing beyond the win credit. Work out from the map whether you are front, with an enemy-team border touching you, or back. If you are back, keep troops near 40–50% of your cap and send the surplus to the teammate actually fighting, take bots on the enemy-team side first, and build Ports and a Factory that connect to teammates. If you are front, attack only with stacks at or above the defender's home troops, ask for troops before you collapse, and put Defense Posts on high ground where you are being attacked. Either way, embargo the enemy team and get a SAM, or sit under a teammate's, within a minute or two of the first enemy Silo. The coach checks almost none of this today: no metric or moment reads donations, troops you donate look like losses, its SAM moment ignores teammates' launchers, and it grades you on personal land ([replay analysis][r2], [moments.ts](../src/analysis/moments.ts)).

## Big FFA lobbies punish drained armies and reward deterrence

Public FFA lobbies now hold up to 210 players on the largest maps, include Medium nations (6 to 82 per game in the replay set), switch donations off and run Overtime ([v0.35.0][v35], [replay analysis][r2], [MapPlaylist.ts][mp-overtime]). The three FFA games with full data show winners who look nothing like the coach's spend-everything soloist. They took 78% of their gold from trade and earned 15.0M a minute, placed 27 build orders and spent 24.3M in the first ten minutes, all built a Port and a Silo while 93% built a SAM and a warship, averaged 25.8M of gold banked, and idled near their troop cap for about 14 minutes ([replay analysis][r2]). They also betrayed: "you betrayed" fired on 73% of FFA top-five players against 24% of the rest ([replay analysis][r2]). Three games prove little, but each of those patterns matches what tournament players describe, from everyone holding Hydrogen bombs by mid-game ([Rex][rex-major]) and a Silo buying respect in diplomacy ([Rex][rex-sleeper]) to MIRVs fired partly to push the next MIRV's price out of rivals' reach ([vari][vari], [TheBiff][biff-oct]).

The early game decides FFA for most players, and Goodkat notes that the first round of fights around minute five eliminates many of them ([Goodkat][goodkat]). The community's consistent advice for big lobbies is to spawn with space around you, expand with small sends so your home army stays near the growth peak, and ally stronger neighbours before you fight; against a bigger attacker, never counter with your whole army, but wear the push down with small clicks, drop Defense Posts and offer an alliance once the push stalls ([openfront.fyi][fyi-outgunned]). The engine adds two reasons. Medium nations' target list runs through bots, traitors, AFK players and the weakest neighbour, and they answer incoming attacks immediately, so a drained army invites them ([NationAttackBehavior.ts][n-attack]). Opposing attacks also cancel troop for troop before any land changes hands, so a panic counter-attack mostly turns your reserve into nothing ([AttackExecution.ts][a-cancel]).

The late game runs on two clocks the coach ignores. Overtime lowers the win bar 2 points a minute after minute 30, so the current leader wins by holding on and waiting in second place loses ([openfront.fyi][fyi-overtime]). The runaway leader also draws a dogpile: Medium nations refuse alliances with a player holding 3× the runner-up's land ([NationUtils.ts][n-runaway]), and openfront.fyi reports that v35 nations gang up on that player and fire victory-denial MIRVs as the leader nears the bar ([openfront.fyi][fyi-runaway]). When the nukes do land, the damage falls mostly on the army rather than the land, since losing 20% of your land to one nuke kills about two-thirds of your home troops and of any attacks you have in flight ([NukeExecution.ts][nuke-troops]).

## Your gaps sit where winners separate, not where the coach looks

You spawned in 18 of the 28 games, 15 Team and 3 FFA, and where the coach spends its words you are fine: your troops averaged 49% of your cap against 51% for the top five, your first City came at 1:48 against 1:46 for the median human, and your first click came 2.1 seconds after spawn ([replay analysis][r2]). Where winners separate, you trail.

| Team games | You | Median human | Top five |
| --- | --- | --- | --- |
| Land share at 1:00 / 2:00 / 5:00 | 0.47% / 1.10% / 1.44% | 0.63% / 1.37% / 1.97% | 0.70% / 2.04% / 4.77% |
| Median stack ÷ defender army | 0.45× | 0.53× | 0.99× |
| Tiles per 1,000 troops against players | 4.7 | 8.7 | 12.4 |
| First Factory | 4:10 | 2:53 | 2:52 |
| Share of gold from trains | 10% | 21% | 24% |
| Income in minutes 5–10 | 1.17M/min | 1.50M/min | 2.84M/min |
| SAM after first enemy Silo | 191 s | 103 s | 66 s |
| Troops received by donation (median) | 0 | 207k | 6.42M |

Source: [replay analysis][r2]. Of your stacks against players, 59% were below 0.6× the defender's army and only 3% reached 1.7×, and the coach's own ledger flagged 13.2% of your 385 attacks on players (6.2% as blunders) against 9.7% and 2.1% for the rest ([replay analysis][r2], [r3]).

The most urgent pattern is early elimination. Nine of your 18 games ended before 5:00, and in the five fastest, all over by 2:30, your troops averaged only 6–18% of your cap ([per-game table][pg]). Sixty-two percent of your games include a send of 60% or more, against 47% for top-five players and 30% for the rest, and in your three FFA games your attacks on players committed a median 89% of your troops against 32% for the median human, leaving you under 15% of your cap for 55% of your life ([replay analysis][r2], [r3]). Low troops are partly a symptom of being attacked, and spawn quality wasn't measured, so this does not prove the big sends killed you, but it is the pattern every 2026 guide warns about and exactly what the coach's "first big send (60–100%)" advice encourages.

Three changes have the most evidence behind them for you. Stop attacking players with stacks smaller than their home army, and instead wait, feed a teammate, or hit someone who has just sent their army elsewhere. Get your first Factory down by about 3:00 and connect it to teammates' Cities and Ports. Build or ask for a SAM as soon as an enemy Silo appears. In 2-team games, add a fourth: decide in the first two minutes whether you are front or back, and play that role.

## Forty revisions, six drops and seventeen additions, rule by rule

The tables below give every coach rule and advice string one of four verdicts: **Keep** means the substance stands, sometimes with a small wording fix; **Revise** means the threshold, wording or trigger has to change; **Drop** means remove it; and **Add** marks a rule the coach has no equivalent for today. Line numbers refer to the current files, and replay figures read as "top five against the rest" unless stated otherwise.

### Engine facts in rules.ts and strategy-notes.md

| Rule (where) | Verdict | Change | Evidence |
| --- | --- | --- | --- |
| Troop cap, City +250k, regen and its 42% peak, flat 100 gold per tick, cost ladders, 20% default ratio, 25% retreat penalty, spawn-phase lengths ([rules.ts](../src/analysis/rules.ts), [strategy-notes.md](../docs/strategy-notes.md)) | Keep | Say the MIRV price counts MIRVs launched by anyone in the lobby. Note that special lobbies with starting gold or gold multipliers break the 60k/min and "first City at 125k" benchmarks. | All match commit 7ee96860 ([cap][c-cap], [MIRV][e-mirv], [modifiers][mp-mods]) |
| Trade sigmoid: routes under ~300 tiles pay very little (notes; economy.ts:318, 509) | Keep | 130k is not a ceiling (150k at 1,500 tiles). Routes of 200–299 tiles pay 13.6k–50k, not "a few thousand". Estimate payouts with the distance actually sailed, not Manhattan distance. | [EngineConfig.ts][e-trade], [TradeShipExecution.ts][ts-both] |
| Loss clamp: "a stack under ~60% of the defender's army pays up to double" (notes; moments.ts:91; scoring.ts:324) | Revise | The 2× penalty applies at half the defender's home troops or less; losses are cheapest at 1.67× or more. Add the density term. Compare against home troops, not the whole army. | [EngineConfig.ts][e-loss], [AttackExecution.ts][a-home] |
| "Bot tribes take only 70% of normal losses" (scoring.ts:267) | Revise | Should read: you lose only 70% of normal troops per bot tile. | [EngineConfig.ts][e-bot] |
| Conquest gold; "taking land hands you their gold" (notes; scoring.ts:302) | Revise | Gold comes only with the eliminating hit (target under 100 tiles). Humans who never attacked give nothing. | [AttackExecution.ts][a-elim], [GameImpl.ts][gi-never] |
| Traitor: 30 s, attackers lose half (rules.ts:31; moments.ts:518) | Revise | Add that attackers also capture a traitor's land ~25% faster. Replace "soured every neighbour" with "−40 relation with nearby players". Add that tribes have broken alliances with traitors and attacked them since v0.35.3. | [traitor speed][e-traitor-speed], [BreakAllianceExecution.ts][break-relation], [v0.35.3][v353] |
| Win at more than 80% (rules.ts:32) | Revise | Add FFA Overtime (−2 points a minute after 30:00), team tile sums, the 170-minute limit, and the 70% win-credit rule for players who leave while alive. | [Config.ts][c-overtime], [WinCheckExecution.ts][wc-team], [GameImpl.ts][gi-credit] |
| Header: "mirrors main, read 2026-10-26" (rules.ts:1–3; notes) | Revise | Pin numbers to the release branch, or to the engine commit in each replay record. | [GitHub compare][compare] |

### Community guidance and the mistakes list in strategy-notes.md

| Rule | Verdict | Change | Evidence |
| --- | --- | --- | --- |
| Opening: full send, then 60–70% into unclaimed land | Drop | Replace with repeated ~20% clicks into open land (10–40% range). Use bigger ratios only on bots you can finish. | Every group clicks 20% ([r2]); plains speed tops out at ~6.6k troops ([e-unclaimed]); [Ash][ash-simple], [Goodkat][goodkat] |
| Two expansion lanes, not three fronts | Keep | — | [openfront.fyi][fyi-first] |
| Troop bands: 35–50% on quiet borders, 50–70% under pressure, spend above 80% | Keep | In Team games, "spend" includes donating. Exempt FFA leaders holding a deterrent army late in the game. | 31% vs 20% of life in the 30–55% band; mid-game time at the cap 14% vs 34% ([r2]) |
| First City usually comes first, by ~2:30 | Revise | Build a City when the troop cap is limiting you. Grade "first income building (a Port with a partner 300+ tiles away, or a Factory) by ~3:00" and income in minutes 5–10. | First-City timing ρ −0.14; income 2.84M vs 1.50M per minute ([r2]); [openfront.fyi][fyi-timing] |
| Nuke timetable: economy only before minute 3, Silo and SAM at 3–5, Hydrogen bomb at 5–8 | Revise | Trigger on events: a SAM when an enemy Silo appears within reach; Silo and Hydrogen-bomb money once rivals have them. | Enemy Silo 4:44, top players' SAM 66 s later ([r2]); [openfront.fyi][fyi-econ] |
| Nations betray allies below ~20% of cap | Drop | Replace with the engine's Medium and Hard rules, shown only when the lobby has nations. | [NationAllianceBehavior.ts][n-betray], [MapPlaylist.ts][mp-nations] |
| Mistake: sitting at the cap | Revise | Team: "you sat at the cap while a teammate had room", so donate. FFA: exempt late-game leaders. | Fires 60% vs 63% in Team, 87% vs 57% in FFA ([r2]) |
| Mistake: mid-game full sends | Revise | Judge the stack against the defender's home troops and what you keep at home, not the send percentage. | Top players raise their ratios to 30–35% after 15:00 ([r2]) |
| Mistake: retreating | Revise | Treat it as a cost, not a mistake. It is free against unclaimed land or when an alliance forms. | Median 0 retreats ([r2]); [AttackExecution.ts][a-retreat] |
| Mistake: banking gold | Revise | Flag only gold with nothing to buy. In Team games, suggest donating it. | Float 0.68 vs 0.77 minutes; absolute bank ρ +0.61 ([r2]) |
| Mistake: two-front wars | Keep | Applies to FFA and 3+ team games. In 2-team games, ask a teammate to cover the second front. | [openfront.fyi][fyi-outgunned] |
| Mistakes: short trade routes; big boats into warship patrols; SAMs built only after launches start | Keep | Add: at most 3 transports at once, and a SAM takes 30 s to build while a nuke arrives in ~10 s. | [transports][e-transports], [SAM build][c-sam-build] |

### Moments in moments.ts

| Moment (lines) | Verdict | Change | Evidence |
| --- | --- | --- | --- |
| Attack ledger verdicts and "N attacks on X went badly" (60–190) | Revise | Use the defender's home troops and the density term. Measure per attack, and compare with the top five's rate. | Fires 88% vs 59% per player, but 9.1% vs 9.7% per attack ([r2], [r3]) |
| Suggestion: hit players already fighting someone else, with ≥1.7× their whole army (142) | Keep | Say "home troops". Add that stacks bigger than 1.7× still pay. | Efficiency 17.6 at 1.7–3×, 22.4 at 3× or more ([r3]) |
| Suggestion: let a stalled attack burn out against unclaimed land (141) | Drop | Replace with: a retreat costs 25% of surviving troops, so commit only to targets you can finish. | [AttackExecution.ts][a-target] |
| "Slow first expansion" and its "first big send (60–100%)" suggestion (235–237) | Drop | — | ρ −0.09; fires 23% vs 23% ([r2]) |
| "Opening fell behind" (258–262) | Revise | Keep the 2:00 trigger and add a 5:00 checkpoint. Replace the 60–70% suggestion with small-send expansion, spawn choice and bot clearing. | Separates 4% vs 23%, but 88% of firings give the wrong fix ([r2], [r4]) |
| "Army idle at the troop cap" (309–311) | Revise | Team: name the teammate who had room to receive. Limit it to minutes 5–15. FFA: exempt top-3 leaders after 15:00. | Mid-game at the cap 14% vs 34% in Team; FFA giants idle ~840 s ([r2]) |
| "Caught with an empty army" (330–332) | Keep | Count troops in boats and attacks as part of your army. | [vari][vari] |
| Territory-collapse suggestions (385–395) | Revise | Replace "around minute 5+" with "once a rival has a Silo". In Team games, add "ask for troops". | Separates 61% vs 81% ([r2]) |
| "Never built a City" (450–452) | Keep | The "about 2 minutes of income" figure is wrong in lobbies with starting gold. | [modifiers][mp-mods] |
| "Late first City", ~2:30 (462–467) | Revise | Fire only if the cap was limiting you (troops at 80%+ of cap for 60 s or more) before the first City. | Weak: 10% vs 13% ([r2]) |
| "Gold piled up unspent" (486–488) | Revise | Skip it when a Silo, SAM, Hydrogen-bomb or MIRV purchase is pending, or rivals hold Silos. In Team games, suggest donating. | Fires 17% on top players vs 6%; FFA 33% vs 5% ([r2]) |
| "Died with N gold in the bank" (499) | Keep | Team version: donate your gold before you fall. | [Lonely_Millennial][lm-team] |
| "You betrayed X" (517–519) | Revise | Fix the relation wording. In FFA, judge the outcome over a longer window, since top players betray far more often. | Fires 73% vs 24% in FFA ([r2]) |
| "X broke your alliance" and the nation clause (532–534) | Revise | Remove the 20% clause. When the betrayer is a nation, cite the 10:1 rule and the 3:1 only-neighbour rule. | [n-betray] |
| "N nukes launched at you with no SAM cover" (553–555) | Revise | Count teammates' and allies' SAMs. Trigger on how late your SAM came after the enemy Silo, not on nukes received. Frame nukes on a leader as expected. | Fires 22% vs 9% ([r2]); [SAM][sam-friendly] |
| "N of your nukes were shot down" (567–569) | Keep | — | A SAM holds one missile per level, reloads in 9 s and never misses ([sam-slots]) |
| "Transport boats lost" (582–584) | Revise | Replace "several smaller boats" with: 1% boats for footholds; big boats only where no enemy warship patrols (at most 3 at once). | [transports][e-transports], [Goodkat][goodkat] |
| "Excellent opening", "Big push", "Eliminated" (276, 427, 605) | Keep | — | — |

### Economy review in economy.ts

| Rule (lines) | Verdict | Change | Evidence |
| --- | --- | --- | --- |
| "City bought Ns after you could afford it" (231–233) | Revise | Fire only if troops were at 80%+ of the cap during the wait and nothing else was bought. | Fires 59% vs 31%; the wait counts gold that was going to Ports and SAMs ([r4]) |
| City, Silo or Factory under 20 tiles from a hostile border (288–289) | Revise | Escalate only if the building was lost. In Team games, count only enemy-team borders. Note that captured buildings don't raise your cost ladder. | Fires 24% vs 11% ([r2]); [capture rules][dp-destroyed] |
| "Factory with almost no rail links" (fewer than 2 of your own stations) (298) | Revise | Count any player's Cities and Ports within 110 tiles. Weight teammates' and allies' stations, which pay 25k and 35k to both sides. | [FactoryExecution.ts][factory-any], [train gold][e-train]; no separation, 17% vs 19% ([r2]) |
| Port with no partners; share of short routes; Port on a weaker coast (314–328) | Keep | Fix "a few thousand" for 200–299 tiles. Use the distance actually sailed. | [EngineConfig.ts][e-trade] |
| Defense Post distance from the front (333–336) | Keep | Add terrain (a post on a mountain means 7.5× plains losses for attackers), and note that posts are destroyed when captured. | [terrain][e-terrain], [post][e-dp] |
| "SAM covering none of your buildings" (350) | Revise | Count teammates' and allies' buildings as covered. | [SAMLauncherExecution.ts][sam-friendly] |
| Trade ships captured (447–467) | Revise | Scale severity by the gold lost relative to your trade income. | Fires 71% vs 49%; piracy is ~0% of anyone's income ([r2]) |
| "No Port while the lobby traded" (509) | Keep | Replace "50–130k" with "52k at 300 tiles, ~100k at 500, more beyond". | Separates 9% vs 25% ([r2]) |
| "N Cities but no Factory" (514) | Keep | Add that teammates' stations pay 25k to both sides. | [EngineConfig.ts][e-train] |
| "Under 40% of spending on economy until minute ~8" (515) | Drop | — | Fires 54% vs 22%. Top players spend 18% on Ports and Factories because they also buy SAMs, Silos and warships ([r2]) |
| "Sat on N minutes of income" (516) | Revise | Fire only above ~3 minutes with nothing to buy. In Team games, suggest donating. | Float 0.68 vs 0.77 minutes ([r2]) |
| Trade-share benchmark (518); Ports and Cities lost within 2.5 minutes (529, 537); warship patrol advice | Keep | — | Separate 11% vs 40% and 16% vs 23% ([r2]) |

### Drills and metrics in scoring.ts

| Drill or metric (lines) | Verdict | Change | Evidence |
| --- | --- | --- | --- |
| "Keep the troop bar between 40% and 60%" (255) | Keep | Team version: donate when you pass 60% and a teammate has room. | [Lonely_Millennial][lm-team] |
| "Faster opening" (265) | Revise | Use repeated small sends. Fix the bot wording. Target land at 5:00 at or above the lobby median. | ρ 0.84 at 5:00 ([r2]) |
| "First City by 2:30" (282) | Revise | "A Port or Factory earning by 3:00; a City when the cap is limiting you." | [r2] |
| "Spend your gold" (291) | Revise | Drop "(from minute 5) a SAM" and use the enemy-Silo trigger instead. | [r2] |
| "Grow income beyond the base 60k a minute" (300) | Revise | Target income in minutes 5–10 against the lobby median (1.5M a minute in Team games), not "20% of gold from trade". | The median human already gets 58% of gold from trade and trains ([r2]) |
| "Place every building where it earns and survives" (312) | Revise | One reachable station is enough for a Factory, and other players' stations count. | [FactoryExecution.ts][factory-any] |
| "Pick fights you can win" (322) | Revise | Compare against home troops and aim for ≥1.7×. In Team games, add "or donate the stack to the teammate who is fighting". | [r2] |
| "Defend the border you'll be hit on", including "ally a second neighbour" (332) | Revise | Keep for FFA. In Team games, ask a teammate for troops or cover instead. | [openfront.fyi][fyi-quickchat] |
| "SAM cover before minute 6", goal: zero nukes (342) | Revise | Goal: a SAM within 90 s of the first enemy Silo in reach, or cover from a teammate's SAM. | [r3] |
| Metric: nukes launched at you (`nukesTaken`) | Drop | Report it as information, not as a grade. | Top players score worse: AUC 0.37 in Team, 0.05 in FFA ([r3]) |
| Metric: gold per minute, absolute curve topping out at 500k | Revise | Rescale it, or make it relative to the lobby. | 60% of Team players are at or above 500k ([r4]) |
| Metric: gold sitting unspent (`float`) | Revise | Give it less weight, and pair it with "idle gold with nothing to buy". | ρ −0.13 ([r2]) |
| Metric: structures lost | Revise | Measure per structure built, and exclude losses to nukes while you lead. | Top players score worse: AUC 0.23 ([r3]) |
| Metrics: alliances formed, times betrayed (in Team games) | Revise | Don't grade diplomacy in 2-team games. | Diplomacy predicts team wins at AUC 0.49, no better than chance ([r2]) |
| Metrics: land at 2:00 and 5:00 vs the typical player | Keep | Make 5:00 the headline opening target. | AUC 0.82 at 5:00 ([r3]) |

### Rules to add

| New rule | What it checks | Evidence |
| --- | --- | --- |
| Rule sets by game mode | Read the team count and the nations setting. Use FFA rules for FFA and Duos/Trios/Quads, team rules for 2–3 teams and Humans vs Nations, and a blend for 4–7 teams. | Own land predicts winning at AUC 0.48 in 2-team games but 0.88–0.95 in Trios and Quads ([r3]) |
| Stack against home army | Median stack ÷ defender's home troops, and the share of stacks at ≥1.7× | ρ +0.44 in Team, +0.56 in FFA ([r2]) |
| Income ramp | Gold per minute in minutes 5–10, against the lobby median and the top five | 2.84M vs 1.50M per minute ([r2]) |
| SAM delay | Seconds from the first enemy Silo within reach to your own SAM, or a teammate's SAM covering your core | Top five 66 s, rest 103 s, you 191 s ([r2]) |
| Donation flow (Team) | Time at 90%+ of your cap while a teammate had room; troops donated as a share of troops grown; whether a fed player turned donations into land. Count donations in the efficiency and income metrics. | Top player received 16.7M; ρ +0.51 ([r2]); [donation cap][donate-clamp]; [issue #3445][gh3445] |
| Land share within the team | Your tiles ÷ your team's tiles, against 1 ÷ team size, and your rank among teammates | [openfront.fyi][fyi-victory] |
| Embargo the enemy; trade with teammates (2-team) | Whether you used Stop Trading with Enemies, and the share of your trade and train gold that came from teammates | [PR #5919][pr-stop-trading], [train gold][e-train] |
| Embargo triggered by attacks | Attacks on players whose Ports or stations were paying you, which cut that trade for 5 minutes | [AttackExecution.ts][a-embargo] |
| AFK teammate land | A disconnected teammate's land left for the enemy to take, when you could take it for free | [EngineConfig.ts][e-afk] |
| Stay connected | Leaving while alive before the team held 70% of the land, which forfeits the win | [GameImpl.ts][gi-credit] |
| Panic counter-attack | A big counter-send into a larger incoming push, instead of small clicks plus a Defense Post | [AttackExecution.ts][a-cancel], [openfront.fyi][fyi-outgunned] |
| Opening army floor | Home troops as a share of your cap after each send in the first 3 minutes (the community floor is ~25%) | Your five fastest eliminations averaged 6–18% of cap ([pg]); [Goodkat][goodkat] |
| FFA Overtime | Where the win bar stands after 30:00, and whether you sat passive in second place | [Config.ts][c-overtime], [openfront.fyi][fyi-overtime] |
| Nation rules (FFA, Humans vs Nations) | The Medium and Hard betrayal thresholds and the runaway-leader threshold, when nations are present | [n-betray], [n-runaway] |
| Troops lost to nukes | Troops killed per nuke (about 1 − (1 − share of land lost)^5) | [NukeExecution.ts][nuke-troops] |
| Lobby modifiers | Starting gold, gold multiplier, Doomsday Clock, nukes or alliances disabled. Adjust the benchmarks accordingly. | [modifiers][mp-mods] |
| Encirclement chances | Bots or pockets you could have surrounded and taken at no cost | [Goodkat][goodkat], [Lonely_Millennial][lm-beginner], [PlayerExecution.ts][encircle] |

## Conclusion

The deepest change is in what the coach thinks a good player looks like. It currently grades a 2025 FFA lone wolf who opens with a full send, buys a City on a timer, spends every coin and fights alone, whereas public play in v0.35 rewards a player who survives the opening on small clicks, turns a Port and a Factory into well over a million gold a minute by minute seven, attacks only with overwhelming stacks or hands the troops to someone who can, and in two-team games measures success by the team's land rather than personal share. Several of the coach's rules penalise exactly what the winners do: banking for a deterrent, building near a front because they own most of the map, attacking often, and getting nuked because they lead.

The game also keeps moving, with trade and train spawn rates retuned at least four times between mid-September and mid-October 2026 ([v0.34.0][v34], [v0.35.0][v35]), so any fixed number in an advice string will go stale again. The durable fix is in the process rather than the numbers: read thresholds from the engine commit each replay ran on, switch rule sets by game mode, and use the replay harness as a regression test that re-runs every rule against each lobby's top five and demotes any rule that fires on winners as often as on losers. That test is how this audit found the problems, and it would catch the next round automatically.

[r2]: <../research_notes/OpenFront current meta coaching/replay_data/results2.txt>
[r3]: <../research_notes/OpenFront current meta coaching/replay_data/results3.txt>
[r4]: <../research_notes/OpenFront current meta coaching/replay_data/results4.txt>
[pg]: <../research_notes/OpenFront current meta coaching/replay_data/pergame.md>

[e-loss]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/configuration/EngineConfig.ts#L584-L590
[e-bot]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/configuration/EngineConfig.ts#L555-L561
[e-unclaimed]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/configuration/EngineConfig.ts#L537-L549
[e-speed]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/configuration/EngineConfig.ts#L596-L598
[e-conquer]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/configuration/EngineConfig.ts#L418-L427
[e-trade]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/configuration/EngineConfig.ts#L268-L273
[e-train]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/configuration/EngineConfig.ts#L236-L259
[e-traitor-speed]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/configuration/EngineConfig.ts#L127-L129
[e-dp]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/configuration/EngineConfig.ts#L527-L530
[e-terrain]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/configuration/EngineConfig.ts#L102-L118
[e-afk]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/configuration/EngineConfig.ts#L551-L554
[e-boost]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/configuration/EngineConfig.ts#L223-L234
[e-donate-cd]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/configuration/EngineConfig.ts#L459-L464
[e-embargo]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/configuration/EngineConfig.ts#L494-L496
[e-transports]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/configuration/EngineConfig.ts#L500-L505
[e-mirv]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/configuration/EngineConfig.ts#L356-L365
[e-gold]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/configuration/EngineConfig.ts#L671-L680
[c-cap]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine-lib/src/configuration/Config.ts#L335-L374
[c-regen]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine-lib/src/configuration/Config.ts#L376-L408
[c-overtime]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine-lib/src/configuration/Config.ts#L293-L312
[c-sam-build]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine-lib/src/configuration/Config.ts#L235-L242
[a-home]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/execution/AttackExecution.ts#L387-L397
[a-target]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/execution/AttackExecution.ts#L312-L323
[a-retreat]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/execution/AttackExecution.ts#L288-L296
[a-embargo]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/execution/AttackExecution.ts#L111-L121
[a-cancel]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/execution/AttackExecution.ts#L155-L168
[a-elim]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/execution/AttackExecution.ts#L465-L499
[n-betray]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/execution/nation/NationAllianceBehavior.ts#L414-L501
[n-accept]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/execution/nation/NationAllianceBehavior.ts#L118-L182
[n-runaway]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/execution/nation/NationUtils.ts#L148-L189
[n-attack]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/execution/nation/NationAttackBehavior.ts#L377-L395
[mp-nations]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/src/server/MapPlaylist.ts#L220-L230
[mp-overtime]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/src/server/MapPlaylist.ts#L237-L239
[mp-team]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/src/server/MapPlaylist.ts#L209-L240
[mp-mods]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/src/server/MapPlaylist.ts#L68-L121
[mp-teamcount]: https://github.com/openfrontio/OpenFrontIO/blob/main/src/server/MapPlaylist.ts
[maps-gen]: https://github.com/openfrontio/OpenFrontIO/blob/main/packages/engine-api/src/game/Maps.gen.ts
[sam-friendly]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/execution/SAMLauncherExecution.ts#L190-L208
[sam-slots]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/game/UnitImpl.ts#L558-L569
[donate-clamp]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/execution/DonateTroopExecution.ts#L54-L57
[playerimpl]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/game/PlayerImpl.ts#L1087-L1145
[ts-both]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/execution/TradeShipExecution.ts#L212-L216
[port-rolls]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/execution/PortExecution.ts#L55-L102
[factory-any]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/execution/FactoryExecution.ts#L43-L56
[dp-destroyed]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/execution/PlayerExecution.ts#L88-L108
[encircle]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/execution/PlayerExecution.ts#L177-L199
[gi-never]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/game/GameImpl.ts#L1571-L1580
[gi-credit]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/game/GameImpl.ts#L1034-L1063
[wc-limit]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/execution/WinCheckExecution.ts#L20-L22
[wc-team]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/execution/WinCheckExecution.ts#L188-L210
[break-relation]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/execution/alliance/BreakAllianceExecution.ts#L46-L57
[nuke-troops]: https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/execution/NukeExecution.ts#L416-L462
[compare]: https://github.com/openfrontio/OpenFrontIO/compare/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de...main
[pr-stop-trading]: https://github.com/openfrontio/OpenFrontIO/pull/5919

[v25]: https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.25.0
[v34]: https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.34.0
[v35]: https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.35.0
[v353]: https://github.com/openfrontio/OpenFrontIO/releases/tag/v0.35.3
[pr2337]: https://github.com/openfrontio/OpenFrontIO/pull/2337
[pr2665]: https://github.com/openfrontio/OpenFrontIO/pull/2665
[pr3232]: https://github.com/openfrontio/OpenFrontIO/pull/3232
[pr5907]: https://github.com/openfrontio/OpenFrontIO/pull/5907
[gh3445]: https://github.com/openfrontio/OpenFrontIO/issues/3445
[gh4650]: https://github.com/openfrontio/OpenFrontIO/issues/4650
[gh5969]: https://github.com/openfrontio/OpenFrontIO/issues/5969

[fyi-opening]: https://openfront.fyi/strategies/ffa-opening/
[fyi-ratio]: https://openfront.fyi/guides/attack-ratio/
[fyi-first]: https://openfront.fyi/guides/first-match/
[fyi-econ]: https://openfront.fyi/strategies/economy-fundamentals/
[fyi-timing]: https://openfront.fyi/guides/building-timing/
[fyi-frontload]: https://openfront.fyi/guides/frontload-port-factory-investment/
[fyi-outgunned]: https://openfront.fyi/guides/outgunned-defense/
[fyi-recovery]: https://openfront.fyi/strategies/recovery-playbook/
[fyi-overtime]: https://openfront.fyi/guides/winning-overtime/
[fyi-runaway]: https://openfront.fyi/guides/ffa-runaway-leader/
[fyi-naval]: https://openfront.fyi/strategies/team-naval-control/
[fyi-quickchat]: https://openfront.fyi/guides/quick-chat-team-coordination/
[fyi-victory]: https://openfront.fyi/guides/team-victory-threshold/
[wiki-buildings]: https://openfront.wiki/Buildings
[goodkat]: https://steamcommunity.com/sharedfiles/filedetails/?id=3818657159
[on1kson]: https://steamcommunity.com/sharedfiles/filedetails/?id=3806155862
[r3re5]: https://steamcommunity.com/sharedfiles/filedetails/?id=3808336226
[steam-sweats]: https://steamcommunity.com/app/3560670/discussions/0/682992180338454079/
[reddit-port2]: https://www.reddit.com/r/Openfront/comments/1vjvm8p/simple_guide_on_how_to_win/

[ash-simple]: https://www.youtube.com/watch?v=fDkfEDIh3tY
[ash-econ]: https://www.youtube.com/watch?v=8ult82qmiAg
[ash-clan]: https://www.youtube.com/watch?v=2gXG7SgyCag
[sinful]: https://www.youtube.com/watch?v=Z0gUv3gyfms
[enzo-econ]: https://www.youtube.com/watch?v=LjHGs047sSM
[lm-beginner]: https://www.youtube.com/watch?v=7J5zwb_s_Cg
[lm-team]: https://www.youtube.com/watch?v=xPk61xZdad0
[rex-major]: https://www.youtube.com/watch?v=J43d0-oGpGQ
[rex-sleeper]: https://www.youtube.com/watch?v=sfj0BUyTo-E
[vari]: https://www.youtube.com/watch?v=pHGVqJEBkyo
[biff-oct]: https://www.youtube.com/watch?v=1wKpia7OGvc
[deshack]: https://www.youtube.com/watch?v=BfPJf9WK3NM
