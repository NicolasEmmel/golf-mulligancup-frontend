"use client";

import { Dices, Flag, Home, Send, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CircularAction } from "@/components/common/CircularAction";
import { ConnectionStatus } from "@/components/common/ConnectionStatus";
import { ErrorState } from "@/components/common/ErrorState";
import { FairwayShell } from "@/components/common/FairwayShell";
import { LoadingState } from "@/components/common/LoadingState";
import { MintCard } from "@/components/common/MintCard";
import { PlayerNamePicker } from "@/components/scoring/PlayerNamePicker";
import { ScoreStepper } from "@/components/scoring/ScoreStepper";
import { useSignalR } from "@/context/SignalRContext";
import { routes, TOURNAMENT_DAY } from "@/lib/constants";
import { normalizeError } from "@/lib/errors";
import {
  HOLE_COUNT,
  isFlightDayComplete,
  mulliganDraftKey,
  scoreDraftKey,
  type DraftMulligans,
  type DraftScores,
} from "@/lib/scoring";
import {
  clearScoringSession,
  loadScoringSession,
  saveScoringSession,
} from "@/lib/scoringSession";
import type { Hole, Player, PlayerFlight } from "@/models/tournament";
import { playerApi } from "@/services/api/playerApi";
import {
  flightApi,
  tournamentApi,
  type CourseInfo,
} from "@/services/api/tournamentApi";

const FLIGHT_COMPLETE_MESSAGE =
  "Für diesen Flight wurden heute bereits alle Ergebnisse eingetragen.";

const SCORES_SAVED_MESSAGE = "Ergebnisse gespeichert";

export default function ScoringPage() {
  const router = useRouter();
  const {
    connectionState,
    scorecard,
    registerScoringClient,
    submitScores,
    clearSync,
  } = useSignalR();

  const [players, setPlayers] = useState<Player[]>([]);
  const [playersLoading, setPlayersLoading] = useState(true);
  const [playersError, setPlayersError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Player | null>(null);
  const [registering, setRegistering] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [flightMates, setFlightMates] = useState<Player[]>([]);
  const [holeIndex, setHoleIndex] = useState(0);
  const [drafts, setDrafts] = useState<DraftScores>({});
  const [saved, setSaved] = useState<DraftScores>({});
  const [mulliganDrafts, setMulliganDrafts] = useState<DraftMulligans>({});
  const [mulliganSaved, setMulliganSaved] = useState<DraftMulligans>({});
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const initialHoleSetFor = useRef<string | null>(null);
  const resumeHoleIndex = useRef<number | null>(null);
  const didTryResume = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await playerApi.list();
        if (!cancelled) setPlayers(list);
      } catch (err) {
        if (!cancelled) setPlayersError(normalizeError(err));
      } finally {
        if (!cancelled) setPlayersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void tournamentApi.getCourse().then(setCourse).catch(() => undefined);
  }, []);

  const hole: Hole | undefined = course?.holes[holeIndex];
  const day = TOURNAMENT_DAY;

  const loadFlight = useCallback(
    async (player: Player, flightNumber: number) => {
      const assignments = await flightApi.playersInFlight(
        day,
        flightNumber,
      );
      const uuids = new Set(assignments.map((a: PlayerFlight) => a.playerUuid));
      const mates = players.filter((p) => uuids.has(p.uuid));
      if (!mates.some((m) => m.uuid === player.uuid)) {
        mates.unshift(player);
      }
      const resolved = mates.length ? mates : [player];
      setFlightMates(resolved);

      const mateCards = await Promise.all(
        resolved.map(async (mate) => {
          try {
            return await tournamentApi.getScorecard(mate.uuid);
          } catch {
            return null;
          }
        }),
      );

      const fromServer: DraftScores = {};
      const mulligansFromServer: DraftMulligans = {};
      for (const card of mateCards) {
        if (!card) continue;
        for (const h of card.holes) {
          if (h.strokes > 0) {
            fromServer[scoreDraftKey(card.playerUuid, h.holeId)] = h.strokes;
          }
          if (h.usedMulligan) {
            mulligansFromServer[mulliganDraftKey(card.playerUuid, h.holeId)] =
              true;
          }
        }
      }
      if (Object.keys(fromServer).length > 0) {
        setSaved((prev) => ({ ...prev, ...fromServer }));
        setDrafts((prev) => ({ ...prev, ...fromServer }));
      }
      if (Object.keys(mulligansFromServer).length > 0) {
        setMulliganSaved((prev) => ({ ...prev, ...mulligansFromServer }));
        setMulliganDrafts((prev) => ({ ...prev, ...mulligansFromServer }));
      }

      return {
        mates: resolved,
        scores: fromServer,
        mulligans: mulligansFromServer,
        complete: isFlightDayComplete(
          resolved.map((m) => m.uuid),
          fromServer,
        ),
      };
    },
    [players],
  );

  const handleSelectPlayer = useCallback(
    async (player: Player) => {
      setRegError(null);
      setRegistering(true);
      setSessionReady(false);
      try {
        const result = await registerScoringClient(player.uuid);
        if (!result.success) {
          setRegError(result.error ?? "Registrierung fürs Scoring fehlgeschlagen.");
          clearScoringSession();
          resumeHoleIndex.current = null;
          return;
        }
        initialHoleSetFor.current = null;
        // sessionReady is set after we confirm the flight is not already finished.
        setSelected(player);
      } catch (err) {
        setRegError(normalizeError(err));
        clearScoringSession();
        resumeHoleIndex.current = null;
      } finally {
        setRegistering(false);
      }
    },
    [registerScoringClient],
  );

  // Resume an in-progress scoring session after visiting leaderboard / refresh.
  useEffect(() => {
    if (didTryResume.current || playersLoading) return;
    didTryResume.current = true;
    const session = loadScoringSession();
    if (!session) return;
    const player = players.find((p) => p.uuid === session.playerUuid);
    if (!player) {
      clearScoringSession();
      return;
    }
    resumeHoleIndex.current = Math.min(
      HOLE_COUNT - 1,
      Math.max(0, Math.floor(session.holeIndex)),
    );
    void handleSelectPlayer(player);
  }, [players, playersLoading, handleSelectPlayer]);

  useEffect(() => {
    if (!selected || !scorecard) return;
    if (scorecard.playerUuid !== selected.uuid) return;

    let cancelled = false;

    void (async () => {
      const nextSaved: DraftScores = {};
      const nextMulliganSaved: DraftMulligans = {};
      for (const h of scorecard.holes) {
        if (h.strokes > 0) {
          nextSaved[scoreDraftKey(selected.uuid, h.holeId)] = h.strokes;
        }
        if (h.usedMulligan) {
          nextMulliganSaved[mulliganDraftKey(selected.uuid, h.holeId)] = true;
        }
      }

      const flight = await loadFlight(selected, scorecard.flightNumber);
      if (cancelled) return;

      const merged: DraftScores = { ...flight.scores, ...nextSaved };
      const mergedMulligans: DraftMulligans = {
        ...flight.mulligans,
        ...nextMulliganSaved,
      };
      setSaved((prev) => ({ ...prev, ...merged }));
      setDrafts((prev) => ({ ...prev, ...merged }));
      setMulliganSaved((prev) => ({ ...prev, ...mergedMulligans }));
      setMulliganDrafts((prev) => ({ ...prev, ...mergedMulligans }));

      if (
        isFlightDayComplete(
          flight.mates.map((m) => m.uuid),
          merged,
        )
      ) {
        clearScoringSession();
        clearSync();
        setSelected(null);
        setSessionReady(false);
        setFlightMates([]);
        setDrafts({});
        setSaved({});
        setMulliganDrafts({});
        setMulliganSaved({});
        initialHoleSetFor.current = null;
        resumeHoleIndex.current = null;
        setRegError(FLIGHT_COMPLETE_MESSAGE);
        return;
      }

      // Only pick the starting hole once per player session — later scorecard
      // updates must not fight with Send's hole advance (that skipped holes).
      if (initialHoleSetFor.current !== selected.uuid) {
        initialHoleSetFor.current = selected.uuid;
        if (resumeHoleIndex.current != null) {
          setHoleIndex(resumeHoleIndex.current);
          resumeHoleIndex.current = null;
        } else {
          const firstOpen = scorecard.holes.findIndex((h) => h.strokes <= 0);
          setHoleIndex(firstOpen >= 0 ? firstOpen : 0);
        }
      }

      setSessionReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [selected, scorecard, loadFlight, clearSync]);

  useEffect(() => {
    if (!selected || !sessionReady) return;
    saveScoringSession({ playerUuid: selected.uuid, holeIndex });
  }, [selected, sessionReady, holeIndex]);

  useEffect(() => {
    setStatusMessage(null);
  }, [holeIndex]);

  useEffect(() => {
    if (!hole || !flightMates.length) return;
    setDrafts((prev) => {
      const next = { ...prev };
      for (const mate of flightMates) {
        const key = scoreDraftKey(mate.uuid, hole.number);
        if (next[key] == null) {
          next[key] = saved[key] ?? hole.par;
        }
      }
      return next;
    });
    setMulliganDrafts((prev) => {
      const next = { ...prev };
      for (const mate of flightMates) {
        const mKey = mulliganDraftKey(mate.uuid, hole.number);
        if (next[mKey] == null) {
          next[mKey] = mulliganSaved[mKey] ?? false;
        }
      }
      return next;
    });
  }, [hole, flightMates, saved, mulliganSaved]);

  const unsavedForHole = useMemo(() => {
    if (!hole) return false;
    return flightMates.some((mate) => {
      const key = scoreDraftKey(mate.uuid, hole.number);
      const mKey = mulliganDraftKey(mate.uuid, hole.number);
      return (
        drafts[key] !== saved[key] ||
        (mulliganDrafts[mKey] ?? false) !== (mulliganSaved[mKey] ?? false)
      );
    });
  }, [drafts, saved, mulliganDrafts, mulliganSaved, flightMates, hole]);

  const finishAndGoHome = useCallback(() => {
    clearScoringSession();
    clearSync();
    setSelected(null);
    setSessionReady(false);
    setFlightMates([]);
    setDrafts({});
    setSaved({});
    setMulliganDrafts({});
    setMulliganSaved({});
    setStatusMessage(null);
    initialHoleSetFor.current = null;
    resumeHoleIndex.current = null;
    router.replace(routes.home);
  }, [clearSync, router]);

  const goToClubRandomizer = useCallback(() => {
    if (!selected) return;
    saveScoringSession({ playerUuid: selected.uuid, holeIndex });
    router.push(routes.randomizer);
  }, [selected, holeIndex, router]);

  const handleSubmitHole = async () => {
    if (!hole || !selected) return;
    setSubmitting(true);
    setStatusMessage(null);
    try {
      const nextSaved: DraftScores = { ...saved };
      const nextMulliganSaved: DraftMulligans = { ...mulliganSaved };
      const batch: {
        playerUuid: string;
        holeId: number;
        strokes: number;
        usedMulligan: boolean;
      }[] = [];

      for (const mate of flightMates) {
        const key = scoreDraftKey(mate.uuid, hole.number);
        const mKey = mulliganDraftKey(mate.uuid, hole.number);
        const strokes = drafts[key] ?? hole.par;
        const usedMulligan = mulliganDrafts[mKey] ?? false;
        const strokesMatch = nextSaved[key] === strokes;
        const mulliganMatch =
          (nextMulliganSaved[mKey] ?? false) === usedMulligan;
        if (strokesMatch && mulliganMatch) continue;
        batch.push({
          playerUuid: mate.uuid,
          holeId: hole.number,
          strokes,
          usedMulligan,
        });
      }

      if (batch.length > 0) {
        const result = await submitScores({ day, scores: batch });
        if (!result.success) {
          throw new Error(result.error ?? "Ergebnisse konnten nicht gesendet werden");
        }
        for (const entry of batch) {
          nextSaved[scoreDraftKey(entry.playerUuid, entry.holeId)] =
            entry.strokes;
          const mKey = mulliganDraftKey(entry.playerUuid, entry.holeId);
          if (entry.usedMulligan) {
            nextMulliganSaved[mKey] = true;
          } else {
            delete nextMulliganSaved[mKey];
          }
        }
      }
      setSaved(nextSaved);
      setMulliganSaved(nextMulliganSaved);

      if (
        isFlightDayComplete(
          flightMates.map((m) => m.uuid),
          nextSaved,
        )
      ) {
        finishAndGoHome();
        return;
      }

      setStatusMessage(SCORES_SAVED_MESSAGE);
      if (holeIndex < HOLE_COUNT - 1) {
        setHoleIndex((i) => i + 1);
      }
    } catch (err) {
      setStatusMessage(normalizeError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const resetSession = () => {
    clearScoringSession();
    clearSync();
    setSelected(null);
    setSessionReady(false);
    setFlightMates([]);
    setDrafts({});
    setSaved({});
    setMulliganDrafts({});
    setMulliganSaved({});
    setRegError(null);
    setStatusMessage(null);
    initialHoleSetFor.current = null;
    resumeHoleIndex.current = null;
  };

  if (!selected || !sessionReady) {
    return (
      <FairwayShell>
        <div className="mx-auto w-full max-w-lg px-4 py-6">
          <MintCard className="mb-4">
            <h1 className="text-2xl font-black text-primary">Ergebniserfassung</h1>
            <p className="mt-1 text-sm text-muted">
              Melden Sie sich mit Ihrem Namen an, um Ihren Flight zu scoren.
            </p>
            <div className="mt-3">
              <ConnectionStatus state={connectionState} />
            </div>
          </MintCard>
          {regError && (
            <div className="mb-4">
              <ErrorState title="Scoring nicht möglich" message={regError} />
            </div>
          )}
          {registering || (selected && !sessionReady) ? (
            <LoadingState message="Verbinden und registrieren…" />
          ) : (
            <PlayerNamePicker
              players={players}
              loading={playersLoading}
              error={playersError}
              onSelect={handleSelectPlayer}
            />
          )}
        </div>
      </FairwayShell>
    );
  }

  return (
    <FairwayShell>
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-4">
        <MintCard className="relative overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-muted">
                Flight {scorecard?.flightNumber ?? "—"}
              </p>
              <h1 className="text-4xl font-black text-primary">
                Loch {hole?.number ?? "—"}
              </h1>
              <p className="mt-1 text-sm font-semibold text-foreground">
                Par {hole?.par ?? "—"} · SI {hole?.strokeIndex ?? "—"}
              </p>
              {hole?.number === 18 && (
                <span className="mt-2 inline-block rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase text-white">
                  Letztes Loch
                </span>
              )}
            </div>
            <Flag className="h-14 w-14 text-primary/40" />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <ConnectionStatus state={connectionState} />
            <button
              type="button"
              onClick={resetSession}
              className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
            >
              Spieler wechseln
            </button>
          </div>
        </MintCard>

        <div className="mt-4 flex-1 space-y-3">
          {flightMates.map((mate) => {
            const key = hole
              ? scoreDraftKey(mate.uuid, hole.number)
              : mate.uuid;
            const mKey =
              hole != null
                ? mulliganDraftKey(mate.uuid, hole.number)
                : mate.uuid;
            const value = drafts[key] ?? hole?.par ?? 4;
            const usedMulligan = mulliganDrafts[mKey] ?? false;
            const savedMulligan = mulliganSaved[mKey] ?? false;
            const isSaved =
              saved[key] === value &&
              saved[key] != null &&
              usedMulligan === savedMulligan;
            const [first, ...rest] = mate.name.split(" ");
            return (
              <div
                key={mate.uuid}
                className="rounded-xl bg-surface-translucent p-4 shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-black">{first}</p>
                    {rest.length > 0 && (
                      <p className="text-sm font-semibold text-muted">
                        {rest.join(" ")}
                      </p>
                    )}
                  </div>
                  <span
                    className={
                      isSaved
                        ? "text-xs font-semibold text-success"
                        : "text-xs font-semibold text-warning"
                    }
                  >
                    {isSaved ? "Gespeichert" : "Nicht gespeichert"}
                  </span>
                </div>
                <ScoreStepper
                  label="Schläge"
                  value={value}
                  onChange={(next) =>
                    setDrafts((prev) => ({ ...prev, [key]: next }))
                  }
                />
                <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border accent-primary"
                    checked={usedMulligan}
                    disabled={submitting}
                    onChange={(e) =>
                      setMulliganDrafts((prev) => ({
                        ...prev,
                        [mKey]: e.target.checked,
                      }))
                    }
                  />
                  Mulligan auf diesem Loch
                </label>
              </div>
            );
          })}
        </div>

        {statusMessage && (
          <p
            className={`mt-3 text-center text-sm font-semibold ${
              statusMessage === SCORES_SAVED_MESSAGE ? "text-success" : "text-error"
            }`}
          >
            {statusMessage}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            className="rounded-xl bg-surface px-4 py-2 text-sm font-semibold disabled:opacity-40"
            disabled={holeIndex <= 0}
            onClick={() => setHoleIndex((i) => Math.max(0, i - 1))}
          >
            Zurück
          </button>
          <span className="text-xs font-semibold text-muted">
            {holeIndex + 1} / {HOLE_COUNT}
            {unsavedForHole ? " · nicht gespeichert" : ""}
          </span>
          <button
            type="button"
            className="rounded-xl bg-surface px-4 py-2 text-sm font-semibold disabled:opacity-40"
            disabled={holeIndex >= HOLE_COUNT - 1}
            onClick={() => setHoleIndex((i) => Math.min(HOLE_COUNT - 1, i + 1))}
          >
            Weiter
          </button>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-4 pb-6 sm:gap-5">
          <CircularAction
            label="Senden"
            icon={<Send />}
            variant="primary"
            disabled={submitting || !hole}
            onClick={() => void handleSubmitHole()}
          />
          <CircularAction
            label="Schläger-Rad"
            icon={<Dices />}
            disabled={submitting}
            onClick={goToClubRandomizer}
          />
          <CircularAction
            label="Rangliste"
            icon={<Trophy />}
            href={routes.leaderboard}
          />
          <CircularAction label="Start" icon={<Home />} href={routes.home} />
        </div>
      </div>
    </FairwayShell>
  );
}
