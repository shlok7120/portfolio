"use client";

import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import {
  BoxGeometry,
  type BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DoubleSide,
  type Group,
  LineBasicMaterial,
  type Material,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  type Plane,
  RingGeometry,
  SphereGeometry,
  SRGBColorSpace,
  Vector3,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { profile } from "@/content/profile";
import { projects } from "@/content/projects";
import { floorPlate, loft, sidePlate, strut, tube, tyre, wing } from "./carGeometry";

type MaterialName =
  | "body"
  | "pod"
  | "red"
  | "pearl"
  | "carbon"
  | "matte"
  | "rim"
  | "light";

type PartSpec = {
  geometry: BufferGeometry;
  material: MaterialName;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
};

const box = (x: number, y: number, z: number) => new BoxGeometry(x, y, z);
const mirrored = (make: (side: number) => PartSpec) => [make(1), make(-1)];

const chassis = loft(
  [
    { z: 3.02, w: 0.045, top: 0.2, bottom: 0.15 },
    { z: 2.62, w: 0.085, top: 0.255, bottom: 0.14 },
    { z: 2.05, w: 0.13, top: 0.335, bottom: 0.12 },
    { z: 1.35, w: 0.2, top: 0.47, bottom: 0.1 },
    { z: 0.8, w: 0.255, top: 0.585, bottom: 0.08 },
    { z: 0.25, w: 0.28, top: 0.625, bottom: 0.08 },
    { z: -0.3, w: 0.26, top: 0.78, bottom: 0.09 },
    { z: -0.62, w: 0.185, top: 0.9, bottom: 0.1 },
    { z: -1.02, w: 0.125, top: 0.8, bottom: 0.11 },
    { z: -1.6, w: 0.085, top: 0.58, bottom: 0.13 },
    { z: -2.15, w: 0.062, top: 0.43, bottom: 0.17 },
    { z: -2.56, w: 0.035, top: 0.35, bottom: 0.24 },
  ],
  96,
);

// High shoulders at the inlet, a deep undercut below, then a long ramp down to the
// rear with the waist pulling in towards the gearbox
const sidepodShape = (side: number) =>
  loft(
    [
      { z: 0.72, w: 0.11, top: 0.56, bottom: 0.46, x: side * 0.57 },
      { z: 0.58, w: 0.17, top: 0.585, bottom: 0.41, x: side * 0.57 },
      { z: 0.32, w: 0.255, top: 0.6, bottom: 0.3, x: side * 0.55 },
      { z: -0.15, w: 0.29, top: 0.575, bottom: 0.2, x: side * 0.53 },
      { z: -0.7, w: 0.25, top: 0.49, bottom: 0.13, x: side * 0.46 },
      { z: -1.3, w: 0.17, top: 0.38, bottom: 0.11, x: side * 0.34 },
      { z: -1.95, w: 0.07, top: 0.27, bottom: 0.12, x: side * 0.2 },
      { z: -2.25, w: 0.03, top: 0.21, bottom: 0.13, x: side * 0.14 },
    ],
    72,
  );

const inlet = (side: number) =>
  loft(
    [
      { z: 0.735, w: 0.07, top: 0.555, bottom: 0.47, x: side * 0.57 },
      { z: 0.725, w: 0.115, top: 0.565, bottom: 0.45, x: side * 0.57 },
      { z: 0.67, w: 0.135, top: 0.57, bottom: 0.44, x: side * 0.57 },
    ],
    6,
  );

const cockpit = loft([
  { z: 0.74, w: 0.07, top: 0.6, bottom: 0.5 },
  { z: 0.52, w: 0.195, top: 0.635, bottom: 0.5 },
  { z: 0.12, w: 0.225, top: 0.65, bottom: 0.5 },
  { z: -0.16, w: 0.18, top: 0.69, bottom: 0.5 },
  { z: -0.24, w: 0.07, top: 0.67, bottom: 0.5 },
]);

const frontWingElement = (i: number) =>
  wing({
    halfSpan: 1,
    chord: (t) => 0.27 - i * 0.03 - t * 0.04,
    y: (t) => 0.078 + i * 0.05 + 0.16 * t ** 2.4 + (t < 0.22 ? 0.03 * (1 - t / 0.22) : 0),
    z: (t) => 2.96 - i * 0.135 - 0.3 * t ** 1.6,
    pitch: (t) => 0.08 + i * 0.27 + t * 0.2,
  });

const louvres = (side: number) =>
  mergeGeometries(
    [0, 1, 2, 3].map((i) =>
      new BoxGeometry(0.12, 0.012, 0.03)
        .rotateZ(side * 0.5)
        .translate(side * (0.2 + i * 0.012), 0.555 - i * 0.03, -0.85 - i * 0.13),
    ),
  );

const parts: PartSpec[] = [
  { geometry: chassis, material: "body" },
  ...mirrored((side) => ({ geometry: sidepodShape(side), material: "pod" })),
  ...mirrored((side) => ({ geometry: inlet(side), material: "matte" })),
  ...mirrored((side) => ({ geometry: louvres(side), material: "matte" })),
  { geometry: cockpit, material: "matte" },

  {
    geometry: floorPlate(
      [
        [-0.24, 1.25],
        [0.24, 1.25],
        [0.42, 0.95],
        [0.7, 0.7],
        [0.84, 0.42],
        [0.88, -0.2],
        [0.86, -1.0],
        [0.72, -1.3],
        [0.62, -1.75],
        [0.55, -2.34],
        [-0.55, -2.34],
        [-0.62, -1.75],
        [-0.72, -1.3],
        [-0.86, -1.0],
        [-0.88, -0.2],
        [-0.84, 0.42],
        [-0.7, 0.7],
        [-0.42, 0.95],
      ],
      0.065,
      0.022,
    ),
    material: "carbon",
  },
  ...mirrored((side) => ({
    geometry: sidePlate(
      [
        [0.42, 0.08],
        [0.25, 0.135],
        [-0.95, 0.155],
        [-1.05, 0.08],
      ],
      side * 0.875,
      0.012,
    ),
    material: "carbon",
  })),
  ...[-0.42, -0.24].flatMap((x) =>
    mirrored((side) => ({
      geometry: sidePlate(
        [
          [1.2, 0.09],
          [0.95, 0.19],
          [0.1, 0.13],
          [0.1, 0.07],
        ],
        side * x,
        0.012,
      ),
      material: "carbon",
    })),
  ),

  { geometry: box(0.94, 0.03, 0.3), material: "matte", position: [0, 0.15, -2.38], rotation: [-0.34, 0, 0] },
  ...[-0.33, -0.11, 0.11, 0.33].map((x): PartSpec => ({
    geometry: sidePlate(
      [
        [-2.24, 0.09],
        [-2.54, 0.21],
        [-2.54, 0.11],
      ],
      x,
      0.01,
    ),
    material: "carbon",
  })),

  // Shark fin running from the airbox to the rear wing
  {
    geometry: sidePlate(
      [
        [-0.72, 0.88],
        [-2.3, 0.6],
        [-2.34, 0.42],
        [-1.4, 0.6],
      ],
      0,
      0.012,
    ),
    material: "pearl",
  },

  { geometry: frontWingElement(0), material: "carbon" },
  { geometry: frontWingElement(1), material: "carbon" },
  { geometry: frontWingElement(2), material: "pearl" },
  { geometry: frontWingElement(3), material: "red" },
  ...mirrored((side) => ({
    geometry: sidePlate(
      [
        [2.72, 0.07],
        [2.76, 0.13],
        [2.72, 0.24],
        [2.58, 0.32],
        [2.38, 0.36],
        [2.24, 0.34],
        [2.19, 0.2],
        [2.2, 0.07],
      ],
      side * 1.005,
      0.012,
    ),
    material: "red",
  })),
  ...mirrored((side) => ({
    geometry: strut(new Vector3(side * 0.06, 0.2, 2.72), new Vector3(side * 0.09, 0.1, 2.72), 0.03),
    material: "carbon",
  })),

  // Rear wing: mainplane, swept flap, beam wing, endplates and swan-neck pylon
  {
    geometry: wing({
      halfSpan: 0.55,
      chord: () => 0.32,
      y: (t) => 0.8 + 0.03 * t ** 2,
      z: () => -2.36,
      pitch: () => -0.16,
    }),
    material: "carbon",
  },
  {
    geometry: wing({
      halfSpan: 0.55,
      chord: () => 0.21,
      y: (t) => 0.85 + 0.075 * t ** 2,
      z: () => -2.66,
      pitch: () => -0.78,
    }),
    material: "pearl",
  },
  {
    geometry: wing({
      halfSpan: 0.44,
      chord: () => 0.2,
      y: () => 0.47,
      z: () => -2.34,
      pitch: () => -0.35,
    }),
    material: "carbon",
  },
  ...mirrored((side) => ({
    geometry: sidePlate(
      [
        [-2.2, 0.6],
        [-2.17, 0.84],
        [-2.26, 1.0],
        [-2.46, 1.07],
        [-2.86, 1.07],
        [-2.88, 0.96],
        [-2.74, 0.68],
        [-2.56, 0.5],
      ],
      side * 0.555,
      0.014,
    ),
    material: "carbon",
  })),
  ...mirrored((side) => ({
    geometry: box(0.018, 0.04, 0.42),
    material: "red",
    position: [side * 0.56, 1.075, -2.66],
  })),
  ...mirrored((side) => ({
    geometry: sidePlate(
      [
        [-2.3, 0.34],
        [-2.46, 0.84],
        [-2.56, 0.84],
        [-2.5, 0.34],
      ],
      side * 0.05,
      0.016,
    ),
    material: "carbon",
  })),
  { geometry: box(0.16, 0.04, 0.02), material: "light", position: [0, 0.3, -2.57] },

  {
    geometry: tube(
      [
        new Vector3(-0.27, 0.6, -0.3),
        new Vector3(-0.31, 0.73, 0.08),
        new Vector3(-0.23, 0.81, 0.45),
        new Vector3(0, 0.84, 0.7),
        new Vector3(0.23, 0.81, 0.45),
        new Vector3(0.31, 0.73, 0.08),
        new Vector3(0.27, 0.6, -0.3),
      ],
      0.032,
      56,
    ),
    material: "red",
  },
  { geometry: strut(new Vector3(0, 0.84, 0.7), new Vector3(0, 0.55, 0.92), 0.026), material: "red" },

  { geometry: box(0.3, 0.09, 0.14), material: "red", position: [0, 0.68, -0.15] },

  // Airbox intake and onboard camera
  { geometry: new SphereGeometry(0.1, 20, 14), material: "matte", position: [0, 0.805, -0.3], scale: [0.72, 0.58, 0.22] },
  { geometry: box(0.05, 0.03, 0.14), material: "matte", position: [0, 0.925, -0.45] },

  ...mirrored((side) => ({ geometry: strut(new Vector3(side * 0.44, 0.585, 0.46), new Vector3(side * 0.62, 0.68, 0.5), 0.012), material: "carbon" })),
  ...mirrored((side) => ({ geometry: new SphereGeometry(0.1, 14, 10), material: "red", position: [side * 0.65, 0.69, 0.5], scale: [0.72, 0.34, 0.26] })),

  // Double wishbones and pushrods, front then rear
  ...[1, -1].flatMap((side) => [
    { z: 1.4, y: 0.4, wheelY: 0.47 },
    { z: 2.04, y: 0.3, wheelY: 0.47 },
    { z: 1.4, y: 0.17, wheelY: 0.2 },
    { z: 2.04, y: 0.16, wheelY: 0.2 },
  ].map(({ z, y, wheelY }): PartSpec => ({
    geometry: strut(new Vector3(side * 0.14, y, z), new Vector3(side * 0.8, wheelY, 1.75)),
    material: "carbon",
  }))),
  ...[1, -1].flatMap((side) => [
    { z: -1.25, y: 0.44, wheelY: 0.46 },
    { z: -1.9, y: 0.42, wheelY: 0.46 },
    { z: -1.3, y: 0.2, wheelY: 0.2 },
    { z: -1.95, y: 0.22, wheelY: 0.2 },
  ].map(({ z, y, wheelY }): PartSpec => ({
    geometry: strut(new Vector3(side * 0.1, y, z), new Vector3(side * 0.74, wheelY, -1.55)),
    material: "carbon",
  }))),
  ...mirrored((side) => ({ geometry: box(0.1, 0.34, 0.22), material: "matte", position: [side * 0.76, 0.34, 1.75] })),
  ...mirrored((side) => ({ geometry: box(0.1, 0.36, 0.26), material: "matte", position: [side * 0.72, 0.34, -1.55] })),
];

const wheelRadius = 0.36;

function buildWheel(width: number) {
  const faces = [1, -1];
  const arcs = faces.flatMap((side) =>
    [0, 1, 2].map((i) =>
      new RingGeometry(wheelRadius * 0.72, wheelRadius * 0.78, 24, 1, (i / 3) * Math.PI * 2 + 0.25, 1.5)
        .rotateX(side * (Math.PI / 2))
        .translate(0, side * (width / 2 + 0.002), 0),
    ),
  );
  const slots = faces.flatMap((side) =>
    [0, 1, 2, 3, 4].map((i) =>
      new BoxGeometry(0.028, 0.006, 0.09)
        .translate(0, side * (width / 2 + 0.001), 0.13)
        .rotateY((i / 5) * Math.PI * 2),
    ),
  );
  return {
    tyre: tyre(wheelRadius, width),
    cover: new CylinderGeometry(wheelRadius * 0.62, wheelRadius * 0.62, width - 0.02, 40),
    hub: new CylinderGeometry(0.052, 0.052, width + 0.02, 16),
    stripe: mergeGeometries(arcs),
    slots: mergeGeometries(slots),
  };
}

const frontWheel = buildWheel(0.32);
const rearWheel = buildWheel(0.42);

const wheels = [
  { x: 0.94, z: 1.75, shape: frontWheel, steers: true },
  { x: -0.94, z: 1.75, shape: frontWheel, steers: true },
  { x: 0.91, z: -1.55, shape: rearWheel, steers: false },
  { x: -0.91, z: -1.55, shape: rearWheel, steers: false },
];

const wireThreshold = 24;
const paintRed = "#c30f18";
const paintWhite = "#f1f3f6";
const paintBlack = "#0d0e11";

function newCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return { canvas, paint: canvas.getContext("2d") };
}

function finishTexture(canvas: HTMLCanvasElement) {
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

type Lettering = {
  text: string;
  x: number;
  y: number;
  size: number;
  color: string;
  rotation?: number;
  stretch?: [number, number];
};

function letter(paint: CanvasRenderingContext2D, { text, x, y, size, color, rotation = 0, stretch = [1, 1] }: Lettering) {
  paint.save();
  paint.translate(x, y);
  paint.rotate(rotation);
  paint.scale(stretch[0], stretch[1]);
  paint.font = `italic 900 ${size}px Arial, sans-serif`;
  paint.textAlign = "center";
  paint.textBaseline = "middle";
  paint.fillStyle = color;
  paint.fillText(text, 0, 0);
  paint.restore();
}

// Along the canvas runs nose to tail. Down the canvas wraps around the body: the top of
// the car is the middle line, the right side is the lower half, the left is the upper half
function paintChassis() {
  const { canvas, paint } = newCanvas(2048, 1024);
  if (!paint) return null;

  paint.fillStyle = paintRed;
  paint.fillRect(0, 0, 2048, 1024);

  // White rear bodywork sweeping forward over the shoulders
  paint.fillStyle = paintWhite;
  paint.beginPath();
  paint.moveTo(2048, 250);
  paint.lineTo(1400, 250);
  paint.lineTo(1040, 512);
  paint.lineTo(1400, 774);
  paint.lineTo(2048, 774);
  paint.closePath();
  paint.fill();

  // A red spine splits the white panel down the engine cover
  paint.fillStyle = paintRed;
  paint.fillRect(1300, 490, 748, 44);

  paint.fillStyle = paintBlack;
  paint.fillRect(0, 0, 2048, 150);
  paint.fillRect(0, 874, 2048, 150);

  // White nose stripes
  paint.fillStyle = paintWhite;
  paint.fillRect(0, 440, 300, 24);
  paint.fillRect(0, 560, 300, 24);

  letter(paint, { text: profile.number, x: 420, y: 512, size: 130, color: paintWhite, rotation: -Math.PI / 2, stretch: [1.25, 0.46] });
  letter(paint, { text: `SP${profile.number}`, x: 1560, y: 694, size: 74, color: paintBlack, stretch: [0.55, 1.2] });
  letter(paint, { text: `SP${profile.number}`, x: 1560, y: 330, size: 74, color: paintBlack, rotation: Math.PI, stretch: [0.55, 1.2] });

  return finishTexture(canvas);
}

function paintSidepod() {
  const { canvas, paint } = newCanvas(2048, 1024);
  if (!paint) return null;

  paint.fillStyle = paintRed;
  paint.fillRect(0, 0, 2048, 1024);

  paint.fillStyle = paintBlack;
  paint.fillRect(0, 0, 2048, 170);
  paint.fillRect(0, 854, 2048, 170);

  // White flash rising along the ramp on both faces of the pod
  paint.fillStyle = paintWhite;
  [
    [900, 512, 2048, 512, 2048, 150, 1500, 150],
    [900, 512, 2048, 512, 2048, 874, 1500, 874],
  ].forEach(([ax, ay, bx, by, cx, cy, dx, dy]) => {
    paint.beginPath();
    paint.moveTo(ax, ay);
    paint.lineTo(bx, by);
    paint.lineTo(cx, cy);
    paint.lineTo(dx, dy);
    paint.closePath();
    paint.fill();
  });

  // Your own projects take the sponsor spots
  const entries = projects.slice(0, 3).map((project) => project.code);
  entries.forEach((code, i) => {
    letter(paint, { text: code, x: 380 + i * 250, y: 724, size: 74, color: paintWhite, stretch: [1, 0.72] });
    letter(paint, { text: code, x: 380 + i * 250, y: 300, size: 74, color: paintWhite, rotation: Math.PI, stretch: [1, 0.72] });
  });
  letter(paint, { text: profile.number, x: 360, y: 594, size: 150, color: paintWhite, stretch: [0.9, 0.8] });
  letter(paint, { text: profile.number, x: 360, y: 430, size: 150, color: paintWhite, rotation: Math.PI, stretch: [0.9, 0.8] });

  return finishTexture(canvas);
}

function paintShadow() {
  const { canvas, paint } = newCanvas(128, 256);
  if (!paint) return null;
  const gradient = paint.createRadialGradient(64, 128, 8, 64, 128, 128);
  gradient.addColorStop(0, "rgba(255,255,255,0.85)");
  gradient.addColorStop(0.55, "rgba(255,255,255,0.6)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  paint.fillStyle = "#000";
  paint.fillRect(0, 0, 128, 256);
  paint.setTransform(0.5, 0, 0, 1, 32, 0);
  paint.fillStyle = gradient;
  paint.fillRect(-64, 0, 256, 256);
  return new CanvasTexture(canvas);
}

export type CarHandle = {
  group: Group | null;
  setBuild: (plane: Plane, inverse: Plane, wireframeVisible: boolean) => void;
  spin: (angle: number, steer: number) => void;
};

export const Car = forwardRef<CarHandle>(function Car(_, ref) {
  const group = useRef<Group>(null);
  const spinners = useRef<(Group | null)[]>([]);
  const steerers = useRef<(Group | null)[]>([]);
  const wires = useRef<Group>(null);

  const materials = useMemo(() => {
    const gloss = { clearcoat: 1, clearcoatRoughness: 0.06, metalness: 0.08, roughness: 0.3 };
    return {
      body: new MeshPhysicalMaterial({ ...gloss, map: paintChassis() }),
      pod: new MeshPhysicalMaterial({ ...gloss, map: paintSidepod() }),
      red: new MeshPhysicalMaterial({ ...gloss, color: paintRed, side: DoubleSide }),
      pearl: new MeshPhysicalMaterial({ ...gloss, color: paintWhite, side: DoubleSide }),
      carbon: new MeshPhysicalMaterial({
        color: "#08090b",
        metalness: 0.2,
        roughness: 0.42,
        clearcoat: 0.6,
        clearcoatRoughness: 0.25,
        envMapIntensity: 0.45,
        side: DoubleSide,
      }),
      matte: new MeshStandardMaterial({ color: "#050506", roughness: 0.8, side: DoubleSide }),
      tyre: new MeshStandardMaterial({ color: "#111214", roughness: 0.85, envMapIntensity: 0.4 }),
      rim: new MeshPhysicalMaterial({ ...gloss, color: paintRed }),
      light: new MeshBasicMaterial({ color: new Color(6, 0.35, 0.2), toneMapped: false }),
      stripe: new MeshStandardMaterial({ color: "#ffd21a", roughness: 0.55, side: DoubleSide }),
      slot: new MeshStandardMaterial({ color: "#050506", roughness: 0.7 }),
      shadow: new MeshBasicMaterial({ alphaMap: paintShadow(), color: "#000000", transparent: true, depthWrite: false }),
      wire: new LineBasicMaterial({ color: "#c8ff00", transparent: true, opacity: 0.75 }),
    };
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      get group() {
        return group.current;
      },
      setBuild(plane, inverse, wireframeVisible) {
        const solids: Material[] = [
          materials.body,
          materials.pod,
          materials.red,
          materials.pearl,
          materials.carbon,
          materials.matte,
          materials.tyre,
          materials.rim,
          materials.light,
          materials.stripe,
          materials.slot,
        ];
        solids.forEach((material) => {
          material.clippingPlanes = [plane];
        });
        materials.wire.clippingPlanes = [inverse];
        if (wires.current) wires.current.visible = wireframeVisible;
      },
      spin(angle, steer) {
        spinners.current.forEach((wheel) => {
          if (wheel) wheel.rotation.x = angle;
        });
        steerers.current.forEach((wheel) => {
          if (wheel) wheel.rotation.y = steer;
        });
      },
    }),
    [materials],
  );

  return (
    <group ref={group}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0.1]} material={materials.shadow} renderOrder={1}>
        <planeGeometry args={[3.3, 7.2]} />
      </mesh>

      {parts.map((part, i) => (
        <mesh
          key={i}
          geometry={part.geometry}
          material={materials[part.material]}
          position={part.position}
          rotation={part.rotation}
          scale={part.scale}
          castShadow
        />
      ))}

      {wheels.map((wheel, i) => (
        <group
          key={i}
          position={[wheel.x, wheelRadius, wheel.z]}
          ref={(node) => {
            if (wheel.steers) steerers.current[i] = node;
          }}
        >
          <group
            ref={(node) => {
              spinners.current[i] = node;
            }}
          >
            <group rotation={[0, 0, Math.PI / 2]}>
              <mesh geometry={wheel.shape.tyre} material={materials.tyre} castShadow />
              <mesh geometry={wheel.shape.cover} material={materials.rim} />
              <mesh geometry={wheel.shape.hub} material={materials.matte} />
              <mesh geometry={wheel.shape.slots} material={materials.slot} />
              <mesh geometry={wheel.shape.stripe} material={materials.stripe} />
            </group>
          </group>
        </group>
      ))}

      <group ref={wires}>
        {parts.map((part, i) => (
          <lineSegments
            key={i}
            material={materials.wire}
            position={part.position}
            rotation={part.rotation}
            scale={part.scale}
          >
            <edgesGeometry args={[part.geometry, wireThreshold]} />
          </lineSegments>
        ))}
        {wheels.map((wheel, i) => (
          <lineSegments
            key={i}
            material={materials.wire}
            position={[wheel.x, wheelRadius, wheel.z]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <edgesGeometry args={[wheel.shape.tyre, wireThreshold]} />
          </lineSegments>
        ))}
      </group>
    </group>
  );
});
