"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DataTexture,
  DoubleSide,
  type InstancedMesh,
  type Material,
  Matrix4,
  MeshStandardMaterial,
  NearestFilter,
  Quaternion,
  RGBAFormat,
  Shape,
  ShapeGeometry,
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
  sampleTrack,
  seaOutline,
  trackHalfWidth,
  type TrackSample,
} from "@/lib/circuit";
import { harbourStretch, tunnelStretch } from "@/lib/monaco";
import { addWindows, grassTexture, tarmacTexture } from "./surfaces";

const samples = sampleTrack(2600);
const lime = "#c8ff00";

const tarmacRepeat = 30;

function ribbon(
  inner: number,
  outer: number,
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
    const a = sample.point.clone().addScaledVector(sample.side, inner);
    const b = sample.point.clone().addScaledVector(sample.side, outer);
    positions.set([a.x, y, a.z, b.x, y, b.z], i * 6);
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
    sample.point.clone().addScaledVector(sample.side, offset).setY(y);

  const shell = mergeGeometries([
    strip(from, to, (sample) => [edge(sample, -reach, height), edge(sample, reach, height)]),
    strip(from, to, (sample) => [edge(sample, -reach, 0), edge(sample, -reach, height)]),
    strip(from, to, (sample) => [edge(sample, reach, 0), edge(sample, reach, height)]),
  ]);
  const shade = strip(from, to, (sample) => [edge(sample, -reach, 0.04), edge(sample, reach, 0.04)]);

  const lamps = [];
  const count = Math.floor(((to - from) * circuitLength) / 10);
  for (let i = 0; i < count; i++) {
    const sample = samples[Math.floor((from + ((to - from) * i) / count) * samples.length)];
    lamps.push({
      position: sample.point.clone().setY(height - 0.15),
      scale: new Vector3(1, 1, 1),
      yaw: Math.atan2(sample.tangent.x, sample.tangent.z),
    });
  }
  return { shell, shade, lamps: buildMatrices(lamps) };
}

// The right of the pit straight stays open, so the harbour shows behind the car
function onPitStraight(sample: TrackSample) {
  const lap = samples.indexOf(sample) / samples.length;
  return lap < 0.16 || lap > 0.84;
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
  children,
}: {
  matrices: Matrix4[];
  material?: Material;
  children: React.ReactNode;
}) {
  const ref = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    matrices.forEach((matrix, i) => ref.current?.setMatrixAt(i, matrix));
    ref.current.instanceMatrix.needsUpdate = true;
  }, [matrices]);

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

export function Track({ wet, day }: { wet: boolean; day: boolean }) {
  const road = useMemo(() => ribbon(-trackHalfWidth, trackHalfWidth, 0), []);
  const tarmac = useMemo(() => tarmacTexture(), []);
  const grass = useMemo(() => grassTexture(), []);
  const towerMaterial = useMemo(() => {
    const material = new MeshStandardMaterial({
      color: day ? "#e6decf" : "#191c22",
      roughness: 0.45,
      metalness: 0.2,
      envMapIntensity: day ? 0.5 : 0.1,
    });
    addWindows(material, day ? "#4d6f90" : "#0a0e14", day ? 0 : 1);
    return material;
  }, [day]);
  const pavement = useMemo(
    () => [
      ribbon(-trackHalfWidth - 6, -trackHalfWidth - 1.2, 0.05),
      ribbon(trackHalfWidth + 1.2, trackHalfWidth + 6, 0.05),
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
        position: sample.point.clone().setY(0.025),
        scale: new Vector3(1, 1, 1),
        yaw: Math.atan2(sample.tangent.x, sample.tangent.z),
      });
    }
    return buildMatrices(items);
  }, []);

  const towers = useMemo(() => {
    const bodies = [];
    const caps = [];
    for (let i = 0; i < 620; i++) {
      const sample = samples[Math.floor(random(i + 1) * samples.length)];
      const offset = (24 + random(i + 500) * 130) * (random(i + 900) > 0.35 ? 1 : -1);
      const position = sample.point.clone().addScaledVector(sample.side, offset);
      if (inSea(position.x, position.z) || distanceToTrack(position.x, position.z) < 25) continue;
      if (offset > 0 && onPitStraight(sample)) continue;
      const width = 9 + random(i + 200) * 14;
      const depth = 9 + random(i + 300) * 14;
      const height = 12 + random(i + 400) ** 2 * 80;
      bodies.push({
        position: position.clone().setY(height / 2),
        scale: new Vector3(width, height, depth),
      });
      caps.push({
        position: position.clone().setY(height + 0.2),
        scale: new Vector3(width, 0.3, depth),
      });
    }
    return { bodies: buildMatrices(bodies), caps: buildMatrices(caps) };
  }, []);

  const trees = useMemo(() => {
    const items = [];
    for (let i = 0; i < 320; i++) {
      const sample = samples[Math.floor(random(i + 2000) * samples.length)];
      const offset = (10 + random(i + 3000) * 34) * (random(i + 4000) > 0.5 ? 1 : -1);
      const position = sample.point.clone().addScaledVector(sample.side, offset);
      if (inSea(position.x, position.z) || distanceToTrack(position.x, position.z) < 10) continue;
      if (offset > 0 && onPitStraight(sample)) continue;
      const size = 0.5 + random(i + 5000) * 0.55;
      items.push({ position: position.setY(3.2 * size), scale: new Vector3(size, size * 1.25, size) });
    }
    return buildMatrices(items);
  }, []);

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
      hulls.push({ position: position.clone().setY(0.9), scale: new Vector3(length * 0.26, 2, length), yaw });
      cabins.push({ position: position.clone().setY(2.8), scale: new Vector3(length * 0.17, 2, length * 0.5), yaw });
    }
    return { hulls: buildMatrices(hulls), cabins: buildMatrices(cabins) };
  }, []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <circleGeometry args={[2600, 48]} />
        <meshStandardMaterial
          map={grass}
          color={day ? "#9c9a8f" : "#0b0d10"}
          roughness={1}
          envMapIntensity={0}
        />
      </mesh>

      <mesh geometry={sea} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
        <meshStandardMaterial
          color={day ? "#1f78ab" : "#05121c"}
          roughness={wet ? 0.45 : 0.16}
          metalness={0.35}
          envMapIntensity={day ? 0.9 : 0.4}
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
      <Instances matrices={towers.bodies} material={towerMaterial}>
        <boxGeometry args={[1, 1, 1]} />
      </Instances>
      <Instances matrices={towers.caps}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color={day ? "#e7ebef" : "#6f8d12"} />
      </Instances>
      <Instances matrices={trees}>
        <icosahedronGeometry args={[3, 1]} />
        <meshStandardMaterial color={day ? "#4d7f45" : "#0d1411"} roughness={1} flatShading envMapIntensity={0} />
      </Instances>

      <Instances matrices={yachts.hulls}>
        <boxGeometry args={[1, 1, 1]} />
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
