"use client";

import { useMemo } from "react";
import { ExtrudeGeometry, MeshStandardMaterial, Shape, Vector2 } from "three";
import { casinoSpot, circuit, groundAt, hotelSpot } from "@/lib/circuit";
import { addWindows } from "./surfaces";

const lowestPoint = (() => {
  let south = circuit.getPointAt(0);
  for (let i = 0; i < 400; i++) {
    const point = circuit.getPointAt(i / 400);
    if (point.z > south.z) south = point;
  }
  return south;
})();

// The Rock of Monaco stands in the sea beyond the southern end of the lap
const rockSpot: [number, number] = [lowestPoint.x + 70, lowestPoint.z + 250];

function buildRock() {
  const outline = new Shape(
    [
      [-210, -58], [-120, -82], [-20, -70], [90, -86], [190, -60], [236, -18],
      [200, 44], [100, 70], [-40, 80], [-160, 62], [-236, 12],
    ].map(([x, y]) => new Vector2(x, y)),
  );
  const rock = new ExtrudeGeometry(outline, {
    depth: 46,
    bevelEnabled: true,
    bevelSize: 18,
    bevelThickness: 14,
    bevelSegments: 2,
  });
  rock.rotateX(-Math.PI / 2);
  rock.translate(0, -4, 0);
  return rock;
}

function Dome({ position, radius }: { position: [number, number, number]; radius: number }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[radius, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial color="#6f9a8a" metalness={0.45} roughness={0.4} />
    </mesh>
  );
}

function Casino({ wall, stone }: { wall: MeshStandardMaterial; stone: MeshStandardMaterial }) {
  const [x, z] = casinoSpot;
  const ground = groundAt(x, z) + 1;
  return (
    <group position={[x, ground, z]} rotation={[0, -0.7, 0]}>
      <mesh material={wall} position={[0, 9, 0]}>
        <boxGeometry args={[66, 18, 34]} />
      </mesh>
      <mesh material={stone} position={[0, 18.6, 0]}>
        <boxGeometry args={[68, 1.2, 36]} />
      </mesh>
      {[-34, 34].map((tower) => (
        <group key={tower} position={[tower, 0, 12]}>
          <mesh material={wall} position={[0, 15, 0]}>
            <boxGeometry args={[11, 30, 11]} />
          </mesh>
          <mesh material={stone} position={[0, 30.6, 0]}>
            <boxGeometry args={[12.4, 1.2, 12.4]} />
          </mesh>
          <Dome position={[0, 31, 0]} radius={5.6} />
        </group>
      ))}
      <mesh material={stone} position={[0, 12, 18.4]}>
        <boxGeometry args={[30, 4, 3]} />
      </mesh>
      {[-10, -5, 0, 5, 10].map((column) => (
        <mesh key={column} material={stone} position={[column, 5, 18.4]}>
          <cylinderGeometry args={[0.7, 0.8, 10, 10]} />
        </mesh>
      ))}
      <mesh position={[0, 0.25, 44]}>
        <cylinderGeometry args={[17, 17, 0.5, 32]} />
        <meshStandardMaterial color="#4f7f46" roughness={1} />
      </mesh>
      <mesh position={[0, 1.1, 44]}>
        <cylinderGeometry args={[4.5, 5, 1.4, 24]} />
        <meshStandardMaterial color="#d8d2c4" roughness={0.6} />
      </mesh>
    </group>
  );
}

function GrandHotel({ wall, stone }: { wall: MeshStandardMaterial; stone: MeshStandardMaterial }) {
  const [x, z] = hotelSpot;
  const ground = groundAt(x, z) + 1;
  return (
    <group position={[x, ground, z]} rotation={[0, 0.5, 0]}>
      <mesh material={wall} position={[0, 15, 0]}>
        <boxGeometry args={[74, 30, 26]} />
      </mesh>
      <mesh material={stone} position={[0, 31, 0]}>
        <boxGeometry args={[76, 2, 28]} />
      </mesh>
      <Dome position={[-37, 30, 13]} radius={7} />
      <Dome position={[37, 30, 13]} radius={7} />
    </group>
  );
}

function Rock({ day, wall, stone }: { day: boolean; wall: MeshStandardMaterial; stone: MeshStandardMaterial }) {
  const rock = useMemo(() => buildRock(), []);
  const town = useMemo(
    () =>
      [
        [-170, 0, 22, 18], [-130, 26, 28, 22], [-90, -22, 26, 16], [-52, 18, 30, 24],
        [-10, -30, 24, 20], [120, 22, 26, 20], [162, -8, 30, 22], [86, -30, 24, 18],
      ] as const,
    [],
  );
  return (
    <group position={[rockSpot[0], 0, rockSpot[1]]} rotation={[0, 0.5, 0]}>
      <mesh geometry={rock}>
        <meshStandardMaterial color={day ? "#b9a988" : "#1b1a18"} roughness={1} flatShading envMapIntensity={0} />
      </mesh>
      {town.map(([x, z, width, depth]) => (
        <mesh key={`${x}-${z}`} material={wall} position={[x, 62, z]}>
          <boxGeometry args={[width, 16, depth]} />
        </mesh>
      ))}
      <group position={[40, 0, 8]}>
        <mesh material={stone} position={[0, 64, 0]}>
          <boxGeometry args={[70, 20, 40]} />
        </mesh>
        {[-35, 35].map((x) =>
          [-20, 20].map((z) => (
            <mesh key={`${x}-${z}`} material={stone} position={[x, 68, z]}>
              <cylinderGeometry args={[5, 5.6, 28, 12]} />
            </mesh>
          )),
        )}
      </group>
    </group>
  );
}

function Lighthouse({ x, z, top }: { x: number; z: number; top: string }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 7, 0]}>
        <cylinderGeometry args={[1.5, 2.2, 14, 14]} />
        <meshStandardMaterial color="#f2efe8" roughness={0.6} />
      </mesh>
      <mesh position={[0, 15.4, 0]}>
        <cylinderGeometry args={[1.8, 1.8, 2.8, 14]} />
        <meshStandardMaterial color={top} roughness={0.5} />
      </mesh>
    </group>
  );
}

export function Landmarks({ day, glow }: { day: boolean; glow: boolean }) {
  const wall = useMemo(() => {
    const material = new MeshStandardMaterial({ color: day ? "#f0e4cc" : "#1b1c20", roughness: 0.55, envMapIntensity: 0.3 });
    addWindows(material, day ? "#45627c" : "#0a0e14", glow ? (day ? 0.3 : 1) : 0);
    return material;
  }, [day, glow]);
  const stone = useMemo(
    () => new MeshStandardMaterial({ color: day ? "#e6dac3" : "#26272b", roughness: 0.7, envMapIntensity: 0.25 }),
    [day],
  );

  return (
    <group>
      <Casino wall={wall} stone={stone} />
      <GrandHotel wall={wall} stone={stone} />
      <Rock day={day} wall={wall} stone={stone} />
      <Lighthouse x={lowestPoint.x + 190} z={lowestPoint.z + 40} top="#c30f18" />
      <Lighthouse x={lowestPoint.x + 260} z={lowestPoint.z - 60} top="#2f7d4f" />
    </group>
  );
}
