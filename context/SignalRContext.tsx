"use client";

import {
  HubConnection,
  HubConnectionState,
} from "@microsoft/signalr";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  ClientSyncPayload,
  FlightLeaderboardSnapshot,
  LeaderboardSnapshot,
  OperationResult,
  PlayerScorecard,
  SubmitScoreRequest,
  SubmitScoresRequest,
} from "@/models/tournament";
import {
  createTournamentHubConnection,
  mapHubState,
} from "@/services/signalr/connection";
import type { SignalRConnectionState } from "@/services/signalr/events";
import {
  attachTournamentHubHandlers,
  registerLeaderboardViewer as hubRegisterLeaderboard,
  registerScoringClient as hubRegisterScoring,
  submitScore as hubSubmitScore,
  submitScores as hubSubmitScores,
} from "@/services/signalr/tournamentHub";

type RegistrationMode =
  | { kind: "none" }
  | { kind: "leaderboard" }
  | { kind: "scoring"; playerUuid: string };

interface SignalRContextValue {
  connectionState: SignalRConnectionState;
  lastError: string | null;
  syncPayload: ClientSyncPayload | null;
  scorecard: PlayerScorecard | null;
  leaderboards: LeaderboardSnapshot[];
  flightLeaderboard: FlightLeaderboardSnapshot | null;
  registeredPlayerUuid: string | null;
  ensureConnected: () => Promise<HubConnection>;
  registerScoringClient: (playerUuid: string) => Promise<OperationResult>;
  registerLeaderboardViewer: () => Promise<void>;
  submitScore: (request: SubmitScoreRequest) => Promise<OperationResult>;
  submitScores: (request: SubmitScoresRequest) => Promise<OperationResult>;
  clearSync: () => void;
}

const SignalRContext = createContext<SignalRContextValue | null>(null);

export function SignalRProvider({ children }: { children: ReactNode }) {
  const connectionRef = useRef<HubConnection | null>(null);
  const connectingPromiseRef = useRef<Promise<HubConnection> | null>(null);
  const registrationRef = useRef<RegistrationMode>({ kind: "none" });
  const [connectionState, setConnectionState] =
    useState<SignalRConnectionState>("connecting");
  const [lastError, setLastError] = useState<string | null>(null);
  const [syncPayload, setSyncPayload] = useState<ClientSyncPayload | null>(
    null,
  );
  const [scorecard, setScorecard] = useState<PlayerScorecard | null>(null);
  const [leaderboards, setLeaderboards] = useState<LeaderboardSnapshot[]>([]);
  const [flightLeaderboard, setFlightLeaderboard] =
    useState<FlightLeaderboardSnapshot | null>(null);
  const [registeredPlayerUuid, setRegisteredPlayerUuid] = useState<
    string | null
  >(null);

  const applySync = useCallback((payload: ClientSyncPayload) => {
    setSyncPayload(payload);
    const reg = registrationRef.current;
    if (reg.kind === "scoring") {
      if (payload.scorecard?.playerUuid === reg.playerUuid) {
        setScorecard(payload.scorecard);
      }
    } else {
      setScorecard(payload.scorecard);
    }
    setLeaderboards(payload.leaderboards ?? []);
    setFlightLeaderboard(payload.flightLeaderboard ?? null);
  }, []);

  const reRegister = useCallback(async (connection: HubConnection) => {
    const reg = registrationRef.current;
    if (reg.kind === "leaderboard") {
      await hubRegisterLeaderboard(connection);
    } else if (reg.kind === "scoring") {
      await hubRegisterScoring(connection, reg.playerUuid);
    }
  }, []);

  const ensureConnected = useCallback(async () => {
    if (
      connectionRef.current &&
      connectionRef.current.state === HubConnectionState.Connected
    ) {
      return connectionRef.current;
    }

    if (connectingPromiseRef.current) {
      return connectingPromiseRef.current;
    }

    connectingPromiseRef.current = (async () => {
      if (!connectionRef.current) {
        const connection = createTournamentHubConnection();
        connectionRef.current = connection;

        attachTournamentHubHandlers(connection, {
          onSyncState: applySync,
          onScorecardUpdated: (card) => {
            const reg = registrationRef.current;
            // Only keep the registered scorer's card — flight-mate submits must not
            // overwrite the local player's scorecard in shared state.
            if (reg.kind === "scoring" && card.playerUuid !== reg.playerUuid) {
              return;
            }
            setScorecard(card);
          },
          onLeaderboardUpdated: (snapshot) => {
            setLeaderboards((prev) => {
              const others = prev.filter(
                (s) => s.category !== snapshot.category,
              );
              return [...others, snapshot].sort(
                (a, b) => a.category - b.category,
              );
            });
          },
          onFlightLeaderboardUpdated: (snapshot) => {
            setFlightLeaderboard(snapshot);
          },
        });

        connection.onreconnecting(() => {
          setConnectionState("reconnecting");
        });
        connection.onreconnected(() => {
          setConnectionState("connected");
          setLastError(null);
          void reRegister(connection).catch((error) => {
            const message =
              error instanceof Error
                ? error.message
                : "Erneute Registrierung fehlgeschlagen";
            setLastError(message);
          });
        });
        connection.onclose(() => {
          setConnectionState("disconnected");
        });
      }

      const connection = connectionRef.current;
      if (connection.state !== HubConnectionState.Connected) {
        setConnectionState("connecting");
        try {
          if (connection.state === HubConnectionState.Disconnected) {
            await connection.start();
          } else {
            // Another start is in flight — wait until Connected or terminal.
            const deadline = Date.now() + 30_000;
            while (Date.now() < deadline) {
              const state = connection.state as HubConnectionState;
              if (state === HubConnectionState.Connected) break;
              if (
                state === HubConnectionState.Disconnected ||
                state === HubConnectionState.Disconnecting
              ) {
                await connection.start();
                break;
              }
              await new Promise((r) => setTimeout(r, 50));
            }
          }
          if (
            (connection.state as HubConnectionState) !==
            HubConnectionState.Connected
          ) {
            throw new Error("Verbindung nicht rechtzeitig hergestellt");
          }
          setConnectionState("connected");
          setLastError(null);
        } catch (error) {
          setConnectionState("failed");
          const message =
            error instanceof Error ? error.message : "Verbindung fehlgeschlagen";
          setLastError(message);
          throw error;
        }
      }

      setConnectionState(mapHubState(connection.state) as SignalRConnectionState);
      return connection;
    })().finally(() => {
      connectingPromiseRef.current = null;
    });

    return connectingPromiseRef.current;
  }, [applySync, reRegister]);

  useEffect(() => {
    void ensureConnected().catch(() => {
      // State already updated to failed inside ensureConnected.
    });
    return () => {
      void connectionRef.current?.stop();
      connectionRef.current = null;
    };
  }, [ensureConnected]);

  const registerScoringClient = useCallback(
    async (playerUuid: string) => {
      const connection = await ensureConnected();
      registrationRef.current = { kind: "scoring", playerUuid };
      setRegisteredPlayerUuid(playerUuid);
      const result = await hubRegisterScoring(connection, playerUuid);
      if (!result.success) {
        setLastError(result.error ?? "Registrierung fehlgeschlagen");
        registrationRef.current = { kind: "none" };
        setRegisteredPlayerUuid(null);
      }
      return result;
    },
    [ensureConnected],
  );

  const registerLeaderboardViewer = useCallback(async () => {
    const connection = await ensureConnected();
    registrationRef.current = { kind: "leaderboard" };
    setRegisteredPlayerUuid(null);
    await hubRegisterLeaderboard(connection);
    setLastError(null);
  }, [ensureConnected]);

  const submitScore = useCallback(
    async (request: SubmitScoreRequest) => {
      const connection = await ensureConnected();
      const result = await hubSubmitScore(connection, request);
      if (!result.success) {
        setLastError(result.error ?? "Ergebnis konnte nicht gesendet werden");
      }
      return result;
    },
    [ensureConnected],
  );

  const submitScores = useCallback(
    async (request: SubmitScoresRequest) => {
      const connection = await ensureConnected();
      const result = await hubSubmitScores(connection, request);
      if (!result.success) {
        setLastError(result.error ?? "Ergebnis konnte nicht gesendet werden");
      }
      return result;
    },
    [ensureConnected],
  );

  const clearSync = useCallback(() => {
    registrationRef.current = { kind: "none" };
    setRegisteredPlayerUuid(null);
    setSyncPayload(null);
    setScorecard(null);
    setLeaderboards([]);
    setFlightLeaderboard(null);
  }, []);

  const value = useMemo(
    () => ({
      connectionState,
      lastError,
      syncPayload,
      scorecard,
      leaderboards,
      flightLeaderboard,
      registeredPlayerUuid,
      ensureConnected,
      registerScoringClient,
      registerLeaderboardViewer,
      submitScore,
      submitScores,
      clearSync,
    }),
    [
      connectionState,
      lastError,
      syncPayload,
      scorecard,
      leaderboards,
      flightLeaderboard,
      registeredPlayerUuid,
      ensureConnected,
      registerScoringClient,
      registerLeaderboardViewer,
      submitScore,
      submitScores,
      clearSync,
    ],
  );

  return (
    <SignalRContext.Provider value={value}>{children}</SignalRContext.Provider>
  );
}

export function useSignalR() {
  const ctx = useContext(SignalRContext);
  if (!ctx) {
    throw new Error("useSignalR must be used within SignalRProvider");
  }
  return ctx;
}
