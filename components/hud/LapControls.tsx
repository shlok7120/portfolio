"use client";

import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { disableSound, enableSound } from "@/lib/audio";
import { getModes, getServerModes, setWet, subscribeModes } from "@/lib/modes";
import { useLapMode } from "@/lib/useLapMode";

const buttonClass =
  "border border-line px-2.5 py-1 font-mono text-xs text-ink hover:border-lime hover:text-lime aria-pressed:border-lime aria-pressed:text-lime";

export function LapControls() {
  const mode = useLapMode();
  const onLap = usePathname() === "/";
  const { wet } = useSyncExternalStore(subscribeModes, getModes, getServerModes);
  const [sound, setSound] = useState(false);

  function toggleSound() {
    if (sound) disableSound();
    else enableSound();
    setSound(!sound);
  }

  if (mode !== "full" || !onLap) return null;

  return (
    <div className="hidden gap-3 lg:flex">
      <button type="button" aria-pressed={wet} onClick={() => setWet(!wet)} className={buttonClass}>
        {wet ? "Wet" : "Dry"}
      </button>
      <button type="button" aria-pressed={sound} onClick={toggleSound} className={buttonClass}>
        {sound ? "Engine on" : "Engine off"}
      </button>
    </div>
  );
}
