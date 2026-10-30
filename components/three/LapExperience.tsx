"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Lenis from "lenis";
import { getRace, subscribeRace } from "@/lib/telemetry";
import { useLapMode } from "@/lib/useLapMode";
import { LapFallback } from "./LapFallback";

const Scene = dynamic(() => import("./Scene"), { ssr: false });

const sceneDelay = 700;

function useSmoothScroll(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const lenis = new Lenis({ autoRaf: true, lerp: 0.09 });

    // Hold the car on the grid until the start sequence is over
    function holdForStart() {
      if (getRace().started) lenis.start();
      else lenis.stop();
    }
    holdForStart();
    const stopWatching = subscribeRace(holdForStart);

    function handleClick(event: MouseEvent) {
      const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="/#"]');
      const section = link && document.querySelector(link.getAttribute("href")!.slice(1));
      if (!section) return;
      event.preventDefault();
      event.stopPropagation();
      window.history.pushState(null, "", link.getAttribute("href"));
      lenis.scrollTo(section as HTMLElement, { duration: 1.8 });
    }

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
      stopWatching();
      lenis.destroy();
    };
  }, [enabled]);
}

export function LapExperience() {
  const mode = useLapMode();
  const [sceneReady, setSceneReady] = useState(false);
  useSmoothScroll(mode === "full");

  // The page paints and hydrates first, then the 3D scene loads behind it
  useEffect(() => {
    if (mode !== "full") return;
    const timer = window.setTimeout(() => setSceneReady(true), sceneDelay);
    return () => window.clearTimeout(timer);
  }, [mode]);

  if (mode === "pending" || mode === "off") return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      {mode === "light" ? <LapFallback /> : sceneReady && <Scene />}
    </div>
  );
}
