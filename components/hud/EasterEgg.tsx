"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";

const PitStopGame = dynamic(() => import("./PitStopGame").then((module) => module.PitStopGame), {
  ssr: false,
});

const konami = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];
const tapsNeeded = 7;
const tapWindow = 3000;

export function EasterEgg() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    let progress = 0;
    let taps: number[] = [];

    function handleKey(event: KeyboardEvent) {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      progress = key === konami[progress] ? progress + 1 : key === konami[0] ? 1 : 0;
      if (progress === konami.length) {
        progress = 0;
        setOpen(true);
      }
    }

    // Phones have no arrow keys, so seven quick taps on the licence number also work
    function handleClick(event: MouseEvent) {
      if (!(event.target as Element).closest("[data-easter]")) return;
      const now = performance.now();
      taps = [...taps.filter((tap) => now - tap < tapWindow), now];
      if (taps.length >= tapsNeeded) {
        taps = [];
        setOpen(true);
      }
    }

    window.addEventListener("keydown", handleKey);
    document.addEventListener("click", handleClick);
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.removeEventListener("click", handleClick);
    };
  }, []);

  return open ? <PitStopGame onClose={close} /> : null;
}
