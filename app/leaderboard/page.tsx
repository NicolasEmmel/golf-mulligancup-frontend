"use client";

import { Flag, Home, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CircularAction } from "@/components/common/CircularAction";
import { ConnectionStatus } from "@/components/common/ConnectionStatus";
import { FairwayShell } from "@/components/common/FairwayShell";
import { FilterChip } from "@/components/common/FilterChip";
import { LoadingState } from "@/components/common/LoadingState";
import { MintCard } from "@/components/common/MintCard";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { useSignalR } from "@/context/SignalRContext";
import { routes } from "@/lib/constants";
import { normalizeError } from "@/lib/errors";
import {
  LeaderboardCategory,
  type LeaderboardSnapshot,
} from "@/models/tournament";
import { tournamentApi } from "@/services/api/tournamentApi";

const categories: { id: LeaderboardCategory; label: string }[] = [
  { id: LeaderboardCategory.Men, label: "Herren" },
  { id: LeaderboardCategory.Women, label: "Damen" },
];

export default function LeaderboardPage() {
  const {
    connectionState,
    leaderboards,
    registerLeaderboardViewer,
    ensureConnected,
  } = useSignalR();
  const [category, setCategory] = useState<LeaderboardCategory>(
    LeaderboardCategory.Men,
  );
  const [bootError, setBootError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [restBoards, setRestBoards] = useState<LeaderboardSnapshot[]>([]);

  // Show scores ASAP via REST; SignalR then keeps them live.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const boards = await tournamentApi.getLeaderboards();
        if (!cancelled) setRestBoards(boards);
      } catch {
        /* live register may still fill the table */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Register (and retry) whenever we are connected — clears sticky boot errors.
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

  // Kick off connect if we landed here while still offline / connecting.
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

  const entries = useMemo(
    () => boards.find((s) => s.category === category)?.entries ?? [],
    [boards, category],
  );

  const showTable = ready || boards.length > 0;

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
          {categories.map((c) => (
            <FilterChip
              key={String(c.id)}
              label={c.label}
              selected={category === c.id}
              onClick={() => setCategory(c.id)}
            />
          ))}
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
          ) : (
            <LeaderboardTable entries={entries} />
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
