# How top OpenFront players, streamers and competitive players play and teach the game (2026), plus lessons from Territorial.io and WarFront.io

**Method.** These notes are based on 24 YouTube videos.
- I pulled each video's title, channel, publish date, view count and description, plus its auto-generated English captions, from YouTube's own caption tracks.
- I read the short videos in full. Three helper agents read the long ones (1–3 hour tournament videos) and checked each quote against the caption text.
- Positions are given as "≈N% into the video". They come from character offsets in the caption text, so they only roughly match playback time.
- Auto-captions garble player names; garbled names are flagged.
- Game-version facts come from the community wiki's update pages (openfront.wiki) and one engine snapshot in this repo.
- "Today" means 2026-10-30. The live version is v0.35 (released 2026-10-16).

**Version timeline used to date advice.** Anything older than v34 may be stale on attack losses and gold.

| Version | Date | Relevant changes |
| --- | --- | --- |
| v29.x | ~Jan 2026 | Ranked 1v1 had just launched. |
| v32 | by Jun/Jul 2026 | — |
| v33 | 2026-07-31 | Doomsday Clock mode; ranked 2v2. |
| v34 | 2026-09-14 | Attack-loss rework; early gold up, mid/late gold down; team win threshold cut from 95% to 80%; clan tags and clan teams. Steam launch followed on 2026-09-17. |
| v35 | 2026-10-16 | Ranked FFA and Ranked Clan Wars; "Stop Trading with All" became "Stop Trading with Enemies"; faster trade ships and trains for players with few ports or factories; lobby cap removed. |

Sources: [openfront.wiki Update 34.0](https://openfront.wiki/Update_34.0), [Update 35.0](https://openfront.wiki/Update_35.0), [openfront.wiki home (version list)](https://openfront.wiki/).

---

## Key question 1: Who are the well-known OpenFront players, streamers and YouTubers in 2025–2026, and what do they teach about openings, economy, attack timing, alliances, naval play, nukes and team play?

### Takeaway
The 2026 teaching voices are:
- **Tutorial channels:** Enzo Plays, Lonely_Millennial and Ash.
- **Competitive players who also make videos:** Ultimus_Rex, TheBiff/Biffeur, vari, deshack and Papi Flex.

They agree on several things that contradict the coach's current advice:
- Open with small, spaced 10–12% pulses into wilderness, not a full send.
- Get the first three cities (125k/250k/500k) before anything else, at least in FFA.
- Keep troops near 42% of the cap, but also park troops in boats ("boat banking").
- Late in FFA, hold gold on purpose for a hydrogen bomb or a counter-MIRV.
- In team games, roles are explicit: frontliners attack and backliners build economy and donate troops on a rhythm.

### Cited findings

**The creators and why they count** (views as of 2026-10-30)
- **Ultimus_Rex** (clan [UN]): the most prolific competitive creator, posting multi-game FFA videos weekly.
  - He won the 2026 Summer OpenFront Masters (OFM) FFA Major on points, with 67 kills. Sparkles was 2nd (792 points) and Whalefall 3rd (774) — [Ultimus_Rex, "I Fought the TOP Players in a GIANT OpenFront.io Tournament", 2026-08-01, ≈98–99%](https://www.youtube.com/watch?v=J43d0-oGpGQ). vari confirms Rex won it, Sparkles 2nd, Whalefall 3rd — [vari, 2026-08-02, ≈93%](https://www.youtube.com/watch?v=pHGVqJEBkyo).
  - He was #1 on the trackerfront leaderboard until "Space Sheep" overtook him — [Ultimus_Rex, "I tried fighting a PRO OpenFront.io player", 2026-07-07, ≈2%](https://www.youtube.com/watch?v=I2MlSoKaubw).
- **Enzo Plays:** the largest tutorial channel. Videos include a v28 tutorial (128k views), a v31 tutorial (68k), "OpenFront.io v34 is Changing the Meta" (90k, 2026-09-15), an economy video (115k, 2026-05-01) and a team-game video (2026-03-09) — [YouTube search results captured 2026-10-30](https://www.youtube.com/watch?v=x-gZ2IFXfnY).
- **TheBiff (Biffeur):** listed as a notable player on the OFM wiki page — [openfront.wiki: OpenFront Masters](https://openfront.wiki/OpenFront_Masters/). His 2025 video title says he won "the Biggest Openfront Tournament" — [TheBiff, ~2025](https://www.youtube.com/watch?v=uUFQJCw4Y8E) (dated by title only, not watched).
- **vari** (LUX clan): 11th in the 2026 Summer OFM Major; won the North America finals round — [vari, 2026-08-02, ≈93–94%](https://www.youtube.com/watch?v=pHGVqJEBkyo).
- **Lonely_Millennial** (clan "Roys", also streams on Twitch):
  - "OpenFront Beginner Guide (2026)", 110k views — [2026-07-04](https://www.youtube.com/watch?v=7J5zwb_s_Cg)
  - "OpenFront Team Game Guide" — [2026-07-31](https://www.youtube.com/watch?v=xPk61xZdad0)
- **Ash:** "This Simple OpenFront Strategy Wins Almost Every Game", 35k views — [2026-09-05](https://www.youtube.com/watch?v=fDkfEDIh3tY). Also the economy tips — [2026-08-13](https://www.youtube.com/watch?v=8ult82qmiAg), mistakes — [2026-08-15](https://www.youtube.com/watch?v=shVV-tq24uw) and a clan match — [2026-09-28](https://www.youtube.com/watch?v=2gXG7SgyCag).
- **Papi Flex:** "The Ultimate OpenFront.io Factory Guide". He says he read the factory code and tested it in custom lobbies — [2026-07-24](https://www.youtube.com/watch?v=dYa-LtXPkrE).
- **deshack** (ITA clan, Twitch): "How to win Ranked 1v1 matches" — [2026-09-01](https://www.youtube.com/watch?v=BfPJf9WK3NM).
- **Sinful73** (AST clan): "How to Snowball Every OpenFront Game" — [2026-07-19](https://www.youtube.com/watch?v=Z0gUv3gyfms).
- **Lower authority:**
  - OpenFront Academy, a beginner who loses on camera — [2026-08-10](https://www.youtube.com/watch?v=UXWA1mB9MhI)
  - ToThePoint Guide, 224 views — [2026-09-18](https://www.youtube.com/watch?v=fiC7Y8TCQhk)
  - DougyJr (JR clan) streams "TOP 100 1v1 push + #JR team games" — [stream VOD, ~May 2026](https://www.youtube.com/watch?v=V5mgVyYF9VM) (title only)
- The repo's stream list (`data/engines/7ee96860…/src/resources/streams.json`) is empty (`"live": []`), so it named no streamers.

**Openings (attack ratio and first purchases)**
- **Ash (Sept 2026):**
  - Do nothing at spawn until about 3,500 troops.
  - Then send 10% into green wilderness, and another 10% each time troops grow by 1,000.
  - Stop once the useful wilderness is gone, then farm bots.
  - Never throw 10% pulses into white (mountain) terrain.
  - Source: [Ash, 2026-09-05](https://www.youtube.com/watch?v=fDkfEDIh3tY)
- **Sinful73 (July 2026), his exact opening:**
  - Set the ratio to 12% and click every ~2 s until the free land is claimed.
  - Raise to 60% for the first tribe, then 50%, 40%, and 30% from the fourth tribe on.
  - Attack each time the troop-growth number turns orange.
  - Hit tribes with at least 2× their troops.
  - Build only cities during the tribe phase: no ports or factories, defense posts only if a player is clearly coming.
  - Send 1% boats into any reachable water.
  - Source: [Sinful73, 2026-07-19](https://www.youtube.com/watch?v=Z0gUv3gyfms)
- **Enzo (v34, Sept 2026):** opens by spacing out 10% pushes. He says he hasn't worked out whether v34 needs a different opening, and that pushes "should be slower" in v34 — [Enzo Plays, "v34 is Changing the Meta", 2026-09-15, ≈0% and ≈95%](https://www.youtube.com/watch?v=x-gZ2IFXfnY).
  - In May he called himself out for pushing with 100% early: "I should not be pushing with 100%" — [Enzo Plays, economy video, 2026-05-01, ≈5%](https://www.youtube.com/watch?v=LjHGs047sSM).
- **Lonely_Millennial (July 2026):**
  - Spam-clicking a full army into wilderness is the classic beginner mistake.
  - Hold troops near 42% of the cap; the growth indicator turns from green to orange when you pass it.
  - In the bot phase, launch ~40% attacks into green-heavy bots when the indicator turns orange.
  - Plan annexations (fully surrounding a target takes all its land and gold for free).
  - Source: [Lonely_Millennial, 2026-07-04](https://www.youtube.com/watch?v=7J5zwb_s_Cg)
- **City prices:** both Lonely_Millennial and Sinful73 give 125k / 250k / 500k, then 1M per city after that. Sinful73 says get all three early — [7J5zwb_s_Cg](https://www.youtube.com/watch?v=7J5zwb_s_Cg); [Z0gUv3gyfms](https://www.youtube.com/watch?v=Z0gUv3gyfms).
- **City first:** Ash says the first big purchase should almost always be a city, because the troop cap is the early bottleneck — [Ash, 2026-08-13](https://www.youtube.com/watch?v=8ult82qmiAg).
- **Rex, FFA tournaments:**
  - Calls a neighbour's early port a "massive mistake" — [J43d0-oGpGQ, ≈16%](https://www.youtube.com/watch?v=J43d0-oGpGQ); similar at [hzmn1gMWEQA, 2026-06-27, ≈71%](https://www.youtube.com/watch?v=hzmn1gMWEQA).
  - Funds city 1, city 2 and a factory from early bot kills and annexations — [CzI9bg-rY-o, 2026-08-29, ≈1–3%](https://www.youtube.com/watch?v=CzI9bg-rY-o).
- **City-reset trick:** build your first city on a bot border and let the bot take it. Your city count drops to zero, so the next city costs 125k again; then retake the bot.
  - Ash says "most ranked players" use it — [Ash, 2026-08-13](https://www.youtube.com/watch?v=8ult82qmiAg).
  - TheBiff demonstrated it in ranked 1v1 and said it saved 375k. He also hedged that he didn't know whether it works against top players — [TheBiff, 2026-01-26, ≈40–46%](https://www.youtube.com/watch?v=jzC7n5NpGZw).

**Economy (Cities, Ports, Factories, trains, trade)**
- **Lonely_Millennial:**
  - Ports are the strongest economic building. Factories are for landlocked spawns.
  - Ports and factories share one price ladder.
  - Don't bank gold.
  - A good start is city, port, city, port, city, port (factories instead of ports if landlocked).
  - Late game, a port economy beats a city-only build.
  - Source: [7J5zwb_s_Cg](https://www.youtube.com/watch?v=7J5zwb_s_Cg)
- **Ash:**
  - Choose ports on a safe coast and factories when landlocked or when the coast is a war zone.
  - Secure the economy before scaling it; defense spending counts as economy.
  - Source: [8ult82qmiAg](https://www.youtube.com/watch?v=8ult82qmiAg)
- **Papi Flex, factory mechanics (July 2026 build, from his reading of the code):**
  - Trains run between connected stations, and every station passed pays both the station owner and the train owner.
  - Stations are cities and ports on a rail line, not factories.
  - Payout per station: 25k for a teammate's or a non-allied player's, 35k for an ally's, 5k for your own.
  - After 10 stations the payout falls by 5k per station, down to a 5k minimum.
  - A factory reaches 110 tiles. Embargoes remove lines from the spawn pool.
  - Income scales with how many allied stations your factories reach, not with factory count. Never stack factories that only feed your own stations.
  - Count: 2–3 factories early, 3–7 mid game, 7–20 late; 10 is a "sweet spot".
  - Not every game is a factory game: you need 3+ allies who also build factories, plus a choke point or a central spawn.
  - Source: [Papi Flex, 2026-07-24](https://www.youtube.com/watch?v=dYa-LtXPkrE)
- **Papi Flex, factories vs ports:**
  - Roughly balanced as of July 2026: factories are better early-to-mid, ports late.
  - Ports pay in lumps, factories steadily.
  - Border factories read as friendly, early warships as hostile.
  - Source: [dYa-LtXPkrE, ≈34–54%](https://www.youtube.com/watch?v=dYa-LtXPkrE)
- **Rex and Enzo:** both place cities along rail lines and ally players who build factories. Rex says a factory builder with no alliances is hurting himself — [CzI9bg-rY-o, ≈3%](https://www.youtube.com/watch?v=CzI9bg-rY-o); [Enzo, YADXdGgmHHc, 2026-08-04](https://www.youtube.com/watch?v=YADXdGgmHHc).
- **Factory count wins FFAs.**
  - The Africa finals winner, Cobra, reached 75 cities from a central train position — [vari, ≈31%](https://www.youtube.com/watch?v=pHGVqJEBkyo).
  - Rex's "pro" opponent out-built him on cities: 21 cities, then 39 vs 25 — [I2MlSoKaubw, ≈18–25%](https://www.youtube.com/watch?v=I2MlSoKaubw).
- **v35 (Oct 16) changes:**
  - Players with few ports or factories get faster trade ships and trains: a 1-port player sends a ship about every 8 s instead of 12 s, and the boost fades by level 6.
  - Trade can now be stopped for "enemies" only.
  - Source: [openfront.wiki Update 35.0](https://openfront.wiki/Update_35.0)
- **v34 (Sept 14):** early-game gold went up and mid-to-late gold went down; no figures published — [openfront.wiki Update 34.0](https://openfront.wiki/Update_34.0). Enzo mentions "the new gold gen" changing his diplomacy — [x-gZ2IFXfnY](https://www.youtube.com/watch?v=x-gZ2IFXfnY).

**Attack timing and troop management**
- **The "magic 42% rule"** is the most-taught concept in 2026 videos — [Lonely_Millennial team guide, 2026-07-31, ≈45%](https://www.youtube.com/watch?v=xPk61xZdad0); [7J5zwb_s_Cg](https://www.youtube.com/watch?v=7J5zwb_s_Cg); [Ash, fDkfEDIh3tY and 8ult82qmiAg](https://www.youtube.com/watch?v=8ult82qmiAg).
  - Growth peaks at ~42% of the cap.
  - Ash frames it as a ±5% band, i.e. 35–45%.
- **Chain your pushes (Lonely_Millennial).** If reserve plus troops in the field exceed the cap when an attack ends, the overflow vanishes. So start the next push before the current one returns. In his example: a 500k cap, 300k in reserve and 400k in the field, so commit 200k+ to a second push first — [xPk61xZdad0, ≈50%](https://www.youtube.com/watch?v=xPk61xZdad0).
- **Attacking players (Sinful73):** build to ~50% of the cap, then launch an 80% attack to end the war quickly. Pick targets who are already losing — [Z0gUv3gyfms](https://www.youtube.com/watch?v=Z0gUv3gyfms).
- **Ash:** look for a mistake, not a fair fight. Good targets have just sent their army into a bot, have an empty troop bar, or are overextended. If every neighbour is healthy, do nothing and offer alliances — [fDkfEDIh3tY](https://www.youtube.com/watch?v=fDkfEDIh3tY).
- **TheBiff (Oct 2026, four public FFA wins):**
  - Waits for neighbours to commit before hitting them.
  - Treats betrayers (who carry the traitor debuff) as prime targets.
  - Spends troops where the buildings are, so he can capture them.
  - Source: [TheBiff, "This is what a PERFECT OpenFront Session Looks Like!", 2026-10-30, ≈4–12%, 38–69%](https://www.youtube.com/watch?v=1wKpia7OGvc)
- **Rex (Oct 2026):** the best moment to attack a rival is while he spends troops on a third party. Before a kill, check the target's gold, since eliminations transfer gold — [Rex, "The Sleeper Cell strat is UNBEATABLE", 2026-10-28, ≈25–26%](https://www.youtube.com/watch?v=sfj0BUyTo-E).

**Alliances**
- **Lonely_Millennial (July 2026):**
  - Ally your biggest neighbours, then eat the weaker ones.
  - Alliances last 5 minutes. Breaking one gives a 30-second traitor debuff: −50% defense, and others can break alliances with you for free.
  - Don't betray unless you have 1.5–2× the troops of the surrounding neighbours.
  - Allies' warships don't capture your trade ships.
  - Source: [7J5zwb_s_Cg](https://www.youtube.com/watch?v=7J5zwb_s_Cg)
- **Sinful73:** never ally nations (AI) in the opening, because that locks away their land and cities for 5 minutes — [Z0gUv3gyfms](https://www.youtube.com/watch?v=Z0gUv3gyfms).
- **Rex, the "mitochondria"/"mito" meta (Aug 2026):**
  - Shrink or encircle a small player, then keep him alive as an ally whose trade and factory traffic feed only you.
  - Mitos are income but a liability: one grew to 42 cities and MIRVed him, costing him the game.
  - Papi Flex defines "mito" the same way, and TheBiff keeps one alive on purpose.
  - Sources: [CzI9bg-rY-o, ≈21–44%](https://www.youtube.com/watch?v=CzI9bg-rY-o); [dYa-LtXPkrE, ≈85%](https://www.youtube.com/watch?v=dYa-LtXPkrE); [1wKpia7OGvc, ≈81–94%](https://www.youtube.com/watch?v=1wKpia7OGvc)
- **Rex's diplomacy rule:** if a neighbour has a hydrogen bomb, offer an alliance; if not, kill him — [CzI9bg-rY-o, ≈60%](https://www.youtube.com/watch?v=CzI9bg-rY-o).
- **Over-allying stalls you.**
  - Rex blamed his worst tournament games on allying everyone and then having nobody to attack — [hzmn1gMWEQA, ≈31%](https://www.youtube.com/watch?v=hzmn1gMWEQA); [E_mBijiW5vc, 2026-07-11, ≈63%](https://www.youtube.com/watch?v=E_mBijiW5vc).
  - TheBiff: don't take alliances as early as he does — [1wKpia7OGvc, ≈33%](https://www.youtube.com/watch?v=1wKpia7OGvc).
- **Alliance renewals (vari):**
  - Renew before you push.
  - Punish a neighbour who misses a renewal.
  - To nuke an ally without the betrayal debuff, let the alliance expire first.
  - Source: [pHGVqJEBkyo, ≈41–50%, 91%](https://www.youtube.com/watch?v=pHGVqJEBkyo)

**Naval play**
- **Rex's "Sleeper Cell" (Oct 2026):**
  - In the first seconds, boat to the far side of the map and hide a one-pixel foothold, ideally deep in a river mouth.
  - It has to be done before any warship exists.
  - Later it lets you attack that half of the map.
  - Source: [sfj0BUyTo-E, ≈0–28%](https://www.youtube.com/watch?v=sfj0BUyTo-E)
- **Enzo also uses "sleeper" boats.** In team games he sends early boats into bot pockets the bots can't reach — [Enzo, "How to Win Team Games", 2026-03-09](https://www.youtube.com/watch?v=uyXs3pahgMA).
- **"Always boat everywhere"** is Rex's tournament rule. He says his critical mistake was sending too few boats — [E_mBijiW5vc, ≈41%](https://www.youtube.com/watch?v=E_mBijiW5vc); [hzmn1gMWEQA, ≈69%](https://www.youtube.com/watch?v=hzmn1gMWEQA). He praised Space Sheep's heavy boating — [J43d0-oGpGQ, ≈98%](https://www.youtube.com/watch?v=J43d0-oGpGQ).
- **Port sniping:** land a boat directly on a dying or port-only player's port or city to grab the building — [CzI9bg-rY-o, ≈63%](https://www.youtube.com/watch?v=CzI9bg-rY-o); [sfj0BUyTo-E, ≈4%, 64%](https://www.youtube.com/watch?v=sfj0BUyTo-E).
- **Piracy:** a warship parked on enemy trade lanes captures their trade ships.
  - Lonely_Millennial: build one once you have 250k spare — [7J5zwb_s_Cg](https://www.youtube.com/watch?v=7J5zwb_s_Cg).
  - TheBiff traced his own low income to a missing warship — [1wKpia7OGvc, ≈37%](https://www.youtube.com/watch?v=1wKpia7OGvc).
  - Rex's late income was about 4M/min, mostly from piracy — [sfj0BUyTo-E, ≈16%, 94%](https://www.youtube.com/watch?v=sfj0BUyTo-E).
  - The cost: piracy angers neighbours — [E_mBijiW5vc, ≈31%](https://www.youtube.com/watch?v=E_mBijiW5vc).

**Nukes, SAMs and MIRVs**
- **Rex (FFA tournaments):**
  - By mid game "everyone's got hydros". After that you expand by stacking SAMs (he upgrades to five-stacks).
  - Hold one or two hydrogen bombs as a threat.
  - Sources: [hzmn1gMWEQA, ≈18%, 50%](https://www.youtube.com/watch?v=hzmn1gMWEQA); [J43d0-oGpGQ, ≈35%, 73–75%](https://www.youtube.com/watch?v=J43d0-oGpGQ)
- **MIRV price ladder (cited in four videos):** each launch raises the next price, from 25M to 40M, 55M, 70M and past 100M.
  - Pros fire a MIRV at a dying player just to price rivals out.
  - They keep "counter-MIRV" gold (Rex: stay above 55–70M).
  - Sources: [I2MlSoKaubw, ≈43–59%](https://www.youtube.com/watch?v=I2MlSoKaubw); [1wKpia7OGvc, ≈25%, 95%](https://www.youtube.com/watch?v=1wKpia7OGvc); [pHGVqJEBkyo, ≈9–60%](https://www.youtube.com/watch?v=pHGVqJEBkyo); [E_mBijiW5vc, ≈52%, 74%](https://www.youtube.com/watch?v=E_mBijiW5vc)
  - Lonely_Millennial gives 25M for the first MIRV, rising with each use — [7J5zwb_s_Cg](https://www.youtube.com/watch?v=7J5zwb_s_Cg).
- **vari's benchmark:** in tournaments, players start holding MIRVs around minute 12–13 — [pHGVqJEBkyo, ≈97%](https://www.youtube.com/watch?v=pHGVqJEBkyo).
- **A silo is diplomatic currency.**
  - Rex: a silo earns respect, and without one it is hard to convince people to keep you alive — [sfj0BUyTo-E, ≈70%, 93%](https://www.youtube.com/watch?v=sfj0BUyTo-E).
  - Rex sorts the leaderboard by gold to see who can afford a MIRV — [CzI9bg-rY-o, ≈17%, 95%](https://www.youtube.com/watch?v=CzI9bg-rY-o).
- **TheBiff's endgame:**
  - Stop trading with the target, bank gold, then betray with a MIRV.
  - Drop hydrogen bombs in pairs.
  - Source: [1wKpia7OGvc, ≈93–99%](https://www.youtube.com/watch?v=1wKpia7OGvc)

**Team play**
This is the user's main mode. Lonely_Millennial's team guide is the most explicit 2026 source: [xPk61xZdad0, 2026-07-31](https://www.youtube.com/watch?v=xPk61xZdad0).
- **Spawn:**
  - Spawn with your team.
  - Share the same river or coast, so trade ships between teammates don't sail past enemy coasts.
- **Bot phase:**
  - Don't cut teammates off from the coast or from further bots.
  - Take the bots nearest and along the enemy border first. This walls off the bots your team is guaranteed to get later and starves the enemy team.
- **Trade setting:** turn off trading with everyone except your team. In v35 this is the "Stop Trading with Enemies" option — [Update 35.0](https://openfront.wiki/Update_35.0).
- **Pick a role and keep it.** Wanting to be the "main character" (launching your own invasions from the back line) loses team games.
- **Frontliners:**
  - Get at least 3 cities and 3 ports before attacking.
  - Stay near 42% of the cap.
  - Chain pushes so returning troops don't overflow the cap.
  - Use the SOS emoji to ask for donations.
- **Backliners:**
  - Build city, port, city, port, city, port; then 7–10 spread-out ports on safe routes; then a SAM and a silo.
  - Donations, with one frontliner to feed: send 30–40% of your troops each time you reach ~50% of the cap. With two frontliners, send ~20% to each, more often.
  - He says there is a cooldown on donations to the same player (not checked).
  - Donate gold to a teammate hit by a hydrogen bomb so they can rebuild ports.
  - Send your next troop donation to a backliner who has fallen low.
  - Use warships to steal enemy trade.
  - A backliner sitting on full troops is costing the team the game (he jokes that a baby panda dies each time).
- **Ash's clan match** (six teams of 20 on Alps, won in about 7 minutes):
  - One designated frontliner is fed by everyone; others are told to stop attacking and donate.
  - Donate at 35–45%, but only about 10% early.
  - The caller uses map grid coordinates (spacebar or M).
  - Everyone keeps building factories on a landlocked map.
  - Early on, keep expanding into wilderness rather than attacking bots.
  - Source: [Ash, 2026-09-28](https://www.youtube.com/watch?v=2gXG7SgyCag)
- **Enzo (March 2026):**
  - Stop trading with all.
  - Sleeper boats into bot pockets.
  - Defense-post lines on fronts you aren't pushing.
  - Strike when an enemy frontliner burns his troops.
  - He said team games ended at 95%. **That is now outdated:** v34 cut the team threshold to 80% — [uyXs3pahgMA](https://www.youtube.com/watch?v=uyXs3pahgMA); [Update 34.0](https://openfront.wiki/Update_34.0).
- **Rule check:** team games still use the 80% threshold of non-fallout land in the engine snapshot `/Users/justinhein/Development/openFrontCoach/data/engines/14ba82b…/src/packages/engine-lib/src/configuration/Config.ts` (`PERCENT_TILES_OWNED_TO_WIN = 80`, applied by `WinCheckExecution.checkWinnerTeam`). An overtime option, off by default, lowers the threshold over time.
- **Nations in team games** now back up teammates and keep donating troops to teammates who are fighting (v35) — [Update 35.0](https://openfront.wiki/Update_35.0).

### Inferences
- **The coach's opening rule is out of step.** It says to full-send at the very start, then 60–70% into unclaimed land. Every 2026 creator who gives numbers teaches small spaced pulses (10–12%) into wilderness, larger ratios only for bots (60% falling to 30%), and ~80% sends only against weak players. The opening rule should change.
- **Ranked/FFA and team builds conflict on early ports.**
  - FFA and ranked creators (Sinful73, Rex, deshack) say cities only in the opening and an early port is a mistake.
  - Team-game teachers (Lonely_Millennial) say alternate city and port.
  - v35's faster trade for 1-port players probably helps early ports.
  - The coach should judge port timing by game mode rather than with one rule.
- **The coach's "banking gold" penalty is too blunt for late FFA.** Holding gold for a hydrogen bomb, a counter-MIRV, or a MIRV betrayal is a deliberate pro habit. "Gold sitting unspent" should probably be exempt once a silo exists and the player is within reach of a hydrogen bomb or MIRV price.
- **The "idle army" metric may misread pros.** Boat-banking troops (see Key question 3) means their home troop count is low while their real army is high.
- **Team donations are a measurable skill.** The coach could check donation cadence, the share sent, and the backliner's troops at donation time against these numbers. A backliner sitting at full troops is the clearest team mistake creators name.

### Gaps
- Twitch: the repo's stream list is empty, and I did not query Twitch, so I can't name current top live streamers by viewership.
- Reddit (r/OpenFrontIO) blocked automated requests (the JSON endpoints returned non-JSON). No Reddit sources are included.
- The donation cooldown, and the troops' share or tick spacing it implies, is a creator claim I did not verify in the engine.
- v34's gold change has no published figures, so I couldn't measure how much early city or port timing should shift.
- Papi Flex's train payouts (25k/35k/5k, 110-tile range) are from the July 2026 build. v35 changed train frequency for small networks, so payouts may differ now.

---

## Key question 2: Does OpenFront have ranked play, 1v1, clans or tournaments now? What does the competitive meta look like, and how does it differ from casual public lobbies?

### Takeaway
Yes, all of them:
- **Ranked:** 1v1 since early 2026, 2v2 since v33 (2026-07-31), and FFA and Clan Wars since v35 (2026-10-16). Ranked needs a trusted account.
- **Clans:** in-game clan tags, treasuries and a clan leaderboard.
- **Tournaments:** an official tournament organiser, OpenFront Masters (OFM), runs seasonal Minors and Majors.

Competitive play differs from public lobbies in several ways:
- Tournament FFAs use short alliances (3 minutes), timers (20–25 minutes), a Doomsday Clock, 1 minute of PvP immunity and points for kills.
- There are no "free" weak players.
- Silos and hydrogen bombs are universal by mid game. MIRVs are held and used to price rivals out.
- Alliance-renewal management decides endgames.
- Ranked 1v1 is a different game: small maps, no nations, no alliances, and a rush to cities and a silo for a hydrogen bomb.

### Cited findings

**Ranked modes**
- **1v1:** existed before v33 with an individual ladder. Ranked 2v2 came in v33. Ranked FFA (4–10 players matched by ELO, continent maps, 20-minute timer, last human standing wins) and Ranked Clan Wars (2–5 per side, up to 4 clans, rated per clan) came in v35.
  - Ranked needs a trusted account and gives 1.25× XP.
  - 2v2 has 1-minute PvP immunity, uses compact maps 50% of the time, and pairs clanmates where possible.
  - Source: [openfront.wiki Ranked](https://openfront.wiki/Ranked); [Update 35.0](https://openfront.wiki/Update_35.0)
- The engine snapshot in this repo (`/Users/justinhein/Development/openFrontCoach/data/engines/14ba82b…`; its date is not recorded) defines `RankedType { OneVOne, TwoVTwo, FreeForAll, ClanWars }` and a ranked FFA size of 4–10 (`data/engines/14ba82b…/src/packages/engine-api/src/game/GameTypes.ts`). Its win check keeps bots from winning ranked FFA (`WinCheckExecution.ts`).
- v34 made every 4th scheduled public game trusted-only — [Update 34.0](https://openfront.wiki/Update_34.0).

**Ranked 1v1 meta**
- **TheBiff (Jan 2026, v29, at launch):**
  - Base ELO 1500, about +15 to +25 per win; he reached 1607 after ~10 games.
  - Small maps with no nations, so the coast and ports are weak (no one to trade with).
  - He refuses alliances. Positioning decides the game. Nukes are huge relative to the small map.
  - He spams 10% (and 1% on mini-maps) attacks, fakes spawns and spawn-kills weak opponents.
  - Source: [jzC7n5NpGZw, ≈0–21%, 42–49%, 96%](https://www.youtube.com/watch?v=jzC7n5NpGZw)
- **deshack (Sept 2026, ranked 1v1 on Australia and Europe, normal size):**
  - Spawn between two bots for an early annexation, then lower the attack ratio.
  - Build 3 cities, then a missile silo, aiming for a hydrogen bomb.
  - No factories or ports. He calls an opponent's factory "simply bad" in ranked.
  - Destroy the opponent's silo, use defense posts to blunt attacks, and then go for 80%.
  - He notes only 30 seconds of PvP immunity.
  - Source: [BfPJf9WK3NM, ≈0–100%](https://www.youtube.com/watch?v=BfPJf9WK3NM)
- **ToThePoint Guide (Sept 2026, low authority, 224 views):** same recipe — green spawn, annex tribes, cities, no ports, rush silos and a hydrogen bomb at ~6M gold — [fiC7Y8TCQhk](https://www.youtube.com/watch?v=fiC7Y8TCQhk).

**Tournaments: OpenFront Masters (OFM)**
- **OFM itself:** announced on 7 July 2025 as the official tournament team. Uses impartial referees and has rules against cheating, interference and match fixing.
- **Events listed:**
  - 2025: World Cup, Autumn/Winter Minor and Major.
  - 2026: Winter 2v2, Winter Minor/Major, Spring Minor/Major, Summer 1p FFA Minor and Finals.
  - Community events: UN Olympics (1v1/FFA/Trios), LUX Solstice Games, Clan Wars October 2025, Nations Cup, BAGNO Final Four Clash.
- **Notable players listed:** Biffeur, EagleEye, Franquito, Grain de Malice, Hulkiora, Liberated Battle Unit, Moka, Ry.
- Sources for the three items above: [openfront.wiki: OpenFront Masters](https://openfront.wiki/OpenFront_Masters/)
- **2026 Winter 2v2:** playoff on 2026-01-25 with 8 teams, single elimination and a Bo3 final. Prizes were shop skins — [Liquipedia Lab: 2026 Winter 2v2 Tournament (search snippet; page returned 403 to fetch)](https://liquipedia.net/lab/Openfront/OFM/2026_Winter_2v2_Tournament).
- **2026 Summer FFA Minor, 2026-07-11 (209 entrants):**
  - Format: three qualifiers, a semifinal and a final, run in parallel lobbies of 40–55 players.
  - Modifiers: 3-minute alliances, a 25-minute cap, and a Doomsday Clock that at the time cut sub-threshold players' troops to zero. Win at 80% or by holding the crown at the timer.
  - Rex won 3 of 5 games and had the most points and kills (47), but placed 3rd because the final game decided the winner.
  - Source: [E_mBijiW5vc](https://www.youtube.com/watch?v=E_mBijiW5vc)
- **2026 Summer FFA Major (~2026-08-01):**
  - About 120 competitors, with elimination rounds of ~50.
  - Finals: Africa (96 players), Mare Nostrum (89), Two Lakes (87), North America (57) and Europe (58).
  - Modifiers: 25-minute timer, 3-minute alliances, Doomsday Clock (softened so troops no longer drop to zero), 1-minute PvP immunity, anonymous "Anon <animal>" names.
  - Points come from placement plus kills.
  - Result: Ultimus Rex 1st, more than 100 points clear, with 67 kills; Sparkles 2nd (792); Whalefall 3rd (774); Alpha 4th; "uni" 5th (caption spelling). Prize was plutonium (the in-game currency) plus a hall of fame.
  - Round winners named in replays: Tenno, Whalefall, vari, Space Sheep (2 game wins).
  - It was the "first OFM major under the new directorship"; an "OFM Grand Championship" is next.
  - Sources: [J43d0-oGpGQ, ≈0–1%, 83–99%](https://www.youtube.com/watch?v=J43d0-oGpGQ); [vari pHGVqJEBkyo, ≈0–23%, 92–94%](https://www.youtube.com/watch?v=pHGVqJEBkyo)
- **Other community events:**
  - A clan "UC Grand Tournament" (1v1 bracket, with losers going to an FFA side event; year not given).
  - An EU clan 1-year anniversary tournament announced on 2026-04-08.
  - Source: [MOON – OpenFront community news (search snippets; pages returned 403)](https://communityone.io/servers/1360870529568870410/moon-openfrontio/news/uc-grand-tournament-announcement-december-13)
- **A separate Discord, "OpenFront Masters" (openfront-masters),** bills itself as the official esports organisation with monthly cash-prize tournaments. That is its own claim — [Discord listing (search snippet)](https://discord.com/servers/openfront-masters-1355960796105932900).

**Clans**
- **How clans work:**
  - A clan is a shared "[TAG]" in the username. In team modes, clanmates are placed on the same team.
  - v34 added a clan tag picker, clan-named teams, donations to a clan treasury and a clan map (alpha).
  - v35 added Ranked Clan Wars and an ELO column on the clan leaderboard.
  - Source: [openfront.wiki Clan](https://openfront.wiki/Clan)
- **Clan seasons:** the clan rework's second phase introduces seasons in which only each clan's top-100 players count. Announced 2026-04-30 — [MOON news (search snippet; page 403)](https://communityone.io/servers/1360870529568870410/moon-openfrontio/news/openfront-clans-seasonal-top-100-2026-04-30/).
- **Clans named by creators:**
  - [UN] (Ultimus_Rex) and LUX (vari). Rex says "The Lux Clan is very, very strong" — [sfj0BUyTo-E, ≈31%](https://www.youtube.com/watch?v=sfj0BUyTo-E).
  - Roys (Lonely_Millennial), AST (Sinful73), ITA (deshack), JR (DougyJr).
  - Lonely_Millennial: clans that take team games seriously "completely dominate" public team lobbies — [xPk61xZdad0, ≈95%](https://www.youtube.com/watch?v=xPk61xZdad0).

**Third-party leaderboards**
- Trackerfront was the "most-used 3rd party leaderboard" in August 2026 — [J43d0-oGpGQ description](https://www.youtube.com/watch?v=J43d0-oGpGQ).
- TheBiff lists ofratings.com, trackerfront.com and ofstats.io — [1wKpia7OGvc description](https://www.youtube.com/watch?v=1wKpia7OGvc).
- Rex calls the sites' ratings "fake ELO" built on heuristics such as max board share. He now points to ofstats.io as the most accurate — [sfj0BUyTo-E, ≈98–99%](https://www.youtube.com/watch?v=sfj0BUyTo-E).
- Players add an underscore prefix to their name to keep a game off trackerfront — [I2MlSoKaubw, ≈1%](https://www.youtube.com/watch?v=I2MlSoKaubw).

**How competitive FFA differs from public FFA**
- **vari:**
  - "This is very different to public FFA": there are no weak players to farm.
  - Players know where their pixels are and when alliances renew.
  - They defend well with defense posts.
  - Cautious play "just doesn't work"; the rule is hyper-aggressive play, take the lead, then grind.
  - Source: [pHGVqJEBkyo, ≈1.5%, 16%, 29%, 65%, 90%](https://www.youtube.com/watch?v=pHGVqJEBkyo)
- **Spawn (vari):** the public-FFA meta is a reasonably central spawn with water access, and the winner almost always comes from a central position (hedged). He spawns in Central Europe to farm nations — [pHGVqJEBkyo, ≈23%, 78%](https://www.youtube.com/watch?v=pHGVqJEBkyo).
- **Rex:**
  - 3-minute alliances "make it very easy to snowball".
  - The Doomsday endgame is "pure alliance management".
  - Renew selectively, because all alliances expire together.
  - Source: [E_mBijiW5vc, ≈41%, 65–70%](https://www.youtube.com/watch?v=E_mBijiW5vc)
- **Rex, Major lessons:**
  - Kill a runaway leader early.
  - Have a hydrogen bomb ready before borders heat up.
  - Avoid holding the crown near the timer; second place stays unnoticed.
  - Defense posts are "unbelievably brutal" in endgames.
  - Source: [J43d0-oGpGQ, ≈13–27%, 71%, 80–82%](https://www.youtube.com/watch?v=J43d0-oGpGQ)
- **Tournament-only behaviour:** dying players betray to feed their land to neighbours, and players self-nuke out of spite — [E_mBijiW5vc, ≈13%, 36%](https://www.youtube.com/watch?v=E_mBijiW5vc).

### Inferences
- Tournament meta (3-minute alliances, Doomsday Clock, kill points, timers) doesn't transfer directly to the user's public lobbies, which have 5-minute alliances, no Doomsday and win at 80% land. The general lessons that do transfer:
  - Universal silo and hydrogen-bomb deterrence by mid game.
  - MIRV price escalation.
  - Alliance-renewal timing.
  - Attacking players who carry the traitor debuff.
  - Boating everywhere.
- Ranked 1v1 and ranked FFA (4–10 players, 20-minute timer, no bots as winners) form their own meta: cities into a silo and hydrogen-bomb rush, no ports or factories, refuse alliances in 1v1. If the coach ever analyses ranked games, its economy advice (ports and factories) would be wrong there.
- Clan stacks in public team lobbies are a real factor. A losing team game may reflect facing a coordinated clan rather than individual mistakes.

### Gaps
- Liquipedia Lab pages for the 2026 Spring Major and Minor returned 403, so I have no results or format for the Spring events.
- No 2026 OFM Winter Major results found.
- No current ranked 1v1, 2v2 or FFA ladder tops, or ELO ranges, as of October 2026. The in-game and third-party leaderboards weren't accessible without visiting openfront.io, and TheBiff's January figures (base 1500, top ~2200, hedged) are old.
- I don't know the ranked 1v1 timer or map pool in v35 (TheBiff guessed 10 minutes in January).
- The OFM "Discord esports org" cash-prize claims are unverified.

---

## Key question 3: What "pro habits" do strong players describe that beginners lack?

### Takeaway
The habits strong players repeat:
- Pulse small attacks into wilderness and then bigger ones into bots, with roughly 2× the defender's troops.
- Hold troops near 42% of the cap, and park extra troops in boats or nuke land to keep regeneration high.
- Plan annexations instead of fighting through territory.
- Buy the three cheap cities first.
- Read the map with spacebar for terrain, and read the leaderboard sorted by gold.
- Attack only players who have just made a mistake.
- Boat everywhere early.
- Time alliance renewals deliberately.
- Keep a silo and hydrogen-bomb or counter-MIRV gold as deterrence.
- In teams, play a fixed role and donate on a rhythm.

### Cited findings
- **Attack-ratio discipline:**
  - Ash: set 10% and leave it there; don't fiddle with the slider — [fDkfEDIh3tY](https://www.youtube.com/watch?v=fDkfEDIh3tY).
  - Sinful73: lower the ratio as each tribe falls, 60% → 50% → 40% → 30% — [Z0gUv3gyfms](https://www.youtube.com/watch?v=Z0gUv3gyfms).
  - Enzo blamed a lost opening on pushing at 100% and on "overkill" pushes — [LjHGs047sSM, ≈5%](https://www.youtube.com/watch?v=LjHGs047sSM).
- **Use the growth indicator:** attack when the troop-growth number turns from green to orange, i.e. when you pass ~42% — [Lonely_Millennial 7J5zwb_s_Cg](https://www.youtube.com/watch?v=7J5zwb_s_Cg); [Sinful73](https://www.youtube.com/watch?v=Z0gUv3gyfms).
- **Boat banking (vari, the most concrete statement):**
  - Troop regeneration depends on troops at home; troops sent out don't count.
  - So push yourself down to 30–40% of max and use pockets of nuke land as "pseudo boat banks".
  - Source: [pHGVqJEBkyo, ≈63%](https://www.youtube.com/watch?v=pHGVqJEBkyo)
  - Rex watched the pro "Pragnar" (garbled name) "boat trick" to keep total troops above the cap, and said he needs to learn it — [I2MlSoKaubw, ≈63–67%](https://www.youtube.com/watch?v=I2MlSoKaubw).
  - TheBiff drops his troops low on purpose with 60k parked in boats — [jzC7n5NpGZw, ≈16%](https://www.youtube.com/watch?v=jzC7n5NpGZw).
  - Rex sends big boats so troops keep building while they travel — [sfj0BUyTo-E, ≈67%](https://www.youtube.com/watch?v=sfj0BUyTo-E).
- **2× rule:** attack tribes or bots with about twice their troops for a fast, cheap capture. Check whether you can surround and annex first — [Ash shVV-tq24uw and fDkfEDIh3tY](https://www.youtube.com/watch?v=shVV-tq24uw); [Sinful73](https://www.youtube.com/watch?v=Z0gUv3gyfms).
- **Hit bots and players who are busy elsewhere.** Prefer bots already attacking something else, whose troops are away from home — [Ash fDkfEDIh3tY](https://www.youtube.com/watch?v=fDkfEDIh3tY); [Sinful73](https://www.youtube.com/watch?v=Z0gUv3gyfms).
- **Reading terrain:**
  - Hold spacebar to see terrain: green (fast) → brown → white mountains (slow). Expand green first; leave white for later or for others — [Ash shVV-tq24uw](https://www.youtube.com/watch?v=shVV-tq24uw); [Lonely_Millennial 7J5zwb_s_Cg](https://www.youtube.com/watch?v=7J5zwb_s_Cg).
  - Rex avoids mountain spawns because nations with defense posts make them slow — [sfj0BUyTo-E, ≈30%](https://www.youtube.com/watch?v=sfj0BUyTo-E).
- **Spawn scouting:**
  - Choose green terrain, nearby bots and nations, few nearby players, and water. Learn 2–3 good spawns per map — [Sinful73](https://www.youtube.com/watch?v=Z0gUv3gyfms); [Lonely_Millennial](https://www.youtube.com/watch?v=7J5zwb_s_Cg).
  - Papi Flex uses the ~5 seconds before spawn to spot trade choke points and count neighbours — [dYa-LtXPkrE, ≈22%](https://www.youtube.com/watch?v=dYa-LtXPkrE).
  - TheBiff fakes his spawn and warns that opponents bait and move at the last minute — [jzC7n5NpGZw, ≈32%, 96%](https://www.youtube.com/watch?v=jzC7n5NpGZw).
- **Annexation planning:**
  - Spawn wedged between bots to set up early annexes — [deshack](https://www.youtube.com/watch?v=BfPJf9WK3NM); [Rex CzI9bg-rY-o, ≈47%](https://www.youtube.com/watch?v=CzI9bg-rY-o).
  - Rex was impressed by a pro's "zero bot kill annexation" and missed his own because he was watching a neighbour — [I2MlSoKaubw, ≈2–3%](https://www.youtube.com/watch?v=I2MlSoKaubw).
- **Steal bot kills and annexations.** Rex's rules: "Always try and steal bot kills" and never miss an annexation — [hzmn1gMWEQA, ≈69%](https://www.youtube.com/watch?v=hzmn1gMWEQA). Snipe the gold of tiny bots — [TheBiff jzC7n5NpGZw, ≈77%](https://www.youtube.com/watch?v=jzC7n5NpGZw).
- **One target at a time; avoid two fronts.**
  - Rex: "keep our targets one at a time" — [E_mBijiW5vc, ≈4%](https://www.youtube.com/watch?v=E_mBijiW5vc).
  - Lonely_Millennial: before a big send into a nation, check that another border isn't left open — [7J5zwb_s_Cg](https://www.youtube.com/watch?v=7J5zwb_s_Cg).
- **Leaderboard reading:**
  - Sort by gold to spot MIRV threats — [Rex CzI9bg-rY-o, ≈17%](https://www.youtube.com/watch?v=CzI9bg-rY-o); [TheBiff 1wKpia7OGvc, ≈72%, 92%](https://www.youtube.com/watch?v=1wKpia7OGvc).
  - Compare city counts, not leaderboard rank: Rex was "third on the leaderboard" but the weakest by cities — [I2MlSoKaubw, ≈33–45%](https://www.youtube.com/watch?v=I2MlSoKaubw).
- **Keep a mental map.** vari tracks who is where, which anonymous names in tournaments break — [pHGVqJEBkyo, ≈95%](https://www.youtube.com/watch?v=pHGVqJEBkyo).
- **Spot AFK players.** Rex: players who don't respond to nuclear threats are probably away, so their land is free — [hzmn1gMWEQA, ≈57%](https://www.youtube.com/watch?v=hzmn1gMWEQA).
- **Temperament:** the pro re-allied the player who had just betrayed him to fight a bigger threat. Rex calls that rare — [I2MlSoKaubw, ≈71%](https://www.youtube.com/watch?v=I2MlSoKaubw).
- **Mistakes strong players admit:**
  - Impulse alliance renewals and over-allying — [hzmn1gMWEQA, ≈9%, 31%](https://www.youtube.com/watch?v=hzmn1gMWEQA).
  - Spending gold on SAMs they never used — [hzmn1gMWEQA, ≈95%](https://www.youtube.com/watch?v=hzmn1gMWEQA).
  - Too few SAMs over city clusters, losing 10 cities to one hydrogen bomb — [I2MlSoKaubw, ≈24–28%](https://www.youtube.com/watch?v=I2MlSoKaubw).
  - Being too timid with pushes — [J43d0-oGpGQ, ≈97%](https://www.youtube.com/watch?v=J43d0-oGpGQ).
  - Not hydrogen-bombing earlier — [TheBiff 1wKpia7OGvc, ≈28%](https://www.youtube.com/watch?v=1wKpia7OGvc).
  - Getting pirated without noticing — [vari, ≈87%](https://www.youtube.com/watch?v=pHGVqJEBkyo).
  - Not keeping enough troops home to deter nations — [Rex sfj0BUyTo-E, ≈63%](https://www.youtube.com/watch?v=sfj0BUyTo-E).
- **Team habits:**
  - Backliners donate 30–40% when at ~50% of the cap — [Lonely_Millennial](https://www.youtube.com/watch?v=xPk61xZdad0); or donate at 35–45%, ~10% early — [Ash clan match](https://www.youtube.com/watch?v=2gXG7SgyCag).
  - Frontliners chain pushes so returning troops don't overflow the cap — [Lonely_Millennial](https://www.youtube.com/watch?v=xPk61xZdad0).

### Inferences
These habits suggest new checks the coach could run from replays:
1. Opening attack size and spacing (pulse size, in troops and as a share of the cap).
2. Ratio per bot attack versus the bot's troops (≥2×).
3. Whether annexations were available and missed.
4. Time to cities 1–3.
5. Whether a spawn lands on green terrain, water and bots.
6. Boat and nuke-land banking. Measure "army" as home troops plus troops in boats and attacks, so pros aren't wrongly flagged as low on troops.
7. Gold held when a neighbour reached hydrogen-bomb or MIRV money.
8. Alliance renewals missed or punished.
9. Team donation cadence.

The "42%" figure creators teach matches the engine's peak-regen point already in the coach (0.73/1.73 ≈ 42%). That part of the coach is current; the advice built around it (full sends, holding to cap bands) is what's dated.

### Gaps
- No creator gives a numeric timing for the first player kill or for the silo in public FFA or team games (vari gives MIRV ~12–13 minutes for tournaments only).
- Boat banking is described consistently, but I didn't verify in the engine that troops in transit leave home troops (and so regen) unaffected while still returning in full.
- No creator in my sample gave team-game advice specific to 2-team public lobbies of 56–94 players with 400 bots. Lonely_Millennial's and Enzo's guides are generic team advice; Ash's example is six teams of 20.

---

## Key question 4: Which Territorial.io and WarFront.io concepts map onto OpenFront, and which mislead?

### Takeaway
What transfers:
- The idea that the army is also your economy, with a growth peak below the cap (red balance in Territorial, ~42% in OpenFront).
- Needing about 2× the defenders.
- Short, terrain-protected borders.
- Buffer neighbours.
- "Don't fight a fair fight; punish full sends."

What misleads, because the mechanics differ:
- In Territorial, gold and army are one pool, and every attack and boat pays a fee (so fewer, bigger attacks are cheaper). In OpenFront, gold is separate and comes from a flat income, trade, trains and kills. There is no per-attack fee, and creators teach small 10% pulses into wilderness.
- The growth-peak number differs: about 67% of the cap in Territorial versus about 42% in OpenFront.
- Territorial's ally support is heavily taxed; OpenFront team donations are a core mechanic.
- Territorial has nothing like cities, ports, factories, trade, warships, nukes or alliance timers, so its lessons stop at the early game.
- WarFront.io, the codebase OpenFront forked, scaled the troop cap linearly with land, as Territorial does. OpenFront's cap grows sub-linearly with land plus cities, which makes cities relatively more valuable.

### Cited findings
**Territorial.io: the official tutorial** (last updated 2024-07-28; section 4 by the game's creator; contact davidtschacher@gmail.com) — [territorial.io/tutorial](https://territorial.io/tutorial)
- Balance (army) earns interest. Interest income peaks when your balance is 100× your pixel count; the balance caps at 150× pixel count. At peak income the balance turns red.
- Attack and action costs:
  - Land attack: 1.17% of balance.
  - Spawning a boat: 3.125%.
  - Moving a boat: 0.78%.
  - Supporting an ally: 6.25%, plus a tax starting near 93.75% that falls to 0 over two minutes.
  - The advice is to avoid unnecessary or frequent attacks.
- Balance is also your defensive strength. To fully conquer a nation, your attack forces must be double the defenders.
- Keep borders short. Use mountains and oceans as barriers. Sometimes keep a weak neighbour between you and a strong one.
- 1v1 endgames: attack repeatedly at peak income, when the balance turns red.
- A 2024 mirror of the tutorial on itch.io gives the same 100×/150× numbers — [Kavya78 on itch.io, 2024-02-03](https://kavya78.itch.io/territorialio/devlog/702590/the-territorial-tutorial).

**Territorial.io: community and fan advice** (lower authority)
- Late early game, save toward red interest. Attack only when someone full-sends or is actively dying.
- Look past the bot you're attacking to see who you'll border afterwards. Don't "snake out" into many borders.
- Source: [OpenBack "territorial strategy glossary" (fan site for another game; quoted via search summary)](https://openback.dedyn.io/guides/territorial-strategy-glossary)
- One fan guide gives the balance cap as 200× pixels, which conflicts with the official tutorial's 150× — same search summary.

**WarFront.io**
- OpenFront's README: "This is a fork/rewrite of WarFront.io. Credit to https://github.com/WarFrontIO" — [OpenFrontIO README](https://github.com/openfrontio/OpenFrontIO).
- WarFront.io's client repo was created 2024-04-13 and last pushed 2025-07-27. The README says it is "still early in development" — [WarFrontIO/client](https://github.com/WarFrontIO/client).
- In WarFront's `Player.ts`:
  - Troop income per tick is `max(1, floor(territorySize/10) + floor((3/5)^(1 − log2(troops+1))))`.
  - Troops are capped at `territorySize × 100`.
  - There are boats (`BoatManager`) and bot attack strategies.
  - Source: [WarFrontIO/client src/game/player/Player.ts](https://github.com/WarFrontIO/client/blob/master/src/game/player/Player.ts)

**OpenFront: what creators teach now** (for contrast)
- Troop growth peaks near 42% of the cap; sitting at full troops "kills your growth" — [Ash 8ult82qmiAg](https://www.youtube.com/watch?v=8ult82qmiAg); [Lonely_Millennial 7J5zwb_s_Cg](https://www.youtube.com/watch?v=7J5zwb_s_Cg).
- Small 10% pulses into wilderness — [Ash fDkfEDIh3tY](https://www.youtube.com/watch?v=fDkfEDIh3tY); [Enzo x-gZ2IFXfnY](https://www.youtube.com/watch?v=x-gZ2IFXfnY).
- 2× the troops against bots — [Ash shVV-tq24uw](https://www.youtube.com/watch?v=shVV-tq24uw); [Sinful73](https://www.youtube.com/watch?v=Z0gUv3gyfms).
- Annexation by full enclosure takes all land and gold — [Lonely_Millennial](https://www.youtube.com/watch?v=7J5zwb_s_Cg).
- Gold sources: ports and trade, factory trains, and taking all of a bot's or player's gold on elimination — [Ash shVV-tq24uw](https://www.youtube.com/watch?v=shVV-tq24uw).
- OpenFront Academy: don't attack a player whose troop count matches yours — [UXWA1mB9MhI, ≈26%](https://www.youtube.com/watch?v=UXWA1mB9MhI).
- Ash: you are looking for an opponent's mistake, not a fair fight — [fDkfEDIh3tY](https://www.youtube.com/watch?v=fDkfEDIh3tY).
- vari, by contrast, says top play needs hyper-aggression, and Rex says a runaway leader must be killed early — [pHGVqJEBkyo](https://www.youtube.com/watch?v=pHGVqJEBkyo); [J43d0-oGpGQ](https://www.youtube.com/watch?v=J43d0-oGpGQ).
- Engine facts already in the coach's notes (`docs/strategy-notes.md`, read from OpenFront `main` on 2026-10-26):
  - Troop cap is `2 × (tiles^0.6 × 1000 + 50,000)` plus 250k per city level.
  - Regen peaks at 42% of the cap.
  - Gold is a flat 100 per tick plus trade, trains and conquest.
  - Attack losses scale with `clamp(defender troops / your stack, 0.6, 2)`.
- v34 rebuilt attack losses around troop ratio and defender density, and capped the giant-empire speed bonus at ~3.3× (down from 9×) — [Update 34.0](https://openfront.wiki/Update_34.0).

### Inferences
**Transfers**
- **"Interest" becomes troop regeneration.** Territorial's red-balance peak (100/150 ≈ 67% of max) and OpenFront's regen peak (~42% of the cap) teach the same habit: don't sit at the cap, and launch attacks from the peak-growth point. Ex-Territorial players aiming for "about two-thirds full" will sit too high in OpenFront.
- **Need about 2× the defenders.** Same in both, and consistent with OpenFront's loss clamp.
- **Short borders and natural barriers.** Still valid. In OpenFront, mountains also slow your own expansion (terrain speed), and factories reward long shared borders with allies. So "short borders" now applies to hostile borders, not allied ones.
- **Keep a weak buffer neighbour.** This has evolved into OpenFront's "mitochondria" meta. The buffer is also an income source (trade and train stations), but it can grow and MIRV you (Rex).
- **Punish full sends; don't start fair fights.** Strongly echoed by Ash, Sinful73 and OpenFront Academy for public lobbies. Tournament pros add that passivity loses at the top level.

**Misleading**
- **"Attack once with a bigger %" to save fees.** OpenFront has no per-click fee, so the meta is small pulses into wilderness. Big sends against defended players are still efficient because of the loss clamp. Carrying fee logic across would steer players toward full-send openings.
- **"Your balance is your money."** OpenFront's gold doesn't depend on troops: it is a flat 100/tick plus trade, trains and kills. Banking troops doesn't earn gold, and Territorial's balance-only economy has no analogue to the build order (cities, then ports or factories).
- **Boats.** Territorial boats are expensive taxed transports with no wider role. OpenFront boats are central: sleeper-cell footholds, 1% exploration boats, port snipes, boat banking, plus a separate naval layer (trade ships, warship piracy) that Territorial lacks.
- **Ally support.** Territorial taxes ally support heavily, which teaches players not to support. OpenFront team games depend on frequent troop donations from backliners.
- **Win condition and diplomacy.** Territorial has no nukes, MIRV price ladder, alliance timers or traitor debuff, so mid and late-game OpenFront strategy (silo deterrence, alliance renewals, counter-MIRV gold) has no Territorial precedent.
- **WarFront's linear cap.** WarFront and Territorial tie the troop cap linearly to land. OpenFront's tiles^0.6 cap plus 250k per city means land adds less cap as you grow, while cities add a fixed amount. That is why every OpenFront creator puts "three cities first" ahead of grabbing more land, a priority that doesn't exist in either ancestor.

### Gaps
- I didn't find a current (2025–2026) Territorial.io community guide from a top Territorial player, nor any statement by OpenFront creators comparing the two games directly (beyond a FrontWars marketing page, not used).
- WarFront.io's live game rules beyond the client code weren't reviewed: attack-loss formula, terrain, buildings. Its repo is the 2024–2025 client, and I don't know how much of that design OpenFront kept.
- The Territorial.io tutorial is from July 2024; current Territorial numbers may differ.
