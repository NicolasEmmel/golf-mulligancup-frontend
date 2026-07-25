export enum Gender {
  Male = 0,
  Female = 1,
}

export enum LeaderboardCategory {
  Men = 0,
  Women = 1,
  Seniors = 2,
}

export interface Player {
  uuid: string;
  name: string;
  handicapIndex: number;
  gender: Gender;
  isSenior: boolean;
}

export interface Hole {
  number: number;
  par: number;
  strokeIndex: number;
}

export interface Flight {
  day: number;
  number: number;
}

export interface PlayerFlight {
  day: number;
  flightNumber: number;
  playerUuid: string;
  gender: Gender;
}

export interface PlayerScore {
  day: number;
  playerUuid: string;
  holeId: number;
  strokes: number;
}

export interface LeaderboardEntry {
  day: number;
  playerUuid: string;
  playerName: string;
  totalStrokesDay: number;
  totalStrokes: number;
  gross: number;
  netto: number;
  /** Gross to-par for the current leaderboard day (starts at 0 each day). */
  toParDay: number;
  /** Sum of daily to-par values through this day. */
  toParTotal: number;
  gender: Gender;
  thru: number;
  position: number;
}

export interface TournamentState {
  currentDay: number;
  totalDays: number;
}

export interface OperationResult {
  success: boolean;
  error?: string | null;
}

export interface ScorecardHole {
  holeId: number;
  par: number;
  strokes: number;
  netStrokes: number;
}

export interface PlayerScorecard {
  playerUuid: string;
  playerName: string;
  day: number;
  flightNumber: number;
  holes: ScorecardHole[];
  gross: number;
  net: number;
  thru: number;
}

export interface LeaderboardSnapshot {
  day: number;
  category: LeaderboardCategory;
  entries: LeaderboardEntry[];
}

export interface ClientSyncPayload {
  currentDay: number;
  scorecard: PlayerScorecard | null;
  leaderboards: LeaderboardSnapshot[];
  dayScores: PlayerScore[];
}

export interface CreatePlayerRequest {
  name: string;
  handicapIndex: number;
  gender: Gender;
  isSenior?: boolean;
}

export interface UpdatePlayerRequest {
  name: string;
  handicapIndex: number;
  gender: Gender;
  isSenior: boolean;
}

export interface CreateFlightRequest {
  day: number;
  number: number;
}

export interface AssignPlayerToFlightRequest {
  day: number;
  flightNumber: number;
  playerUuid: string;
}

export interface SubmitScoreRequest {
  day: number;
  playerUuid: string;
  holeId: number;
  strokes: number;
}

export interface SetCurrentDayRequest {
  day: number;
}

export interface ResetTournamentRequest {
  totalDays?: number;
}
