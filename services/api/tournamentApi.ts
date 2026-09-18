import type {
  AssignPlayerToFlightRequest,
  CreateFlightRequest,
  Flight,
  FlightLeaderboardSnapshot,
  Hole,
  LeaderboardSnapshot,
  OperationResult,
  PlayerFlight,
  PlayerScorecard,
  TournamentState,
} from "@/models/tournament";
import { TOURNAMENT_DAY } from "@/lib/constants";
import { apiFetch } from "./http";

export interface CourseInfo {
  par: number;
  holes: Hole[];
}

export const tournamentApi = {
  getState: () => apiFetch<TournamentState>("/api/tournament/state"),
  reset: () =>
    apiFetch<OperationResult>("/api/tournament/reset", {
      method: "POST",
    }),
  getCourse: () => apiFetch<CourseInfo>("/api/tournament/course"),
  getLeaderboards: () =>
    apiFetch<LeaderboardSnapshot[]>("/api/tournament/leaderboards"),
  getFlightLeaderboard: () =>
    apiFetch<FlightLeaderboardSnapshot>("/api/tournament/flight-leaderboard"),
  getScorecard: (playerUuid: string) =>
    apiFetch<PlayerScorecard>(`/api/tournament/scorecard/${playerUuid}`),
} as const;

export const flightApi = {
  list: () => apiFetch<Flight[]>("/api/flights"),
  listForDay: (day: number = TOURNAMENT_DAY) =>
    apiFetch<Flight[]>(`/api/flights/${day}`),
  create: (body: CreateFlightRequest) =>
    apiFetch<Flight>("/api/flights", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  assign: (body: AssignPlayerToFlightRequest) =>
    apiFetch<PlayerFlight>("/api/flights/assign", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  unassign: (day: number, playerUuid: string) =>
    apiFetch<OperationResult>(`/api/flights/${day}/players/${playerUuid}`, {
      method: "DELETE",
    }),
  playersInFlight: (day: number, flightNumber: number) =>
    apiFetch<PlayerFlight[]>(`/api/flights/${day}/${flightNumber}/players`),
} as const;
