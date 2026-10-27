# OpenFront Coach

A post-game coach for [OpenFront.io](https://openfront.io). Play as usual; when a game ends, the coach replays it tick by tick on the exact engine build it was played on, finds the moments that decided it, grades your play, and tells you what to do differently next game.

OpenFront's terms forbid real-time assistance, so the coach never reads or shows anything during a match. It only works from OpenFront's public archive, which publishes a game after it ends.

## What you get

- **Debrief.** A written review of your game: the story, three things to fix with timestamps, what to keep doing, and a plan for the next game. Your local Claude Code writes it, on your existing subscription.
- **Front-line chart.** Your share of the map against your main rivals, with key moments pinned to the curve using chess annotation glyphs: `!!` brilliant, `!` good, `?!` inaccuracy, `?` mistake, `??` blunder.
- **Key moments and map replay.** Each moment explains what happened, why it mattered and what to do instead. Selecting one jumps a territory-map replay to that point.
  - Detected moment types: slow openings, attacks that went badly, idle armies sitting at the troop cap, empty armies caught under attack, territory collapses (with who did it and why), big pushes, banked gold, late Cities, betrayals, nukes without SAM cover, lost transports.
- **Scorecard.** Expansion, economy, troop management, combat, defense, diplomacy, naval and nuclear play, each scored 0–100. Scores compare you with every other human in the same lobby and with absolute targets taken from the engine's own formulas.
- **Attack ledger and build order.** Every attack: troops sent, share of your army, the defender's army, troops used, tiles taken, efficiency.
- **Progress.** Trends across games for the numbers that matter, with goals from your drills.
- **Ask the coach.** Ask follow-up questions about a game, for example "why did I collapse at 7:58?".
- **Jev judge (optional).** [TypeSafe's Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev) reviews each key moment. It returns a calibrated severity, the probability the moment was avoidable, and which lesson it teaches, for about a tenth of a cent per game.

## Run it

Requirements: macOS or Linux, Node.js 20.19+, git. Optional: [Claude Code](https://claude.com/claude-code) logged in (for written debriefs), and a TypeSafe API key (for Jev).

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
2. **Sandbox.** The downloaded engine runs in a child process under Node's permission model. It can read only its own bundle, the map and the record, can write only the replay output, and can't spawn processes.
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
- `npx tsx scripts/try-ai.ts <gameId> <username>`: run analysis, then Jev and the narrator.
- `node scripts/extension-sim.mjs <game url> <username> [publicId]`: run the real extension code against the coach.

Data (SQLite database, cached records, engine builds, replays) lives in `./data`.

## License

AGPL-3.0, matching OpenFront, whose engine the coach downloads and runs.
