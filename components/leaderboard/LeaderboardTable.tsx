"use client";

import { useMemo, useState } from "react";
import { SortableColumnHeader } from "@/components/leaderboard/SortableColumnHeader";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/models/tournament";

type SortKey = "thru" | "gross" | "net" | "toPar" | "mulligans";

function rankClass(position: number) {
  if (position === 1) return "bg-rank-gold text-white";
  if (position === 2) return "bg-rank-silver text-white";
  if (position === 3) return "bg-rank-bronze text-white";
  return "bg-primary/15 text-primary";
}

function formatToPar(value: number): string {
  if (value === 0) return "E";
  if (value > 0) return `+${value}`;
  return String(value);
}

function toParClass(value: number): string {
  if (value < 0) return "text-error";
  if (value > 0) return "text-foreground";
  return "text-primary";
}

function grossStrokes(entry: LeaderboardEntry): number {
  return entry.gross ?? entry.totalStrokesDay ?? entry.totalStrokes ?? 0;
}

function netStrokes(entry: LeaderboardEntry): number {
  return entry.netto ?? 0;
}

function hasStartedRound(entry: LeaderboardEntry): boolean {
  return (entry.thru ?? 0) > 0;
}

function sortValue(entry: LeaderboardEntry, key: SortKey): number {
  switch (key) {
    case "thru":
      return entry.thru ?? 0;
    case "gross":
      return grossStrokes(entry);
    case "net":
      return netStrokes(entry);
    case "toPar":
      return entry.toParTotal ?? 0;
    case "mulligans":
      return entry.mulligans ?? 0;
  }
}

function defaultDescending(key: SortKey): boolean {
  return key === "thru" || key === "gross" || key === "net";
}

function sortEntries(
  entries: LeaderboardEntry[],
  sortKey: SortKey,
  descending: boolean,
): LeaderboardEntry[] {
  const scored = entries.filter(hasStartedRound);
  const unscored = entries.filter((e) => !hasStartedRound(e));

  const sortedScored = [...scored].sort((a, b) => {
    const diff = sortValue(a, sortKey) - sortValue(b, sortKey);
    if (diff !== 0) {
      return descending ? -diff : diff;
    }
    return a.playerName.localeCompare(b.playerName, "de");
  });

  const sortedUnscored = [...unscored].sort((a, b) =>
    a.playerName.localeCompare(b.playerName, "de"),
  );

  return [...sortedScored, ...sortedUnscored].map((entry, index) => ({
    ...entry,
    position: index + 1,
  }));
}

export function LeaderboardTable({ entries }: { entries: LeaderboardEntry[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("gross");
  const [descending, setDescending] = useState(true);

  const ranked = useMemo(
    () => sortEntries(entries, sortKey, descending),
    [entries, sortKey, descending],
  );

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setDescending((d) => !d);
      return;
    }
    setSortKey(key);
    setDescending(defaultDescending(key));
  };

  if (entries.length === 0) {
    return (
      <p className="py-10 text-center text-muted">
        Noch keine Spieler angelegt.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl bg-surface/90 shadow-[var(--shadow-soft)]">
      <table className="w-full table-fixed text-left text-sm sm:table-auto">
        <colgroup>
          <col className="w-10 sm:w-auto" />
          <col />
          <col className="w-11 sm:w-auto" />
          <col className="w-12 sm:w-auto" />
          <col className="w-12 sm:w-auto" />
          <col className="w-12 sm:w-auto" />
          <col className="w-10 sm:w-auto" />
        </colgroup>
        <thead>
          <tr className="border-b border-border bg-surface-mint text-[0.65rem] font-bold uppercase tracking-wide text-primary sm:text-xs">
            <th className="px-2 py-3 sm:px-3">#</th>
            <th className="px-2 py-3 sm:px-3">Spieler</th>
            <SortableColumnHeader
              label="Thru"
              active={sortKey === "thru"}
              onClick={() => handleSort("thru")}
            />
            <SortableColumnHeader
              label="Brutto"
              active={sortKey === "gross"}
              onClick={() => handleSort("gross")}
            />
            <SortableColumnHeader
              label="Netto"
              active={sortKey === "net"}
              onClick={() => handleSort("net")}
            />
            <SortableColumnHeader
              label="+/−"
              active={sortKey === "toPar"}
              onClick={() => handleSort("toPar")}
            />
            <SortableColumnHeader
              label="M"
              active={sortKey === "mulligans"}
              onClick={() => handleSort("mulligans")}
            />
          </tr>
        </thead>
        <tbody>
          {ranked.map((entry) => {
            const started = hasStartedRound(entry);
            return (
              <tr
                key={entry.playerUuid}
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
                <td className="truncate px-2 py-3 font-extrabold text-foreground sm:px-3">
                  {entry.playerName}
                </td>
                <td className="px-1 py-3 text-center font-semibold tabular-nums sm:px-3">
                  {!started ? "—" : entry.thru >= 18 ? "F" : entry.thru}
                </td>
                <td className="px-1 py-3 text-center font-semibold tabular-nums sm:px-3">
                  {started ? grossStrokes(entry) : "—"}
                </td>
                <td className="px-1 py-3 text-center font-semibold tabular-nums sm:px-3">
                  {started ? netStrokes(entry) : "—"}
                </td>
                <td
                  className={cn(
                    "px-1 py-3 text-center font-bold tabular-nums sm:px-3",
                    started ? toParClass(entry.toParTotal ?? 0) : "text-muted",
                  )}
                >
                  {started ? formatToPar(entry.toParTotal ?? 0) : "—"}
                </td>
                <td className="px-1 py-3 text-center font-semibold tabular-nums sm:px-3">
                  {started ? (entry.mulligans ?? 0) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
