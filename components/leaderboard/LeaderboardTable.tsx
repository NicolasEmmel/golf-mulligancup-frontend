import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/models/tournament";

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

/** Sort by gross to-par, lowest first; re-rank for display. */
function sortByToPar(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries]
    .sort((a, b) => {
      const totalDiff = a.toParTotal - b.toParTotal;
      if (totalDiff !== 0) return totalDiff;
      const dayDiff = a.toParDay - b.toParDay;
      if (dayDiff !== 0) return dayDiff;
      return a.playerName.localeCompare(b.playerName, "de");
    })
    .map((entry, index) => ({ ...entry, position: index + 1 }));
}

export function LeaderboardTable({ entries }: { entries: LeaderboardEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="py-10 text-center text-muted">
        Noch keine Spieler mit erfassten Löchern.
      </p>
    );
  }

  const ranked = sortByToPar(entries);

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
            <th className="px-1 py-3 text-center sm:px-3">Thru</th>
            <th className="px-1 py-3 text-center sm:px-3">Brutto</th>
            <th className="px-1 py-3 text-center sm:px-3">Netto</th>
            <th className="px-1 py-3 text-center sm:px-3">+/−</th>
            <th className="px-1 py-3 text-center sm:px-3">M</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((entry) => (
            <tr
              key={entry.playerUuid}
              className="border-b border-border/60 last:border-0"
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
                {entry.thru >= 18 ? "F" : entry.thru}
              </td>
              <td className="px-1 py-3 text-center font-semibold tabular-nums sm:px-3">
                {grossStrokes(entry)}
              </td>
              <td className="px-1 py-3 text-center font-semibold tabular-nums sm:px-3">
                {netStrokes(entry)}
              </td>
              <td
                className={cn(
                  "px-1 py-3 text-center font-bold tabular-nums sm:px-3",
                  toParClass(entry.toParTotal ?? 0),
                )}
              >
                {formatToPar(entry.toParTotal ?? 0)}
              </td>
              <td className="px-1 py-3 text-center font-semibold tabular-nums sm:px-3">
                {entry.mulligans ?? 0}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
