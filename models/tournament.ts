export enum Gender {
  Male = 0,
  Female = 1,
}

export enum LeaderboardCategory {
  Men = 0,
  Women = 1,
  Seniors = 2,
  Overall = 3,
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
  usedMulligan?: boolean;
}

export interface LeaderboardEntry {
  day: number;
  playerUuid: string;
  playerName: string;
  totalStrokesDay: number;
  totalStrokes: number;
  gross: number;
  netto: number;
  netToPar?: number;
  toParDay: number;
  toParTotal: number;
  gender: Gender;
  thru: number;
  mulligans?: number;
  position: number;
}

/** Empty object from backend for single-day events. */
export type TournamentState = Record<string, never>;

export interface OperationResult {
  success: boolean;
  error?: string | null;
}

export interface ScorecardHole {
  holeId: number;
  par: number;
  strokes: number;
  netStrokes: number;
  usedMulligan?: boolean;
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
  mulligans?: number;
}

export interface LeaderboardSnapshot {
  day: number;
  category: LeaderboardCategory;
  entries: LeaderboardEntry[];
}

export interface FlightLeaderboardEntry {
  day: number;
  flightNumber: number;
  playerCount: number;
  averageGross: number;
  averageNet: number;
  position: number;
  hasScores?: boolean;
}

export interface FlightLeaderboardSnapshot {
  day: number;
  entries: FlightLeaderboardEntry[];
}

export interface ClientSyncPayload {
  scorecard: PlayerScorecard | null;
  leaderboards: LeaderboardSnapshot[];
  scores: PlayerScore[];
  flightLeaderboard?: FlightLeaderboardSnapshot | null;
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
  usedMulligan?: boolean;
}

export interface ScoreEntry {
  playerUuid: string;
  holeId: number;
  strokes: number;
  usedMulligan?: boolean;
}

export interface SubmitScoresRequest {
  day: number;
  scores: ScoreEntry[];
}
