"use client";

import { useSyncExternalStore } from "react";
import { formatLap, getRace, type RaceState, subscribeRace } from "@/lib/telemetry";

const noRace: RaceState = { started: false, reaction: null, lap: null };

export function LapSummary() {
  const { lap, reaction } = useSyncExternalStore(subscribeRace, getRace, () => noRace);

  const lapValue = !lap ? "--" : lap.deleted ? "Deleted" : formatLap(lap.ms);
  const lapNote = !lap
    ? "Finish the lap to set a time"
    : lap.deleted
      ? "Track limits. That was too quick to count"
      : lap.isBest
        ? "Personal best"
        : `Personal best ${formatLap(lap.best)}`;

  return (
    <dl className="lap-only mt-8 grid max-w-2xl gap-px bg-line sm:grid-cols-2">
      <div className="bg-carbon py-4 sm:pr-6">
        <dt className="font-mono text-xs text-muted">Your lap</dt>
        <dd className="font-display mt-2 text-3xl text-lime">{lapValue}</dd>
        <dd className="mt-1 font-mono text-xs text-muted">{lapNote}</dd>
      </div>
      <div className="bg-carbon py-4 sm:pl-6">
        <dt className="font-mono text-xs text-muted">Your reaction</dt>
        <dd className="font-display mt-2 text-3xl">
          {reaction ? `${reaction.toFixed(3)} s` : "--"}
        </dd>
        <dd className="mt-1 font-mono text-xs text-muted">
          {reaction ? "From lights out" : "Skipped the start"}
        </dd>
      </div>
    </dl>
  );
}
