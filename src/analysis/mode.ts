// Which rule set a game needs. Public lobbies come in very different shapes:
// a 2-team game is won by feeding the front and the team's combined land,
// while FFA and Duos/Trios/Quads reward the individual. See
// docs/strategy-notes.md ("Game modes").
import type { GameRecord } from "../openfront/types.js";

export interface PlayMode {
  /** Short name for prose: "FFA", "2-team", "Trios", "Humans vs Nations". */
  label: string;
  /** You have teammates (any Team game). Turns on donation and teammate-SAM checks. */
  teammates: boolean;
  /**
   * A few big teams (2–3 teams, or Humans vs Nations): the team's land wins,
   * personal land share says little, and diplomacy with other teams is moot.
   */
  bigTeams: boolean;
  /** Number of teams, when the config says. */
  teams: number | null;
  donations: boolean;
  nations: boolean;
  /** FFA Overtime: after 30 minutes the 80% win bar drops 2 points a minute. */
  overtime: boolean;
}

const SQUADS = new Set(["Duos", "Trios", "Quads"]);

export function playModeOf(record: GameRecord): PlayMode {
  const c = record.info.config;
  const isTeam = c.gameMode === "Team";
  const pt = c.playerTeams;
  const nations = c.nations !== "disabled" && c.disableNations !== true && c.disableNPCs !== true;
  const donations = c.donateTroops === true || c.donateGold === true;
  const overtime = !isTeam && !!(c.overtime as { enabled?: boolean } | undefined)?.enabled;
  if (!isTeam) return { label: "FFA", teammates: false, bigTeams: false, teams: null, donations, nations, overtime };
  if (typeof pt === "string" && SQUADS.has(pt)) return { label: pt, teammates: true, bigTeams: false, teams: null, donations, nations, overtime };
  if (typeof pt === "string") {
    // "Humans Vs Nations": every human on one side.
    return { label: "Humans vs Nations", teammates: true, bigTeams: true, teams: 2, donations, nations: true, overtime };
  }
  const teams = typeof pt === "number" ? pt : null;
  return { label: teams ? `${teams}-team` : "Team", teammates: true, bigTeams: teams !== null && teams <= 3, teams, donations, nations, overtime };
}
