# Community written strategy for OpenFront.io (public FFA focus)

Research date: 2026-10-30. Current live version per openfront.fyi: v0.35.9 (v35.0 feature baseline released 2026-10-16). "Coach" below means the openFrontCoach advice in `docs/strategy-notes.md` and `src/analysis/moments.ts`. Each finding is tagged against the coach: **[coach: agrees]**, **[coach: conflicts]**, **[coach: partial]**, or **[coach: not covered]**.

Coach claims used for comparison (short IDs used in tags):
- C1: open with a full send, then 60–70% sends into unclaimed land, along two lanes. moments.ts flags average opening sends under 40% as the cause of a weak opening.
- C2: hold 35–50% of the cap on quiet borders and 50–70% under pressure. Above 80%, spend the troops.
- C3: first City in a safe interior spot as soon as you have 125k gold, by about 2:30.
- C4: trade routes should be 300+ tiles. Short routes are a mistake.
- C5: put a Defense Post on the border you expect to be hit or the strongest neighbour's border.
- C6: economy only before minute 3; Silo and SAM at minutes 3–5; SAMs from minute ~5; bank for a Hydrogen bomb at minutes 5–8.
- C7: send a stack at least ~1.7× the defender's whole army.
- C8: avoid two-front wars.
- C9: Hard and Impossible nations may betray an ally whose troops fall below ~20% of its cap.
- C10: mistakes are sitting at the cap, mid-game full sends, retreating, banking gold, two-front wars, short trade routes, big boats into warship patrols, and late SAMs.
- C11: send several small boats, not one big one, and escort landings.
- C12: betray only for an immediate payoff.

Notes on dating Reddit posts: reddit.com cannot be fetched with the available tools. WebFetch reports "unable to fetch from old.reddit.com", and WebSearch rejects reddit.com for its user agent. All Reddit findings come from Brave search-result excerpts, so they are fragments, not whole threads. Reddit dates are approximate and inferred from post IDs: `1hr5jfv` is the subreddit intro dated 2025-01-01, and `1x5wch8` is the Goodkat guide, which is also on Steam and dated Oct 2026. On that scale, 1k–1m ≈ Apr–Aug 2025, 1n–1p ≈ Sep–Dec 2025, 1q–1r ≈ Jan–Mar 2026, 1s–1t ≈ Apr–May 2026, 1v–1w ≈ Aug–Sep 2026, and 1x ≈ Oct 2026.

## Q1. What do current (2026) sources say is the strongest opening and early economy, and how does that differ from 2025 sources?

### Takeaway
Current 2026 sources agree on three things. Pace your expansion so the troop bar rides the ~42% regrowth peak, using repeated **20–40% clicks** rather than big sends. Treat Tribes (formerly "bots") as annex or encircle targets. Open with **City or Port/Factory → City → Port/Factory** chosen by the situation, not a timer.

Two changes since 2025 matter for the coach:
- **openfront.fyi, the coach's own cited source, now explicitly calls 60–70% "not a universal optimum."** It also says "City at 40 seconds is not a mechanic" and "minute five is a review point, not a nuke deadline."
- **v0.34.12 (Sep 2026) and v35 (Oct 2026) front-load Port/Factory income.** They speed up trade ships and trains for players with few Ports or Factories, so an early Port or Factory is now favoured over a 2025-style "cities first, ports later" plan.

### Cited Findings

#### Source register (who, when, which version, reliability)
- **openfront.fyi ("OpenFront Intel")** is a community fan site that is very source-code-driven. Every page carries a version, a "last verified" date and an editorial disclaimer. Its site baseline is v0.35.9, but most strategy pages are verified against v33 or v34 tags. It says its strategy text is "editorial interpretation, not game documentation" — [openfront.fyi strategies index](https://openfront.fyi/strategies/)
- **Goodkat, "Open Front: Ultimate Beginner's Guide"** (Steam guide plus an r/Openfront post, ~Oct 2026). This is the most detailed experienced-player guide found. It is written in the first person, gives keybinds and concrete numbers, and mentions the "Tribes" naming. Some numbers are wrong: it says "City +25,000" where the engine gives +250k, and "Ports 250k/500k/1M" where Ports actually share a ladder with Factories — [Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=3818657159); [Reddit cross-post](https://www.reddit.com/r/Openfront/comments/1x5wch8/open_front_ultimate_beginners_guide/)
- **on1kson, "OpenFront Beginner Guide: How to Win Your First Games"** (Steam, 2026, no date shown). Short and generic — [Steam](https://steamcommunity.com/sharedfiles/filedetails/?id=3806155862)
- **"twitch.tv/R3RE5", "How to win like R3RE5 does" / "The Ultimate Openfront Beginner & Strategy Guide"** (Steam, 2026, no date). Generic and probably AI-assisted: it mentions "Level 51 Silos" and claims regen is a % of current population. Low reliability — [Steam](https://steamcommunity.com/sharedfiles/filedetails/?id=3808336226)
- **Steam discussion "how do i avoid getting killed by sweats"**, a reply dated Feb 17 (2026) with a concrete opening recipe — [Steam discussion](https://steamcommunity.com/app/3560670/discussions/0/682992180338454079/)
- **openfrontwiki.wiki** (2026-09-22) and its "Reddit community guide" page are low reliability. They read as AI-generated: they mention "Workers" and a "troop-to-worker ratio", give no thread links, and say "Defense Posts absorb missiles" — [openfrontwiki explained](https://openfrontwiki.wiki/guide/explained/); [openfrontwiki reddit page](https://openfrontwiki.wiki/community/reddit/)
- **newgamewiki.wiki** (updated 2026-10-05) is an aggregator citing openfront.fyi, a Miraheze guide and YouTube — [newgamewiki](https://newgamewiki.wiki/openfront/strategy)
- **openfront.wiki/Buildings** gives figures "as of Update 34.0" — [openfront.wiki Buildings](https://openfront.wiki/Buildings/)
- GitHub Discussions are disabled on openfrontio/OpenFrontIO (checked via `gh api`). GitHub issues give a few player opinions on balance, cited below.

#### Spawn selection
- Judge spawns by usable features, not size. Check five things: a land route that doesn't cross another spawn, water access, a short front (neck, peninsula or strait), interior space for a City, and the ability to change direction. Check land exits first, coast second, front length third, and spawn density last. Pick a fallback before the timer gets urgent (openfront.fyi, published 2026-05-12, verified 2026-08-02, v33) — [FFA Spawn and Early Expansion](https://openfront.fyi/strategies/ffa-opening/) **[coach: partial — the coach says "open land on at least two sides"]**
- The spawn phase is about 15 s in multiplayer random-spawn lobbies and about 30 s with fixed spawn. Spawn immunity is 50 ticks (~5 s) for everyone — [openfront.fyi ffa-opening](https://openfront.fyi/strategies/ffa-opening/)
- Spawn on green plains with few players nearby and plenty of tribes and open ground, with water access (rivers count). **Spawn near the centre, not the edge.** Edges are easier to defend, but you trade less and grow slower, and a central hub gets more train connections (Goodkat, ~Oct 2026) — [Goodkat Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=3818657159) **[conflicts with openfront.fyi's preference for a short front or peninsula]**
- "Space from other players when spawning is top priority … The spawn is the single most important factor in winning games" (Steam reply, Feb 2026) — [Steam discussion](https://steamcommunity.com/app/3560670/discussions/0/682992180338454079/)
- "I usually try to locate an area where there aren't too many bots, and then I spawn right next to one of them (rather than in the middle of that area): less expansion for that bot means more for me" (r/Openfront "How to win early game??", ~Feb 2026, excerpt) — [Reddit](https://www.reddit.com/r/Openfront/comments/1qx4a1u/how_to_win_early_game/)
- "Don't box yourself in a corner. Don't be scared of early fights … you need an avenue of expansion all the time" (r/Openfront "How do you choose a good spawn?", ~Sep 2025, excerpt) — [Reddit](https://www.reddit.com/r/Openfront/comments/1nrl7iu/how_do_you_choose_a_good_spawn/)
- "Spawn at a place where there are mountains under you but plains next to you … important to spawn close to water" (r/Openfront, ~Apr 2025, excerpt; old) — [Reddit](https://www.reddit.com/r/Openfront/comments/1jpi8x0/my_tactic_for_openfront_multiplayer_games/)
- "Pick your spawn quick and go for big open green areas before rocky hilly terrain" (r/Openfront, ~Oct 2025, excerpt) — [Reddit](https://www.reddit.com/r/Openfront/comments/1o7eyyl/best_start_how_to_get_started/). A 2026 beginner video is summarised by a search engine as "spawning first makes other players avoid you." I could not verify this because the YouTube page had no readable content — [YouTube "OpenFront Beginner Guide (2026)"](https://www.youtube.com/watch?v=7J5zwb_s_Cg)
- "Make sure you have positions everywhere on the map … this is why your pixels from the start of the game are so important" (r/Openfront "Simple guide on how to win", ~Aug 2026, excerpt) — [Reddit](https://www.reddit.com/r/Openfront/comments/1vjvm8p/simple_guide_on_how_to_win/)

#### Opening expansion and attack ratio
- **Goodkat (~Oct 2026):** do not attack players, nations or tribes at the start; take wilderness first. Use a 20% slider. Click at 4k troops, then 5.5k, 7k, 8.5k and so on, "to ensure your troop count is close to 42% of your max troop cap". Send boats at a **1%** slider, because any landing pixel gives you a foothold. Once wilderness is gone, use a 40% slider and wait for 20–25k troops before hitting tribes one at a time. Go back to 20% when the tribes are done — [Goodkat](https://steamcommunity.com/sharedfiles/filedetails/?id=3818657159) **[coach: conflicts with C1]**
- **Steam reply (Feb 2026):** "Use 30%ish percent attacks … 30% at 5k, then 7k, then 9k, then 12k, i keep on attacking at 12k." Hit bots at 30–40% of total troops; "you can over attack but never underattack" — [Steam discussion](https://steamcommunity.com/app/3560670/discussions/0/682992180338454079/) **[coach: conflicts with C1]**
- **r/Openfront "Any tips for beginners?" (~Apr 2026, excerpt):** "Send a 25% attack instantly at the start of the game. Wait till 6k, then send a 25% 8k, 25% 12k 25% and repeat 12k until all…" — [Reddit](https://www.reddit.com/r/Openfront/comments/1sewfo1/any_tips_for_beginners/) **[coach: conflicts with C1]**
- **r/Openfront "How to win early game??" (~Feb 2026, excerpt):** "Attack ratio (AR) of 20%, just the tap frequency changes." Expand into wilderness more slowly when neighbours heavily outnumber you — [Reddit](https://www.reddit.com/r/Openfront/comments/1qx4a1u/how_to_win_early_game/)
- **r/Openfront "My best strategy" (~Feb 2026, excerpts):** go from a 20% ratio to 46–50%. A commenter adds "50% is fine for first couple bots … After bot 1 or 2 you should be at like 30%" — [Reddit](https://www.reddit.com/r/Openfront/comments/1qt4cz8/my_best_strategy_in_openfrontio/)
- **r/Openfront "Why do others always have more troops than me?" (~Apr 2026, excerpt):** "most people have indicated early sends of 30–35% are most efficient, sending out every few seconds. 'Constant clicks' may mean you are sending too often" — [Reddit](https://www.reddit.com/r/Openfront/comments/1s91bv9/why_do_others_always_have_more_troops_than_me/)
- **r/Openfront "Why am I so bad at early-game?" (~May 2026, excerpt):** "20% for open land, 10% for transports and 30% for bots." Another reply says to pick an opening from a video and copy its timing — [Reddit](https://www.reddit.com/r/Openfront/comments/1tjpyx5/why_am_i_so_bad_at_earlygame/)
- **on1kson (Steam, 2026):** when the troop-growth number turns orange (past the sweet spot), attack with about 40% — [on1kson](https://steamcommunity.com/sharedfiles/filedetails/?id=3806155862)
- **R3RE5 (Steam, 2026):** keep the slider at 20–35% during early expansion. "Never use 100% unless … final elimination strike" — [R3RE5](https://steamcommunity.com/sharedfiles/filedetails/?id=3808336226) **[coach: conflicts with C1]**
- **openfront.fyi Attack Ratio (2026-09-21, v34):** the only source that endorses the opening full send. It reserves 100% for "the opening full-send at match start, when nobody has a real army yet" and for endgame kill pushes. It suggests about 50% for an early free land grab but says "the percentage barely matters there". Routine land against weaker neighbours takes 25–40%. Other full sends are "a coin flip" — [openfront.fyi attack-ratio](https://openfront.fyi/guides/attack-ratio/) **[coach: agrees on the first-click full send only]**
- **openfront.fyi FFA opening (v33, verified 2026-08-02):** 60–70% is "a first-match beginner default … not a universal optimum". Lower it when a neighbour can counterattack, and avoid repeated maximum commits — [ffa-opening](https://openfront.fyi/strategies/ffa-opening/). The newer first-match guide (verified 2026-10-26, v35) drops any fixed number: "The fallback is 20%"; don't copy a permanent number from another player — [first-match](https://openfront.fyi/guides/first-match/) **[coach: conflicts — the coach cites this site for 60–70%]**
- **openfront.fyi guides index:** "keep your frontier moving while your army sits near 40–45% of its troop cap, and only switch from wildlands to bots to players once the growth peak is spent" — [openfront.fyi guides](https://openfront.fyi/guides/)
- **openfrontpro.com:** "50% during early bot engagements and transition to 20–30% against human players and fortified opponents" (date and version unknown) — [openfrontpro attack ratio](https://openfrontpro.com/mechanics/attack-ratio/)
- **2025 sources, for comparison:**
  - "Send 20% of troops right away … then … 35% and expand every time you get 40% of your population (like 6k, 8k, 10k checkpoints)" (~Jul 2025) — [Reddit](https://www.reddit.com/r/Openfront/comments/1lxfi5c/heres_my_guide_for_beginners_whats_missing_tried/)
  - "20% attack for claiming wilderness, wait until you get 5k pops, and then attack every 1k pops after that … Once you've claimed all the wilderness, I go up to 50%" (~Aug 2025) — [Reddit](https://www.reddit.com/r/Openfront/comments/1mdm0q2/how_does_combat_work_eli5_please/)
  - "40% for initial wilderness expansion … bots with about 25–30% … players … 60% if I can overwhelm them … or 25–40%" (~Nov 2025) — [Reddit](https://www.reddit.com/r/Openfront/comments/1p0my6s/what_attack_ratio_do_you_guys_use/)
  - "Set your attack percentage to 10% at the start and click every few seconds" (~May 2025) — [Reddit](https://www.reddit.com/r/Openfront/comments/1ktzmp1/i_dont_understand_this_game_at_all/)
  - "Don't push with more than 10–20% unless someone full sends" (~May 2025) — [Reddit](https://www.reddit.com/r/Openfront/comments/1kma1cw/how_do_people_grow_such_fast_pop_at_the_beginning/)
  - "Learn this curve and you'll out grow players who 80%+ attacks all the time" (~Sep 2025) — [Reddit "Riding the Growth Curve"](https://www.reddit.com/r/Openfront/comments/1ns6jnt/new_player_guide_riding_the_growth_curve/)
- **Encircle and annex:** surrounding a tribe so it touches no water, map edge, other player or other tribe annexes it instantly with no casualties. "Treat every start as a puzzle you can solve for maximum annexations" (Goodkat, ~Oct 2026) — [Goodkat](https://steamcommunity.com/sharedfiles/filedetails/?id=3818657159). on1kson says the same applies to any opponent, including nations and players — [on1kson](https://steamcommunity.com/sharedfiles/filedetails/?id=3806155862); R3RE5 agrees — [R3RE5](https://steamcommunity.com/sharedfiles/filedetails/?id=3808336226) **[coach: not covered]**
- **openfront.fyi opening timeline (v33):**
  - 0:00–0:05: claim the first ring toward your main lane.
  - 0:05–0:30: watch who approaches, and shorten a shared edge rather than racing tile for tile.
  - 0:30–1:00: prepare a City if the cap is limiting, or a Defense Post on a narrow active front.
  - 1:00–2:00: place the City in protected interior, a Defense Post on the attackers' route, and a Port only if it is defensible.
  - "Building from a memorized timer ('City at 40 seconds' is not a mechanic)" is listed as a mistake — [ffa-opening](https://openfront.fyi/strategies/ffa-opening/)
- **Lanes:** in the first 60 s, pick one primary lane, one secondary lane and one boundary to avoid. "Fill space beside your core rather than projecting narrow fingers outward" (openfront.fyi first-match, v35) — [first-match](https://openfront.fyi/guides/first-match/) **[coach: agrees with "two lanes"]**. "Three unfinished corridors create three weak borders" — [ffa-opening](https://openfront.fyi/strategies/ffa-opening/)

#### Troop management
- **The "42% rule"** appears in almost every 2025–2026 player source: troop growth is fastest near 42% of the cap.
  - Goodkat (~Oct 2026): keep troops between **30–60%** of the cap, **never below 10%** (the "death zone"), and after sending, keep at least **25% of the cap** at home — [Goodkat](https://steamcommunity.com/sharedfiles/filedetails/?id=3818657159)
  - Reddit (~Oct 2025): "ride the 42% population wave" — [Reddit](https://www.reddit.com/r/Openfront/comments/1o3ka48/are_there_any_good_strategy_guides_for_beginners/)
  - on1kson (2026) — [on1kson](https://steamcommunity.com/sharedfiles/filedetails/?id=3806155862)
  - openfrontwiki puts the peak at "~41%" — [openfrontwiki](https://openfrontwiki.wiki/guide/explained/)
  - **[coach: agrees with C2's 35–50% band]**
- R3RE5 (2026): "Maintain at least 40%–50% of your max population in reserve to deter opportunistic neighbors" — [R3RE5](https://steamcommunity.com/sharedfiles/filedetails/?id=3808336226) **[coach: agrees]**
- openfront.fyi Outgunned Defense (2026-10-07, v34.24): "Hold while your bar stays around 40–55%." If the bar falls below the peak and keeps falling, fall back — [outgunned-defense](https://openfront.fyi/guides/outgunned-defense/) **[coach: agrees]**
- The newest openfront.fyi first-match guide (v35) deliberately gives "no percentage reserve target". Keep a reserve that recovers between attacks, and "stop expanding when the next border needs more defense than you can keep at home" — [first-match](https://openfront.fyi/guides/first-match/)

#### Economy and build order (City vs Port vs Factory)
- **Goodkat (~Oct 2026):** "City – Factory (or Port) – City – Factory – City. Make sure to build your first city as soon as you have 125k gold!" He suggests new players learn **Factory builds first**. Early game has "a lot of piracy (since there's few alliances)", so start with factories. Ports matter more mid and late game: "during late game, your economy will typically rely almost entirely on port trade" — [Goodkat](https://steamcommunity.com/sharedfiles/filedetails/?id=3818657159) **[coach: agrees on C3 timing, partial on emphasis]**
- **on1kson (2026):** "City ➔ Port (or Factory) ➔ City ➔ Port (or Factory) ➔ City." It calls Ports the "strongest economic building" and Factories the option for landlocked players — [on1kson](https://steamcommunity.com/sharedfiles/filedetails/?id=3806155862)
- **R3RE5 (2026):** City first, then Port or Factory. Spam Cities "whenever land is secure" — [R3RE5](https://steamcommunity.com/sharedfiles/filedetails/?id=3808336226)
- **Steam reply (Feb 2026):** "GET A CITY FIRST... ALWAYS." For trade versus population, aim for something like 12 cities : 4 factories : 6 ports, "ideally 1 city to 2 money making towers" — [Steam discussion](https://steamcommunity.com/app/3560670/discussions/0/682992180338454079/)
- **r/Openfront "Any tips for beginners?" (~Apr 2026, excerpt):** "the first thing you build is a Port, then a City, then a Warship" — [Reddit](https://www.reddit.com/r/Openfront/comments/1sewfo1/any_tips_for_beginners/) **[coach: conflicts with C3]**
- **r/Openfront "Simple guide on how to win" (~Aug 2026, excerpt):** "my build strat is rush port near another player (so it will hopefully connect to a rail system) … So usually I do Port, City, Factory" — [Reddit](https://www.reddit.com/r/Openfront/comments/1vjvm8p/simple_guide_on_how_to_win/) **[coach: conflicts with C3]**
- **r/Openfront "Optimal Structure Build Order" (~Sep 2025, excerpt):** "If you need to survive then cities are better, but long term you need ports … ideally 3 cities first if you can afford it" — [Reddit](https://www.reddit.com/r/Openfront/comments/1ncvzyo/optimal_structure_build_order/)
- **r/Openfront "So you got addicted…" (~Oct 2025, excerpt):** "I get a port, second city, and a second port since railways are only worthwhile later." This 2025 view, that trains only pay later, has been overtaken by 2026 Factory-first advice and the v35 early-economy boost — [Reddit](https://www.reddit.com/r/Openfront/comments/1nx2yer/so_you_got_addicted_to_openfront_but_keep_losing/)
- **openfront.fyi Economy Fundamentals (2026-05-23, verified 2026-09-16, v33):** "There is no fixed build order." Build a City when the troop cap limits growth, and choose a Port or Factory as the first income node. "Minute five is a review point, not a nuke deadline. Don't follow a rigid 'Silo plus SAM by minute five' rule" — [economy-fundamentals](https://openfront.fyi/strategies/economy-fundamentals/) **[coach: conflicts with C6 as a fixed timer]**
- **openfront.fyi Building Timing (2026-08-23, v0.33.9):** "Don't build from a timer." Build a City when the army often sits near its maximum. "If your army is at or below half the maximum, the cap probably isn't the problem." It lists "buying a City to refill a small army" as a mistake — [building-timing](https://openfront.fyi/guides/building-timing/) **[coach: partial conflict with C3, which is "as soon as you have 125k"]**
- **openfront.fyi Structures page (v35 snapshot):** "Priority: 1st City > Port > 2nd City > DefensePost > 3rd City > Missile Silo"; after the 3rd City, upgrade instead — [mechanics/structures](https://openfront.fyi/mechanics/structures/). This contradicts the same site's "no fixed build order" pages.
- **openfront.wiki (v34.0):** Cities are "usually the first thing to build" — [openfront.wiki Buildings](https://openfront.wiki/Buildings/)
- **openfront.best (undated):** "a common opening order is City, Port, then Factory." Buying a Factory first raises the Port's price. Place a Factory within ~110 tiles of a City or Port and keep rail hops under ~155.6 tiles — [openfront.best factory strategy](https://openfront.best/openfront-factory-strategy/)
- **Patch-driven change, v0.34.12 (2026-09-20):** trade-ship spawn rates rose by up to +119% at about 300 global ships and train spawns by up to +37% at about 700 trains. openfront.fyi's advice: "do not defer your first Port to the late game". Buy the Port at 125k when the fleet is in the 150–400 ship window and a trade destination exists. Buy the Factory later, once a rail network reaches several cities (published 2026-09-22) — [frontload-port-factory-investment](https://openfront.fyi/guides/frontload-port-factory-investment/)
- **Patch-driven change, v35.0 (2026-10-16):** "Players with few Ports or Factories get Trade Ships and Trains faster … roughly eight seconds instead of twelve" for a one-Port player; "The boost fades out by six building levels." Its strategy note: "Use the early building boost for your first working Port or Factory" — [changelog v35](https://openfront.fyi/changelog/v35/) **[coach: not covered]**
- **Trains in public lobbies:** openfront.fyi Economy Fundamentals still says trains are "documented for single-player and private lobbies (v24 reference)". The same caveat appears on openfront.best — [economy-fundamentals](https://openfront.fyi/strategies/economy-fundamentals/). This conflicts with 2026 player guides that treat Factory/train builds as standard in public games (Goodkat, Reddit ~Aug 2026) and with v35 release notes that boost trains for all players — [Goodkat](https://steamcommunity.com/sharedfiles/filedetails/?id=3818657159); [changelog v35](https://openfront.fyi/changelog/v35/)
- **Train income (Goodkat, ~Oct 2026):** a train entering your own City pays 10k, another player's 25k, an ally's 35k, and both sides get paid. "Look for players that already have a factory and try to connect to them … turn your base into a hub where rail networks from many other players intersect." Don't stack cities or factories early: stacked cities count as one stop, and stacked factories spawn fewer trains — [Goodkat](https://steamcommunity.com/sharedfiles/filedetails/?id=3818657159). openfront.fyi gives the same 10k/25k/35k figures, minus 5k per visit after nine cities with a 5k floor — [frontload guide](https://openfront.fyi/guides/frontload-port-factory-investment/)
- **"Factories to cities ratio" (~Nov 2025, excerpt):** "There's not really a ratio … You have the first cities/ports, you build a factory around it" — [Reddit](https://www.reddit.com/r/Openfront/comments/1p7xr7m/factories_to_cities_ratio/). openfront.fyi: build the first Factory when a rail line can carry trains and the second when the line is crowded, "then stop" — [how-many-factories (search excerpt)](https://openfront.fyi/guides/how-many-factories/)
- **Trade-route length (C4):**
  - openfront.fyi Economy Fundamentals uses the v32 curve. At distance 100 a route pays ≈5,185 per arrival, at 300 it pays 52,500, and at 600 it pays ≈104,991, so short routes are poor — [economy-fundamentals](https://openfront.fyi/strategies/economy-fundamentals/) **[coach: agrees with C4]**
  - The newer v0.34.12 page says arrivals pay roughly **82k on a short route to 100k on a long one**, with a "debuff" term replacing the fixed 300 — [frontload guide](https://openfront.fyi/guides/frontload-port-factory-investment/)
  - These two openfront.fyi pages disagree. If the newer one is right, the coach's "300+ tiles" rule is outdated. Engine check needed.
- **Don't hoard gold:** "Never sit on millions of idle gold—invest it immediately" (on1kson) — [on1kson](https://steamcommunity.com/sharedfiles/filedetails/?id=3806155862) **[coach: agrees with C10]**. openfront.fyi is more nuanced: "If no structure removes the current constraint, keep Gold liquid" — [ffa-opening](https://openfront.fyi/strategies/ffa-opening/). Goodkat says mid-game players should keep **5M on hand for a Hydrogen bomb** as deterrence (see Q2) **[coach: partial conflict with "banking gold" as a mistake]**

### Inferences
- The coach's opening advice (C1) is the main mismatch with the current community. It suggests a 100% first click, then 60–70% sends, and flags average opening sends under 40% as a mistake. 2026 player guides open with **20–40% clicks timed to troop thresholds** (for example 4k → 5.5k → 7k → 8.5k, or 5k → 7k → 9k → 12k). Two of these guides explicitly warn against the 80%+ habit. The coach could be penalising the correct behaviour.
- Most 2026 sources accept "City first", but the timer framing ("by 2:30") is out of step. openfront.fyi now frames the City as a fix for a binding troop cap. 2026 Reddit posts show a real Port-first and Factory-first school, and v34.12 and v35 strengthen early Port/Factory income. The coach should probably judge "first income node by X" alongside "first City".
- Two of the coach's three main sources (openfront.fyi ffa-opening and economy pages) have rewritten their own numeric rules into "review points". The coach is quoting a 2025-era reading of those pages.

### Gaps
- No primary Reddit thread text could be read, only search excerpts. The full Port-first versus City-first arguments in r/Openfront threads (for example "Optimal Structure Build Order" and "Simple guide on how to win") could not be checked.
- No source gives measured win rates for different openings. Every recommendation is opinion or a formula reading.
- I couldn't confirm whether trains run in public FFA in v35. openfront.fyi Economy Fundamentals says private and single-player only, while player guides and release notes imply public play. Check the engine config.
- The YouTube 2026 beginner guide and the "How to Dominate the Early Game" video could not be watched or transcribed.

## Q2. Where do experienced players disagree (City-first vs Port-first, aggression vs turtling, when to nuke, and other topics)?

### Takeaway
The main splits are these:
- **First building:** City first (most guides) versus Port or Factory first (several 2026 Reddit posters, plus the v34.12 and v35 economics).
- **Full sends:** only openfront.fyi endorses the opening full send. Players widely call full sends a mistake, or "toxic" against other players.
- **Allying Nations:** Goodkat says never ally them, while GitHub players say you're effectively forced to.
- **SAM timing:** "avoid SAMs early, 2–4 SAMs mid-game" versus "as soon as a neighbour builds a Silo".
- **Defense Posts:** "don't build unless you need them" versus "spam them under siege".
- **Nukes:** they are central to mid-game diplomacy. Keeping 5M (a hydro) on hand is a widely shared norm that conflicts with the coach's "banking gold is a mistake".

### Cited Findings

#### City-first vs Port/Factory-first
- City first: Goodkat (~Oct 2026), on1kson (2026), R3RE5 (2026), Steam reply (Feb 2026, "ALWAYS"), openfront.wiki (v34) and openfront.fyi Structures — [Goodkat](https://steamcommunity.com/sharedfiles/filedetails/?id=3818657159); [on1kson](https://steamcommunity.com/sharedfiles/filedetails/?id=3806155862); [R3RE5](https://steamcommunity.com/sharedfiles/filedetails/?id=3808336226); [Steam discussion](https://steamcommunity.com/app/3560670/discussions/0/682992180338454079/); [openfront.wiki](https://openfront.wiki/Buildings/); [openfront.fyi structures](https://openfront.fyi/mechanics/structures/)
- Port first: r/Openfront (~Apr 2026) "Port, then a City, then a Warship"; r/Openfront (~Aug 2026) "Port, City, Factory", placing the port near another player to catch rail — [Reddit 1sewfo1](https://www.reddit.com/r/Openfront/comments/1sewfo1/any_tips_for_beginners/); [Reddit 1vjvm8p](https://www.reddit.com/r/Openfront/comments/1vjvm8p/simple_guide_on_how_to_win/)
- Situational: openfront.fyi Economy Fundamentals and Building Timing say there is no fixed order; build a City when capped and a Port when a real route exists — [economy-fundamentals](https://openfront.fyi/strategies/economy-fundamentals/); [building-timing](https://openfront.fyi/guides/building-timing/)
- Factory versus Port as the first income node:
  - Goodkat: Factory first because of early piracy.
  - on1kson: Port is "strongest".
  - openfront.fyi v34.12: Port first, Factory later.
  - openfront.best: the City → Port → Factory order matters because of the shared ladder.
  - Sources: [Goodkat](https://steamcommunity.com/sharedfiles/filedetails/?id=3818657159); [on1kson](https://steamcommunity.com/sharedfiles/filedetails/?id=3806155862); [frontload guide](https://openfront.fyi/guides/frontload-port-factory-investment/); [openfront.best](https://openfront.best/openfront-factory-strategy/)

#### Full sends and aggression vs turtling
- Against full sends:
  - "never full send … that'll ruin your game and the other players, toxic behavior and useless" (~Mar 2026, excerpt) — [Reddit](https://www.reddit.com/r/Openfront/comments/1rphnc5/i_learned_about_this_game_through_a_youtube_video/)
  - "full sends in the game are kinda broken, it either screws u both over if there are other players" (~May 2025, excerpt) — [Reddit](https://www.reddit.com/r/Openfront/comments/1kmggrv/attack_ratio/)
  - "don't attack with 100% of your population" (~Jul 2025, excerpt) — [Reddit](https://www.reddit.com/r/Openfront/comments/1mbgxi0/what_would_be_the_best_advice_you_could_give_to_a/)
- For full sends:
  - "ally everyone, see who accepts … eat some bots, full send the player(s) who didn't accept your alliance (ratio=80) before they finished eating bots" (~May 2025, excerpt) — [Reddit](https://www.reddit.com/r/Openfront/comments/1knz3bu/random_questions/)
  - openfront.fyi says 40–100% into "an exposed front vs. a distracted player", with 100% only in the opening and in endgame kill pushes — [attack-ratio](https://openfront.fyi/guides/attack-ratio/) **[coach: agrees with "hit players already fighting someone else"]**
- Goodkat on player attacks: "keep your troop slider at 20%. Feel free to click the enemy 3, 4 or even 5 times … one big, overwhelming wave … Avoid small, incremental attacks." Fight fast, then "conquer your enemy completely or take what you can and offer an alliance" — [Goodkat](https://steamcommunity.com/sharedfiles/filedetails/?id=3818657159)
- "you need to be very aggressive in the early game and then basically totally passive in the late game" (~Aug 2025, excerpt) — [Reddit](https://www.reddit.com/r/Openfront/comments/1mhavxp/i_do_not_get_how_you_guys_manage_to_win/)
- Tall versus wide: openfrontwiki says play "tall" to deter betrayal, but the source is low reliability — [openfrontwiki reddit page](https://openfrontwiki.wiki/community/reddit/). openfront.fyi has a separate tall-vs-wide guide that I did not read — [tall-vs-wide](https://openfront.fyi/guides/tall-vs-wide/)

#### Stack-size rules (C7)
- Goodkat: target players with at least 30% fewer defending troops than you, "ideally … double". Avoid targets with a much higher max troop cap, because they "out-regenerate you". His example: don't attack a 100k/500k-cap player with 175k/200k — [Goodkat](https://steamcommunity.com/sharedfiles/filedetails/?id=3818657159)
- openfront.fyi Attack Ratio (v34.11): the loss multiplier is clamped to 0.6–2. Being "outnumbered by more than 1.67:1 costs the same per-tile loss as a 0.6 ratio", and full speed comes at a ratio of 0.82 or lower (about 1.22× the defender). It calls the "2× rule" a rule of thumb — [attack-ratio](https://openfront.fyi/guides/attack-ratio/) **[coach: agrees — 1.7× is the point where losses stop improving]**
- openfront.fyi Outgunned Defense: "Believing 'two times their troops' makes you safe from attack" is a mistake, because a 3:1 push hits the same floors as 2:1 — [outgunned-defense](https://openfront.fyi/guides/outgunned-defense/)
- Goodkat says the attack-speed bonus maxes at "120% more attacking troops than defending" (2.2×). Territory size gives "by far the biggest attack speed bonus" — [Goodkat](https://steamcommunity.com/sharedfiles/filedetails/?id=3818657159). **This conflicts with** openfront.fyi's full speed at ~1.22× — [attack-ratio](https://openfront.fyi/guides/attack-ratio/)
- Several sources treat about 2:1 as the community norm: [openfrontwiki](https://openfrontwiki.wiki/guide/explained/); [newgamewiki](https://newgamewiki.wiki/openfront/strategy)

#### Retreating (C10)
- Goodkat: cancelling costs 25% of troops, "but this is often necessary. You will often have to stop an attack in order to have enough troops to defend" — [Goodkat](https://steamcommunity.com/sharedfiles/filedetails/?id=3818657159) **[coach: conflicts with treating retreat as a mistake]**
- openfront.fyi Recovery Playbook: "Retreat is a loss-control tool, not a reset button." There is no penalty against unclaimed land (Terra Nullius) or if the two sides ally mid-attack. 25% of *surviving* troops is lost — [recovery-playbook](https://openfront.fyi/strategies/recovery-playbook/)
- openfront.fyi Diplomacy: accepting an alliance mid-attack recalls the attack with no retreat penalty — [diplomacy-betrayal](https://openfront.fyi/strategies/diplomacy-betrayal/)

#### Defense Posts (C5)
- Goodkat: when a bigger player attacks, "the correct thing to do is build Defense posts". Send only small amounts to slow them while posts build. Posts don't stack, so build rows. "Always try to place Defense posts in mountains … Two or three well placed Defense posts in mountains can stop a player whose current troops are twice yours." Build one or two before a fight to deter, but "don't build Defense posts unless you really need them" — [Goodkat](https://steamcommunity.com/sharedfiles/filedetails/?id=3818657159) **[coach: partial — agrees on pre-placing on the threatened border]**
- R3RE5: "spamming Defense Posts is far more cost-effective than building Cities" under pressure, and posts should be layered "directly behind the frontline" — [R3RE5](https://steamcommunity.com/sharedfiles/filedetails/?id=3808336226)
- openfront.fyi: place the post slightly behind the front so the battle stays in its 30-tile range. Overlapping posts don't stack, and an unfinished post gives no defence. Don't buy one for every quiet border — [building-timing](https://openfront.fyi/guides/building-timing/). Place it on "the route attackers must cross" — [ffa-opening](https://openfront.fyi/strategies/ffa-opening/)
- Effect figures: attacker losses ×5 and speed ÷3 within 30 tiles (openfront.wiki v34; openfront.fyi). The older Miraheze guide says 40 tiles and ×6 — [openfront.wiki](https://openfront.wiki/Buildings/); [newgamewiki citing both](https://newgamewiki.wiki/openfront/strategy)
- Captured land destroys Defense Posts, while Silos, SAMs and Cities transfer to the captor — [nuclear-deterrence](https://openfront.fyi/strategies/nuclear-deterrence/)

#### Diplomacy with humans
- Goodkat:
  - Early on, ally most neighbours but "do NOT over-ally. If you ally everyone, you'll have no one to attack."
  - Ally stronger players and attack weaker ones.
  - Send alliance requests to your future neighbours *before* attacking.
  - Renew on time, because a lapsed alliance looks like an attack signal.
  - "In early game, betrayal is almost certain death … In late game, betrayal is commonplace and is often necessary to secure victory."
  - Spot a likely betrayer by their neighbours: "If player has no other neighbors except you – expect a betrayal."
  - [Goodkat](https://steamcommunity.com/sharedfiles/filedetails/?id=3818657159) **[coach: partial agreement with C12]**
- "Don't over ally – only ally threats or early game when u wanna take bots" (~Feb 2026, excerpt) — [Reddit](https://www.reddit.com/r/Openfront/comments/1qwiace/help_me_to_understand_how_to_win/)
- Target "players with very few alliances but with many neighbors" (~Aug 2026, excerpt) — [Reddit](https://www.reddit.com/r/Openfront/comments/1vjvm8p/simple_guide_on_how_to_win/)
- "If you see them not renewing the alliance send them the nuke emoji to signal you have money for nukes" (~Apr 2026, excerpt) — [Reddit](https://www.reddit.com/r/Openfront/comments/1sewfo1/any_tips_for_beginners/)
- Betray only with 1.5–2× their troops (on1kson; newgamewiki) — [on1kson](https://steamcommunity.com/sharedfiles/filedetails/?id=3806155862); [newgamewiki](https://newgamewiki.wiki/openfront/strategy)
- Mechanics (openfront.fyi, v0.33.7, 2026-08-22):
  - Requests last 20 s.
  - Renewal needs both players to approve in the final 30 s and gives a fresh 300 s.
  - Natural expiry is not betrayal.
  - The traitor window is 30 s. Attackers against a traitor take a 0.5 loss multiplier and a 0.8 tile cost.
  - A normal attack places a ~5-minute temporary embargo.
  - A nuke breaks an alliance if it hits more than 100 weighted allied tiles or destroys an allied structure.
  - [diplomacy-betrayal](https://openfront.fyi/strategies/diplomacy-betrayal/)

#### Diplomacy with Nations (C9)
- Goodkat (~Oct 2026): "*Do NOT ally Nation bots* (unless you're really desperate). Nation bots are your primary target during early game." Attack one only if you can finish it, because a nation keeps attacking once a fight starts. "Wait for them to send their troops somewhere … then attack them with a big send." Nations "target players with lowest troop count" — [Goodkat](https://steamcommunity.com/sharedfiles/filedetails/?id=3818657159)
- GitHub issue #4650 (2026-07-20, auto-closed): "Nations will repeatedly attack the player even if the player is larger … hit you with 20k every 30s … It's lame to be forced to ally every nation who could access you just to avoid instantly losing 50% of your games" — [GitHub #4650](https://github.com/openfrontio/OpenFrontIO/issues/4650)
- GitHub issue #5969 (2026-10-16, after the v35 nation changes): "There is barely any incentive to ally them (in standard FFA at least), so early game always plays the same way" — [GitHub #5969](https://github.com/openfrontio/OpenFrontIO/issues/5969)
- v35.0 (2026-10-16) nations:
  - They save later, fortify borders before attacking, defend against landings and respond to attacks.
  - Hard and Impossible nations send **1% beachhead boats** before land attacks.
  - In FFA they can gang up on a runaway leader.
  - v35.3 (2026-10-23): Hard and Impossible nations "stop refusing every renewal in small games."
  - [changelog v35](https://openfront.fyi/changelog/v35/)
- openfront.fyi Nation Pressure (v34.0-beta1, 2026-09-11):
  - Hard and Impossible nations pick "juicy" targets only among bordering enemies with **≤75% of the nation's troops**.
  - A rival **below 15% of its own max troops** counts as "very weak".
  - A player receiving attacks larger than half its troops counts as a "victim".
  - Nations keep a 30–39% reserve.
  - Don't attack a nation "to keep it busy".
  - [nations-pressure](https://openfront.fyi/guides/nations-pressure/)
  - **[coach: C9's "betray below ~20% of cap" did not appear in any current source; the closest is the 15% "very weak" rule]**

#### Naval play (C11)
- Goodkat:
  - Send boats at a **1% slider**, because any landing gives a foothold.
  - Keep "at least one warship guarding your coastline and rivers".
  - Warships pirate non-allied trade ships, which "can get you insane amounts of gold" early, but "piracy will anger a lot of players" later.
  - Shift-click to group warships.
  - [Goodkat](https://steamcommunity.com/sharedfiles/filedetails/?id=3818657159) **[coach: partial — the coach advises several smaller boats, Goodkat advises 1% boats]**
- r/Openfront (~May 2026): "10% for transports" — [Reddit](https://www.reddit.com/r/Openfront/comments/1tjpyx5/why_am_i_so_bad_at_earlygame/)
- openfront.fyi Warship Fleet Decisions (v34.11, 2026-09-19):
  - Buy a warship only with a Port, a lane with real traffic, and a named threat.
  - Anchor beside the gold lane, within heal range of a Port.
  - Transports are the top target.
  - Costs are 250k, 500k, 750k, then 1M.
  - "An idle ship on an empty bay wastes 250,000 gold."
  - [warship-fleet-decisions](https://openfront.fyi/guides/warship-fleet-decisions/)
- Older Miraheze trick: "Finish with a 1% boat followed immediately by a 45% ground attack while he's looking at the sea" (undated) — [Miraheze Combat](https://openfront.miraheze.org/wiki/Combat)

#### Nukes, Silos and SAMs (C6)
- Goodkat (~Oct 2026):
  - Avoid SAMs early, because "a single SAM can be easily destroyed by launching two Atom bombs". Build 2–4 SAMs mid-game.
  - Build a Silo "once your cities and factories cost 1 million", or when a neighbour builds one. Then always keep two Silos in different places.
  - Use Atom bombs offensively early: hit enemy Silos first if there are 3 or fewer, then Defense Posts, then cities. An Atom on empty land can cut about 20k troops.
  - "Once you reach mid game it is critical to have 5 million gold on hand so you can launch a hydro at any time … if you're poor … even weaker players will attempt to launch a hydro at you."
  - Open attacks with a hydro, even into empty land, to halve the defender's troops.
  - Late game revolves around stockpiling for a MIRV (25M, plus 15M per launch) and keeping a counter-MIRV reserve.
  - Stacking 5 SAMs gives more range than a hydro radius.
  - [Goodkat](https://steamcommunity.com/sharedfiles/filedetails/?id=3818657159) **[coach: conflicts with SAMs from minute ~5 and with "banking gold is a mistake"; agrees with "bank for hydro"]**
- Steam reply (Feb 2026): "When you notice others start to save money into the millions, start saving immediately … at least 5 mil for a hydro … 25 mil for a mirv … ideally you will be the first" — [Steam discussion](https://steamcommunity.com/app/3560670/discussions/0/682992180338454079/)
- r/Openfront (~Feb 2026): "watch your gold count … if one player has gold for a hydro you should have enough" — [Reddit](https://www.reddit.com/r/Openfront/comments/1qwiace/help_me_to_understand_how_to_win/)
- r/Openfront (~Apr 2026): the "bunker" meta is to boat to a small island and stack SAMs, cities, ports and Silos, because it survives a MIRV. It is late-game only, "as bunkers are expensive" — [Reddit](https://www.reddit.com/r/Openfront/comments/1s7r6pj/open_front_guide/)
- Steam feedback thread: "The key to winning is just building and stacking SAMs. Cause everyone goes Nuke" (a complaint about mid and late game) — [Steam discussion](https://steamcommunity.com/app/3560670/discussions/0/663863457493364897/)
- R3RE5: deploy SAMs "as soon as neighbors build Silos"; under a barrage, add SAMs behind the front — [R3RE5](https://steamcommunity.com/sharedfiles/filedetails/?id=3808336226)
- openfront.fyi Nuclear Deterrence (v34, 2026-09-11):
  - Start the first SAM so it finishes before the threat window; it takes 300 ticks, about 30 s.
  - Level-1 range is 70 tiles. Levels 1–5 are about 70/81/90/97/102.
  - Offset the second SAM, and don't put every launcher inside one 100-tile hydro radius.
  - "State the follow-up in one sentence. If you can't, hold the weapon."
  - [nuclear-deterrence](https://openfront.fyi/strategies/nuclear-deterrence/) **[coach: agrees on 70-tile SAM and on SAM before the launch; conflicts with minute-5 timer]**
- openfront.fyi Building Timing: plan a SAM "when an opponent has a completed Silo and can afford a weapon" — [building-timing](https://openfront.fyi/guides/building-timing/)
- openfront.fyi Structures: "the first SAM deters AI nukes because they avoid covered targets" — [structures](https://openfront.fyi/mechanics/structures/)
- v35 nation nuke-targeting change: atoms need 25% and hydrogens 40% of the blast on enemy land, and nations never nuke friendly land (described as upcoming) — [first-match (search excerpt)](https://openfront.fyi/guides/first-match/)
- Spread versus stack: Goodkat and a 2026 Reddit poster say don't stack buildings early, because one Atom then hits several of them and trains earn less. Stacking is for late-game bunkers — [Goodkat](https://steamcommunity.com/sharedfiles/filedetails/?id=3818657159); [Reddit](https://www.reddit.com/r/Openfront/comments/1qt4cz8/my_best_strategy_in_openfrontio/)
- SAM upgrades versus more SAMs: on1kson says upgrading one SAM beats two basic ones side by side — [on1kson](https://steamcommunity.com/sharedfiles/filedetails/?id=3806155862). openfront.fyi says upgrade only when it brings an asset into coverage, and offset a second SAM — [nuclear-deterrence](https://openfront.fyi/strategies/nuclear-deterrence/)

#### Mid-game, endgame and how winners close out
- **Overtime is on by default in public FFA (since v34).** At 30:00 the win bar starts dropping from 80% by 2 points per minute, one point every 30 s, with no floor. You must be strictly above the bar. Leaders should keep short, connected borders and a reserve, and avoid risky attacks or alliance breaks near a threshold step. "Don't wait while in second place, because the falling bar favors the current leader" (openfront.fyi, v0.34.25, verified 2026-10-14) — [winning-overtime](https://openfront.fyi/guides/winning-overtime/). **Conflict:** the Endgame Commit page (v0.34.21) says "OVERTIME defaults: Disabled" — [ffa-endgame-commit](https://openfront.fyi/guides/ffa-endgame-commit/). This is probably the engine default versus the public-FFA playlist setting. **[coach: not covered]**
- **v35 runaway-leader gang-up** (openfront.fyi, v0.35.2, 2026-10-22):
  - Nations gang up when your tiles reach 3× (Medium), 2× (Hard) or 1.5× (Impossible) the runner-up's.
  - Above 50% of non-fallout land, every non-allied nation can nuke you.
  - "Victory-denial MIRVs" fire near 75%, 65%, 55% or 40% of land, from Easy to Impossible.
  - Its advice: ally before becoming the runaway leader, keep a second challenger alive so the target is ambiguous, and win before the focus converges.
  - [ffa-runaway-leader](https://openfront.fyi/guides/ffa-runaway-leader/) **[coach: not covered]**
- Endgame commit test (openfront.fyi, v34.21, 2026-10-01): commit the last reserve or MIRV only if you can name the border it converts and the remaining reserve is at least the rival's army. Otherwise reposition behind a SAM ring, or hold liquid only if Overtime is on and you lead. Don't commit inside your own traitor window — [ffa-endgame-commit](https://openfront.fyi/guides/ffa-endgame-commit/)
- Goodkat: late game is "3–6 very strong players … with troop caps in millions". It "revolves around stockpiling enough gold to always have enough money to threaten with a MIRV and then using it at the right moment"; betrayal is commonplace — [Goodkat](https://steamcommunity.com/sharedfiles/filedetails/?id=3818657159)
- "When I'm still around in late game, it seems like MIRVs are the key resource that ends the game" (~Jul 2025, excerpt) — [Reddit "Nukes aren't fun"](https://www.reddit.com/r/Openfront/comments/1lxxztm/nukes_arent_fun/)
- "Late game is god awful … 2–4 nations that are covered in nuked land that takes ages to clear" (~Jul 2025, excerpt) — [Reddit](https://www.reddit.com/r/Openfront/comments/1lsu9u3/late_game_is_god_awful/)
- newgamewiki: keep one alliance until you control the sea, strike enemy cities and ports, and embargo or raid a runaway neighbour's trade early — [newgamewiki](https://newgamewiki.wiki/openfront/strategy)
- v35 adds ranked FFA: 4–10 players by ELO, a 20-minute timer, ending when one human remains. It plays differently from 80–95-player public lobbies — [changelog v35](https://openfront.fyi/changelog/v35/)

### Inferences
- The coach treats banked gold as waste. From mid-game on, though, the community treats a visible 5M (hydro) or 25M+ (MIRV) reserve as deterrence that buys alliance renewals. A "gold sitting unspent" penalty should switch off or flip once rivals have Silos.
- The coach's SAMs "from minute ~5" conflicts with two views. Goodkat says skip early SAMs, build 2–4 mid-game, and spread buildings instead. openfront.fyi says trigger on an enemy Silo plus affordable ammo, not the clock. A trigger-based rule ("an enemy within range has a Silo and ≥750k") fits both.
- Calling retreat a mistake is too strong. Experienced players treat a cancelled attack as a routine way to free defenders, and retreating against unclaimed land is free.
- Nation diplomacy changed in v35 (Oct 2026), and players disagree about it: never ally (Goodkat) versus effectively forced to ally (GitHub #4650). Any coach rule about nations should be tied to the v35 behaviour and to difficulty.

### Gaps
- No source quantifies Port-first versus City-first outcomes.
- I couldn't check C9's nation betrayal rule ("allies below ~20% of cap") in any current community source. openfront.fyi's Diplomacy page covers humans only. Engine check needed.
- I couldn't read the full content of the openfront.fyi tall-vs-wide, stack-vs-spread, threat-assessment and near-parity-combat guides within the tool budget (only search excerpts).
- There is little written content on naval-heavy FFA play beyond warships and piracy.

## Q3. What do guides say about surviving early in 80+ player lobbies and dealing with a big neighbour?

### Takeaway
Few written sources address 80–95-player lobbies specifically. The consistent advice:
- Spawn with space from other humans (and, per Goodkat, near the centre for trade).
- Expand at low ratios so the home army stays near the regrowth peak, which keeps you from looking like the weakest target to nations and opportunists.
- Ally neighbours before fighting.
- Against a bigger attacker, never panic-counter with your whole army. Whittle with 5–20% clicks, drop Defense Posts (in mountains if possible), then offer an alliance.

### Cited Findings
- Lobby context: in v35 (2026-10-16), public lobby size "comes from map land instead of a universal 125-player cap (Box 210, Alps 185, Middle East 170)". Tribes are the passive bots; Nations are the AI that build, attack and defend — [changelog v35](https://openfront.fyi/changelog/v35/); [Goodkat](https://steamcommunity.com/sharedfiles/filedetails/?id=3818657159)
- Early-game length: "The early game ends after roughly 5 min into the match, after the first round of pvp fights. Many players will be eliminated" (Goodkat) — [Goodkat](https://steamcommunity.com/sharedfiles/filedetails/?id=3818657159)
- "Some games you cannot win just because the guy that spawned next to you will just attack you early and get both of you killed" (r/Openfront "How do you deal with people inting early game?", ~Sep 2025, excerpt) — [Reddit](https://www.reddit.com/r/Openfront/comments/1n9482g/how_do_you_deal_with_people_inting_early_game/)
- Responding to an early attack:
  - "If you're getting attacked, don't retaliate, you'll lose way too many troops, build a defense post and set your attack ratio on 10–20% and click once, in early game, that should be enough to stop them — make alliances to stay alive, ally the stronger players" (~Mar 2026, excerpt) — [Reddit](https://www.reddit.com/r/Openfront/comments/1rphnc5/i_learned_about_this_game_through_a_youtube_video/)
  - "one of the main things a lot of newbies make is trying to stop an attack by attacking them. Very rarely is this useful and it just ends up giving your foe more land"; another reply says "set my counter-attack to be 1–10% … slowly whittle them down" (~Sep 2025, excerpts) — [Reddit](https://www.reddit.com/r/Openfront/comments/1no19k3/how_to_even_survive_until_midgame/)
- Goodkat's defence sequence: "Do NOT panic click on the attacking player and send all your troops." Send small amounts to slow the attacker, build a line of Defense Posts (in mountains), and "when the attacker gets bogged down … offer them an alliance. Good players will take that alliance." He also says "Ally most of your neighbors … when attacking make sure you're allied with most of your neighbours" — [Goodkat](https://steamcommunity.com/sharedfiles/filedetails/?id=3818657159)
- openfront.fyi Outgunned Defense (2026-10-07, v34.24) gives a hold / whittle / fall-back fork:
  - Bigger (ratio ~1.4): counter.
  - Parity: whittle with **5–15% clicks** and hold.
  - Outgunned 2:1: hold behind Defense Posts.
  - Outgunned 3:1+: fall back or concede the front.
  - A delayed counter after the push has spread out beats an instant full counter.
  - On two fronts, starve the worse one.
  - [outgunned-defense](https://openfront.fyi/guides/outgunned-defense/) **[coach: agrees with C8]**
- openfront.fyi Attack Ratio, on an incoming full send: "whittle with 5–15% clicks as it crosses … not to counter with 100% while it is still in the air" — [attack-ratio](https://openfront.fyi/guides/attack-ratio/)
- Threat assessment (openfront.fyi ffa-opening):
  - Classify each neighbour as expanding away, parallel or toward you. "Toward you: needs troops, a shorter front, diplomacy, or a Defense Post."
  - "Don't read intent from troop cap alone."
  - "Bots are not free land … attacking one while a human closes your escape lane can lose."
  - [ffa-opening](https://openfront.fyi/strategies/ffa-opening/) **[coach: not covered]**
- Contrasting view: tribes are free gold ("The player who finishes off a tribe also gets their gold") and nations are "your primary target during early game" (Goodkat) — [Goodkat](https://steamcommunity.com/sharedfiles/filedetails/?id=3818657159)
- "When enough enemy players are close by, maintain a similar troop count to them so they don't pick on you" (~May 2025, excerpt) — [Reddit](https://www.reddit.com/r/Openfront/comments/1kma1cw/how_do_people_grow_such_fast_pop_at_the_beginning/)
- "Early alliances are necessary and will save your game if you are not the biggest in your area" (Steam, Feb 2026) — [Steam discussion](https://steamcommunity.com/app/3560670/discussions/0/682992180338454079/)
- "Ally early. Anno[ex] often … Attack where your neighbors are attacking and avoid the bigger stacks" (~Oct 2025, excerpt) — [Reddit](https://www.reddit.com/r/Openfront/comments/1o7eyyl/best_start_how_to_get_started/)
- Deterring a larger player:
  - "If the size discrepancy isn't that big defense posts on your border can help. Mid-game enough money for hydrogen bombs … Late-game … MIRVs. Also … make sure your structures are not placed … concentrated together nor right on the enemy border" (~Apr 2026, excerpt) — [Reddit](https://www.reddit.com/r/Openfront/comments/1sewfo1/any_tips_for_beginners/)
  - "You'd be surprised how effective just one or two Defense posts can be at deterring a player from attacking you" (Goodkat) — [Goodkat](https://steamcommunity.com/sharedfiles/filedetails/?id=3818657159)
- Nations target low home armies:
  - Goodkat says nations "target players with lowest troop count" — [Goodkat](https://steamcommunity.com/sharedfiles/filedetails/?id=3818657159)
  - openfront.fyi says Hard and Impossible nations' "juicy" targets must have ≤75% of the nation's troops, that players below 15% of their own max are "very weak" targets, and that nations raise their response when attacked — [nations-pressure](https://openfront.fyi/guides/nations-pressure/)
  - The GitHub complaint about nations attacking every 30 s early on (Jul 2026) — [GitHub #4650](https://github.com/openfrontio/OpenFrontIO/issues/4650)
- v35 beachhead boats: "Keep enough reserve to defend a landing and a border at the same time"; check coast as well as land contact before expanding beside a nation — [changelog v35](https://openfront.fyi/changelog/v35/)
- AFK players: "if you see 'Zzz' next to a player name … attack them immediately – it's free land … You can attack 'Zzz' players even if you're allied with them" (Goodkat) — [Goodkat](https://steamcommunity.com/sharedfiles/filedetails/?id=3818657159)
- Spawn immunity is only ~5 s and applies to everyone, so it can't be used to attack protected opponents — [ffa-opening](https://openfront.fyi/strategies/ffa-opening/)
- Exploit, flagged for awareness only: one Reddit reply (~Mar 2026) suggests opening three incognito tabs to place "dummy" spawns next to yourself. This is multi-accounting and not legitimate advice. v35.6 terms also tightened rules on unapproved extensions — [Reddit](https://www.reddit.com/r/Openfront/comments/1rphnc5/i_learned_about_this_game_through_a_youtube_video/); [changelog v35](https://openfront.fyi/changelog/v35/)

### Inferences
- For a player eliminated around 1:50 in a 90-player lobby, the most likely community diagnosis has two parts:
  - **Spawn density or a hostile neighbour.** A neighbour or nation attacked early.
  - **A low home army.** The player had drained troops on big opening sends, the exact pattern the coach currently *recommends*. In a v35 nation-heavy lobby this matters doubly, because nations target bordering players with low troops relative to their own (≤75%) or below 15% of their own cap.
- A coach for big lobbies should check different things than one for small lobbies:
  - The home-army fraction right after each send; the community norm is ≥25–40% of the cap.
  - Whether the player answered an incoming attack with a big counter-send, which is a mistake, instead of small clicks plus a Defense Post.
  - Whether the player requested alliances with neighbours before or while fighting.
  - Whether the player kept attacking a nation that was retaliating.

### Gaps
- No written source specifically compares 30-player and 90-player lobby openings, or says how spawn choice should change with density. This seems to be covered mostly in videos and Discord, which I could not reach.
- No source gives a survival rate, or the share of players eliminated before 3 minutes, in large public lobbies.
- I couldn't check whether the "spawn first so others avoid you" claim from the 2026 YouTube beginner guide holds. It was a search-engine summary only.

## Q4. What mistakes do experienced players say beginners make that a coach should catch?

### Takeaway
The most-cited mistakes are:
- (1) Draining the army, through full sends, over-clicking, or dropping below 10–25% of the cap.
- (2) Panic-countering a bigger attacker instead of whittling and building posts.
- (3) Over-allying, or never allying.
- (4) Stacking or bordering valuable buildings early.
- (5) Not having a Silo or hydro money when rivals do.
- (6) Building from timers rather than bottlenecks.
- (7) Long, protracted wars instead of quick fights followed by an alliance offer.

Several coach "mistakes" are contested by the community: retreating, banking gold, the minute-5 SAM timer, and low opening sends.

### Cited Findings
- **Letting troops fall too low** is "the most common mistake new players make" (Goodkat). He gives a "10% death zone" and a 25%-of-cap minimum after any send — [Goodkat](https://steamcommunity.com/sharedfiles/filedetails/?id=3818657159). on1kson says "Spamming left-click and dumping 100% of your army completely drains your troops" — [on1kson](https://steamcommunity.com/sharedfiles/filedetails/?id=3806155862) **[coach: agrees with C2 and C10]**
- **Over-clicking:** "'Constant clicks' may mean you are sending too often, depleting troop growth too quickly" (~Apr 2026) — [Reddit](https://www.reddit.com/r/Openfront/comments/1s91bv9/why_do_others_always_have_more_troops_than_me/)
- **Sitting near max troops:** openfront.fyi lists "Staying near max troops" and "Expanding cap without using it" — [ffa-opening](https://openfront.fyi/strategies/ffa-opening/); [economy-fundamentals](https://openfront.fyi/strategies/economy-fundamentals/) **[coach: agrees]**
- **Panic counter-attacking:**
  - "Do NOT panic click on the attacking player and send all your troops" (Goodkat) — [Goodkat](https://steamcommunity.com/sharedfiles/filedetails/?id=3818657159)
  - "the panic-send trap" (openfront.fyi) — [outgunned-defense](https://openfront.fyi/guides/outgunned-defense/)
  - "trying to stop an attack by attacking them. Very rarely is this useful" (~Sep 2025) — [Reddit](https://www.reddit.com/r/Openfront/comments/1no19k3/how_to_even_survive_until_midgame/)
  - **[coach: not covered]**
- **Small incremental attacks against players.** "Avoid small, incremental attacks … slow and result in high casualties"; send one overwhelming wave by clicking several times at 20% (Goodkat) — [Goodkat](https://steamcommunity.com/sharedfiles/filedetails/?id=3818657159)
- **Long, grinding wars:** "avoid a long, protracted fight over one or two cities … offer them generous terms of peace". Grinding makes the opponent "resent you" and betray later (Goodkat) — [Goodkat](https://steamcommunity.com/sharedfiles/filedetails/?id=3818657159) **[coach: not covered]**
- **Attacking a target with a much higher troop cap**, which will out-regenerate you (Goodkat) — [Goodkat](https://steamcommunity.com/sharedfiles/filedetails/?id=3818657159)
- **Over-allying versus under-allying:** "If you ally everyone, you'll have no one to attack" (Goodkat) — [Goodkat](https://steamcommunity.com/sharedfiles/filedetails/?id=3818657159); "Don't accept every alliance, since it can leave you boxed in" — [openfrontwiki (low reliability)](https://openfrontwiki.wiki/community/reddit/). Missing alliance renewals, so the partner reads it as an attack signal — [Goodkat](https://steamcommunity.com/sharedfiles/filedetails/?id=3818657159); "Assuming an alliance extends automatically" — [diplomacy-betrayal](https://openfront.fyi/strategies/diplomacy-betrayal/)
- **Early betrayal:** "In early game, betrayal is almost certain death" (Goodkat) — [Goodkat](https://steamcommunity.com/sharedfiles/filedetails/?id=3818657159). Breaking an alliance with little time left, when waiting costs nothing — [diplomacy-betrayal](https://openfront.fyi/strategies/diplomacy-betrayal/) **[coach: agrees with C12]**
- **Ignoring AFK ("Zzz") players next to you**, who are free land — [Goodkat](https://steamcommunity.com/sharedfiles/filedetails/?id=3818657159)
- **Attacking a nation you can't finish**, because it keeps retaliating (Goodkat). "Do not attack a Nation to 'keep it busy'" (openfront.fyi) — [Goodkat](https://steamcommunity.com/sharedfiles/filedetails/?id=3818657159); [nations-pressure](https://openfront.fyi/guides/nations-pressure/)
- **Treating tribes as free land** while a human closes your escape lane — [ffa-opening](https://openfront.fyi/strategies/ffa-opening/)
- **Building placement:**
  - Placing Cities, Ports, SAMs or Silos on the leading edge, where they transfer on capture — [ffa-opening](https://openfront.fyi/strategies/ffa-opening/)
  - Stacking cities or factories early, which cuts train income and makes an Atom target — [Goodkat](https://steamcommunity.com/sharedfiles/filedetails/?id=3818657159); [Reddit ~Feb 2026](https://www.reddit.com/r/Openfront/comments/1qt4cz8/my_best_strategy_in_openfrontio/)
  - "Hiding everything in one core" within one 100-tile hydro radius — [economy-fundamentals](https://openfront.fyi/strategies/economy-fundamentals/)
  - **[coach: not covered]**
- **Building from a timer**, for example "City at 40 seconds"; "Buying a City to refill a small army"; "Buying a second node before checking the first route"; "buying one of everything" — [ffa-opening](https://openfront.fyi/strategies/ffa-opening/); [building-timing](https://openfront.fyi/guides/building-timing/); [economy-fundamentals](https://openfront.fyi/strategies/economy-fundamentals/)
- **Port with no reachable destination**, or "Building in an isolated lake expecting passive income"; a Factory whose rail reaches no City or Port — [frontload guide](https://openfront.fyi/guides/frontload-port-factory-investment/); [building-timing](https://openfront.fyi/guides/building-timing/); [openfront.best](https://openfront.best/openfront-factory-strategy/)
- **Factory before the first Port**, which makes the Port cost 250k — [openfront.best](https://openfront.best/openfront-factory-strategy/); [economy-fundamentals](https://openfront.fyi/strategies/economy-fundamentals/)
- **Defense Post mistakes:** assuming overlapping posts multiply their effect, starting a post after the breach, or blanketing quiet borders — [building-timing](https://openfront.fyi/guides/building-timing/); [Goodkat](https://steamcommunity.com/sharedfiles/filedetails/?id=3818657159)
- **Nuke and SAM mistakes:**
  - Starting a SAM after the warning, since it takes about 30 s to build.
  - Treating one SAM as a shield.
  - Silo outside SAM coverage.
  - Emptying the treasury on one weapon.
  - Striking without a follow-up.
  - Sources: [nuclear-deterrence](https://openfront.fyi/strategies/nuclear-deterrence/); [building-timing](https://openfront.fyi/guides/building-timing/) **[coach: agrees with "late SAMs"]**
  - "Building missiles without interceptors" — [newgamewiki](https://newgamewiki.wiki/openfront/strategy)
  - Not having a Silo or hydro money when neighbours do: "Even players who are weaker than you will consider attacking if you don't have a silo" (Goodkat) — [Goodkat](https://steamcommunity.com/sharedfiles/filedetails/?id=3818657159) **[coach: conflicts with "banking gold" as a mistake]**
- **Naval mistakes:**
  - Sending boats with large troop shares instead of 1% — [Goodkat](https://steamcommunity.com/sharedfiles/filedetails/?id=3818657159)
  - Leaving no warship on your coast — [Goodkat](https://steamcommunity.com/sharedfiles/filedetails/?id=3818657159)
  - An idle warship on an empty bay, or a lone ship far from its Port — [warship-fleet-decisions](https://openfront.fyi/guides/warship-fleet-decisions/)
  - Late-game piracy that angers stronger players — [Goodkat](https://steamcommunity.com/sharedfiles/filedetails/?id=3818657159)
  - **[coach: partial agreement with C11]**
- **Endgame mistakes:**
  - Waiting in second place while Overtime lowers the bar for the leader — [winning-overtime](https://openfront.fyi/guides/winning-overtime/)
  - Hoarding while waiting for a rival to move, or committing inside your own traitor window — [ffa-endgame-commit](https://openfront.fyi/guides/ffa-endgame-commit/)
  - Growing into the v35 runaway-leader trigger without allies — [ffa-runaway-leader](https://openfront.fyi/guides/ffa-runaway-leader/)
- **"Copying a permanent attack-ratio number from another player"** is flagged as a mistake by openfront.fyi (v35) — [first-match](https://openfront.fyi/guides/first-match/)
- **Learning habits:** "watch a video … choose an opening … look at the time bar … to see when they attack" (~May 2026) — [Reddit](https://www.reddit.com/r/Openfront/comments/1tjpyx5/why_am_i_so_bad_at_earlygame/). "If you die, stay in the game and watch how others survive/win + you can watch the replay"; "join a clan" (~Mar 2026) — [Reddit](https://www.reddit.com/r/Openfront/comments/1rphnc5/i_learned_about_this_game_through_a_youtube_video/)

### Inferences
Coach rules that conflict with current written community opinion, roughly by likely impact:
1. **C1, the opening ratio.** The coach's 100% then 60–70%, and its penalty for opening sends under 40%, conflict with almost every 2026 player guide, which use 20–40% clicks timed to troop thresholds. Its own cited source (openfront.fyi) now says "not a universal optimum".
2. **C10, banking gold.** In mid and late game, a 5M (hydro) or 25M+ (MIRV) reserve is treated as essential deterrence.
3. **C6, timed SAMs and Silos.** The community ties SAMs to "a neighbour has a Silo plus ammo money". Goodkat says avoid early SAMs and build 2–4 mid-game.
4. **C10, retreating.** Experienced players treat cancelling as routine. It is free against unclaimed land and penalty-free if an alliance is accepted.
5. **C3, City by about 2:30.** City first is still the majority view, but a Port-first or Factory-first minority exists, and v34.12/v35 economics favour an early Port or Factory. openfront.fyi rejects timers.
6. **C4, routes of 300+ tiles.** This rests on an older trade curve. A newer openfront.fyi page suggests short routes now pay about 82k, against ~100k for long ones.
7. **C9, nation betrayal below 20%.** I found no current source for it.

Mistakes the coach does not yet catch but experienced players stress:
- Panic counter-sends against a bigger attacker.
- Stacked or edge-placed buildings early.
- Over-allying (no one left to attack) or never allying.
- Grinding protracted wars rather than taking land and offering an alliance.
- Ignoring AFK neighbours.
- Attacking nations you can't finish.
- Missing alliance renewals.
- No Silo or hydro money once rivals have them.
- Losing in Overtime by passively holding second place.

### Gaps
- Many Reddit "mistakes" threads could only be seen as one-line search excerpts, so their full lists and any disagreement in replies are missing.
- Discord (where a Reddit reply says most tips live) and YouTube content were out of reach.
- No source ranks how common each mistake is. All rankings above are qualitative.
