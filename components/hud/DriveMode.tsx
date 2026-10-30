"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import {
  cameraNames,
  type DriveState,
  driveSignals,
  getDrive,
  restartDrive,
  stopDrive,
  subscribeDrive,
} from "@/lib/drive";
import { getModes, subscribeModes } from "@/lib/modes";
import { formatLap, getRace, subscribeFrames, subscribeRace } from "@/lib/telemetry";

const offTrack: DriveState = { phase: "off", count: 3, penalties: 0, camera: 0 };

const controls = [
  ["↑", "Throttle"],
  ["↓", "Brake"],
  ["Shift", "DRS"],
  ["C", "Camera"],
  ["Esc", "Exit"],
];

export function DriveMode() {
  const { phase, count, penalties, camera } = useSyncExternalStore(subscribeDrive, getDrive, () => offTrack);
  const { lap } = useSyncExternalStore(subscribeRace, getRace, getRace);
  const brake = useRef<HTMLParagraphElement>(null);
  const drs = useRef<HTMLParagraphElement>(null);
  const again = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    return subscribeFrames(() => {
      brake.current?.classList.toggle("is-on", driveSignals.brake || driveSignals.locked);
      if (brake.current) brake.current.textContent = driveSignals.locked ? "Lock-up · +1 s" : "Brake";
      drs.current?.classList.toggle("is-on", driveSignals.drsReady);
    });
  }, []);

  useEffect(() => subscribeModes(() => getModes().safety && stopDrive()), []);

  useEffect(() => {
    if (phase === "finished") again.current?.focus();
  }, [phase]);

  if (phase === "off") return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[45] font-mono">
      <div className="absolute inset-x-0 top-16 flex flex-wrap justify-center gap-x-4 gap-y-1 px-4 text-xs">
        {controls.map(([key, label]) => (
          <span key={key} className="glass px-2 py-1">
            <span className="text-lime">{key}</span> {label}
          </span>
        ))}
        <span className="glass px-2 py-1">{cameraNames[camera]}</span>
        <span className="glass px-2 py-1">Penalties {penalties}</span>
      </div>

      {phase === "countdown" && (
        <p key={count} aria-live="assertive" className="drive-count font-display absolute inset-0 grid place-items-center text-[28vh] text-lime">
          {count}
        </p>
      )}

      {phase === "racing" && (
        <>
          <p ref={brake} className="drive-brake absolute inset-x-0 top-[24%] text-center text-4xl font-bold uppercase">
            Brake
          </p>
          <p ref={drs} className="drive-drs absolute inset-x-0 top-[33%] text-center text-sm">
            DRS available · hold Shift
          </p>
        </>
      )}

      {phase === "finished" && lap && (
        <div role="status" className="glass pointer-events-auto absolute left-1/2 top-1/2 w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 p-6 text-center">
          <p className="tag">Chequered flag</p>
          <p className="font-display mt-2 text-6xl text-lime">{formatLap(lap.ms)}</p>
          <p className="mt-2 text-xs text-muted">
            {lap.isBest ? "New best driven lap" : `Best driven lap ${formatLap(lap.best)}`}
            {penalties > 0 && ` · ${penalties} s in penalties`}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button ref={again} type="button" onClick={restartDrive} className="btn-race">
              Go again
            </button>
            <button type="button" onClick={stopDrive} className="btn-race btn-ghost">
              Back to the portfolio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
