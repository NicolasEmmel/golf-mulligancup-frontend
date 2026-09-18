export const APP_NAME = "Mulligan-Cup 2026";
export const APP_TAGLINE = "Presented by GC Kitzingen";

/** Must match backend `TournamentConfiguration.Day`. */
export const TOURNAMENT_DAY = 1;

/** Match backend flight size limits (3–4 players per group). */
export const FLIGHT_MIN_PLAYERS = 3;
export const FLIGHT_MAX_PLAYERS = 4;

export const routes = {
  home: "/",
  leaderboard: "/leaderboard",
  scoring: "/scoring",
  randomizer: "/randomizer",
  display: "/display",
  admin: "/admin",
  adminPlayers: "/admin/players",
  adminFlights: "/admin/flights",
  adminTournament: "/admin/tournament",
} as const;
