"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  type DirectionalLight,
  MathUtils,
  type PerspectiveCamera,
  Plane,
  PMREMGenerator,
  type PointLight,
  Vector3,
} from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { circuit, circuitLength, lapPosition } from "@/lib/circuit";
import { getModes, getServerModes, subscribeModes } from "@/lib/modes";
import { progressAtCentre } from "@/lib/scroll";
import { getRace, subscribeFrames, subscribeRace, telemetry } from "@/lib/telemetry";
import { Car, type CarHandle } from "./Car";
import { Cinema } from "./Cinema";
import { type Cue, directCamera, type Pose } from "./director";
import { Rain } from "./Rain";
import { Sky } from "./Sky";
import { Track } from "./Track";
import { type GantryInfo, Trackside } from "./Trackside";
import { Trails } from "./Trails";

const sunDirection: [number, number, number] = [-110, 170, 150];
const sunVector = new Vector3(...sunDirection).normalize();

const atmospheres = {
  dayDry: {
    top: "#1f63c4",
    horizon: "#bcdcf2",
    fog: [220, 1150],
    sunStrength: 1,
    clouds: 0.92,
    stars: 0,
    hemisphere: ["#f1f7ff", "#7c8a55", 1.5],
    sun: ["#fff0d6", 3.6],
    reflections: 0.8,
  },
  dayWet: {
    top: "#5e6a77",
    horizon: "#a4afba",
    fog: [50, 460],
    sunStrength: 0,
    clouds: 0.5,
    stars: 0,
    hemisphere: ["#d6dee7", "#5c6352", 1.8],
    sun: ["#dfe6ee", 1.1],
    reflections: 0.7,
  },
  nightDry: {
    top: "#03050a",
    horizon: "#10161f",
    fog: [60, 640],
    sunStrength: 0,
    clouds: 0.04,
    stars: 1,
    hemisphere: ["#a9bbd4", "#0c0f0a", 0.9],
    sun: ["#d6e4ff", 1.7],
    reflections: 0.5,
  },
  nightWet: {
    top: "#080c12",
    horizon: "#131b25",
    fog: [24, 300],
    sunStrength: 0,
    clouds: 0.1,
    stars: 0,
    hemisphere: ["#a9bbd4", "#0c0f0a", 0.9],
    sun: ["#d6e4ff", 1.2],
    reflections: 0.5,
  },
} as const;

function pickAtmosphere(day: boolean, wet: boolean) {
  if (day) return wet ? atmospheres.dayWet : atmospheres.dayDry;
  return wet ? atmospheres.nightWet : atmospheres.nightDry;
}

const qualitySampleFrames = 90;
const targetFps = 42;
const lowestDpr = 0.75;
const buildSeconds = 2;
const wheelRadius = 0.36;
const heroRange = 0.02;

const up = new Vector3(0, 1, 0);
const point = new Vector3();
const ahead = new Vector3();
const tangent = new Vector3();
const nextTangent = new Vector3();
const side = new Vector3();
const solidPlane = new Plane();
const wirePlane = new Plane();
const shot = { position: new Vector3(), target: new Vector3(), fov: 30 };
const pose: Pose = { point, tangent, side, u: 0, orbit: 0 };

function readLap() {
  const gates = [...document.querySelectorAll<HTMLElement>("[data-gate]")];
  const gantries: GantryInfo[] = gates.map((gate) => ({
    progress: lapPosition(progressAtCentre(gate)),
    title: gate.dataset.title ?? "",
    label: gate.dataset.label ?? "",
  }));

  const at = (selector: string, fallback: number) => {
    const element = document.querySelector(selector);
    return element ? progressAtCentre(element) : fallback;
  };
  const gateAt = gates.map(progressAtCentre);
  const results = at("#results", 0.3);
  const trap = at("#speed-trap", 0.5);

  // Every open stretch of track gets its own shot, like a live broadcast direction
  const hold = 0.022;
  const cues: Cue[] = [
    { at: 0, shot: "hero" },
    { at: 0.03, shot: "hero" },
    { at: gateAt[0] - hold, shot: "front" },
    { at: gateAt[0] + hold, shot: "front" },
    { at: at("#driver", 0.2), shot: "chase" },
    { at: gateAt[1] - hold, shot: "heli" },
    { at: gateAt[1] + hold, shot: "heli" },
    { at: results, shot: "chase" },
    { at: trap - hold, shot: "lowRear" },
    { at: trap + hold, shot: "lowRear" },
    { at: gateAt[2] - hold, shot: "side" },
    { at: gateAt[2] + hold, shot: "side" },
    { at: 0.71, shot: "harbour" },
    { at: 0.76, shot: "harbour" },
    { at: at("#season", 0.8), shot: "onboard" },
    { at: gateAt[3] - hold, shot: "front" },
    { at: gateAt[3] + hold, shot: "front" },
    { at: 1, shot: "chase" },
  ].sort((a, b) => a.at - b.at) as Cue[];

  return { gantries, cues };
}

function Rig({ cues }: { cues: Cue[] }) {
  const invalidate = useThree((state) => state.invalidate);
  const car = useRef<CarHandle>(null);
  const glow = useRef<PointLight>(null);
  const sun = useRef<DirectionalLight>(null);
  const build = useRef(0);
  const quality = useRef({ frames: 0, seconds: 0 });
  const pointer = useRef({ x: 0, eased: 0 });

  useEffect(() => {
    const redraw = () => invalidate();
    const stopFrames = subscribeFrames(redraw);
    const stopRace = subscribeRace(redraw);
    const stopModes = subscribeModes(redraw);
    const movePointer = (event: PointerEvent) => {
      pointer.current.x = event.clientX / window.innerWidth - 0.5;
    };
    window.addEventListener("resize", redraw);
    window.addEventListener("pointermove", movePointer, { passive: true });
    return () => {
      stopFrames();
      stopRace();
      stopModes();
      window.removeEventListener("resize", redraw);
      window.removeEventListener("pointermove", movePointer);
    };
  }, [invalidate]);

  useFrame((frame, rawDelta) => {
    const camera = frame.camera as PerspectiveCamera;
    const delta = Math.min(rawDelta, 0.05);
    const { progress, speed } = telemetry;
    const { day, wet } = getModes();
    frame.scene.environmentIntensity = pickAtmosphere(day, wet).reflections;

    // Slow machines trade sharpness for a steadier frame rate
    if (telemetry.moving && rawDelta < 0.25) {
      const sample = quality.current;
      sample.frames += 1;
      sample.seconds += rawDelta;
      if (sample.frames >= qualitySampleFrames) {
        const dpr = frame.viewport.dpr;
        if (sample.frames / sample.seconds < targetFps && dpr > lowestDpr) {
          frame.setDpr(Math.max(dpr - 0.25, lowestDpr));
        }
        sample.frames = 0;
        sample.seconds = 0;
      }
    }

    const u = lapPosition(progress);
    circuit.getPointAt(u, point);
    circuit.getTangentAt(u, tangent);
    circuit.getTangentAt((u + 0.006) % 1, nextTangent);
    side.crossVectors(tangent, up).normalize();

    const handle = car.current;
    const body = handle?.group;
    if (!handle || !body) return;

    body.position.copy(point);
    ahead.copy(point).add(tangent);
    body.lookAt(ahead);

    const steer = MathUtils.clamp(side.dot(nextTangent) * -1.6, -0.35, 0.35);
    handle.spin((progress * circuitLength) / wheelRadius, steer);

    // Blueprint sweep runs nose to tail, and scrolling away finishes it instantly
    if (build.current < 1) {
      if (getRace().started) build.current = Math.min(build.current + delta / buildSeconds, 1);
      if (progress > 0.004) build.current = 1;
      const eased = MathUtils.smoothstep(build.current, 0, 1);
      const reach = build.current >= 1 ? -1000 : MathUtils.lerp(3.3, -3, eased);
      const edge = point.dot(tangent) + reach;
      solidPlane.normal.copy(tangent);
      solidPlane.constant = -edge;
      wirePlane.normal.copy(tangent).negate();
      wirePlane.constant = edge;
      handle.setBuild(solidPlane, wirePlane, build.current < 1);
    }

    // On the grid the camera drifts slowly and leans towards the pointer
    pointer.current.eased += (pointer.current.x - pointer.current.eased) * (1 - Math.exp(-delta * 3));
    pose.u = u;
    pose.orbit = Math.sin(frame.clock.elapsedTime * 0.14) * 0.12 + pointer.current.eased * 0.34;
    directCamera(cues, progress, pose, shot);
    camera.position.copy(shot.position);
    camera.lookAt(shot.target);

    // Push the hero car clear of the headline, then recentre for the rest of the lap
    const hero = 1 - MathUtils.smoothstep(progress, 0, 0.05);
    const { width, height } = frame.size;
    const shiftX = width / height > 1.25 ? -0.13 : 0;
    camera.fov = shot.fov + speed * 14;
    camera.setViewOffset(width, height, shiftX * hero * width, -0.2 * hero * height, width, height);

    if (glow.current) {
      glow.current.position.copy(point).addScaledVector(up, 2.4);
      glow.current.intensity = day ? 0 : 7;
    }
    if (sun.current) {
      sun.current.position.copy(point).addScaledVector(sunVector, 60);
      sun.current.target.position.copy(point);
      sun.current.target.updateMatrixWorld();
    }

    if (progress < heroRange || (getRace().started && build.current < 1)) frame.invalidate();
  });

  const { day, wet } = getModes();
  const atmosphere = pickAtmosphere(day, wet);

  return (
    <>
      <Car ref={car} />
      <pointLight ref={glow} color="#eaffb0" intensity={7} distance={22} decay={1.6} />
      <directionalLight
        ref={sun}
        intensity={atmosphere.sun[1]}
        color={atmosphere.sun[0]}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-11}
        shadow-camera-right={11}
        shadow-camera-top={11}
        shadow-camera-bottom={-11}
        shadow-camera-near={10}
        shadow-camera-far={120}
        shadow-bias={-0.0006}
        shadow-normalBias={0.02}
      />
    </>
  );
}

export default function Scene() {
  const { day, wet } = useSyncExternalStore(subscribeModes, getModes, getServerModes);
  const atmosphere = pickAtmosphere(day, wet);
  const lap = useMemo(() => readLap(), []);

  return (
    <Canvas
      flat
      shadows
      frameloop="demand"
      dpr={[1, 2]}
      camera={{ fov: 30, near: 0.1, far: 1500, position: [0, 3, 10] }}
      gl={{
        alpha: false,
        antialias: false,
        powerPreference: "high-performance",
        stencil: false,
      }}
      onCreated={({ gl, scene }) => {
        gl.localClippingEnabled = true;
        // A generated studio gives the paint something to reflect, with no image files
        const reflections = new PMREMGenerator(gl);
        scene.environment = reflections.fromScene(new RoomEnvironment(), 0.03).texture;
        reflections.dispose();
      }}
    >
      <fog
        key={`${atmosphere.horizon}-fog`}
        attach="fog"
        args={[atmosphere.horizon, atmosphere.fog[0], atmosphere.fog[1]]}
      />
      <Sky
        top={atmosphere.top}
        horizon={atmosphere.horizon}
        sun={sunDirection}
        sunStrength={atmosphere.sunStrength}
        clouds={atmosphere.clouds}
        stars={atmosphere.stars}
      />
      <hemisphereLight
        key={`${atmosphere.horizon}-sky`}
        args={[atmosphere.hemisphere[0], atmosphere.hemisphere[1], atmosphere.hemisphere[2]]}
      />
      <Track wet={wet} day={day} />
      <Trackside gantries={lap.gantries} day={day} />
      <Rig cues={lap.cues} />
      <Trails />
      {wet && <Rain />}
      <Cinema />
    </Canvas>
  );
}
