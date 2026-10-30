import { progressAtCentre, scrollProgress } from "./scroll";

const finishLine = 0.995;
const minimumLapMs = 6000;
const bestLapKey = "sp75-best-lap";
const reactionKey = "sp75-reaction";
const gearTops = [60, 100, 140, 180, 220, 260, 300, 345];

export const telemetry = {
  progress: 0,
  speed: 0,
  kph: 0,
  gear: 0,
  revs: 0,
  lapMs: 0,
  sector: 0,
  splits: [0, 0, 0],
  moving: false,
};

export type LapResult = { ms: number; best: number; isBest: boolean; deleted: boolean };

export type RaceState = {
  started: boolean;
  reaction: number | null;
  lap: LapResult | null;
};

let race: RaceState = { started: false, reaction: null, lap: null };
let sectorStarts = [0, 1, 1];
let lapRunning = false;

const raceListeners = new Set<() => void>();
const frameListeners = new Set<() => void>();

function setRace(next: Partial<RaceState>) {
  race = { ...race, ...next };
  raceListeners.forEach((listener) => listener());
}

function readStored(storage: () => Storage, key: string) {
  try {
    const value = Number(storage().getItem(key));
    return value > 0 ? value : null;
  } catch {
    return null;
  }
}

function store(storage: () => Storage, key: string, value: number) {
  try {
    storage().setItem(key, String(value));
  } catch {
    // Private windows can refuse storage, and the race still works without it
  }
}

export const getRace = () => race;

export function subscribeRace(listener: () => void) {
  raceListeners.add(listener);
  return () => {
    raceListeners.delete(listener);
  };
}

export function subscribeFrames(listener: () => void) {
  frameListeners.add(listener);
  return () => {
    frameListeners.delete(listener);
  };
}

export function startRace(reaction?: number) {
  document.documentElement.dataset.green = "1";
  if (reaction) store(() => sessionStorage, reactionKey, reaction);
  setRace({
    started: true,
    reaction: reaction ?? readStored(() => sessionStorage, reactionKey),
  });
}

function finishLap() {
  lapRunning = false;
  const ms = telemetry.lapMs;
  const deleted = ms < minimumLapMs;
  const previous = readStored(() => localStorage, bestLapKey);
  const isBest = !deleted && (previous === null || ms < previous);
  if (isBest) store(() => localStorage, bestLapKey, ms);
  setRace({ lap: { ms, best: isBest ? ms : (previous ?? ms), isBest, deleted } });
}

function resetLap() {
  telemetry.lapMs = 0;
  telemetry.splits = [0, 0, 0];
  telemetry.sector = 0;
  if (race.lap) setRace({ lap: null });
}

function updateDrivetrain() {
  telemetry.kph = Math.round(345 * telemetry.speed ** 0.7);
  if (telemetry.kph < 2) {
    telemetry.gear = 0;
    telemetry.revs = 0;
    return;
  }
  const index = gearTops.findIndex((top) => telemetry.kph <= top);
  const low = index > 0 ? gearTops[index - 1] : 0;
  telemetry.gear = index + 1;
  telemetry.revs = (telemetry.kph - low) / (gearTops[index] - low);
}

function updateLap(milliseconds: number) {
  if (telemetry.progress < 0.002) {
    if (telemetry.lapMs > 0) resetLap();
    return;
  }
  if (telemetry.progress >= finishLine) {
    if (lapRunning) finishLap();
    return;
  }
  if (race.lap) resetLap();
  lapRunning = true;
  telemetry.lapMs += milliseconds;
  const sector = telemetry.progress >= sectorStarts[2] ? 2 : telemetry.progress >= sectorStarts[1] ? 1 : 0;
  telemetry.sector = sector;
  telemetry.splits[sector] += milliseconds;
}

let users = 0;
let frame = 0;
let lastTime = 0;

function tick(time: number) {
  const elapsed = Math.min(time - lastTime, 50);
  lastTime = time;
  const seconds = elapsed / 1000;

  const target = scrollProgress();
  const gap = target - telemetry.progress;
  telemetry.progress = Math.abs(gap) < 0.00002 ? target : telemetry.progress + gap * (1 - Math.exp(-seconds * 5));

  const speedTarget = Math.min(Math.abs(gap) * 45, 1);
  telemetry.speed += (speedTarget - telemetry.speed) * (1 - Math.exp(-seconds * 4));
  if (telemetry.speed < 0.001) telemetry.speed = 0;

  telemetry.moving = gap !== 0 || telemetry.speed > 0;
  if (telemetry.moving) {
    updateDrivetrain();
    updateLap(elapsed);
    frameListeners.forEach((listener) => listener());
  }

  frame = requestAnimationFrame(tick);
}

export function startTelemetry() {
  users += 1;
  if (users === 1) {
    const gates = document.querySelectorAll("[data-gate]");
    if (gates.length > 2) sectorStarts = [0, progressAtCentre(gates[1]), progressAtCentre(gates[2])];
    telemetry.progress = scrollProgress();
    lastTime = performance.now();
    frame = requestAnimationFrame(tick);
  }
  return () => {
    users -= 1;
    if (users === 0) cancelAnimationFrame(frame);
  };
}

export function formatLap(milliseconds: number) {
  const total = Math.floor(milliseconds);
  const minutes = Math.floor(total / 60000);
  const seconds = Math.floor((total % 60000) / 1000);
  return `${minutes}:${String(seconds).padStart(2, "0")}.${String(total % 1000).padStart(3, "0")}`;
}
