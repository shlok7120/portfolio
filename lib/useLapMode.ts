"use client";

import { useSyncExternalStore } from "react";
import { getModes, subscribeModes } from "./modes";

export type LapMode = "pending" | "off" | "light" | "full";

let webgl: boolean | undefined;

function supportsWebGL() {
  webgl ??= Boolean(document.createElement("canvas").getContext("webgl2"));
  return webgl;
}

function subscribe(onChange: () => void) {
  const stopModes = subscribeModes(onChange);
  window.addEventListener("resize", onChange);
  return () => {
    stopModes();
    window.removeEventListener("resize", onChange);
  };
}

// Safety Car turns the lap off; phones and touch devices get the light 2D lap
function detectMode(): LapMode {
  if (getModes().safety) return "off";
  const light = window.matchMedia(
    "(max-width: 767px), (pointer: coarse), (prefers-reduced-motion: reduce)",
  ).matches;
  return !light && supportsWebGL() ? "full" : "light";
}

export function useLapMode() {
  return useSyncExternalStore<LapMode>(subscribe, detectMode, () => "pending");
}
