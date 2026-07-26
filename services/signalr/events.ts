/** Hub method names (client → server). Must match TournamentHub. */
export const TournamentHubMethods = {
  registerScoringClient: "RegisterScoringClient",
  registerLeaderboardViewer: "RegisterLeaderboardViewer",
  submitScore: "SubmitScore",
  submitScores: "SubmitScores",
} as const;

/** Client event names (server → client). Must match backend SendAsync names. */
export const TournamentHubEvents = {
  receiveSyncState: "ReceiveSyncState",
  scorecardUpdated: "ScorecardUpdated",
  leaderboardUpdated: "LeaderboardUpdated",
} as const;

export type SignalRConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "failed";
