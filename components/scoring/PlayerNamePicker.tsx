"use client";

import { Search, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { MintCard } from "@/components/common/MintCard";
import type { Player } from "@/models/tournament";

export function PlayerNamePicker({
  players,
  loading,
  error,
  onSelect,
}: {
  players: Player[];
  loading: boolean;
  error: string | null;
  onSelect: (player: Player) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return players;
    return players.filter((p) => p.name.toLowerCase().includes(q));
  }, [players, query]);

  if (loading) {
    return <LoadingState message="Spieler werden geladen…" />;
  }

  if (error) {
    return (
      <EmptyState title="Spieler konnten nicht geladen werden" message={error} />
    );
  }

  return (
    <div className="space-y-4">
      <MintCard>
        <label className="block text-sm font-semibold text-primary" htmlFor="player-search">
          Namen suchen
        </label>
        <div className="relative mt-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            id="player-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Namen eingeben…"
            className="w-full rounded-xl border border-border bg-surface py-3 pl-10 pr-3 text-base outline-none ring-primary focus:ring-2"
            autoComplete="off"
          />
        </div>
        <p className="mt-2 text-xs text-muted">
          Wählen Sie Ihren Namen, um für Ihren Flight zu scoren. Kein QR-Code
          nötig.
        </p>
      </MintCard>

      {filtered.length === 0 ? (
        <EmptyState
          title="Keine passenden Spieler"
          message="Bitten Sie einen Admin, Sie hinzuzufügen, oder prüfen Sie die Schreibweise."
        />
      ) : (
        <ul className="space-y-2">
          {filtered.map((player) => (
            <li key={player.uuid}>
              <button
                type="button"
                onClick={() => onSelect(player)}
                className="flex w-full items-center gap-3 rounded-xl bg-surface-translucent px-4 py-3 text-left shadow-sm transition hover:bg-white/60"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-mint text-primary">
                  <UserRound className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-base font-extrabold">
                    {player.name}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
