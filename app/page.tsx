"use client";

import { Flag, LayoutDashboard, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { ConnectionStatus } from "@/components/common/ConnectionStatus";
import { FairwayShell } from "@/components/common/FairwayShell";
import { PrimaryCta } from "@/components/common/PrimaryCta";
import { useSignalR } from "@/context/SignalRContext";
import { APP_NAME, routes } from "@/lib/constants";

export default function HomePage() {
  const { connectionState } = useSignalR();

  return (
    <FairwayShell>
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-8 py-12">
        <Flag className="h-28 w-28 text-primary" strokeWidth={1.25} aria-hidden />
        <h1 className="mt-8 text-center text-3xl font-bold text-primary sm:text-4xl">
          {APP_NAME}
        </h1>
        <p className="mt-3 text-center text-sm text-muted">
          Live-Turnier-Scoring
        </p>
        <div className="mt-4">
          <ConnectionStatus state={connectionState} />
        </div>

        <div className="mt-12 flex w-full flex-col gap-4">
          <PrimaryCta href={routes.scoring}>
            <Users className="h-5 w-5" />
            Scoring starten
          </PrimaryCta>
          <PrimaryCta href={routes.leaderboard}>
            <Trophy className="h-5 w-5" />
            Rangliste anzeigen
          </PrimaryCta>
          <PrimaryCta href={routes.display}>
            <Trophy className="h-5 w-5" />
            Großanzeige
          </PrimaryCta>
          <PrimaryCta href={routes.admin} className="hidden md:flex">
            <LayoutDashboard className="h-5 w-5" />
            Verwaltung
          </PrimaryCta>
        </div>

        <p className="mt-10 text-center text-xs text-muted">
          Fürs Scoring wählen Sie Ihren{" "}
          <Link href={routes.scoring} className="font-semibold text-primary underline-offset-2 hover:underline">
            Spielernamen
          </Link>
          — kein QR-Code nötig.
        </p>
      </div>
    </FairwayShell>
  );
}
