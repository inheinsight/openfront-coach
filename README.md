# OpenFront Coach

A post-game coach for [OpenFront.io](https://openfront.io). Play as usual; when a game ends, the coach replays it tick by tick on the exact engine build it was played on, finds the moments that decided it, grades your play, and tells you what to do differently next game.

OpenFront's terms forbid real-time assistance, so the coach never reads or shows anything during a match. It only works from OpenFront's public archive, which publishes a game after it ends.

## What you get

- **Debrief.** A written review of your game: the story, three things to fix with timestamps, what to keep doing, and a plan for the next game. Your local Claude Code writes it, on your existing subscription.
- **Troop lesson.** Four troop habits, each checked every game:
  - stack at least the defender's home army;
  - decide the total before a burst of clicks;
  - keep a floor of troops at home;
  - in team games, feed one front.

  The debrief opens with the one habit to fix next, this game's evidence for it, the numbers for the lobby's median player and its top five, and how that habit has trended across your games.
- **Front-line chart.** Your share of the map against your main rivals, with key moments pinned to the curve using chess annotation glyphs: `!!` brilliant, `!` good, `?!` inaccuracy, `?` mistake, `??` blunder.
- **Key moments and map replay.** Each moment explains what happened, why it mattered and what to do instead. Selecting one jumps a territory-map replay to that point.
  - Detected moment types: slow openings, attacks that went badly, idle armies sitting at the troop cap, empty armies caught under attack, territory collapses (with who did it and why), big pushes, banked gold, late Cities, betrayals, nukes without SAM cover, lost transports.
- **Scorecard.** Expansion, economy, troop management, combat, defense, diplomacy, naval and nuclear play, each scored 0–100. Scores compare you with every other human in the same lobby and with absolute targets taken from the engine's own formulas.
- **Economy and buildings.**
  - Every building you placed gets a verdict on the map, with a suggested better spot when there was one:
    - Cities and Silos: the safest interior point at the time.
    - Ports: the stretch of your coast with the best expected gold per trade ship, computed with the engine's own trade-partner weighting and route-length payout.
    - Defense Posts: the border facing your strongest neighbour.
  - It shows what happened to each building: kept, captured (including by naval landings) or nuked.
  - Build timing: how long you sat on the gold before buying, and whether your army was at its cap when you bought a City.
  - Income by source over time compared with the lobby, and your build order next to the strongest player's.
  - Warship patrols, warship losses, and who captured your trade ships.
- **Attacks.**
  - Decision cards for the attacks on players that cost you most. Each shows:
    - your stack against the defender's home army, on the engine's loss bands;
    - what you did, click by click;
    - what would have worked, such as the moment their home army dropped while they fought someone else.
  - A ledger of every attack, with bursts of quick clicks folded into one row.
- **Practice.** "Your call" drills built from your own attacks and defences. You choose how much to send before you see what you did and the coach's call. Missed drills come back until you get them right twice.
- **Progress.** Trends across games for the numbers that matter, with goals from your drills.
- **Ask the coach.** Ask follow-up questions about a game, for example "why did I collapse at 7:58?".
- **Jev judge (optional).** [TypeSafe's Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev) reviews each key moment. It returns a calibrated severity, the probability the moment was avoidable, and which lesson it teaches, for about a tenth of a cent per game.

## Run it

Requirements: macOS or Linux, Node.js 24 LTS (pinned in `.node-version`; 20.19+ still works), git. Optional: [Claude Code](https://claude.com/claude-code) logged in (for written debriefs), and a TypeSafe API key (for Jev).

```bash
npm run setup
```

```bash
npm start
```

Then open http://localhost:5317. On a Mac you can instead double-click **OpenFront Coach.command** in Finder, which starts the coach and opens the dashboard.

Copy `.env.example` to `.env` to configure the coach. Every setting is optional:

| Setting | What it does |
| --- | --- |
| `TYPESAFE_API_KEY` | Turns on the Jev judge. Get a key at https://console.typesafe.ai/keys. |
| `OPENFRONT_PUBLIC_ID` | Your public player ID, for importing your history without the extension. |
| `NARRATOR=off` | Use template debriefs instead of Claude Code. |
| `CLAUDE_MODEL` | The Claude model for debriefs. Defaults to `haiku`. |
| `PORT` | Defaults to `5317`. |

### Install the Chrome extension

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and choose the `extension` folder in this project.
3. Play on openfront.io. When a game ends and its debrief is ready, you get a notification; click it to open the debrief.

The extension stays passive: it notes the game ID from the URL and your public player name and ID, which OpenFront caches in local storage, and sends them to your local coach. It never reads your private persistent ID, never changes the page, and never shows anything during a match.

### Without the extension

- **Paste a game.** Paste a game ID or link on the dashboard. Replay links work.
- **Import your history.** Set your public ID in Settings; the coach imports your recent games from OpenFront's public API every 10 minutes.
- **Use a saved record.** Load a saved game record (`.json`).

## How it works

```
openfront.io ──(game ID, after you play)──▶ extension ──▶ local coach (localhost:5317)
                                                              │
         api.openfront.io/public/game/:id  ◀── waits for the archive (published at game end)
                                                              │
   github.com/openfrontio/OpenFrontIO @ record.gitCommit ──▶ sparse checkout + esbuild harness
                                                              │
                                      sandboxed replay (Node permission model), every hash checked
                                                              │
               metrics ▸ key moments ▸ scores ▸ Jev judgments ▸ Claude debrief ▸ dashboard
```

1. **Exact replay.** OpenFront's simulation is deterministic within a build, and every archived record names the commit that played it. The coach makes a sparse, shallow checkout of that commit's engine packages and map files, bundles a small harness against them with esbuild, and re-runs the game.
   - It checks each checkpoint hash the live clients agreed on, so the replay is the game that was actually played.
   - A 25-player, 12-minute public game replays in about 20 seconds.
2. **Sandbox.** The downloaded engine runs in a child process with three layers of protection:
   - An empty environment, so it never sees your API keys or shell secrets.
   - Node's permission model: it can read only its own bundle, the map and the record, can write only its one output file, and can't spawn processes.
   - An OS sandbox with no network at all: `sandbox-exec` on macOS, `unshare -rn` on Linux.

   Engines are only fetched for commits from OpenFront's archive, or, for imported records, commits on OpenFront's main or release branches. A watchdog stops any replay that stalls.
3. **Measurement.** The harness samples every human and nation (territory, troops, troop cap, gold, units, attacks) and records your intents with their context, such as your army and the defender's when you attacked. It credits every captured tile to the attack that took it, using the engine's own tile updates.
4. **Coaching rules.** The rules come from the engine's formulas. Two examples:
   - Troop regen is `(10 + troops^0.73/4) · (1 − troops/cap)`, which peaks at 42% of the cap.
   - Attacks with a stack under ~60% of the defender's army pay up to double losses.

   Community strategy guides inform the rest. See [docs/strategy-notes.md](docs/strategy-notes.md).
5. **Fallback.** Games from builds older than OpenFront's October 2025 engine package split get a stats-and-actions analysis from the record alone.

## Development

```bash
npm run dev
```

`npm run dev` starts the API with reload and the Vite dashboard at :5318.

```bash
npm test
```

Useful scripts:

- `npx tsx scripts/try-replay.ts <gameId>`: replay a game and print the harness output.
- `npx tsx scripts/try-analyze.ts <gameId> <username>`: print the full analysis for one player.
- `npx tsx scripts/reanalyze.ts [gameId ...]`: re-run the analysis for your games from their cached replays, keeping each written debrief. Use it after the analysis changes; with no IDs it covers every game.
- `npx tsx scripts/try-ai.ts <gameId> <username>`: run analysis, then Jev and the narrator.
- `node scripts/extension-sim.mjs <game url> <username> [publicId]`: run the real extension code against the coach.

Data (SQLite database, cached records, engine builds, replays) lives in `./data`.

The API listens on 127.0.0.1 only. It accepts requests addressed to `localhost`, and browser requests only from the dashboard itself. The extension may only report games and read their status. Every other write needs the per-install token in `data/api-token`, which the server injects into the dashboard page.

## License

AGPL-3.0, matching OpenFront, whose engine the coach downloads and runs.
