"use client";

import { Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FairwayShell } from "@/components/common/FairwayShell";
import { LoadingState } from "@/components/common/LoadingState";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { useSignalR } from "@/context/SignalRContext";
import { pickLeaderboardEntries } from "@/lib/leaderboard";

export default function DisplayPage() {
  const { leaderboards, registerLeaderboardViewer, ensureConnected } =
    useSignalR();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await ensureConnected();
        await registerLeaderboardViewer();
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ensureConnected, registerLeaderboardViewer]);

  const entries = useMemo(
    () => pickLeaderboardEntries(leaderboards),
    [leaderboards],
  );

  return (
    <FairwayShell className="min-h-screen">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <Trophy className="h-16 w-16 text-primary" />
            <div>
              <h1 className="text-5xl font-black tracking-tight text-primary md:text-6xl">
                RANGLISTE
              </h1>
              <p className="mt-2 text-xl text-muted">Mulligan-Cup 2026</p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex-1 text-lg [&_table]:text-base [&_th]:py-4 [&_td]:py-4">
          {!ready && entries.length === 0 ? (
            <LoadingState message="Verbinden…" />
          ) : (
            <LeaderboardTable entries={entries} />
          )}
        </div>
      </div>
    </FairwayShell>
  );
}
