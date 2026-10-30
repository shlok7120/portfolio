"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const scoresKey = "sp75-pit-scores";
const totalCalls = 12;
const penaltyMs = 500;

const wheels = [
  { key: "q", label: "Front left", area: "col-start-1 row-start-1" },
  { key: "w", label: "Front right", area: "col-start-3 row-start-1" },
  { key: "a", label: "Rear left", area: "col-start-1 row-start-2" },
  { key: "s", label: "Rear right", area: "col-start-3 row-start-2" },
];

function readScores(): number[] {
  try {
    const saved = JSON.parse(localStorage.getItem(scoresKey) ?? "[]");
    return Array.isArray(saved) ? saved.filter((score) => typeof score === "number") : [];
  } catch {
    return [];
  }
}

function saveScore(score: number) {
  const scores = [...readScores(), score].sort((a, b) => a - b).slice(0, 5);
  try {
    localStorage.setItem(scoresKey, JSON.stringify(scores));
  } catch {
    // The leaderboard lasts for this game only
  }
  return scores;
}

export function PitStopGame({ onClose }: { onClose: () => void }) {
  const [target, setTarget] = useState<number | null>(null);
  const [hits, setHits] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const [scores, setScores] = useState<number[]>(readScores);
  const startedAt = useRef(0);
  const penalties = useRef(0);
  const closeButton = useRef<HTMLButtonElement>(null);

  const nextTarget = useCallback((previous: number | null) => {
    const options = wheels.map((_, index) => index).filter((index) => index !== previous);
    setTarget(options[Math.floor(Math.random() * options.length)]);
  }, []);

  const start = useCallback(() => {
    startedAt.current = performance.now();
    penalties.current = 0;
    setHits(0);
    setResult(null);
    nextTarget(null);
  }, [nextTarget]);

  const press = useCallback(
    (index: number) => {
      if (target === null) return;
      if (index !== target) {
        penalties.current += penaltyMs;
        return;
      }
      const done = hits + 1;
      setHits(done);
      if (done < totalCalls) {
        nextTarget(target);
        return;
      }
      const time = performance.now() - startedAt.current + penalties.current;
      setTarget(null);
      setResult(time);
      setScores(saveScore(Math.round(time)));
    },
    [hits, nextTarget, target],
  );

  useEffect(() => {
    closeButton.current?.focus();
    const scrollLock = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      const index = wheels.findIndex((wheel) => wheel.key === event.key.toLowerCase());
      if (index >= 0) press(index);
    }
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.documentElement.style.overflow = scrollLock;
    };
  }, [onClose, press]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pit stop challenge"
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center overflow-y-auto bg-carbon/95 p-4"
    >
      <button
        ref={closeButton}
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 border border-line px-3 py-1.5 font-mono text-sm text-muted hover:border-lime hover:text-lime"
      >
        Close
      </button>

      <p className="font-mono text-sm text-lime">You found the pit crew</p>
      <h2 className="font-display mt-2 text-center text-3xl sm:text-5xl">Pit stop challenge</h2>
      <p className="mt-3 max-w-md text-center text-muted">
        Hit the glowing wheel, with a tap or Q, W, A, S. {totalCalls} calls, and each wrong wheel
        costs half a second.
      </p>

      <div className="mt-6 grid w-full max-w-xs grid-cols-[1fr_0.7fr_1fr] grid-rows-2 gap-3">
        {wheels.map((wheel, index) => (
          <button
            key={wheel.key}
            type="button"
            aria-label={wheel.label}
            onPointerDown={() => press(index)}
            className={`${wheel.area} h-20 rounded-lg border-2 font-display text-xl uppercase ${
              target === index ? "border-lime bg-lime text-carbon" : "border-line bg-panel text-muted"
            }`}
          >
            {wheel.key}
          </button>
        ))}
        <div aria-hidden className="col-start-2 row-span-2 row-start-1 rounded-full border border-line bg-panel" />
      </div>

      <p aria-live="polite" className="font-display mt-6 min-h-9 text-2xl">
        {result !== null
          ? `${(result / 1000).toFixed(2)} s`
          : target !== null
            ? `${hits} / ${totalCalls}`
            : ""}
      </p>

      {target === null && (
        <button
          type="button"
          onClick={start}
          className="mt-3 bg-lime px-6 py-3 font-mono text-sm font-semibold text-carbon hover:bg-ink"
        >
          {result === null ? "Start" : "Go again"}
        </button>
      )}

      {scores.length > 0 && (
        <div className="mt-6 w-full max-w-xs">
          <h3 className="font-mono text-xs text-muted">Your best stops on this device</h3>
          <ol className="mt-2 font-mono text-sm">
            {scores.map((score, index) => (
              <li key={`${score}-${index}`} className="flex justify-between border-b border-line/60 py-1">
                <span className="text-muted">P{index + 1}</span>
                <span>{(score / 1000).toFixed(2)} s</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
