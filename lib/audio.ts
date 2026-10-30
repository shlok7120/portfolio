import { subscribeFrames, telemetry } from "./telemetry";

// Everything is synthesised, so the site ships no audio files
const idleRpm = 3400;
const lowRpm = 6000;
const highRpm = 12500;
const cylinders = 6;

type Engine = {
  context: AudioContext;
  output: GainNode;
  shiftDip: GainNode;
  filter: BiquadFilterNode;
  noiseFilter: BiquadFilterNode;
  noiseGain: GainNode;
  roughness: GainNode;
  firing: OscillatorNode;
  sub: OscillatorNode;
  turbo: OscillatorNode;
  turboGain: GainNode;
  flutter: OscillatorNode;
};

let engine: Engine | null = null;
let stopFrames: (() => void) | null = null;
let lastSector = 0;
let lastGear = 0;

function handleVisibility() {
  if (document.hidden) void engine?.context.suspend();
  else void engine?.context.resume();
}

function noiseBuffer(context: AudioContext) {
  const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

// Soft clipping adds the rasp of an exhaust without harsh digital edges
function exhaustCurve() {
  const curve = new Float32Array(1024);
  for (let i = 0; i < curve.length; i++) {
    const x = (i / (curve.length - 1)) * 2 - 1;
    curve[i] = Math.tanh(x * 2.6);
  }
  return curve;
}

// The harmonic mix of the firing pulse, heaviest on the low, odd orders
function firingWave(context: AudioContext) {
  const levels = [0, 1, 0.55, 0.72, 0.3, 0.38, 0.16, 0.2, 0.09, 0.11, 0.05, 0.06];
  return context.createPeriodicWave(new Float32Array(levels.length), new Float32Array(levels));
}

function setRpm(rpm: number, smoothing: number, at = engine?.context.currentTime ?? 0) {
  if (!engine) return;
  const pitch = (rpm / 60) * (cylinders / 2);
  const openness = Math.min((rpm - idleRpm) / (highRpm - idleRpm), 1);
  engine.firing.frequency.setTargetAtTime(pitch, at, smoothing);
  engine.sub.frequency.setTargetAtTime(pitch / 2, at, smoothing);
  engine.turbo.frequency.setTargetAtTime(pitch * 5.3, at, smoothing);
  engine.flutter.frequency.setTargetAtTime(pitch / 2.97, at, smoothing);
  engine.filter.frequency.setTargetAtTime(700 + openness * 4300, at, smoothing);
  engine.noiseFilter.frequency.setTargetAtTime(pitch * 4, at, smoothing);
  engine.roughness.gain.setTargetAtTime(0.32 - openness * 0.22, at, smoothing);
  engine.turboGain.gain.setTargetAtTime(0.004 + openness * 0.03, at, smoothing);
}

function radioBeep(frequency: number, start: number, length: number) {
  if (!engine) return;
  const { context } = engine;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.value = frequency;
  gain.gain.value = 0.05;
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(context.currentTime + start);
  oscillator.stop(context.currentTime + start + length);
}

// An upshift cuts ignition for a moment, then the revs land lower
function shiftGear() {
  if (!engine) return;
  const now = engine.context.currentTime;
  engine.shiftDip.gain.cancelScheduledValues(now);
  engine.shiftDip.gain.setValueAtTime(0.25, now);
  engine.shiftDip.gain.linearRampToValueAtTime(1, now + 0.09);
}

function updateEngine() {
  if (!engine) return;
  const moving = telemetry.gear > 0;
  const rpm = moving ? lowRpm + telemetry.revs * (highRpm - lowRpm) : idleRpm;
  setRpm(rpm, 0.035);

  const now = engine.context.currentTime;
  engine.output.gain.setTargetAtTime(moving ? 0.1 + telemetry.speed * 0.14 : 0.06, now, 0.07);
  engine.noiseGain.gain.setTargetAtTime(moving ? 0.1 + telemetry.speed * 0.16 : 0.03, now, 0.07);

  if (telemetry.gear > lastGear && lastGear > 0) shiftGear();
  lastGear = telemetry.gear;

  if (telemetry.sector !== lastSector) {
    lastSector = telemetry.sector;
    radioBeep(1100, 0, 0.07);
    radioBeep(1100, 0.12, 0.07);
  }
}

export function enableSound() {
  const context = new AudioContext();
  const mix = context.createGain();
  const roughnessDepth = context.createGain();
  const shaper = context.createWaveShaper();
  const filter = context.createBiquadFilter();
  const rumbleCut = context.createBiquadFilter();
  const shiftDip = context.createGain();
  const output = context.createGain();
  const limiter = context.createDynamicsCompressor();

  shaper.curve = exhaustCurve();
  shaper.oversample = "4x";
  filter.type = "lowpass";
  filter.Q.value = 0.8;
  rumbleCut.type = "highpass";
  rumbleCut.frequency.value = 70;
  output.gain.value = 0;
  limiter.threshold.value = -14;
  limiter.ratio.value = 8;

  mix.connect(roughnessDepth).connect(shaper).connect(filter).connect(rumbleCut);
  rumbleCut.connect(shiftDip).connect(output).connect(limiter).connect(context.destination);

  const firing = context.createOscillator();
  firing.setPeriodicWave(firingWave(context));
  const firingGain = context.createGain();
  firingGain.gain.value = 0.42;
  firing.connect(firingGain).connect(mix);

  const sub = context.createOscillator();
  sub.type = "sawtooth";
  const subGain = context.createGain();
  subGain.gain.value = 0.26;
  sub.connect(subGain).connect(mix);

  const turbo = context.createOscillator();
  const turboGain = context.createGain();
  turbo.connect(turboGain).connect(shiftDip);

  // A slow wobble against the firing rate gives the lumpy, uneven idle
  const flutter = context.createOscillator();
  const roughness = context.createGain();
  flutter.connect(roughness).connect(roughnessDepth.gain);

  const noise = context.createBufferSource();
  noise.buffer = noiseBuffer(context);
  noise.loop = true;
  const noiseFilter = context.createBiquadFilter();
  noiseFilter.type = "bandpass";
  noiseFilter.Q.value = 1.1;
  const noiseGain = context.createGain();
  noiseGain.gain.value = 0;
  noise.connect(noiseFilter).connect(noiseGain).connect(mix);

  [firing, sub, turbo, flutter].forEach((source) => source.start());
  noise.start();

  engine = {
    context, output, shiftDip, filter, noiseFilter, noiseGain, roughness,
    firing, sub, turbo, turboGain, flutter,
  };

  // Fire-up: catch, blip the throttle, settle at idle
  const now = context.currentTime;
  setRpm(idleRpm, 0.01, now);
  output.gain.setTargetAtTime(0.1, now, 0.08);
  setRpm(8200, 0.06, now + 0.28);
  setRpm(idleRpm, 0.16, now + 0.55);
  output.gain.setTargetAtTime(0.06, now + 0.9, 0.2);

  lastSector = telemetry.sector;
  lastGear = telemetry.gear;
  stopFrames = subscribeFrames(updateEngine);
  document.addEventListener("visibilitychange", handleVisibility);
}

export function disableSound() {
  stopFrames?.();
  stopFrames = null;
  document.removeEventListener("visibilitychange", handleVisibility);
  void engine?.context.close();
  engine = null;
}
