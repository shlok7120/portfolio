"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import {
  CanvasTexture,
  Color,
  ExtrudeGeometry,
  type InstancedMesh,
  Matrix4,
  Quaternion,
  Shape,
  SRGBColorSpace,
  Vector3,
} from "three";
import { profile } from "@/content/profile";
import { projects } from "@/content/projects";
import { circuit, circuitLength, distanceToTrack, inSea, trackHalfWidth } from "@/lib/circuit";
import { crowdTexture } from "./surfaces";

const yUp = new Vector3(0, 1, 0);

export type GantryInfo = { progress: number; title: string; label: string };

type Item = { position: Vector3; scale: Vector3; yaw?: number; color?: string };

function Instances({ items, children }: { items: Item[]; children: React.ReactNode }) {
  const ref = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const rotation = new Quaternion();
    const paint = new Color();
    items.forEach(({ position, scale, yaw = 0, color }, i) => {
      rotation.setFromAxisAngle(yUp, yaw);
      mesh.setMatrixAt(i, new Matrix4().compose(position, rotation, scale));
      if (color) mesh.setColorAt(i, paint.set(color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [items]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, items.length]} frustumCulled={false}>
      {children}
    </instancedMesh>
  );
}

function ledTexture(lines: { text: string; size: number; color: string; y: number }[], width = 1024, height = 160) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (context) {
    context.fillStyle = "#050607";
    context.fillRect(0, 0, width, height);
    context.textBaseline = "middle";
    lines.forEach(({ text, size, color, y }) => {
      context.font = `italic 900 ${size}px Arial, sans-serif`;
      context.fillStyle = color;
      context.fillText(text.toUpperCase(), 28, y);
    });
    // Fine dark lines read as individual LED rows up close
    context.fillStyle = "rgba(0,0,0,0.3)";
    for (let y = 0; y < height; y += 4) context.fillRect(0, y, width, 1);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function along(u: number) {
  const point = circuit.getPointAt(u % 1);
  const tangent = circuit.getTangentAt(u % 1);
  return { point, tangent, side: new Vector3().crossVectors(tangent, yUp).normalize(), yaw: Math.atan2(tangent.x, tangent.z) };
}

function Gantry({ progress, title, label, day }: GantryInfo & { day: boolean }) {
  const { point, yaw } = along(progress);
  const span = trackHalfWidth + 4;
  const texture = useMemo(
    () =>
      ledTexture([
        { text: label, size: 34, color: "#ffffff", y: 44 },
        { text: `${title}  ·  SP${profile.number}`, size: 78, color: day ? "#ff3440" : "#c8ff00", y: 108 },
      ]),
    [title, label, day],
  );
  const frame = day ? "#2b2f36" : "#15181d";

  return (
    <group position={point} rotation={[0, yaw, 0]}>
      {[-span, span].map((x) => (
        <mesh key={x} position={[x, 5.5, 0]}>
          <boxGeometry args={[0.7, 11, 0.7]} />
          <meshStandardMaterial color={frame} metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, 10.2, 0]}>
        <boxGeometry args={[span * 2 + 0.7, 3.3, 0.8]} />
        <meshStandardMaterial color={frame} metalness={0.6} roughness={0.4} />
      </mesh>
      {[1, -1].map((face) => (
        <mesh key={face} position={[0, 10.2, face * -0.42]} rotation={[0, face > 0 ? Math.PI : 0, 0]}>
          <planeGeometry args={[span * 2, 2.9]} />
          <meshBasicMaterial map={texture} color={day ? "#ffffff" : "#d8d8d8"} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function Billboard({ u, offset, title, stat, day }: { u: number; offset: number; title: string; stat: string; day: boolean }) {
  const { point, side, yaw } = along(u);
  const position = point.clone().addScaledVector(side, offset).setY(point.y + 3.6);
  const facing = yaw + (offset > 0 ? -Math.PI / 2 : Math.PI / 2) + (offset > 0 ? 0.45 : -0.45);
  const texture = useMemo(
    () =>
      ledTexture(
        [
          { text: title, size: 58, color: "#ffffff", y: 54 },
          { text: stat, size: 44, color: day ? "#ff3440" : "#c8ff00", y: 118 },
        ],
        768,
        160,
      ),
    [title, stat, day],
  );

  return (
    <group position={position} rotation={[0, facing, 0]}>
      {[-5.5, 5.5].map((x) => (
        <mesh key={x} position={[x, -6, -0.2]}>
          <boxGeometry args={[0.25, 12, 0.25]} />
          <meshStandardMaterial color={day ? "#3a3f47" : "#14171b"} />
        </mesh>
      ))}
      <mesh position={[0, 0, -0.15]}>
        <boxGeometry args={[13.4, 3.1, 0.25]} />
        <meshStandardMaterial color={day ? "#23262c" : "#0b0d10"} />
      </mesh>
      <mesh>
        <planeGeometry args={[13, 2.7]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </group>
  );
}

function numberGeometry() {
  const seven = new Shape();
  seven.moveTo(0, 10);
  seven.lineTo(7.4, 10);
  seven.lineTo(7.4, 8.5);
  seven.lineTo(3.5, 0);
  seven.lineTo(1, 0);
  seven.lineTo(4.7, 8);
  seven.lineTo(0, 8);
  seven.closePath();

  const five = new Shape();
  five.moveTo(9.6, 10);
  five.lineTo(15.3, 10);
  five.lineTo(15.3, 8.2);
  five.lineTo(11.4, 8.2);
  five.lineTo(11.1, 6.1);
  five.bezierCurveTo(15, 6.6, 15.8, 5, 15.8, 3.2);
  five.bezierCurveTo(15.8, 1, 13.9, -0.2, 12.1, -0.2);
  five.bezierCurveTo(10.3, -0.2, 9, 0.8, 8.6, 2.4);
  five.lineTo(10.7, 2.8);
  five.bezierCurveTo(11, 2, 11.5, 1.6, 12.1, 1.6);
  five.bezierCurveTo(13.1, 1.6, 13.7, 2.3, 13.7, 3.2);
  five.bezierCurveTo(13.7, 4.2, 12.9, 4.8, 11.9, 4.8);
  five.bezierCurveTo(10.7, 4.8, 10.1, 4.4, 9.2, 4.4);
  five.closePath();

  const geometry = new ExtrudeGeometry([seven, five], {
    depth: 1.6,
    bevelEnabled: true,
    bevelSize: 0.08,
    bevelThickness: 0.08,
    curveSegments: 16,
  });
  geometry.applyMatrix4(new Matrix4().makeShear(0, 0, 0.22, 0, 0, 0));
  geometry.center();
  return geometry;
}

export function Trackside({ gantries, day }: { gantries: GantryInfo[]; day: boolean }) {
  const barriers = useMemo(() => {
    const items: Item[] = [];
    const count = Math.floor(circuitLength / 5);
    const palette = day ? ["#f4f6f8", "#d8261c"] : ["#20242b", "#c8ff00"];
    const startGap = 0.03;
    for (let i = 0; i < count; i++) {
      const u = i / count;
      const { point, side, yaw } = along(u);
      for (const direction of [1, -1]) {
        if (direction < 0 && (u < startGap || u > 1 - startGap)) continue;
        items.push({
          position: point.clone().addScaledVector(side, direction * (trackHalfWidth + 1.5)).setY(point.y + 0.55),
          scale: new Vector3(0.35, 1.1, 5.1),
          yaw,
          color: palette[Math.floor(i / 2) % 2 === 0 ? 0 : day ? 1 : 0],
        });
      }
    }
    return items;
  }, [day]);

  const fence = useMemo(() => {
    const items: Item[] = [];
    const count = Math.floor(circuitLength / 8);
    for (let i = 0; i < count; i++) {
      const { point, side } = along(i / count);
      for (const direction of [1, -1]) {
        if (direction < 0 && (i / count < 0.03 || i / count > 0.97)) continue;
        items.push({
          position: point.clone().addScaledVector(side, direction * (trackHalfWidth + 1.8)).setY(point.y + 2.1),
          scale: new Vector3(1, 1, 1),
        });
      }
    }
    return items;
  }, []);

  const floodlights = useMemo(() => {
    const poles: Item[] = [];
    const lamps: Item[] = [];
    for (let i = 0; i < 44; i++) {
      const { point, side, yaw } = along(i / 44);
      const direction = i % 2 ? 1 : -1;
      const base = point.clone().addScaledVector(side, direction * (trackHalfWidth + 7));
            poles.push({ position: base.clone().setY(point.y + 10.4), scale: new Vector3(1, 1.2, 1) });
      lamps.push({ position: base.clone().addScaledVector(side, -direction).setY(point.y + 26), scale: new Vector3(1, 1, 1), yaw });
    }
    return { poles, lamps };
  }, []);

  const stand = useMemo(() => {
    const tiers: Item[] = [];
    const roofs: Item[] = [];
    const backing: Item[] = [];
    const floor = -8;
    const span = 0.1;
    const bays = 12;
    for (let bay = 0; bay < bays; bay++) {
      const { point, side, yaw } = along(0.9 + (bay / bays) * span);
      for (let tier = 0; tier < 7; tier++) {
        tiers.push({
          position: point.clone().addScaledVector(side, -(trackHalfWidth + 9 + tier * 2)).setY(point.y + 1.1 + tier * 1.5),
          scale: new Vector3(2, 1.5, 21),
          yaw,
        });
        // Solid concrete under each row, so the stand reaches the ground
        const underside = 0.35 + tier * 1.5;
        backing.push({
          position: point.clone().addScaledVector(side, -(trackHalfWidth + 9 + tier * 2)).setY(point.y + (underside + floor) / 2),
          scale: new Vector3(2, underside - floor, 21),
          yaw,
        });
      }
      backing.push({
        position: point.clone().addScaledVector(side, -(trackHalfWidth + 23.2)).setY(point.y + (14.5 + floor) / 2),
        scale: new Vector3(0.6, 14.5 - floor, 21),
        yaw,
      });
      roofs.push({
        position: point.clone().addScaledVector(side, -(trackHalfWidth + 15)).setY(point.y + 14.5),
        scale: new Vector3(18, 0.4, 21),
        yaw,
      });
    }
    return { tiers, roofs, backing };
  }, []);

  // Short bays that follow the road, skipped wherever another stretch of track passes
  const pits = useMemo(() => {
    const bodies: Item[] = [];
    const glass: Item[] = [];
    const stripes: Item[] = [];
    const bays = 24;
    const bayLength = 10;
    for (let bay = 0; bay < bays; bay++) {
      const { point, side, yaw } = along(0.06 + (bay * bayLength) / circuitLength);
      const centre = point.clone().addScaledVector(side, trackHalfWidth + 14);
      if (distanceToTrack(centre.x, centre.z) < trackHalfWidth + 13) continue;
      const front = point.clone().addScaledVector(side, trackHalfWidth + 6.95);
      bodies.push({ position: centre.clone().setY(point.y + 2), scale: new Vector3(14, 20, bayLength + 0.4), yaw });
      glass.push({ position: front.clone().setY(point.y + 7.6), scale: new Vector3(0.1, 3.6, bayLength + 0.4), yaw });
      stripes.push({ position: front.clone().setY(point.y + 11.4), scale: new Vector3(0.1, 0.4, bayLength + 0.4), yaw });
    }
    return { bodies, glass, stripes };
  }, []);
  const monument = useMemo(() => along(0.9955), []);
  const crowd = useMemo(() => crowdTexture(), []);
  const seventyFive = useMemo(() => numberGeometry(), []);

  const boards = useMemo(() => {
    const entries = projects.map((project) => ({ title: project.name, stat: project.towerStat }));
    const placed = [];
    for (let i = 0; i < 40 && placed.length < entries.length * 2; i++) {
      const u = 0.1 + (i / 40) * 0.82;
      const offset = (trackHalfWidth + 9) * (i % 2 ? 1 : -1);
      const { point, side } = along(u);
      const spot = point.clone().addScaledVector(side, offset);
      if (inSea(spot.x, spot.z) || distanceToTrack(spot.x, spot.z) < trackHalfWidth + 7) continue;
      placed.push({ ...entries[placed.length % entries.length], u, offset });
    }
    return placed;
  }, []);

  return (
    <group>
      <Instances items={barriers}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.5} />
      </Instances>
      <Instances items={fence}>
        <boxGeometry args={[0.06, 4.2, 0.06]} />
        <meshStandardMaterial color={day ? "#8d949d" : "#23272e"} metalness={0.6} roughness={0.4} />
      </Instances>

      <Instances items={floodlights.poles}>
        <cylinderGeometry args={[0.16, 0.28, 26, 8]} />
        <meshStandardMaterial color={day ? "#7a818a" : "#14171b"} metalness={0.6} roughness={0.5} />
      </Instances>
      <Instances items={floodlights.lamps}>
        <boxGeometry args={[3.8, 1, 0.5]} />
        <meshBasicMaterial color={day ? "#d4d8dd" : "#fff4dc"} toneMapped={false} />
      </Instances>

      <Instances items={stand.tiers}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial map={crowd} roughness={0.9} emissiveMap={crowd} emissive="#ffffff" emissiveIntensity={day ? 0 : 0.1} />
      </Instances>
      <Instances items={stand.backing}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={day ? "#cfc9bc" : "#14161a"} roughness={0.9} />
      </Instances>
      <Instances items={stand.roofs}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={day ? "#dfe4ea" : "#1a1d22"} metalness={0.3} roughness={0.5} />
      </Instances>

      <Instances items={pits.bodies}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={day ? "#e4e8ed" : "#14171c"} metalness={0.25} roughness={0.35} />
      </Instances>
      <Instances items={pits.glass}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color={day ? "#3a5a7a" : [1.6, 1.9, 1]} toneMapped={false} />
      </Instances>
      <Instances items={pits.stripes}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color={day ? "#b80f1b" : "#b6f000"} toneMapped={false} />
      </Instances>

      <mesh
        position={monument.point.clone().addScaledVector(monument.side, trackHalfWidth + 12.4).setY(monument.point.y + 1.4)}
        rotation={[0, monument.yaw + Math.PI / 2, 0]}
      >
        <boxGeometry args={[19, 18, 0.5]} />
        <meshStandardMaterial color={day ? "#f4f1ea" : "#0c0e12"} roughness={0.5} />
      </mesh>
      <mesh
        geometry={seventyFive}
        position={monument.point.clone().addScaledVector(monument.side, trackHalfWidth + 11).setY(monument.point.y + 5.1)}
        rotation={[0, monument.yaw + Math.PI / 2, 0]}
        scale={0.92}
      >
        <meshPhysicalMaterial
          color={day ? "#c30f18" : "#0b0d10"}
          emissive={day ? "#000000" : "#b6f000"}
          emissiveIntensity={day ? 0.05 : 2.2}
          metalness={0.2}
          roughness={0.28}
          clearcoat={1}
        />
      </mesh>

      {gantries.map((gantry) => (
        <Gantry key={gantry.title} {...gantry} day={day} />
      ))}
      {boards.map((board) => (
        <Billboard key={`${board.title}-${board.u}`} {...board} day={day} />
      ))}
    </group>
  );
}
