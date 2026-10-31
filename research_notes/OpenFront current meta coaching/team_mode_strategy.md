# OpenFront Team-Game Strategy: Being a Valuable Teammate (researched 2026-10-30)

Scope note for the report writer. Engine facts below come from the OpenFront source at commit `7ee96860` (v35 branch, committed 2026-10-30, the same engine the coach replays with, local copy at `data/engines/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de`). Public-lobby settings come from `src/server/MapPlaylist.ts` on `main` (last changed 2026-10-30). Community strategy comes almost entirely from openfront.fyi ("OpenFront Intel", an editorial community site, not official). Its pages were verified against v0.33 to v0.34 (Aug to Sep 2026), one major version behind the live v0.35 (released 2026-10-16 per [openfront.wiki](https://openfront.wiki/Game_modes)), so treat its numbers as slightly dated. Searches of Reddit (r/OpenFrontIO), YouTube and Steam guides returned nothing team-specific (see Gaps). Engine links use the base `https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/`.

**Correction to the brief.** The user's Luna game was not played with nations. The local record `data/records/c5VZsHpTtU.json` shows `gameMode: Team, playerTeams: 2, difficulty: Medium, nations: "disabled", bots: 400, donateGold: true, donateTroops: true, maxPlayers: 74, maxTimerValue: null, overtime: null` with 56 players. "Medium" is only the lobby difficulty label. Current public config turns nations off in every Team game except Humans vs Nations ([MapPlaylist.ts](https://github.com/openfrontio/OpenFrontIO/blob/main/src/server/MapPlaylist.ts), `nations: mode === Team && playerTeams !== HumansVsNations ? "disabled" : "default"`).

## What roles exist in team games, and how do players decide who does what?

### Takeaway
The game has no built-in roles. The only written framework (openfront.fyi, Aug to Sep 2026) uses six flexible jobs: frontline anchor, donor/economy, target caller, rail/trade logistics, naval support and nuclear deterrence. Players pick a job by asking who can remove the team's current bottleneck at the lowest cost, and they swap jobs as the map changes. Spawn position mostly decides it: edge players front, interior players feed and build.

### Cited Findings
- The game has "no fixed team roles or role bonuses". The six roles are an editorial framework, not game mechanics. The site's test for picking a role: "who can remove the team's current bottleneck at the lowest opportunity cost?" Roles shift mid-match (for example, a donor becomes the frontline when a border opens). Don't assign all six roles when only two jobs matter. — [openfront.fyi: Team Roles (pub. 2026-08-22, upd. 2026-09-27, verified v0.33.7)](https://openfront.fyi/strategies/team-roles/)
- The six roles as that page defines them:
  - **Frontline/Anchor** absorbs land pressure and reports incoming direction, usable troops, recipient headroom and one near-term objective.
  - **Donor/Economy** decides whether gold or troops removes the bigger bottleneck. It keeps reserves for its own exposed borders and stops when the recipient nears the cap.
  - **Target Caller** states one current priority.
  - **Rail/Trade Logistics** keeps Factory, City and Port connections settling.
  - **Naval Support** protects the water routes that change movement.
  - **Nuclear Deterrence** keeps gold, Silo access and protected infrastructure ready. It is "a readiness job, not permission to fire".
  
  — [openfront.fyi: Team Roles](https://openfront.fyi/strategies/team-roles/)
- At spawn, the **edge/front player** takes the exposed frontier. The **interior/rear player** "may accept less early land to protect the interior and a City site, and keeps troops and Gold for donations or useful building". A **central anchor** only works if that player accepts shorter early expansion and keeps a response reserve. A trapped player should "hold a compact core, donate when the lobby allows, and let a teammate own the reconnecting route". — [openfront.fyi: Team Spawn Formation (2026-09-05, v0.33.14)](https://openfront.fyi/guides/team-spawn-formation/)
- The "feeder" model: a safe, income-rich teammate turns gold into troops and a Factory while an anchor holds the front with the feeder's troops. Warning: don't give so much that you become "the next ally in trouble". — [openfront.fyi: In-Match Gold Donation (2026-09-24, v0.34.17)](https://openfront.fyi/guides/in-match-gold-donation/)
- Naval is support for the land push, not a replacement for it. Build ships only for a specific mission: escort transports, intercept a lane, or defend a Port. Don't build "because we have coast". Pivot back to land if the enemy isn't using the water. — [openfront.fyi: Team Naval Control (pub. 2026-05-12, upd. 2026-08-04, v33)](https://openfront.fyi/strategies/team-naval-control/)
- Nuclear role in teams: "one player funds launch capacity while teammates provide ground follow-up". A centralized arsenal "becomes a clear enemy objective". — [openfront.fyi: Nuclear Deterrence (upd. 2026-09-11, v34)](https://openfront.fyi/strategies/nuclear-deterrence/)
- Generic team advice from a third-party docs mirror: donate to teammates who need it most, help teammates under attack even when it doesn't benefit you directly, time attacks together, and split roles between economy and military. — [mintlify.wiki OpenFrontIO strategies (undated, third-party)](https://mintlify.wiki/openfrontio/OpenFrontIO/guides/strategies)
- Team assignment: clan tags are strict (a clan goes to one team, and overflow members are kicked); friends are a soft preference. Public Team lobbies keep clan tags (`disableClanTags` is set only for FFA). — [TeamAssignment.ts](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine-lib/src/game/TeamAssignment.ts); [MapPlaylist.ts](https://github.com/openfrontio/OpenFrontIO/blob/main/src/server/MapPlaylist.ts)

### Inferences
- In a 56-player, 2-team public lobby (about 28 humans a side), most players are neither the anchor nor the caller. The practical roles for a solo player are: (a) a **front-line holder** whose border touches the enemy team, (b) a **backline feeder/builder** with no enemy contact, and (c) the occasional **naval/coastal** player on water maps such as Luna, Madagascar and Pluto. Players don't really "decide" a role. Spawn geography assigns it, and good players accept the job their position gives them.
- A small player on a winning team is usually a backline or flank player. The FFA rules the coach applies (grow your own land share, never fight on two fronts) are the wrong yardstick for that role.
- Role-switch triggers the coach can detect from a replay:
  - Your border with enemy-team humans closes. You've become backline, so feed.
  - You sit at your troop cap. Donate.
  - An enemy-team player starts hitting you. You're now front, so stop donating and hold.

### Gaps
- I found no player-written source (Reddit, YouTube, Discord dumps, Steam guides) describing how public-lobby players actually split roles. The six-role scheme is one editorial site's framework, and the site itself says no verified source names a best fixed team composition ([Team Roles](https://openfront.fyi/strategies/team-roles/)).
- A YouTube video "OpenFront Team Game Guide - How to Win More Team Games" by Lonely_Millennial is featured on [openfront.wiki](https://openfront.wiki/Game_modes), but I couldn't find or read its content.

## When and how much should you donate troops and gold, to whom, and what are the engine rules? Is feeding a front-line teammate better than fighting yourself when you are small?

### Takeaway
Public Team lobbies always allow gold and troop donations (FFA never does). The rules:
- You can donate to any living, connected teammate or ally.
- The default send is one third of your troops, or one third of your gold.
- A troop gift is clamped to the recipient's free capacity, and you keep the rest.
- There is one 10-second cooldown per sender-recipient pair, shared between gold and troops.

The mechanics favour feeding. A player at the troop cap regenerates nothing, and a single large attacking stack loses fewer troops per tile than a small one. So a small backline player should keep troops near the regeneration sweet spot and push the surplus to a front-liner who has headroom.

### Cited Findings
**Engine rules (commit 7ee96860, 2026-10-30)**
- **Lobby switch.** Public lobbies set `donateGold: mode === GameMode.Team` and `donateTroops: mode === GameMode.Team`, so donations are on in every public Team game and off in public FFA. — [MapPlaylist.ts (main, 2026-10-30)](https://github.com/openfrontio/OpenFrontIO/blob/main/src/server/MapPlaylist.ts). The PR adding donation stats confirms that donations are disabled in public FFA, so they only fire in Team games. — [PR #5631 (merged 2026-09-23)](https://github.com/openfrontio/OpenFrontIO/pull/5631)
- **Who can receive.** `canDonateTroops` and `canDonateGold` require the sender and recipient to be different players, both alive, and `isFriendly` (same team or allied). The lobby switch is checked only when the recipient is a Human. — [PlayerImpl.ts](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/game/PlayerImpl.ts)
- **No gifts to disconnected players.** `isFriendly` returns false when the other player is disconnected, so you can't donate to an AFK teammate. — [PlayerImpl.ts](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/game/PlayerImpl.ts)
- **Cooldown.** It is `donateCooldown() = 10 * 10` ticks (10 seconds) per recipient. Both gold and troop donations are logged in one `sentDonations` list and both checks scan that list, so the cooldown is **shared between gold and troops** for the same sender-recipient pair. Different recipients have independent cooldowns. — [EngineConfig.ts](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/configuration/EngineConfig.ts); [PlayerImpl.ts](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/game/PlayerImpl.ts). This agrees with [openfront.fyi Team Roles](https://openfront.fyi/strategies/team-roles/) ("Gold and Troop donations from one sender to the same recipient share a 10-second window"). It contradicts [openfront.fyi In-Match Gold Donation](https://openfront.fyi/guides/in-match-gold-donation/) ("tracked separately for gold and troops"); the engine shows that page is wrong.
- **Default amounts.** A troop donation with no amount sends `floor(sender.troops / 3)`. A gold donation with no amount sends `sender.gold / 3`. — [EngineConfig.ts `defaultDonationAmount`](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/configuration/EngineConfig.ts); [DonateGoldExecution.ts](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/execution/DonateGoldExecution.ts). The gold modal offers presets of 10, 25, 50, 75 and 100% of your balance, plus a slider. — [openfront.fyi In-Match Gold Donation](https://openfront.fyi/guides/in-match-gold-donation/)
- **Troop clamp.** A troop gift is cut to `maxTroops(recipient) − recipient.troops()` before any troops leave you, so the **sender keeps the excess**; the troops aren't destroyed. — [DonateTroopExecution.ts](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/execution/DonateTroopExecution.ts). openfront.fyi's "Surplus troops above their capacity are lost" is contradicted by this code. The cooldown is still spent. Example from the Team Roles page: with a 200k cap and 185k held, only 15k can be received.
- **Gold has no recipient cap.** — [openfront.fyi In-Match Gold Donation](https://openfront.fyi/guides/in-match-gold-donation/), consistent with [DonateGoldExecution.ts](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/execution/DonateGoldExecution.ts) (no clamp).
- **Gifts to nations.** Donations to AI Nations also earn relation points, with random minimum troop sizes that scale with difficulty. This doesn't matter in public 2-team games, which have no nations. — [DonateTroopExecution.ts](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/execution/DonateTroopExecution.ts)
- **Stats.** Gold donations received (count, count while the recipient held under 50k "broke", and total gold) have been recorded in player stats since PR #5631 (2026-09-23). Every donation also emits a `DonateEvent` game update with sender, recipient, type and amount, so donations can be rebuilt from replays. — [PR #5631](https://github.com/openfrontio/OpenFrontIO/pull/5631); [PlayerImpl.ts](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/game/PlayerImpl.ts)

**Mechanics that decide whether feeding beats fighting**
- **Regeneration.** Troop regen per tick is `(10 + troops^0.73 / 4) × (1 − troops/cap)`. It peaks at about 42% of the cap and is zero at the cap. — [docs/strategy-notes.md (engine read 2026-10-26)](../../docs/strategy-notes.md)
- **Attack losses.** They scale with `clamp(defender's total troops / your stack, 0.6, 2)`, so a stack under about 60% of the defender's army pays up to double per tile. — [docs/strategy-notes.md](../../docs/strategy-notes.md)
- **Sitting at the cap.** A GitHub proposal to show a "send troops to teammates" reminder in team games when a player passes 80 to 90% of the army limit says: players "often reach very high army or population limits but keep their units instead of sending them to teammates," which "leaves a lot of army capacity sitting idle". Maintainers liked it and a mock-up was posted in Apr 2026, but the issue is now closed and I couldn't confirm it shipped. — [Issue #3445 (2026-03-16)](https://github.com/openfrontio/OpenFrontIO/issues/3445)

**Community advice**
- Send **troops** when a teammate is losing a border and will be overrun in about 10 seconds. Send **gold** when they are stuck on income and you can name the purchase it unlocks (a City, a Port), or when they're at the troop cap. Send nothing when you can't name a purchase and they aren't in danger. Keep a 25 to 50% reserve, and commit 75 to 100% only when the endgame is clear. Give "small, frequent gold gifts early and larger, committed gifts late." — [openfront.fyi In-Match Gold Donation (2026-09-24)](https://openfront.fyi/guides/in-match-gold-donation/)
- Before an urgent transfer, check that the recipient is eligible, has troop headroom, can absorb the deduction safely, which resource unlocks the bigger gain, and the cooldown status. Then confirm the amount received. — [openfront.fyi Team Roles](https://openfront.fyi/strategies/team-roles/)
- **Tooling.** Feature requests for donate hotkeys are still open ([Issue #3164 (2026-02-09)](https://github.com/openfrontio/OpenFrontIO/issues/3164); [PR #6212 "donate troops and gold to the player under the cursor" (opened 2026-10-29)](https://github.com/openfrontio/OpenFrontIO/pull/6212)). Today you donate through the right-click radial menu's quick-donate button on a friendly player ([newreleases.io v0.29.x notes (older, 2025-26)](https://newreleases.io/project/github/openfrontio/OpenFrontIO/release/v0.29.5)).

### Inferences
- **Feeding vs fighting when small.** The engine math favours concentrating troops in one front-line stack:
  - A small player's 20% attack stack is tiny next to an enemy human's whole army, so it pays near the 2× loss ceiling.
  - The same troops added to a big teammate's stack push that stack's ratio toward the 0.6 floor.
  - A small player at the cap regenerates nothing, so every second at the cap is wasted team production.
  
  The rule of thumb for a backline small player: hold troops around 40 to 50% of your own cap (peak regen, enough to deter bot or flank pokes), and send the surplus every 10 seconds to the teammate actually fighting enemy humans. Fight yourself when you are the front (an enemy-team border touches you), when a weak enemy flank is next to you, or when bots are still there to eat. Bot land is cheap and adds to the team total.
- **Gold.** Passive income is a flat 100 per tick (60k a minute) for every living human regardless of size ([PR #5631](https://github.com/openfrontio/OpenFrontIO/pull/5631)), so a small player earns as much passive gold as a big one. Sending that gold to a front-liner for Cities (more cap, so they can receive more troops), Defense Posts or SAMs is often worth more than the small player's own builds.
- **Order matters.** The troop and gold cooldown is shared per recipient. Send the larger, more urgent resource first, and spread gifts across different teammates rather than stacking small gifts on one.
- **Coach rule changes for team games:**
  - "Army idle at the troop cap" should become "you sat at the cap instead of donating".
  - "Gold piled up unspent" and "Died with gold in the bank" should suggest donating to a teammate.
  - These rules should only fire when donations were enabled.

### Gaps
- I found no measured data (replays or statistics) comparing win rates of teams that feed against teams that don't. The feeding advice rests on engine math plus one editorial site.
- Whether the #3445 "send troops to teammates" reminder is live in v35 is unconfirmed.

## How do teams coordinate attacks, use quick chat and emoji, and pick targets? How do you avoid being the weak link the enemy team breaks through?

### Takeaway
Coordination happens through four things:
- a **target marker**, a shared map signal: 10 seconds visible, 15-second cooldown;
- **Quick Chat**, direct to one recipient with a 3-second cooldown per recipient (there is no team broadcast);
- **emoji**, for tone only;
- voice, for clans.

The recommended protocol is one problem, one target, one next action, then confirm by watching the map. You become the weak link by having a low troop count on a border with the enemy team, frontline structures that can be captured, and no SAM cover.

### Cited Findings
- **Engine timings.** `targetDuration` is 10 seconds and `targetCooldown` is 15 seconds; `quickChatCooldown` is 3 seconds per recipient (`outgoingQuickChats_` is keyed by recipient); emoji are limited to 5 messages per 5-second window. — [EngineConfig.ts](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/configuration/EngineConfig.ts); [PlayerImpl.ts `canSendQuickChat`](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/game/PlayerImpl.ts)
- **Marker gap.** The marker is "a short intent signal, not a command", and markers from allies and teammates are merged for display. Because the cooldown is longer than the visibility, there is about a 5-second gap when the caller can't re-mark, so another caller or voice has to carry changes. — [openfront.fyi Team Roles](https://openfront.fyi/strategies/team-roles/)
- **Quick Chat protocol** — [openfront.fyi Quick Chat Team Coordination (2026-09-27, v0.34.20)](https://openfront.fyi/guides/quick-chat-team-coordination/)
  - It is "direct between one sender and one recipient", so every teammate needs their own message.
  - Phrase families: Help (troops, frontline troops, gold, help defend [player]), Attack (attack, focus, finish, MIRV, build warships), Defend, Warnings (MIRV timing, saving for MIRV, stop trading, snowballing).
  - The protocol: "One problem, one target, one next action." Attach a named enemy to Attack or Focus. Confirm by watching troops move, not by text replies.
  - Escalation ladder: emoji (tone) → target marker (shared priority) → direct Quick Chat (one player's job) → visible unit movement (confirmation).
  - Emoji are ambiguous, so use them for tone, acknowledgment and diplomacy, not urgent orders.
- **No team broadcast.** A proposal for team-broadcast quick chat and team-specific phrases ("Send troops to [P1]!", "Build SAMs!", "[P1] is AFK!") was closed as not planned on 2026-10-05. — [Issue #5789](https://github.com/openfrontio/OpenFrontIO/issues/5789). A player complaint that "it takes too long to tell an ally to attack someone" in team games got the maintainer reply "We plan on reworking communication system in a future update" (2026-07-03). — [Issue #4482](https://github.com/openfrontio/OpenFrontIO/issues/4482)
- **Stop trading with enemies.** The "Stop Trading with All" button was renamed "Stop Trading with Enemies" and now skips teammates, allies and bots. The matching quick chat is "Please stop trading with enemies!" — [PR #5919 (merged 2026-10-16)](https://github.com/openfrontio/OpenFrontIO/pull/5919). Players in voice chat routinely embargo enemies at the start of team games. — [Issue #4186 (2026-06-07, closed not planned)](https://github.com/openfrontio/OpenFrontIO/issues/4186)
- **Ways to be the weak link** — [openfront.fyi Team Roles](https://openfront.fyi/strategies/team-roles/)
  - Donating into a full recipient (it wastes the cooldown).
  - A donor with no reserve becoming a target.
  - Assuming teammates share your vision.
  - Defending a rail line that no longer pays.
  - Not expecting the enemy to "pressure donors, split fronts, cut rails, capture Ports, or threaten nuclear infrastructure".
- **Spawning.** Avoid piling into one pocket (teammates compete for the same land) and avoid scattering (the team fights unrelated wars). Aim for "a connected arc" where each teammate has a distinct neutral wedge. — [openfront.fyi Team Spawn Formation](https://openfront.fyi/guides/team-spawn-formation/)
- **Teammates can't hurt each other.** Attacks on friendly players (same team or ally) are blocked. — [AttackExecution.ts](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/execution/AttackExecution.ts)
- **AFK teammates are a hole in the line.** A disconnected teammate stops counting as friendly after about 30 seconds. Teammates can then absorb them with **zero attacker troop loss**, and the absorber also captures the AFK player's warships and transport ships. — [EngineConfig.ts `isDisconnectedTeammate`](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/configuration/EngineConfig.ts); [GameImpl.ts `conquerPlayer`](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/game/GameImpl.ts); [openfront.fyi AFK Teammate Takeover (2026-09-23, v0.34.16)](https://openfront.fyi/guides/afk-teammate-takeover/). The site recommends that a front-liner with a spare army takes the AFK land, and only when it fixes a real deficit.
- **Structures transfer with land.** Cities, Silos, SAMs and Ports transfer when their territory is captured. — [openfront.fyi Nuclear Deterrence](https://openfront.fyi/strategies/nuclear-deterrence/). Ports "can be captured if their supporting land falls". Keep a Port connected to your core, place a Coastal Defense Post (50k, 30-tile zone) across the land approach, and don't upgrade exposed infrastructure. — [openfront.fyi Team Naval Control](https://openfront.fyi/strategies/team-naval-control/)

### Inferences
- **The user's Luna ports.** Ports lost "soon after building" were probably built on land that touched, or was reachable by, the enemy team. In team games, Ports and Cities belong in the backline core. A front-line Port gifts the enemy a structure and its trade income.
- **Not being the weak link** on a front with enemy humans mostly comes down to troop count, because attackers pay less per tile when their stack is large relative to your army. So:
  - Don't donate away the troops that hold your own enemy-team border.
  - Build Defense Posts on the contact line.
  - Ask for troops early with Quick Chat "Help → troops", since teammates can't see your troop bar's urgency.
  - If you're collapsing anyway, give your gold away before you die so it isn't wasted.
- **Coach opportunity.** Detect when an enemy-team player starts attacking you, then check whether you asked for help or received donations within the next 30 to 60 seconds.

### Gaps
- No source quantifies how often public-lobby (non-clan) teammates actually respond to Quick Chat requests.
- Nothing found on voice or Discord coordination norms in public lobbies.
- No source on how strong players pick enemy targets in big 2-team lobbies. The only advice found is "one current priority" and "attach a named enemy".

## How do nukes, SAMs and Silos work in team games, and how do trade and trains between teammates pay?

### Takeaway
A SAM shoots down any nuke launched by a non-friendly player whose flight path comes within range. That means **SAMs protect teammates' land and structures**, not just the owner's, so a SAM in the middle of a cluster of teammates covers all of them. You can't nuke teammate land, and non-MIRV nukes are blocked if the blast would hit a teammate's structure. A MIRV hits only the one targeted player's tiles. The game has no shared silo or gold pool, so "pooling for a MIRV" means donating gold to one launcher.

Trade and trains reward working with teammates. Both ends of a teammate trade, and of a teammate train stop, get paid, so the team earns double, while trade with the enemy team pays both sides equally. In a 2-team game that nets zero, hence "Stop Trading with Enemies".

### Cited Findings
**Nukes and SAMs (engine 7ee96860)**
- **What a SAM shoots at.** `isValidNukeTarget` skips a nuke if it is already targeted, owned by the SAM owner, or owned by a friendly player (until the game is over). Otherwise any nuke whose trajectory passes within the SAM's dynamic range is a valid target. The code doesn't check whose land the nuke is aimed at. — [SAMLauncherExecution.ts](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/execution/SAMLauncherExecution.ts)
- **SAM priority.** Hydrogen bombs come first (a +70,001 score bonus), then nukes landing closer to the SAM. — [SAMLauncherExecution.ts](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/execution/SAMLauncherExecution.ts)
- **SAM range** is `samRange(level) = maxSamRange − 480/(level+5)`: level 1 is 70 tiles, and range approaches 150 tiles at higher levels. — [Config.ts](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine-lib/src/configuration/Config.ts)
- **SAM cost and build time.** 1.5M for the first, then (n+1)×1.5M capped at 3M. Construction takes 300 ticks, so a SAM started after a warning may not finish in time. — [openfront.fyi Nuclear Deterrence (upd. 2026-09-11, v34)](https://openfront.fyi/strategies/nuclear-deterrence/); costs also in [docs/strategy-notes.md](../../docs/strategy-notes.md)
- **Nuking teammates is blocked.** You can't target a tile owned by a teammate until the game is over. In Team mode, a non-MIRV nuke is refused if any teammate structure lies within its outer blast radius. — [PlayerImpl.ts `nukeSpawn`](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/game/PlayerImpl.ts). A fix also stopped crediting launchers for destroying their own, teammate or ally units. — [PR #5525 (merged 2026-09)](https://github.com/openfrontio/OpenFrontIO/pull/5525)
- **MIRV scope.** A MIRV records the owner of the destination tile as `targetPlayer`, and its 350 warheads only pick tiles owned by that player. — [MIRVExecution.ts](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/execution/MIRVExecution.ts). A proposal for MIRVs to hit the whole enemy team is open but unmerged, "Needs playtesting" (2026-09-21); its PR was closed. One player called it "an absolutely massive change to the meta". — [Issue #5603](https://github.com/openfrontio/OpenFrontIO/issues/5603); [PR #5705](https://github.com/openfrontio/OpenFrontIO/pull/5705)
- **Nuke prices.** Atom 750k, Hydrogen 5M, MIRV 25M + 15M per MIRV already launched. A minimum Silo + SAM + Atom package costs 3.25M, and protected Hydrogen capability needs at least 7.5M. — [openfront.fyi Nuclear Deterrence](https://openfront.fyi/strategies/nuclear-deterrence/); [docs/strategy-notes.md](../../docs/strategy-notes.md)
- **SAM upgrades are owner-only.** A request to let teammates upgrade each other's SAMs was closed as not planned (2026-06). The suggested workaround: ask the owner by quick chat and send them gold. The requester complained that public teammates "place ONE sam" and never upgrade it. — [Issue #4155](https://github.com/openfrontio/OpenFrontIO/issues/4155)
- **Team nuke advice.** The nuclear page's only team guidance: split roles (one player funds launch capacity, teammates follow up on the ground), call targets, and don't centralize everything in one player. It doesn't say how to move pooled gold. — [openfront.fyi Nuclear Deterrence](https://openfront.fyi/strategies/nuclear-deterrence/)

**Trade and trains (engine 7ee96860)**
- **Trade-ship payouts.** When a trade ship arrives, **both** the source Port owner and the destination Port owner get the full distance payout: `75,000/(1+e^(−0.03(d−300))) + 50d`, which is about 37.5k at 300 tiles. — [TradeShipExecution.ts](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/execution/TradeShipExecution.ts); [EngineConfig.ts `tradeShipGold`](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/configuration/EngineConfig.ts); [openfront.fyi Team Trade Coordination (upd. 2026-09-27)](https://openfront.fyi/guides/team-trade-coordination/)
- **Friendly-port bonus.** Destination selection gives friendly Ports (teammate or ally) an extra weighted copy when they are outside the 300-tile short-range debuff. Port level also multiplies the weight. — [PortExecution.ts](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/execution/PortExecution.ts)
- **Trade permission.** Trade is allowed unless either side has an embargo; teammates get no special permission. — [PlayerImpl.ts `canTrade`](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/game/PlayerImpl.ts)
- **Train payouts.** Each stop pays per relation: **team 25k**, ally 35k, other (enemy) 25k, self 10k. When the train owner and station owner differ, **both** receive the full amount. From the 10th city visited onward, each stop pays 5k less, with a 5k floor. — [EngineConfig.ts `trainGold`](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/configuration/EngineConfig.ts); [TrainStation.ts](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/game/TrainStation.ts). The same table appears in [openfront.fyi Team Roles](https://openfront.fyi/strategies/team-roles/) ("Teammate stops don't pay the most. Ally stops pay more").
- **Embargoes stop trains too.** Trains check `canTrade` (`tradeAvailable` → `player.canTrade(otherPlayer)`), so an embargo blocks trains into that player's stations. — [TrainStation.ts](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/game/TrainStation.ts); [TrainExecution.ts](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/execution/TrainExecution.ts). This contradicts openfront.fyi Team Trade Coordination's claim that "trains don't use the trade embargo gate".
- **Space planning for team economies:**
  - Teammates "don't share an economy". Agree on core, corridor, coast and pressure-edge space before the first expensive build.
  - Cities go in the owner's safe interior.
  - Factory station search reaches 110 tiles.
  - Don't close a teammate's only City-to-Port lane with FFA-style expansion.
  
  — [openfront.fyi Team Economy Space (2026-09-09, v0.33.14)](https://openfront.fyi/guides/team-economy-space/)

### Inferences
- **The user's 17 nukes.** Taking 17 nukes with no SAM is the clearest team-specific fix: one SAM covers a 70-tile radius of anyone's land. If a teammate already has a SAM, building nearby (inside its circle) or asking for coverage is cheap. If not, the user's SAM also protects neighbours, which makes it a team asset worth asking gold for. Also, 17 nukes aimed at one player is enemy gold (at least about 12.75M if they were all Atom bombs) not spent on the main front. Soaking nukes isn't pure loss.
- **Team-relative economics in a 2-team game:**

  | Gold source | Team total per event |
  |---|---|
  | Teammate-to-teammate trade or train stop | +2× payout |
  | Self train stop | 10k |
  | Trade or train with the enemy team | Same gold to both sides, so net zero relative |

  The practical rules: press "Stop Trading with Enemies" early in 2-team games, build Ports where teammates' Ports are reachable at more than 300 tiles, and link rail stations to teammates' Cities and Factories. A team stop is worth 50k to the team against 10k for a self stop. In 3+ team games, enemy trade still helps you against teams you don't trade with, so a blanket embargo is less clear-cut there.
- **Pooling for a MIRV** means several players donating gold to one player who has (or will build) a Silo. Donations to one recipient share a 10-second cooldown, but many donors can send at once. Since a MIRV hits only one player, aim it at the enemy team's biggest front-line player to open a breach for ground follow-up.

### Gaps
- No source quantifies how often public team games see MIRVs or coordinated nuke pooling.
- `maxSamRange()` wasn't read directly. The roughly 150-tile asymptote comes from the code comment.
- Not verified: whether rail lines connect through teammate territory without restriction (only the station-range rules were read).

## What is the team win condition, how do games typically end, and what does a good game look like for a small player on a winning team?

### Takeaway
A team wins when the sum of its members' tiles is **strictly above 80% of non-fallout land**, checked every 10 ticks. Public team lobbies have no timer and no overtime (overtime is FFA-only), and there is a 170-minute hard limit. Bots form their own team, which can't win.

Every teammate who spawned and stays connected gets win credit **even if eliminated**. A player who disconnects while still alive gets credit only if the team already held at least 70% of the land at that moment.

A 2.4% share in a 56-player, 2-team game is close to the average share a winning-team member needs (above 80% ÷ 28 ≈ 2.86%). The user's size was normal; it wasn't a failure.

### Cited Findings
- **The check.** `checkWinnerTeam` sums `numTilesOwned()` per team and declares the top team the winner when `tilesOwned × 100 > nonFalloutLand × percentageTilesOwnedToWin`. A Bot-team leader is ignored. The check runs every 10 ticks. — [WinCheckExecution.ts](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/execution/WinCheckExecution.ts)
- **The threshold.** `PERCENT_TILES_OWNED_TO_WIN = 80`. Overtime (the bar drops 2 points a minute after 30 minutes) is "Off unless enabled". — [Config.ts](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine-lib/src/configuration/Config.ts). Public lobbies set `overtime: mode === FFA ? {enabled: true} : undefined` and `maxTimerValue: undefined`, so public Team games have neither. — [MapPlaylist.ts](https://github.com/openfrontio/OpenFrontIO/blob/main/src/server/MapPlaylist.ts). The user's Luna record confirms `maxTimerValue: null, overtime: null` (local `data/records/c5VZsHpTtU.json`).
- **Hard limit.** `HARD_TIME_LIMIT_SECONDS = 170 × 60` forces a result before the server's 3-hour kill. — [WinCheckExecution.ts](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/execution/WinCheckExecution.ts)
- **Strictly above 80%.** Exactly 80.00% doesn't win, and fallout shrinks the denominator. Individual members don't each need 80%. — [openfront.fyi Team Victory Threshold (2026-09-23, v0.34.15)](https://openfront.fyi/guides/team-victory-threshold/)
- **Who gets win credit.** `makeWinner` credits members who have a client ID and spawned, and who are (a) still connected, (b) disconnected after being eliminated (`!snap.wasAlive`), or (c) disconnected while alive when the team held at least 70% of land at disconnect (`teamLandShareWinThresholdTenths() = 7`). — [GameImpl.ts `isEligibleForTeamWin`](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/game/GameImpl.ts); [EngineConfig.ts](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/configuration/EngineConfig.ts). openfront.fyi's threshold page calls dead or disconnected eligibility "unspecified"; the engine settles it.
- **Ranked team modes differ.** Ranked 2v2 and Clan Wars also end when only one team has connected humans alive, and they are voided if any matched player never spawns. — [WinCheckExecution.ts](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/execution/WinCheckExecution.ts)
- **First to 80% keeps the win.** The winner doesn't change if play continues: "first player to 80% wins" (maintainer evanpelle, 2026-03-07). — [Issue #3370](https://github.com/openfrontio/OpenFrontIO/issues/3370). After a win the "aftergame" starts, and teammates can nuke each other for fun. — [PlayerImpl.ts](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/game/PlayerImpl.ts); [SAMLauncherExecution.ts](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/execution/SAMLauncherExecution.ts)
- **Team land is a sum.** Team totals are the sum of members' tiles; "one player can hold a large core while another holds a small bridge". — [openfront.fyi Team Victory Threshold](https://openfront.fyi/guides/team-victory-threshold/). The AFK-takeover guide adds that "the team's combined share matters more than your personal share". — [openfront.fyi AFK Teammate Takeover](https://openfront.fyi/guides/afk-teammate-takeover/)
- **The user's game.** 56 players, 2 teams, 400 bots, no timer (local record `data/records/c5VZsHpTtU.json`), so about 28 humans a side.

### Inferences
- **Benchmark against the team.** At the moment of victory, the winning team's members average just over 80% ÷ 28 ≈ 2.9% of the map each. That's less if bots and enemy remnants still hold land, since the 80% is of all non-fallout land. The user's 2.4% is about 85% of the team average. Better land benchmarks for team games:
  - share of **team** land (your tiles ÷ team tiles) against 1 ÷ team size;
  - percentile among your own teammates;
  - not the FFA "be the biggest" standard.
- **How public 2-team games typically end.** One side's land share snowballs until it crosses 80%. With no timer or overtime, a stalemated game can drag on, and nukes and MIRVs are the usual stalemate breakers. This is inferred from the rules; no source describes typical endings.
- **A good game for a small player on a winning team** (inferred from the mechanics above):
  - stays alive and connected to the end, or at least stays connected after dying;
  - holds its own border with enemy-team humans without collapsing;
  - converts troops it can't use into teammates' stacks, so it rarely sits at the cap;
  - sends spare gold where it unlocks a City, SAM or Defense Post;
  - keeps Ports and Cities in the backline;
  - has (or sits under) SAM cover;
  - trades and rails with teammates while embargoing enemies;
  - takes bot land early, since bots hold land in the denominator and bot conquest transfers all the bot's gold ([docs/strategy-notes.md](../../docs/strategy-notes.md)).
- **Don't quit while alive.** Leaving a game while still alive, before the team reaches 70%, forfeits win credit. The coach should tell players to spectate rather than close the tab.

### Gaps
- No public data on the typical length or ending pattern of public 2-team games (for example, the share decided by MIRV versus a ground push). The user's own replays could supply this.
- The win-credit rule was read from code. I didn't confirm how the public leaderboard or stats treat eliminated winners.

## How should a teammate's contribution be measured, given that personal land share may be the wrong yardstick?

### Takeaway
No official or community "team contribution" metric exists. The engine records enough raw data to build one from replays: donations (`DonateEvent` amounts), gold donations received while broke, train and trade gold by partner, SAM interceptions, structures captured or lost, attack troops sent and received, kills, and per-tick samples. A team-aware coach should score team-relative land, flow of resources to teammates, front holding and protection given, not personal land share alone.

### Cited Findings
- **What the engine records per player:**
  - attacks sent, received and cancelled, plus peak incoming;
  - trade boats sent, arrived, captured and destroyed;
  - bombs launched, landed and intercepted;
  - gold by source: work, war, trade, steal, own trains, external trains, donations received;
  - units built, captured, upgraded, destroyed and lost;
  - kills and killed-by, final tiles, alliance stats, and per-tick samples.
  
  — [Stats.ts](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/game/Stats.ts); [StatsSchemas.ts](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine-api/src/StatsSchemas.ts)
- **Donation stats.** Gold donations received, the subset received while under 50k ("broke"), and the total donated gold were added in PR #5631 (2026-09-23) for "an upcoming server-side criterion". Each donation also emits a `DonateEvent` with amounts. — [PR #5631](https://github.com/openfrontio/OpenFrontIO/pull/5631); [PlayerImpl.ts](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/game/PlayerImpl.ts)
- **Related community proposals:** a "lobby-adjusted win performance stat" ([Issue #3895 (2026-05)](https://github.com/openfrontio/OpenFrontIO/issues/3895)) and an end-of-game awards screen ([Issue #3140 (2026-02)](https://github.com/openfrontio/OpenFrontIO/issues/3140)). There is also a third-party userscript with a "Team Build Stats Panel" showing per-team structure counts, team gold per minute and tile percentages ([OpenFront Helper userscript](https://greasyfork.org/scripts/584309-openfront-helper-userscript)).
- **The site's own scorecard.** openfront.fyi's team status board tracks six signals: land pressure, troop recipients, current enemy priority, settling networks, water chokepoints and nuclear response capacity. — [openfront.fyi Team Roles](https://openfront.fyi/strategies/team-roles/)

### Inferences
Suggested team-mode scorecard, all computable from replays the coach already runs:

1. **Team-relative land.** Your tiles ÷ team tiles, against 1 ÷ team size. Also your rank among teammates. Also the team-share curve, with your share of it.
2. **Troop flow.**
   - Troops donated ÷ troops generated.
   - Seconds at 95% of cap or more while a teammate had headroom (wasted production).
   - Troops received, which marks a fed front-liner.
3. **Gold flow.**
   - Gold donated, and gold donated to broke teammates (the PR #5631 stats count this on the recipient).
   - Gold banked at death.
4. **Front holding.**
   - Tiles lost to enemy-team humans against tiles taken from them.
   - Incoming attack troops absorbed (`ATTACK_INDEX_RECV`).
   - Whether your border collapsed (the coach's existing "collapse" moment, filtered to enemy-team attackers).
5. **Protection given.**
   - SAM interceptions, including nukes aimed at teammates.
   - Nukes absorbed with gold cost to the enemy (17 nukes means at least about 12.75M of enemy gold if all were Atoms).
6. **Team economy.**
   - Train and trade gold with teammates against with enemies.
   - Structures lost to capture within N minutes of being built (the Port problem).
7. **Kills and conquest.** Enemy-team humans eliminated or assisted; bot land cleared early.
8. **Presence.** Connected at the end, which is required for win credit if you left while alive.

### Gaps
- No source validates any of these metrics against win rates. They are design proposals built on engine data.
- I couldn't determine what the "upcoming server-side criterion" in PR #5631 is (likely an award or achievement).

## How do Duos/Trios/Quads, 3+ team games, and Humans vs Nations differ from 2-team games?

### Takeaway
Public Team lobbies roll a team count. 2 to 7 teams carry weight 10 each, Duos 5, Trios 7.5, Quads 7.5 and Humans vs Nations 20 (of 100). Some maps force their own count 75% of the time; Luna, Madagascar and Pluto force 2 teams, which explains the user's frequent 2-team games. Every format keeps the same 80% team-land win rule and donations.

- **Duos/Trios/Quads:** many small teams (team count = players ÷ team size, rounded up). They play like an FFA of tiny squads, with alliances across teams allowed and never random spawn.
- **Humans vs Nations:** every human on one team against an equal number of Hard nations.

### Cited Findings
- **Team-count weights.** `TEAM_WEIGHTS`: 2, 3, 4, 5, 6 and 7 teams at weight 10 each; Duos 5; Trios 7.5; Quads 7.5; HumansVsNations 20. A map's `specialTeamCount` overrides the roll with probability 0.75. — [MapPlaylist.ts (main, 2026-10-30)](https://github.com/openfrontio/OpenFrontIO/blob/main/src/server/MapPlaylist.ts)
- **Forced counts.** Luna, Madagascar and Pluto have `specialTeamCount: 2`. Balkans, China, South America and Giant World Map have none, so they take the random roll. — [Maps.gen.ts (main)](https://github.com/openfrontio/OpenFrontIO/blob/main/packages/engine-api/src/game/Maps.gen.ts)
- **Duos/Trios/Quads team count.** It is `max(2, ceil(totalPlayers / 2|3|4))`. — [TeamAssignment.ts `resolveTeamsList`](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine-lib/src/game/TeamAssignment.ts). Lobby size is rounded down to a multiple of the team size, and Duos, Trios and Quads never get the random-spawn modifier "as it defeats the purpose". — [MapPlaylist.ts](https://github.com/openfrontio/OpenFrontIO/blob/main/src/server/MapPlaylist.ts)
- **Humans vs Nations.** Humans go to the "Humans" team and nations to "Nations" ([GameImpl.ts `addPlayers`](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/game/GameImpl.ts)). Lobby details ([MapPlaylist.ts](https://github.com/openfrontio/OpenFrontIO/blob/main/src/server/MapPlaylist.ts)):
  - Half the slots go to humans and the other half fill with nations.
  - Nation difficulty is **Hard**; all other public Team lobbies use Medium.
  - Nations are enabled only in this mode. Every other public Team mode has them disabled.
  - Spawn immunity is 5 seconds.
  - 25M starting gold and peace-time modifiers are excluded because nations don't have PvP immunity.
  
  HvN returned to public play with the nation count matching the human count. — [newreleases.io v0.29.14 notes (older)](https://newreleases.io/project/github/openfrontio/OpenFrontIO/release/v0.29.14)
- **Lobby settings shared by all public Team lobbies:**
  - 400 bots (100 on compact maps), on their own Bot team, which can't win.
  - Donations on.
  - Alliances not disabled.
  - Clan tags kept.
  
  — [MapPlaylist.ts](https://github.com/openfrontio/OpenFrontIO/blob/main/src/server/MapPlaylist.ts); [WinCheckExecution.ts](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/execution/WinCheckExecution.ts); [PlayerImpl.ts `isOnSameTeam`](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/game/PlayerImpl.ts)
- **Cross-team alliances.** `canSendAllianceRequest` allows a request to any non-friendly, connected, living player unless alliances are disabled, so players on other teams can be allied (default duration 5 minutes). — [PlayerImpl.ts](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/game/PlayerImpl.ts); [Config.ts `allianceDuration`](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine-lib/src/configuration/Config.ts). Team mode adds a refusal path to alliance requests to Nations, which "can be decisive at higher difficulty" (HvN context). — [openfront.fyi Nation Alliances (2026-09-18)](https://openfront.fyi/guides/nation-alliance-decisions/)
- **Embargo button.** "Stop Trading with Enemies" skips teammates, allies and bots. — [PR #5919](https://github.com/openfrontio/OpenFrontIO/pull/5919)
- **Team spawn areas.** Some maps define a spawn rectangle per team count. Teams are assigned first, and clan groups stay together. — [GameImpl.ts `teamSpawnArea`](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/game/GameImpl.ts); [openfront.fyi Team Spawn Formation](https://openfront.fyi/guides/team-spawn-formation/)
- **Ranked 2v2 and Clan Wars** are separate matchmade modes. Their teams can also win by outlasting the other side, and a match is voided if any player fails to spawn. Ranked 2v2 has 60 seconds of PvP immunity. — [WinCheckExecution.ts](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine/src/execution/WinCheckExecution.ts); [openfront.fyi Team Spawn Formation](https://openfront.fyi/guides/team-spawn-formation/)
- **Old Duos bug.** A June 2026 bug had Duos/Trios/Quads humans "spread across teams and paired with nations instead of each other". It is closed and moot now that public Team lobbies other than HvN have no nations. — [Issue #4253](https://github.com/openfrontio/OpenFrontIO/issues/4253)
- **Unreliable claim.** openfront.fyi's naval page says Team mode runs "2v2 to 8v8, with a 95% territory objective in five minutes". This contradicts the engine (80%, no public timer) and should be disregarded. — [openfront.fyi Team Naval Control](https://openfront.fyi/strategies/team-naval-control/) versus [Config.ts](https://github.com/openfrontio/OpenFrontIO/blob/7ee96860c717b1ea36870cdfa6d4bb1e9bccd6de/packages/engine-lib/src/configuration/Config.ts)

### Inferences
- **2-team games** (the user's usual: Luna, Madagascar, Pluto) are zero-sum between two big blocs. That makes the team-first rules strongest: feed the front, embargo enemies, trade and rail with teammates, share SAM cover. Personal land share means least here.
- **3 to 7 team games** add real diplomacy. Allying a third team's neighbour to avoid a two-front war is FFA thinking that is valid again. Trading with a non-threatening third team can be net positive.
- **Duos/Trios/Quads** in a 56 to 94 player lobby mean 14 to 47 teams. One small team rarely reaches 80%, so play is close to FFA. Personal land share and FFA rules matter much more, though feeding your 1 to 3 partners still applies.
- **Humans vs Nations** (Hard nations, equal numbers): the whole human side is one team, so donation and SAM-umbrella logic applies across the human side. Nations are scripted, for example they betray allies whose troops drop low, per the existing coach notes ([docs/strategy-notes.md](../../docs/strategy-notes.md)).
- **Coach implication.** Read `playerTeams` from the game config and switch rule sets: FFA rules for FFA and Duos; team rules for 2 to 3 teams and HvN; a blend for 4 to 7 teams.

### Gaps
- I found no player commentary (Reddit, YouTube, Discord) contrasting how Duos, multi-team and HvN games actually play in public lobbies. The differences above come from code and configuration.
- I didn't verify which of the user's other maps (Balkans, South America, China, Giant World Map) define team spawn areas.
