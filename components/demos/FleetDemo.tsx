"use client";

import { useState } from "react";

const tankLitres = 400;
const averageLitres = 180;

function assess(litres: number, hour: number, hoursSinceFill: number) {
  const hard: string[] = [];
  const soft: string[] = [];
  if (litres > tankLitres) hard.push(`${litres} L is more than the ${tankLitres} L tank holds`);
  if (hoursSinceFill < 6 && litres > tankLitres * 0.6) hard.push("A large refill only hours after the last one");
  if (hour < 5 || hour >= 23) soft.push("Odd-hours fill");
  if (litres > averageLitres * 1.6) soft.push("Volume well above this vehicle's average");

  if (hard.length) return { flagged: true, reason: "Hard rule: flagged on its own.", signals: [...hard, ...soft] };
  if (soft.length > 1) return { flagged: true, reason: "Two soft signals agree, so it's flagged.", signals: soft };
  if (soft.length === 1) return { flagged: false, reason: "One soft signal alone isn't enough.", signals: soft };
  return { flagged: false, reason: "Nothing unusual here.", signals: [] };
}

function Slider({
  label,
  value,
  display,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block font-mono text-xs text-muted">
      <span className="flex justify-between">
        {label}
        <span className="text-ink">{display}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1.5 w-full accent-[var(--color-lime)]"
      />
    </label>
  );
}

export function FleetDemo() {
  const [litres, setLitres] = useState(170);
  const [hour, setHour] = useState(14);
  const [gap, setGap] = useState(48);
  const result = assess(litres, hour, gap);

  return (
    <div>
      <h3 className="font-display text-3xl">Try to beat the fraud rules</h3>
      <p className="mt-2 text-sm text-muted">
        Set up a fill and see how the tiered rules respond. This runs the rule logic in your browser with sample
        numbers. The Isolation Forest model isn&apos;t part of this demo.
      </p>
      <div className="mt-5 grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <Slider label="Litres dispensed" value={litres} display={`${litres} L`} min={20} max={520} onChange={setLitres} />
          <Slider label="Time of day" value={hour} display={`${String(hour).padStart(2, "0")}:00`} min={0} max={23} onChange={setHour} />
          <Slider label="Hours since last fill" value={gap} display={`${gap} h`} min={1} max={96} onChange={setGap} />
        </div>
        <div aria-live="polite" className={`border-l-4 p-4 ${result.flagged ? "border-l-red" : "border-l-green"}`}>
          <p className={`font-display text-3xl ${result.flagged ? "text-red" : "text-green"}`}>
            {result.flagged ? "Flagged" : "Cleared"}
          </p>
          <p className="mt-1 text-sm">{result.reason}</p>
          <ul className="mt-3 space-y-1 font-mono text-xs text-muted">
            {result.signals.map((signal) => (
              <li key={signal}>· {signal}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
