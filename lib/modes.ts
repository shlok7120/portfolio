const safetyKey = "sp75-safety";
const wetKey = "sp75-wet";
const skyKey = "sp75-sky";

export type Sky = "day" | "golden" | "night";
export type Modes = { safety: boolean; wet: boolean; day: boolean; golden: boolean };

const serverModes: Modes = { safety: false, wet: false, day: false, golden: false };
const listeners = new Set<() => void>();
let modes: Modes | null = null;

function remember(key: string, value: boolean) {
  try {
    localStorage.setItem(key, value ? "1" : "0");
  } catch {
    // The choice just lasts for this page view
  }
}

function readWet() {
  try {
    return localStorage.getItem(wetKey) === "1";
  } catch {
    return false;
  }
}

export function getModes() {
  // The layout's inline script has already set these attributes before first paint
  const { safety, day, golden } = document.documentElement.dataset;
  modes ??= { safety: safety === "1", wet: readWet(), day: day === "1", golden: golden === "1" };
  return modes;
}

export const getServerModes = () => serverModes;

export function subscribeModes(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function update(next: Partial<Modes>) {
  modes = { ...getModes(), ...next };
  listeners.forEach((listener) => listener());
}

export function setSafety(safety: boolean) {
  document.documentElement.toggleAttribute("data-safety", safety);
  if (safety) document.documentElement.dataset.safety = "1";
  remember(safetyKey, safety);
  update({ safety });
}

export function setSky(sky: Sky) {
  const root = document.documentElement;
  root.toggleAttribute("data-day", sky === "day");
  root.toggleAttribute("data-golden", sky === "golden");
  if (sky === "day") root.dataset.day = "1";
  if (sky === "golden") root.dataset.golden = "1";
  try {
    localStorage.setItem(skyKey, sky);
  } catch {
    // The choice just lasts for this page view
  }
  update({ day: sky === "day", golden: sky === "golden" });
}

export function setWet(wet: boolean) {
  remember(wetKey, wet);
  update({ wet });
}
