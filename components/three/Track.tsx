"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DataTexture,
  DoubleSide,
  ExtrudeGeometry,
  type InstancedMesh,
  type Material,
  Matrix4,
  MeshStandardMaterial,
  NearestFilter,
  PlaneGeometry,
  Quaternion,
  RGBAFormat,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  SRGBColorSpace,
  Vector2,
  Vector3,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import {
  circuit,
  circuitLength,
  distanceToTrack,
  inSea,
  nearLandmark,
  sampleTrack,
  seaOutline,
  clearReach,
  seatAt,
  terrainHeight,
  terrainSize,
  terrainSteps,
  trackHalfWidth,
  type TrackSample,
} from "@/lib/circuit";
import { harbourStretch, tunnelStretch } from "@/lib/monaco";
import { addWindows, tarmacTexture } from "./surfaces";

const samples = sampleTrack(2600);
const lime = "#c8ff00";

const tarmacRepeat = 30;
const cityPaint = ["#efe3cd", "#e8cfae", "#e6bd9a", "#f1dcc3", "#d9c7ad", "#f3ece0"];
const nightPaint = ["#191c22", "#1d1e22", "#1a1a1e"];

type Edge = number | ((sample: TrackSample, index: number) => number);

const pavementReach = trackHalfWidth + 6;
const reachCache = new Map<number, Float32Array>();

// Beside another stretch of road the pavement narrows, so it can't spread across it
function sideReach(direction: number) {
  const cached = reachCache.get(direction);
  if (cached) return cached;
  const reaches = new Float32Array(samples.length);
  samples.forEach((sample, i) => {
    const { point, side } = sample;
    reaches[i] = clearReach(point.x, point.z, side.x * direction, side.z * direction, i / samples.length, pavementReach, trackHalfWidth + 1.3);
  });
  const smoothed = softenReach(reaches);
  reachCache.set(direction, smoothed);
  return smoothed;
}

function softenReach(reaches: Float32Array) {
  const span = 7;
  const count = reaches.length;
  const narrowest = reaches.map((_, i) => {
    let lowest = Infinity;
    for (let j = -span; j <= span; j++) lowest = Math.min(lowest, reaches[(i + j + count) % count]);
    return lowest;
  });
  return narrowest.map((_, i) => {
    let total = 0;
    for (let j = -span; j <= span; j++) total += narrowest[(i + j + count) % count];
    return total / (span * 2 + 1);
  });
}

const pavementEdge = (direction: number) => (_: TrackSample, index: number) =>
  sideReach(direction)[index % samples.length] * direction;

function ribbon(
  inner: Edge,
  outer: Edge,
  y: number,
  colorAt?: (sample: TrackSample, index: number) => Color,
) {
  const rows = samples.length + 1;
  const positions = new Float32Array(rows * 6);
  const uvs = new Float32Array(rows * 4);
  const colors = colorAt ? new Float32Array(rows * 6) : null;
  const index: number[] = [];
  const stretch = Math.round(circuitLength / tarmacRepeat);

  for (let i = 0; i < rows; i++) {
    const sample = samples[i % samples.length];
    const a = sample.point.clone().addScaledVector(sample.side, typeof inner === "number" ? inner : inner(sample, i));
    const b = sample.point.clone().addScaledVector(sample.side, typeof outer === "number" ? outer : outer(sample, i));
    positions.set([a.x, a.y + y, a.z, b.x, b.y + y, b.z], i * 6);
    uvs.set([0, (i / samples.length) * stretch, 1, (i / samples.length) * stretch], i * 4);
    if (colors && colorAt) {
      const { r, g, b: blue } = colorAt(sample, i);
      colors.set([r, g, blue, r, g, blue], i * 6);
    }
    if (i < samples.length) {
      const next = i + 1;
      index.push(i * 2, i * 2 + 1, next * 2, i * 2 + 1, next * 2 + 1, next * 2);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new BufferAttribute(uvs, 2));
  if (colors) geometry.setAttribute("color", new BufferAttribute(colors, 3));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  return geometry;
}

function strip(from: number, to: number, place: (sample: TrackSample) => [Vector3, Vector3]) {
  const first = Math.floor(from * samples.length);
  const last = Math.floor(to * samples.length);
  const positions: number[] = [];
  const index: number[] = [];
  for (let i = first; i <= last; i++) {
    const [a, b] = place(samples[i]);
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
    const row = (i - first) * 2;
    if (i < last) index.push(row, row + 1, row + 2, row + 1, row + 3, row + 2);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  return geometry;
}

function buildTunnel() {
  const { from, to } = tunnelStretch;
  const reach = trackHalfWidth + 1.6;
  const height = 6.5;
  const edge = (sample: TrackSample, offset: number, y: number) =>
    sample.point.clone().addScaledVector(sample.side, offset).setY(sample.point.y + y);

  const shell = mergeGeometries([
    strip(from, to, (sample) => [edge(sample, -reach, height), edge(sample, reach, height)]),
    strip(from, to, (sample) => [edge(sample, -reach, -6), edge(sample, -reach, height)]),
    strip(from, to, (sample) => [edge(sample, reach, -6), edge(sample, reach, height)]),
  ]);
  const shade = strip(from, to, (sample) => [edge(sample, -reach, 0.04), edge(sample, reach, 0.04)]);

  const lamps = [];
  const count = Math.floor(((to - from) * circuitLength) / 10);
  for (let i = 0; i < count; i++) {
    const sample = samples[Math.floor((from + ((to - from) * i) / count) * samples.length)];
    lamps.push({
      position: sample.point.clone().setY(sample.point.y + height - 0.15),
      scale: new Vector3(1, 1, 1),
      yaw: Math.atan2(sample.tangent.x, sample.tangent.z),
    });
  }
  return { shell, shade, lamps: buildMatrices(lamps) };
}

function buildWalls() {
  const edge = (sample: TrackSample, offset: number, y: number) =>
    sample.point.clone().addScaledVector(sample.side, offset).setY(sample.point.y + y);
  // Deep enough to reach the ground wherever the road runs above it
  const wall = (direction: number) =>
    strip(0, 0.9996, (sample) => {
      const offset = sideReach(direction)[samples.indexOf(sample)] * direction;
      return [edge(sample, offset, 0.05), edge(sample, offset, -45)];
    });
  return mergeGeometries([wall(-1), wall(1)]);
}

type Footprint = [x: number, z: number, reach: number];

// A soft dark patch under each building, so it reads as standing on the ground
function shadeFootprints(positions: BufferAttribute, colors: Float32Array, footprints: Footprint[]) {
  const rows = terrainSteps + 1;
  const cell = terrainSize / terrainSteps;
  for (const [x, z, reach] of footprints) {
    const radius = reach + 16;
    const column = Math.round((x + terrainSize / 2) / cell);
    const row = Math.round((z + terrainSize / 2) / cell);
    const cells = Math.ceil(radius / cell);
    for (let r = Math.max(row - cells, 0); r <= Math.min(row + cells, terrainSteps); r++) {
      for (let c = Math.max(column - cells, 0); c <= Math.min(column + cells, terrainSteps); c++) {
        const vertex = r * rows + c;
        const distance = Math.hypot(positions.getX(vertex) - x, positions.getZ(vertex) - z);
        const shade = 1 - 0.42 * Math.max(1 - Math.max(distance - reach, 0) / 16, 0);
        for (let channel = 0; channel < 3; channel++) colors[vertex * 3 + channel] *= shade;
      }
    }
  }
}

function buildTerrain(footprints: Footprint[]) {
  const geometry = new PlaneGeometry(terrainSize, terrainSize, terrainSteps, terrainSteps);
  geometry.rotateX(-Math.PI / 2);
  const positions = geometry.attributes.position as BufferAttribute;
  const colors = new Float32Array(positions.count * 3);
  const paint = new Color();
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const z = positions.getZ(i);
    const y = terrainHeight(x, z);
    positions.setY(i, y);
    const height = Math.min(Math.max((y - 50) / 130, 0), 1);
    paint.set(height > 0.65 ? "#9b9383" : height > 0.08 ? "#6d7a4e" : "#a0967f");
    colors.set([paint.r, paint.g, paint.b], i * 3);
  }
  shadeFootprints(positions, colors, footprints);
  geometry.setAttribute("color", new BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

// The right of the pit straight stays open, so the harbour shows behind the car
function onPitStraight(sample: TrackSample) {
  const lap = samples.indexOf(sample) / samples.length;
  return lap < 0.16 || lap > 0.84;
}

function buildPalm() {
  const parts: BufferGeometry[] = [new CylinderGeometry(0.1, 0.2, 7, 6).translate(0, 3.5, 0)];
  const trunks = parts[0].attributes.position.count;
  for (let i = 0; i < 7; i++) {
    const frond = new SphereGeometry(1, 6, 3);
    frond.scale(0.5, 0.09, 1.9);
    frond.translate(0, 0, 1.75);
    frond.rotateX(0.32);
    frond.rotateY((i / 7) * Math.PI * 2);
    frond.translate(0, 7, 0);
    parts.push(frond);
  }
  const palm = mergeGeometries(parts.map((part) => part.toNonIndexed()));
  const colors = new Float32Array(palm.attributes.position.count * 3);
  const count = trunks * 2;
  for (let i = 0; i < palm.attributes.position.count; i++) {
    const trunk = palm.attributes.position.getY(i) < 6.6 && i < count;
    colors.set(trunk ? [0.32, 0.23, 0.15] : [0.2, 0.36, 0.13], i * 3);
  }
  palm.setAttribute("color", new BufferAttribute(colors, 3));
  palm.computeVertexNormals();
  return palm;
}

function buildHull() {
  const outline = new Shape();
  outline.moveTo(0, 13);
  outline.bezierCurveTo(2.6, 7, 3.2, 2, 3.2, -9);
  outline.lineTo(2.6, -13);
  outline.lineTo(-2.6, -13);
  outline.lineTo(-3.2, -9);
  outline.bezierCurveTo(-3.2, 2, -2.6, 7, 0, 13);
  const hull = new ExtrudeGeometry(outline, { depth: 2.2, bevelEnabled: false, curveSegments: 8 });
  hull.rotateX(Math.PI / 2);
  hull.translate(0, 1.1, 0);
  return hull;
}

function random(seed: number) {
  const x = Math.sin(seed * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

function buildMatrices(items: { position: Vector3; scale: Vector3; yaw?: number }[]) {
  const up = new Vector3(0, 1, 0);
  return items.map(({ position, scale, yaw = 0 }) =>
    new Matrix4().compose(position, new Quaternion().setFromAxisAngle(up, yaw), scale),
  );
}

function Instances({
  matrices,
  material,
  colors,
  children,
}: {
  matrices: Matrix4[];
  material?: Material;
  colors?: string[];
  children: React.ReactNode;
}) {
  const ref = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const paint = new Color();
    matrices.forEach((matrix, i) => {
      ref.current?.setMatrixAt(i, matrix);
      if (colors) ref.current?.setColorAt(i, paint.set(colors[Math.floor(random(i + 40) * colors.length)]));
    });
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  }, [matrices, colors]);

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, material, matrices.length]}
      material={material}
      frustumCulled={false}
      receiveShadow
    >
      {children}
    </instancedMesh>
  );
}

function StartLine() {
  const point = circuit.getPointAt(0);
  const tangent = circuit.getTangentAt(0);
  const yaw = Math.atan2(tangent.x, tangent.z);
  const span = trackHalfWidth + 2;

  const chequers = useMemo(() => {
    const width = 16;
    const height = 3;
    const data = new Uint8Array(width * height * 4);
    for (let i = 0; i < width * height; i++) {
      const value = (i % width) % 2 === Math.floor(i / width) % 2 ? 235 : 12;
      data.set([value, value, value, 255], i * 4);
    }
    const texture = new DataTexture(data, width, height, RGBAFormat);
    texture.magFilter = NearestFilter;
    texture.colorSpace = SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }, []);

  return (
    <group position={point} rotation={[0, yaw, 0]}>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[trackHalfWidth * 2, 3]} />
        <meshBasicMaterial map={chequers} />
      </mesh>
      {[-span, span].map((x) => (
        <mesh key={x} position={[x, 5, 0]}>
          <boxGeometry args={[0.5, 10, 0.5]} />
          <meshStandardMaterial color="#20242b" />
        </mesh>
      ))}
      <mesh position={[0, 9.5, 0]}>
        <boxGeometry args={[span * 2, 1.4, 0.6]} />
        <meshStandardMaterial color="#20242b" />
      </mesh>
      {[-4, -2, 0, 2, 4].map((x) => (
        <mesh key={x} position={[x, 9.5, 0.34]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.42, 0.42, 0.1, 20]} />
          <meshBasicMaterial color={[0.16, 0.01, 0.01]} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

export function Track({ wet, day, golden }: { wet: boolean; day: boolean; golden: boolean }) {
  const road = useMemo(() => ribbon(-trackHalfWidth, trackHalfWidth, 0), []);
  const tarmac = useMemo(() => tarmacTexture(), []);
  const walls = useMemo(() => buildWalls(), []);
  const towerMaterial = useMemo(() => {
    const material = new MeshStandardMaterial({
      roughness: 0.5,
      metalness: 0.1,
      envMapIntensity: day ? 0.45 : 0.1,
    });
    addWindows(material, day ? "#46637f" : "#0a0e14", golden ? 0.3 : day ? 0 : 1);
    return material;
  }, [day, golden]);
  const pavement = useMemo(
    () => [
      ribbon(pavementEdge(-1), -trackHalfWidth - 1.2, 0.05),
      ribbon(trackHalfWidth + 1.2, pavementEdge(1), 0.05),
    ],
    [],
  );
  const sea = useMemo(() => {
    const points = seaOutline().map(([x, z]) => new Vector2(x, -z));
    return new ShapeGeometry(new Shape(points), 1);
  }, []);
  const tunnel = useMemo(() => buildTunnel(), []);
  const edges = useMemo(
    () => [
      ribbon(-trackHalfWidth, -trackHalfWidth + 0.22, 0.02),
      ribbon(trackHalfWidth - 0.22, trackHalfWidth, 0.02),
    ],
    [],
  );
  const kerbs = useMemo(() => {
    const color = (sample: TrackSample, index: number) =>
      sample.bend < 0.11
        ? new Color(day ? "#585b62" : "#15171c")
        : new Color(Math.floor(index / 2) % 2 ? "#f2f4f7" : day ? "#d8261c" : "#c8ff00");
    return [
      ribbon(-trackHalfWidth - 1.2, -trackHalfWidth, 0.01, color),
      ribbon(trackHalfWidth, trackHalfWidth + 1.2, 0.01, color),
    ];
  }, [day]);

  const dashes = useMemo(() => {
    const items = [];
    const count = Math.floor(circuitLength / 9);
    for (let i = 0; i < count; i++) {
      const sample = samples[Math.floor((i / count) * samples.length)];
      items.push({
        position: sample.point.clone().setY(sample.point.y + 0.025),
        scale: new Vector3(1, 1, 1),
        yaw: Math.atan2(sample.tangent.x, sample.tangent.z),
      });
    }
    return buildMatrices(items);
  }, []);

  const towers = useMemo(() => {
    const bodies = [];
    const caps = [];
    const placed: Footprint[] = [];
    for (let i = 0; i < 620; i++) {
      const sample = samples[Math.floor(random(i + 1) * samples.length)];
      const offset = (24 + random(i + 500) * 130) * (random(i + 900) > 0.35 ? 1 : -1);
      const position = sample.point.clone().addScaledVector(sample.side, offset);
      if (offset > 0 && onPitStraight(sample)) continue;
      if (offset < 0 && Math.abs(offset) < 52 && samples.indexOf(sample) / samples.length > 0.88) continue;
      if (nearLandmark(position.x, position.z)) continue;
      const width = 9 + random(i + 200) * 14;
      const depth = 9 + random(i + 300) * 14;
      const reach = Math.hypot(width, depth) / 2;
      const height = 12 + random(i + 400) ** 2 * 80;
      if (distanceToTrack(position.x, position.z) < trackHalfWidth + 8 + reach) continue;
      if ([-reach, reach].some((dx) => [-reach, reach].some((dz) => inSea(position.x + dx, position.z + dz)))) continue;
      if (placed.some(([x, z, size]) => Math.hypot(x - position.x, z - position.z) < (size + reach) * 0.9)) continue;
      placed.push([position.x, position.z, reach]);
      const base = seatAt(position.x, position.z, reach) - 1.5;
      bodies.push({
        position: position.clone().setY(base + height / 2),
        scale: new Vector3(width, height, depth),
      });
      caps.push({
        position: position.clone().setY(base + height + 0.2),
        scale: new Vector3(width + 0.8, 0.5, depth + 0.8),
      });
    }
    return { bodies: buildMatrices(bodies), caps: buildMatrices(caps), placed };
  }, []);

  const terrain = useMemo(() => buildTerrain(towers.placed), [towers]);

  const palms = useMemo(() => {
    const items = [];
    for (let i = 0; i < 420; i++) {
      const sample = samples[Math.floor(random(i + 2000) * samples.length)];
      const offset = (trackHalfWidth + 3.4 + random(i + 3000) * 2) * (random(i + 4000) > 0.5 ? 1 : -1);
      const position = sample.point.clone().addScaledVector(sample.side, offset);
      if (distanceToTrack(position.x, position.z) < trackHalfWidth + 3) continue;
      const size = 0.8 + random(i + 5000) * 0.5;
      items.push({
        position: position.setY(sample.point.y),
        scale: new Vector3(size, size, size),
        yaw: random(i + 5500) * 6.28,
      });
    }
    return buildMatrices(items);
  }, []);

  const palmShape = useMemo(() => buildPalm(), []);
  const yachtHull = useMemo(() => buildHull(), []);

  const yachts = useMemo(() => {
    const hulls = [];
    const cabins = [];
    for (let i = 0; i < 90; i++) {
      const u = harbourStretch.from + random(i + 6000) * (harbourStretch.to - harbourStretch.from);
      const sample = samples[Math.floor(u * samples.length)];
      const position = sample.point.clone().addScaledVector(sample.side, -(20 + random(i + 7000) * 150));
      if (!inSea(position.x, position.z) || distanceToTrack(position.x, position.z) < 16) continue;
      const length = 12 + random(i + 8000) * 26;
      const yaw = Math.round(random(i + 9000)) * Math.PI + Math.PI / 2 + Math.atan2(sample.tangent.x, sample.tangent.z);
      hulls.push({ position: position.clone().setY(1.2), scale: new Vector3(length / 26, 1, length / 26), yaw });
      cabins.push({ position: position.clone().setY(3), scale: new Vector3(length * 0.16, 2, length * 0.46), yaw });
    }
    return { hulls: buildMatrices(hulls), cabins: buildMatrices(cabins) };
  }, []);

  return (
    <group>
      <mesh geometry={terrain} receiveShadow>
        <meshStandardMaterial
          vertexColors
          color={day ? "#ffffff" : "#20242a"}
          roughness={1}
          flatShading
          envMapIntensity={0}
        />
      </mesh>
      <mesh geometry={walls}>
        <meshStandardMaterial color={day ? "#c9c2b3" : "#16181c"} roughness={0.95} side={DoubleSide} envMapIntensity={0} />
      </mesh>

      <mesh geometry={sea} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <meshStandardMaterial
          color={day ? "#135f92" : "#05121c"}
          roughness={wet ? 0.5 : 0.28}
          metalness={0.1}
          envMapIntensity={day ? 0.22 : 0.12}
        />
      </mesh>

      <mesh geometry={road} receiveShadow>
        <meshStandardMaterial
          map={tarmac}
          color={day ? "#585b62" : "#1f2229"}
          roughness={wet ? 0.18 : 0.8}
          metalness={wet ? 0.5 : 0.05}
          envMapIntensity={wet ? 0.9 : 0.15}
        />
      </mesh>
      {pavement.map((geometry) => (
        <mesh key={geometry.uuid} geometry={geometry} receiveShadow>
          <meshStandardMaterial color={day ? "#b5b2a8" : "#16181c"} roughness={0.9} envMapIntensity={0} />
        </mesh>
      ))}
      {edges.map((geometry) => (
        <mesh key={geometry.uuid} geometry={geometry}>
          <meshBasicMaterial color={day ? "#f4f6f8" : lime} />
        </mesh>
      ))}
      {kerbs.map((geometry) => (
        <mesh key={geometry.uuid} geometry={geometry}>
          <meshBasicMaterial vertexColors />
        </mesh>
      ))}

      <Instances matrices={dashes}>
        <boxGeometry args={[0.16, 0.01, 3]} />
        <meshBasicMaterial color={day ? "#d6dae0" : "#59616d"} />
      </Instances>
      <Instances matrices={towers.bodies} material={towerMaterial} colors={day ? cityPaint : nightPaint}>
        <boxGeometry args={[1, 1, 1]} />
      </Instances>
      <Instances matrices={towers.caps}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={day ? "#b4623f" : "#161311"} roughness={0.8} envMapIntensity={0} />
      </Instances>
      <Instances matrices={palms} material={undefined}>
        <primitive object={palmShape} attach="geometry" />
        <meshStandardMaterial vertexColors roughness={0.9} flatShading envMapIntensity={0} color={day ? "#ffffff" : "#1c2420"} />
      </Instances>

      <Instances matrices={yachts.hulls}>
        <primitive object={yachtHull} attach="geometry" />
        <meshStandardMaterial color={day ? "#f3f4f6" : "#20242a"} roughness={0.3} />
      </Instances>
      <Instances matrices={yachts.cabins}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={day ? "#d7dde3" : "#2c3036"} roughness={0.25} emissive="#ffcf8a" emissiveIntensity={day ? 0 : 0.3} />
      </Instances>

      <mesh geometry={tunnel.shell}>
        <meshStandardMaterial color={day ? "#6f7176" : "#14161a"} roughness={0.85} side={DoubleSide} envMapIntensity={0.1} />
      </mesh>
      <mesh geometry={tunnel.shade}>
        <meshBasicMaterial color="#000000" transparent opacity={day ? 0.62 : 0.2} depthWrite={false} />
      </mesh>
      <Instances matrices={tunnel.lamps}>
        <boxGeometry args={[0.5, 0.08, 3]} />
        <meshBasicMaterial color={[6, 5.2, 3.6]} toneMapped={false} />
      </Instances>

      <StartLine />
    </group>
  );
}
