"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, DoubleSide, type Mesh, Vector3 } from "three";
import { circuit, circuitLength, lapPosition } from "@/lib/circuit";
import { telemetry } from "@/lib/telemetry";

const rows = 40;
const up = new Vector3(0, 1, 0);
const point = new Vector3();
const tangent = new Vector3();
const side = new Vector3();

const streaks = [
  { offset: 0.54, height: 1.04, width: 0.05, color: new Color(2.4, 3.2, 0.3) },
  { offset: -0.54, height: 1.04, width: 0.05, color: new Color(2.4, 3.2, 0.3) },
  { offset: 0, height: 0.3, width: 0.09, color: new Color(4, 0.25, 0.15) },
];

function buildGeometry() {
  const geometry = new BufferGeometry();
  const count = (rows + 1) * 2 * streaks.length;
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(count * 3), 3));
  geometry.setAttribute("color", new BufferAttribute(new Float32Array(count * 3), 3));
  const index: number[] = [];
  streaks.forEach((_, s) => {
    const base = s * (rows + 1) * 2;
    for (let i = 0; i < rows; i++) {
      const a = base + i * 2;
      index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  });
  geometry.setIndex(index);
  return geometry;
}

// Light streaks off the rear wing and rain light, stretched by speed
export function Trails() {
  const mesh = useRef<Mesh>(null);
  const geometry = useMemo(() => buildGeometry(), []);

  useFrame(() => {
    if (!mesh.current) return;
    const { attributes } = mesh.current.geometry;
    const positions = attributes.position as BufferAttribute;
    const colors = attributes.color as BufferAttribute;
    const u = lapPosition(telemetry.progress);
    const length = 3 + telemetry.speed * 70;
    const glow = Math.min(telemetry.speed * 2.2, 1);
    mesh.current.visible = glow > 0.02;

    let vertex = 0;
    streaks.forEach(({ offset, height, width, color }) => {
      for (let i = 0; i <= rows; i++) {
        const along = i / rows;
        const where = (u - (2.5 + along * length) / circuitLength + 1) % 1;
        circuit.getPointAt(where, point);
        circuit.getTangentAt(where, tangent);
        side.crossVectors(tangent, up).normalize();
        const fade = (1 - along) ** 2 * glow;
        for (const edge of [-1, 1]) {
          positions.setXYZ(
            vertex,
            point.x + side.x * (offset + edge * width),
            height,
            point.z + side.z * (offset + edge * width),
          );
          colors.setXYZ(vertex, color.r * fade, color.g * fade, color.b * fade);
          vertex += 1;
        }
      }
    });
    positions.needsUpdate = true;
    colors.needsUpdate = true;
  });

  return (
    <mesh ref={mesh} geometry={geometry} frustumCulled={false}>
      <meshBasicMaterial vertexColors transparent blending={AdditiveBlending} depthWrite={false} side={DoubleSide} fog={false} />
    </mesh>
  );
}
