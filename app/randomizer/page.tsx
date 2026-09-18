"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FairwayShell } from "@/components/common/FairwayShell";
import { MintCard } from "@/components/common/MintCard";
import { ClubRandomizerWheel } from "@/components/randomizer/ClubRandomizerWheel";
import { routes } from "@/lib/constants";
import { loadScoringSession } from "@/lib/scoringSession";

export default function RandomizerPage() {
  const [holeLabel, setHoleLabel] = useState<string | null>(null);

  useEffect(() => {
    const session = loadScoringSession();
    if (session) {
      setHoleLabel(String(session.holeIndex + 1));
    }
  }, []);

  return (
    <FairwayShell>
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-6">
        <MintCard>
          <h1 className="text-2xl font-black text-primary">Schläger-Rad</h1>
          <p className="mt-2 text-sm text-muted">
            Nach einem Mulligan bestimmt das Rad zufällig, welcher Schläger nicht
            mehr gespielt werden darf.
          </p>
          <p className="mt-3 text-sm text-foreground">
            Die Zahlen <span className="font-bold">1</span> bis{" "}
            <span className="font-bold">14</span> entsprechen einem{" "}
            14-Schläger-Bag:{" "}
            <span className="font-bold">1</span> ist der niedrigste Schläger
            (Putter), <span className="font-bold">14</span> der höchste (Driver).
            Dazwischen steigt die Nummer von den kürzeren zu den längeren
            Schlägern.
          </p>
        </MintCard>

        <div className="mt-8 flex flex-1 flex-col items-center justify-center">
          <ClubRandomizerWheel />
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 pb-8">
          {holeLabel ? (
            <Link
              href={routes.scoring}
              className="inline-flex items-center gap-2 rounded-2xl bg-surface-mint px-6 py-3 text-sm font-bold text-primary shadow-[var(--shadow-soft)]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Zurück zu Loch {holeLabel}
            </Link>
          ) : (
            <Link
              href={routes.scoring}
              className="inline-flex items-center gap-2 rounded-2xl bg-surface-mint px-6 py-3 text-sm font-bold text-primary shadow-[var(--shadow-soft)]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Zurück zur Ergebniserfassung
            </Link>
          )}
        </div>
      </div>
    </FairwayShell>
  );
}
