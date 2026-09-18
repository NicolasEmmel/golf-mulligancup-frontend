import type { HubConnection } from "@microsoft/signalr";
import type {
  ClientSyncPayload,
  FlightLeaderboardSnapshot,
  LeaderboardSnapshot,
  OperationResult,
  PlayerScorecard,
  SubmitScoreRequest,
  SubmitScoresRequest,
} from "@/models/tournament";
import { TournamentHubEvents, TournamentHubMethods } from "./events";

export function attachTournamentHubHandlers(
  connection: HubConnection,
  handlers: {
    onSyncState?: (payload: ClientSyncPayload) => void;
    onScorecardUpdated?: (scorecard: PlayerScorecard) => void;
    onLeaderboardUpdated?: (snapshot: LeaderboardSnapshot) => void;
    onFlightLeaderboardUpdated?: (snapshot: FlightLeaderboardSnapshot) => void;
  },
) {
  if (handlers.onSyncState) {
    connection.on(TournamentHubEvents.receiveSyncState, handlers.onSyncState);
  }
  if (handlers.onScorecardUpdated) {
    connection.on(
      TournamentHubEvents.scorecardUpdated,
      handlers.onScorecardUpdated,
    );
  }
  if (handlers.onLeaderboardUpdated) {
    connection.on(
      TournamentHubEvents.leaderboardUpdated,
      handlers.onLeaderboardUpdated,
    );
  }
  if (handlers.onFlightLeaderboardUpdated) {
    connection.on(
      TournamentHubEvents.flightLeaderboardUpdated,
      handlers.onFlightLeaderboardUpdated,
    );
  }

  return () => {
    connection.off(TournamentHubEvents.receiveSyncState);
    connection.off(TournamentHubEvents.scorecardUpdated);
    connection.off(TournamentHubEvents.leaderboardUpdated);
    connection.off(TournamentHubEvents.flightLeaderboardUpdated);
  };
}

export async function registerScoringClient(
  connection: HubConnection,
  playerUuid: string,
): Promise<OperationResult> {
  return connection.invoke<OperationResult>(
    TournamentHubMethods.registerScoringClient,
    playerUuid,
  );
}

export async function registerLeaderboardViewer(
  connection: HubConnection,
): Promise<void> {
  await connection.invoke(TournamentHubMethods.registerLeaderboardViewer);
}

export async function submitScore(
  connection: HubConnection,
  request: SubmitScoreRequest,
): Promise<OperationResult> {
  return connection.invoke<OperationResult>(
    TournamentHubMethods.submitScore,
    request,
  );
}

export async function submitScores(
  connection: HubConnection,
  request: SubmitScoresRequest,
): Promise<OperationResult> {
  return connection.invoke<OperationResult>(
    TournamentHubMethods.submitScores,
    request,
  );
}
