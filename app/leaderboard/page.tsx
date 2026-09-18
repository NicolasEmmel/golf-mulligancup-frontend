"use client";

import { Flag, Home, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CircularAction } from "@/components/common/CircularAction";
import { ConnectionStatus } from "@/components/common/ConnectionStatus";
import { FairwayShell } from "@/components/common/FairwayShell";
import { FilterChip } from "@/components/common/FilterChip";
import { LoadingState } from "@/components/common/LoadingState";
import { MintCard } from "@/components/common/MintCard";
import { FlightLeaderboardTable } from "@/components/leaderboard/FlightLeaderboardTable";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { useSignalR } from "@/context/SignalRContext";
import { routes } from "@/lib/constants";
import { normalizeError } from "@/lib/errors";
import { pickLeaderboardEntries } from "@/lib/leaderboard";
import type {
  FlightLeaderboardSnapshot,
  LeaderboardSnapshot,
} from "@/models/tournament";
import { tournamentApi } from "@/services/api/tournamentApi";

type LeaderboardView = "individual" | "flights";

export default function LeaderboardPage() {
  const {
    connectionState,
    leaderboards,
    flightLeaderboard,
    registerLeaderboardViewer,
    ensureConnected,
  } = useSignalR();
  const [view, setView] = useState<LeaderboardView>("individual");
  const [bootError, setBootError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [restBoards, setRestBoards] = useState<LeaderboardSnapshot[]>([]);
  const [restFlightBoard, setRestFlightBoard] =
    useState<FlightLeaderboardSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [boards, flights] = await Promise.all([
          tournamentApi.getLeaderboards(),
          tournamentApi.getFlightLeaderboard(),
        ]);
        if (!cancelled) {
          setRestBoards(boards);
          setRestFlightBoard(flights);
        }
      } catch {
        /* live register may still fill the table */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (connectionState !== "connected") return;

    let cancelled = false;
    (async () => {
      try {
        await registerLeaderboardViewer();
        if (!cancelled) {
          setBootError(null);
          setReady(true);
        }
      } catch (err) {
        if (!cancelled) setBootError(normalizeError(err));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [connectionState, registerLeaderboardViewer]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await ensureConnected();
      } catch (err) {
        if (!cancelled) setBootError(normalizeError(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ensureConnected]);

  const boards = leaderboards.length > 0 ? leaderboards : restBoards;
  const flightBoard = flightLeaderboard ?? restFlightBoard;

  const individualEntries = useMemo(
    () => pickLeaderboardEntries(boards),
    [boards],
  );

  const flightEntries = flightBoard?.entries ?? [];
  const showTable =
    ready || boards.length > 0 || (flightBoard?.entries.length ?? 0) > 0;

  return (
    <FairwayShell>
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-6">
        <MintCard className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-black tracking-wide text-primary">
                RANGLISTE
              </h1>
              <p className="text-xs text-muted">Live-Updates</p>
            </div>
          </div>
          <ConnectionStatus state={connectionState} />
        </MintCard>

        <div className="mt-4 flex flex-wrap gap-2">
          <FilterChip
            label="Einzel"
            selected={view === "individual"}
            onClick={() => setView("individual")}
          />
          <FilterChip
            label="Flights (Team)"
            selected={view === "flights"}
            onClick={() => setView("flights")}
          />
        </div>

        <div className="mt-4 flex-1 space-y-3">
          {bootError && !showTable ? (
            <p className="rounded-xl bg-error/10 p-4 text-error">{bootError}</p>
          ) : null}
          {bootError && showTable ? (
            <p className="rounded-xl bg-warning/15 px-4 py-2 text-sm text-warning">
              Live-Verbindung verzögert — aktuelle Rangliste wird trotzdem
              angezeigt. ({bootError})
            </p>
          ) : null}
          {!showTable ? (
            <LoadingState message="Verbindung zur Live-Rangliste…" />
          ) : view === "individual" ? (
            <LeaderboardTable entries={individualEntries} />
          ) : (
            <FlightLeaderboardTable entries={flightEntries} />
          )}
        </div>

        <div className="mt-6 flex justify-center gap-6 pb-4">
          <CircularAction label="Start" icon={<Home />} href={routes.home} />
          <CircularAction
            label="Scoring"
            icon={<Flag />}
            variant="primary"
            href={routes.scoring}
          />
        </div>
      </div>
    </FairwayShell>
  );
}
