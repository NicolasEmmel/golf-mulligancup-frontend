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

/** Sort by cumulative to-par (Gesamt), lowest first; re-rank for display. */
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
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-mint text-xs font-bold uppercase tracking-wide text-primary">
            <th className="px-3 py-3">#</th>
            <th className="px-3 py-3">Spieler</th>
            <th className="px-3 py-3 text-center">Thru</th>
            <th className="px-3 py-3 text-center">Heute</th>
            <th className="px-3 py-3 text-center">Gesamt</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((entry) => (
            <tr
              key={entry.playerUuid}
              className="border-b border-border/60 last:border-0"
            >
              <td className="px-3 py-3">
                <span
                  className={cn(
                    "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                    rankClass(entry.position),
                  )}
                >
                  {entry.position}
                </span>
              </td>
              <td className="px-3 py-3 font-extrabold text-foreground">
                {entry.playerName}
              </td>
              <td className="px-3 py-3 text-center font-semibold tabular-nums">
                {entry.thru >= 18 ? "F" : entry.thru}
              </td>
              <td
                className={cn(
                  "px-3 py-3 text-center font-semibold tabular-nums",
                  toParClass(entry.toParDay ?? 0),
                )}
              >
                {formatToPar(entry.toParDay ?? 0)}
              </td>
              <td
                className={cn(
                  "px-3 py-3 text-center font-bold tabular-nums",
                  toParClass(entry.toParTotal ?? 0),
                )}
              >
                {formatToPar(entry.toParTotal ?? 0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
