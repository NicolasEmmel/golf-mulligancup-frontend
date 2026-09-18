"use client";

import { useMemo, useState } from "react";
import { SortableColumnHeader } from "@/components/leaderboard/SortableColumnHeader";
import { cn } from "@/lib/utils";
import type { FlightLeaderboardEntry } from "@/models/tournament";

type SortKey = "gross" | "net";

function rankClass(position: number) {
  if (position === 1) return "bg-rank-gold text-white";
  if (position === 2) return "bg-rank-silver text-white";
  if (position === 3) return "bg-rank-bronze text-white";
  return "bg-primary/15 text-primary";
}

function formatAverage(value: number): string {
  return value.toLocaleString("de-DE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function hasTeamScores(entry: FlightLeaderboardEntry): boolean {
  return entry.hasScores === true;
}

function sortFlightEntries(
  entries: FlightLeaderboardEntry[],
  sortKey: SortKey,
  descending: boolean,
): FlightLeaderboardEntry[] {
  const scored = entries.filter(hasTeamScores);
  const unscored = entries.filter((e) => !hasTeamScores(e));

  const value = (e: FlightLeaderboardEntry) =>
    sortKey === "gross" ? e.averageGross : e.averageNet;

  const sortedScored = [...scored].sort((a, b) => {
    const diff = value(a) - value(b);
    if (diff !== 0) {
      return descending ? -diff : diff;
    }
    return a.flightNumber - b.flightNumber;
  });

  const sortedUnscored = [...unscored].sort(
    (a, b) => a.flightNumber - b.flightNumber,
  );

  return [...sortedScored, ...sortedUnscored].map((entry, index) => ({
    ...entry,
    position: index + 1,
  }));
}

export function FlightLeaderboardTable({
  entries,
}: {
  entries: FlightLeaderboardEntry[];
}) {
  const [sortKey, setSortKey] = useState<SortKey>("net");
  const [descending, setDescending] = useState(true);

  const ranked = useMemo(
    () => sortFlightEntries(entries, sortKey, descending),
    [entries, sortKey, descending],
  );

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setDescending((d) => !d);
      return;
    }
    setSortKey(key);
    setDescending(key === "net");
  };

  if (entries.length === 0) {
    return (
      <p className="py-10 text-center text-muted">
        Noch keine Flights angelegt.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl bg-surface/90 shadow-[var(--shadow-soft)]">
      <table className="w-full table-fixed text-left text-sm sm:table-auto">
        <colgroup>
          <col className="w-10 sm:w-auto" />
          <col />
          <col className="w-14 sm:w-auto" />
          <col className="w-14 sm:w-auto" />
        </colgroup>
        <thead>
          <tr className="border-b border-border bg-surface-mint text-[0.65rem] font-bold uppercase tracking-wide text-primary sm:text-xs">
            <th className="px-2 py-3 sm:px-3">#</th>
            <th className="px-2 py-3 sm:px-3">Team</th>
            <SortableColumnHeader
              label="Ø Brutto"
              active={sortKey === "gross"}
              onClick={() => handleSort("gross")}
            />
            <SortableColumnHeader
              label="Ø Netto"
              active={sortKey === "net"}
              onClick={() => handleSort("net")}
            />
          </tr>
        </thead>
        <tbody>
          {ranked.map((entry) => {
            const started = hasTeamScores(entry);
            return (
              <tr
                key={entry.flightNumber}
                className={cn(
                  "border-b border-border/60 last:border-0",
                  !started && "text-muted",
                )}
              >
                <td className="px-2 py-3 sm:px-3">
                  <span
                    className={cn(
                      "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                      rankClass(entry.position),
                    )}
                  >
                    {entry.position}
                  </span>
                </td>
                <td className="px-2 py-3 font-semibold text-foreground sm:px-3">
                  {entry.playerNames && entry.playerNames.length > 0 ? (
                    <span className="block leading-snug">
                      {entry.playerNames.map((name, index) => (
                        <span key={`${entry.flightNumber}-${name}`}>
                          {index > 0 ? (
                            <span className="text-muted"> · </span>
                          ) : null}
                          <span className="font-extrabold">{name}</span>
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span className="font-extrabold text-muted">—</span>
                  )}
                </td>
                <td className="px-1 py-3 text-center font-semibold tabular-nums sm:px-3">
                  {started ? formatAverage(entry.averageGross) : "—"}
                </td>
                <td className="px-1 py-3 text-center font-semibold tabular-nums sm:px-3">
                  {started ? formatAverage(entry.averageNet) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
