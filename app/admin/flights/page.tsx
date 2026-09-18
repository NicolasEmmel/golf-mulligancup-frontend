"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FairwayShell } from "@/components/common/FairwayShell";
import { LoadingState } from "@/components/common/LoadingState";
import { MintCard } from "@/components/common/MintCard";
import { routes, FLIGHT_MAX_PLAYERS, TOURNAMENT_DAY } from "@/lib/constants";
import { normalizeError } from "@/lib/errors";
import type { Flight, Player, PlayerFlight } from "@/models/tournament";
import { playerApi } from "@/services/api/playerApi";
import { flightApi } from "@/services/api/tournamentApi";

function assignedPlayerUuids(
  map: Record<number, PlayerFlight[]>,
): Set<string> {
  const uuids = new Set<string>();
  for (const list of Object.values(map)) {
    for (const assignment of list) {
      uuids.add(assignment.playerUuid);
    }
  }
  return uuids;
}

export default function AdminFlightsPage() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [assignments, setAssignments] = useState<
    Record<number, PlayerFlight[]>
  >({});
  const [flightNumber, setFlightNumber] = useState(1);
  const [assignPlayerUuid, setAssignPlayerUuid] = useState("");
  const [assignFlight, setAssignFlight] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyPlayerUuid, setBusyPlayerUuid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const refreshSeq = useRef(0);

  const refresh = useCallback(async () => {
    const seq = ++refreshSeq.current;
    setLoading(true);
    setError(null);
    try {
      const [flightList, playerList] = await Promise.all([
        flightApi.listForDay(TOURNAMENT_DAY),
        playerApi.list(),
      ]);
      const map: Record<number, PlayerFlight[]> = {};
      for (const f of flightList) {
        map[f.number] = await flightApi.playersInFlight(
          TOURNAMENT_DAY,
          f.number,
        );
      }
      if (seq !== refreshSeq.current) return;

      const available = playerList.filter(
        (p) => !assignedPlayerUuids(map).has(p.uuid),
      );

      setFlights(flightList);
      setPlayers(playerList);
      setAssignments(map);
      setAssignPlayerUuid((current) =>
        available.some((p) => p.uuid === current)
          ? current
          : (available[0]?.uuid ?? ""),
      );
      setAssignFlight((current) =>
        flightList.some((f) => f.number === current)
          ? current
          : (flightList[0]?.number ?? 1),
      );
    } catch (err) {
      if (seq !== refreshSeq.current) return;
      setError(normalizeError(err));
    } finally {
      if (seq === refreshSeq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const availablePlayers = useMemo(() => {
    const taken = assignedPlayerUuids(assignments);
    return players.filter((p) => !taken.has(p.uuid));
  }, [players, assignments]);

  const assignFlightCount = (assignments[assignFlight] ?? []).length;
  const assignFlightFull = assignFlightCount >= FLIGHT_MAX_PLAYERS;

  const createFlight = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      await flightApi.create({ day: TOURNAMENT_DAY, number: flightNumber });
      setMessage(`Flight ${flightNumber} angelegt.`);
      await refresh();
    } catch (err) {
      setError(normalizeError(err));
    }
  };

  const assignPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignPlayerUuid) return;
    setMessage(null);
    try {
      await flightApi.assign({
        day: TOURNAMENT_DAY,
        flightNumber: assignFlight,
        playerUuid: assignPlayerUuid,
      });
      setMessage("Spieler dem Flight zugewiesen.");
      await refresh();
    } catch (err) {
      setError(normalizeError(err));
    }
  };

  const removePlayer = async (playerUuid: string, name: string) => {
    if (!window.confirm(`${name} aus dem Flight entfernen?`)) {
      return;
    }
    setMessage(null);
    setBusyPlayerUuid(playerUuid);
    try {
      await flightApi.unassign(TOURNAMENT_DAY, playerUuid);
      setMessage(`${name} aus dem Flight entfernt.`);
      await refresh();
    } catch (err) {
      setError(normalizeError(err));
    } finally {
      setBusyPlayerUuid(null);
    }
  };

  const playerName = (uuid: string) =>
    players.find((p) => p.uuid === uuid)?.name ?? uuid.slice(0, 8);

  return (
    <FairwayShell>
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8">
        <div className="flex items-center justify-between gap-3">
          <MintCard className="flex-1">
            <h1 className="text-2xl font-black text-primary">Flights</h1>
            <p className="text-sm text-muted">
              Flights mit 3–4 Spielern anlegen (gemischt möglich). Spieler
              zuweisen, damit sie scoren können.
            </p>
          </MintCard>
          <Link
            href={routes.admin}
            className="rounded-xl bg-surface px-4 py-2 text-sm font-semibold text-primary shadow-sm"
          >
            Zurück
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <form
            onSubmit={createFlight}
            className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-soft)]"
          >
            <h2 className="font-bold text-primary">Flight anlegen</h2>
            <label className="mt-3 block text-sm font-semibold">
              Flight-Nummer
              <input
                type="number"
                min={1}
                value={flightNumber}
                onChange={(e) => setFlightNumber(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-border px-3 py-2"
              />
            </label>
            <button
              type="submit"
              className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              Anlegen
            </button>
          </form>

          <form
            onSubmit={assignPlayer}
            className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-soft)]"
          >
            <h2 className="font-bold text-primary">Spieler zuweisen</h2>
            <label className="mt-3 block text-sm font-semibold">
              Spieler
              <select
                value={assignPlayerUuid}
                onChange={(e) => setAssignPlayerUuid(e.target.value)}
                disabled={availablePlayers.length === 0}
                className="mt-1 w-full rounded-xl border border-border px-3 py-2 disabled:opacity-50"
              >
                {availablePlayers.length === 0 ? (
                  <option value="">Alle Spieler zugewiesen</option>
                ) : (
                  availablePlayers.map((p) => (
                    <option key={p.uuid} value={p.uuid}>
                      {p.name}
                    </option>
                  ))
                )}
              </select>
            </label>
            <label className="mt-3 block text-sm font-semibold">
              Flight
              <select
                value={assignFlight}
                onChange={(e) => setAssignFlight(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-border px-3 py-2"
              >
                {flights.map((f) => (
                  <option key={f.number} value={f.number}>
                    Flight {f.number}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={
                assignFlightFull ||
                flights.length === 0 ||
                availablePlayers.length === 0
              }
              className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Zuweisen
            </button>
            {assignFlightFull && (
              <p className="mt-2 text-xs font-semibold text-muted">
                Flight {assignFlight} ist voll ({FLIGHT_MAX_PLAYERS} Spieler).
              </p>
            )}
          </form>
        </div>

        {error && <p className="text-sm font-semibold text-error">{error}</p>}
        {message && (
          <p className="text-sm font-semibold text-success">{message}</p>
        )}

        {loading ? (
          <LoadingState />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {flights.map((f) => (
              <div
                key={f.number}
                className="rounded-2xl bg-surface-mint p-4 shadow-[var(--shadow-soft)]"
              >
                <h3 className="text-lg font-black text-primary">
                  Flight {f.number}
                  <span className="ml-2 text-sm font-semibold text-muted">
                    ({(assignments[f.number] ?? []).length}/{FLIGHT_MAX_PLAYERS})
                  </span>
                </h3>
                <ul className="mt-2 space-y-2 text-sm">
                  {(assignments[f.number] ?? []).map((a) => {
                    const name = playerName(a.playerUuid);
                    return (
                      <li
                        key={a.playerUuid}
                        className="flex items-center justify-between gap-3 font-semibold"
                      >
                        <span>{name}</span>
                        <button
                          type="button"
                          disabled={busyPlayerUuid === a.playerUuid}
                          onClick={() =>
                            void removePlayer(a.playerUuid, name)
                          }
                          className="rounded-lg px-2 py-1 text-xs font-semibold text-error hover:bg-error/10 disabled:opacity-50"
                        >
                          Entfernen
                        </button>
                      </li>
                    );
                  })}
                  {(assignments[f.number] ?? []).length === 0 && (
                    <li className="text-muted">Keine Spieler zugewiesen</li>
                  )}
                </ul>
              </div>
            ))}
            {flights.length === 0 && (
              <p className="text-muted">Noch keine Flights angelegt.</p>
            )}
          </div>
        )}
      </div>
    </FairwayShell>
  );
}
