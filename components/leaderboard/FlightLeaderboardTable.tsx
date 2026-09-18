import { cn } from "@/lib/utils";
import type { FlightLeaderboardEntry } from "@/models/tournament";

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

export function FlightLeaderboardTable({
  entries,
}: {
  entries: FlightLeaderboardEntry[];
}) {
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
          <col className="w-12 sm:w-auto" />
          <col className="w-14 sm:w-auto" />
          <col className="w-14 sm:w-auto" />
        </colgroup>
        <thead>
          <tr className="border-b border-border bg-surface-mint text-[0.65rem] font-bold uppercase tracking-wide text-primary sm:text-xs">
            <th className="px-2 py-3 sm:px-3">#</th>
            <th className="px-2 py-3 sm:px-3">Flight</th>
            <th className="px-1 py-3 text-center sm:px-3">Spieler</th>
            <th className="px-1 py-3 text-center sm:px-3">Ø Brutto</th>
            <th className="px-1 py-3 text-center sm:px-3">Ø Netto</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
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
                <td className="px-2 py-3 font-extrabold text-foreground sm:px-3">
                  Flight {entry.flightNumber}
                </td>
                <td className="px-1 py-3 text-center font-semibold tabular-nums sm:px-3">
                  {entry.playerCount}
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
