const safetyKey = "sp75-safety";
const wetKey = "sp75-wet";
const dayKey = "sp75-day";

export type Modes = { safety: boolean; wet: boolean; day: boolean };

const serverModes: Modes = { safety: false, wet: false, day: false };
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
  const { safety, day } = document.documentElement.dataset;
  modes ??= { safety: safety === "1", wet: readWet(), day: day === "1" };
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

export function setDay(day: boolean) {
  document.documentElement.toggleAttribute("data-day", day);
  if (day) document.documentElement.dataset.day = "1";
  remember(dayKey, day);
  update({ day });
}

export function setWet(wet: boolean) {
  remember(wetKey, wet);
  update({ wet });
}
