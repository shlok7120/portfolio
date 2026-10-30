"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { startRace } from "@/lib/telemetry";

const lightsKey = "sp75-lights";
const lightGap = 650;
const stallAfter = 3500;
const holdResult = 1500;

type Phase = "lighting" | "out" | "result" | "jump" | "stalled" | "leaving" | "gone";

export function LightsOut() {
  const [phase, setPhaseState] = useState<Phase>("lighting");
  const [lit, setLit] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [reaction, setReaction] = useState(0);
  const outAt = useRef(0);
  const reactionRef = useRef<number | undefined>(undefined);
  const skipped = useRef(false);
  const phaseRef = useRef<Phase>("lighting");

  const setPhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhaseState(next);
  }, []);

  const leave = useCallback(() => {
    if (phaseRef.current === "leaving" || phaseRef.current === "gone") return;
    try {
      sessionStorage.setItem(lightsKey, "1");
    } catch {
      // The start simply replays next visit
    }
    setPhase("leaving");
    window.setTimeout(() => {
      document.documentElement.style.overflow = "";
      startRace(reactionRef.current);
      setPhase("gone");
    }, 700);
  }, [setPhase]);

  useEffect(() => {
    if (document.documentElement.dataset.lights === "done") {
      skipped.current = true;
      startRace();
      return;
    }

    document.documentElement.style.overflow = "hidden";
    const timers: number[] = [];
    for (let light = 1; light <= 5; light++) {
      timers.push(window.setTimeout(() => setLit(light), light * lightGap));
    }
    const hold = 500 + Math.random() * 1500;
    timers.push(
      window.setTimeout(() => {
        outAt.current = performance.now();
        setLit(0);
        setPhase("out");
      }, 5 * lightGap + hold),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [attempt, setPhase]);

  useEffect(() => {
    if (phase === "out") {
      const timer = window.setTimeout(() => {
        setPhase("stalled");
        window.setTimeout(leave, 1200);
      }, stallAfter);
      return () => window.clearTimeout(timer);
    }
    if (phase === "result") {
      const timer = window.setTimeout(leave, holdResult);
      return () => window.clearTimeout(timer);
    }
    if (phase === "jump") {
      const timer = window.setTimeout(() => {
        setLit(0);
        setPhase("lighting");
        setAttempt((value) => value + 1);
      }, 1600);
      return () => window.clearTimeout(timer);
    }
  }, [phase, leave, setPhase]);

  const launch = useCallback(() => {
    if (phaseRef.current === "lighting") setPhase("jump");
    if (phaseRef.current !== "out") return;
    const time = Math.round(performance.now() - outAt.current) / 1000;
    reactionRef.current = time;
    setReaction(time);
    setPhase("result");
  }, [setPhase]);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") leave();
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        launch();
      }
    }
    if (phase === "gone" || skipped.current) return;
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase, launch, leave]);

  if (phase === "gone") return null;

  const message = {
    lighting: "Tap, click or press Space when the lights go out",
    out: "GO!",
    result: `${reaction.toFixed(3)} s`,
    jump: "Jump start. Back to the grid",
    stalled: "Stalled on the grid",
    leaving: `${reaction ? `${reaction.toFixed(3)} s` : "Lights out"}`,
    gone: "",
  }[phase];

  return (
    <div
      role="dialog"
      aria-label="Race start"
      onPointerDown={launch}
      className={`lights-overlay fixed inset-0 z-[60] flex touch-none select-none flex-col items-center justify-center gap-10 bg-carbon px-4 transition-transform duration-700 ease-in ${
        phase === "leaving" ? "-translate-y-full" : ""
      }`}
    >
      <p className="font-mono text-sm text-muted">Race start · Reaction test</p>

      <div aria-hidden className="flex gap-2 sm:gap-4">
        {[1, 2, 3, 4, 5].map((column) => (
          <div key={column} className="flex flex-col gap-2 rounded-md bg-panel p-2 sm:gap-3 sm:p-3">
            {[0, 1].map((row) => (
              <span
                key={row}
                className={`size-9 rounded-full sm:size-14 ${
                  lit >= column ? "bg-red shadow-[0_0_28px_6px_rgb(255_30_30/0.6)]" : "bg-line"
                }`}
              />
            ))}
          </div>
        ))}
      </div>

      <p aria-live="polite" className="font-display min-h-12 text-center text-2xl sm:text-4xl">
        {message}
      </p>

      <button
        type="button"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={leave}
        className="absolute bottom-6 right-4 border border-line px-4 py-2 font-mono text-sm text-muted hover:border-lime hover:text-lime sm:right-6"
      >
        Skip start
      </button>
    </div>
  );
}
