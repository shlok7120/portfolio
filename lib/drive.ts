import { Vector3 } from "three";
import type { Cue } from "@/components/three/director";
import { circuit, circuitLength, lapPosition } from "./circuit";
import { getModes } from "./modes";
import { scrollProgress } from "./scroll";
import { driveControl, getRace, telemetry } from "./telemetry";

export type DrivePhase = "off" | "countdown" | "racing" | "finished";
export type DriveState = { phase: DrivePhase; count: number; penalties: number; camera: number };

// Distances are in track units and times in seconds
const topSpeed = 120;
const drsSpeed = 140;
const acceleration = 58;
const coasting = 7;
const braking = 125;
const grip = 78;
const slowestCorner = 26;
const lockUpMargin = 1.12;
const lockUpDrag = 70;
const penaltyMs = 1000;
const penaltyGap = 2.5;
const countdownStep = 0.8;

const cameras: Cue[][] = ["chase", "onboard", "heli"].map((shot) => [
  { at: 0, shot } as Cue,
  { at: 1, shot } as Cue,
]);
export const cameraNames = ["Chase", "Onboard", "Helicopter"];

const limitSamples = 1500;
const limits = new Float32Array(limitSamples);
const before = new Vector3();
const after = new Vector3();

// The fastest safe speed at each point of the lap, worked out from how sharply the road bends
function buildLimits() {
  const span = 14 / circuitLength;
  const raw = new Float32Array(limitSamples);
  for (let i = 0; i < limitSamples; i++) {
    const u = i / limitSamples;
    circuit.getTangentAt((u - span + 1) % 1, before);
    circuit.getTangentAt((u + span) % 1, after);
    const bend = before.angleTo(after) / 28;
    raw[i] = Math.min(Math.max(Math.sqrt(grip / Math.max(bend, 0.0001)), slowestCorner), topSpeed);
  }
  for (let i = 0; i < limitSamples; i++) {
    let lowest = topSpeed;
    for (let j = -3; j <= 3; j++) lowest = Math.min(lowest, raw[(i + j + limitSamples) % limitSamples]);
    limits[i] = lowest;
  }
}

function limitAt(u: number) {
  const wet = getModes().wet ? 0.86 : 1;
  return limits[Math.floor(((u % 1) + 1) % 1 * limitSamples) % limitSamples] * wet;
}

let state: DriveState = { phase: "off", count: 3, penalties: 0, camera: 0 };
let velocity = 0;
let progress = 0;
let waited = 0;
let penaltyTimer = 0;
const held = new Set<string>();
const listeners = new Set<() => void>();

export const driveSignals = { brake: false, drs: false, drsReady: false, locked: false };

function setState(next: Partial<DriveState>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

export const getDrive = () => state;
export const getDriveCues = () => cameras[state.camera];

export function subscribeDrive(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function needsBraking(u: number) {
  const reach = (velocity * velocity) / (2 * braking);
  for (let distance = 0; distance <= reach + 12; distance += 4) {
    const limit = limitAt(u + distance / circuitLength);
    if (velocity > limit && velocity * velocity - limit * limit >= 2 * braking * distance * 0.7) return true;
  }
  return false;
}

function step(seconds: number) {
  const u = lapPosition(progress);
  const limit = limitAt(u);
  const throttle = held.has("ArrowUp") || held.has("KeyW");
  const brake = held.has("ArrowDown") || held.has("KeyS") || held.has("Space");

  driveSignals.drsReady = state.phase === "racing" && limit >= topSpeed * 0.97;
  driveSignals.drs = driveSignals.drsReady && throttle && (held.has("ShiftLeft") || held.has("ShiftRight"));
  driveSignals.brake = false;
  driveSignals.locked = false;

  if (state.phase === "countdown") {
    waited += seconds;
    velocity = 0;
    if (waited >= countdownStep) {
      waited = 0;
      if (state.count > 1) setState({ count: state.count - 1 });
      else setState({ phase: "racing", count: 0 });
    }
  } else if (state.phase === "racing") {
    const top = driveSignals.drs ? drsSpeed : topSpeed;
    if (brake) velocity -= braking * seconds;
    else if (throttle) velocity += acceleration * Math.max(1 - velocity / top, 0) * seconds;
    else velocity -= coasting * seconds;
    if (velocity > top) velocity -= coasting * seconds;

    penaltyTimer -= seconds;
    if (velocity > limit * lockUpMargin) {
      velocity -= lockUpDrag * seconds;
      driveSignals.locked = true;
      if (penaltyTimer <= 0) {
        penaltyTimer = penaltyGap;
        telemetry.lapMs += penaltyMs;
        setState({ penalties: state.penalties + 1 });
      }
    }
    driveSignals.brake = needsBraking(u);
    if (getRace().lap) setState({ phase: "finished" });
  } else {
    velocity -= braking * 0.5 * seconds;
  }

  velocity = Math.max(velocity, 0);
  progress = Math.min(progress + (velocity * seconds) / (circuitLength * 0.996), 0.9995);

  telemetry.progress = progress;
  telemetry.speed = Math.min(velocity / drsSpeed, 1) ** (1 / 0.7);
  telemetry.boost += ((driveSignals.drs ? 1 : 0) - telemetry.boost) * (1 - Math.exp(-seconds * 8));
  telemetry.scrape = driveSignals.locked || (brake && velocity > 40) ? 1 : 0;
}

function handleKey(event: KeyboardEvent) {
  if (event.type === "keyup") {
    held.delete(event.code);
    return;
  }
  if (event.code === "Escape") stopDrive();
  if (event.code === "KeyC" && !event.repeat) setState({ camera: (state.camera + 1) % cameras.length });
  if (/^(Arrow|Space)/.test(event.code)) event.preventDefault();
  held.add(event.code);
}

function clearKeys() {
  held.clear();
}

function line() {
  velocity = 0;
  progress = 0;
  waited = 0;
  penaltyTimer = 0;
  telemetry.progress = 0;
  setState({ phase: "countdown", count: 3, penalties: 0 });
}

export function startDrive() {
  if (state.phase !== "off") return;
  if (!limits[0]) buildLimits();
  window.scrollTo(0, 0);
  document.documentElement.dataset.drive = "1";
  driveControl.step = step;
  driveControl.active = true;
  window.addEventListener("keydown", handleKey);
  window.addEventListener("keyup", handleKey);
  window.addEventListener("blur", clearKeys);
  line();
}

export const restartDrive = line;

export function stopDrive() {
  if (state.phase === "off") return;
  window.removeEventListener("keydown", handleKey);
  window.removeEventListener("keyup", handleKey);
  window.removeEventListener("blur", clearKeys);
  held.clear();
  const max = document.documentElement.scrollHeight - window.innerHeight;
  driveControl.active = false;
  delete document.documentElement.dataset.drive;
  window.scrollTo(0, progress * max);
  telemetry.progress = scrollProgress();
  setState({ phase: "off" });
}
