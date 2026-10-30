"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { AdditiveBlending, BufferAttribute, BufferGeometry, CanvasTexture, type Points, Vector3 } from "three";
import { circuit, circuitLength, lapPosition } from "@/lib/circuit";
import { telemetry } from "@/lib/telemetry";

const count = 140;
const flatOutKph = 250;
const flatOutRate = 0.12;
const burstRate = 0.9;
const gravity = 16;
const up = new Vector3(0, 1, 0);
const point = new Vector3();
const tangent = new Vector3();
const side = new Vector3();
const velocity = new Float32Array(count * 3);
const life = new Float32Array(count);
let nextSpark = 0;

function paintDot() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 32;
  const context = canvas.getContext("2d")!;
  const fade = context.createRadialGradient(16, 16, 0, 16, 16, 16);
  fade.addColorStop(0, "#fff");
  fade.addColorStop(0.35, "#fff");
  fade.addColorStop(1, "#000");
  context.fillStyle = fade;
  context.fillRect(0, 0, 32, 32);
  return new CanvasTexture(canvas);
}

// Titanium sparks from the floor when the car brakes hard or bottoms out flat out
export function Sparks() {
  const points = useRef<Points>(null);
  const invalidate = useThree((state) => state.invalidate);
  const dot = useMemo(() => paintDot(), []);
  const geometry = useMemo(() => {
    const shape = new BufferGeometry();
    shape.setAttribute("position", new BufferAttribute(new Float32Array(count * 3), 3));
    shape.setAttribute("color", new BufferAttribute(new Float32Array(count * 3), 3));
    return shape;
  }, []);

  useFrame((_, rawDelta) => {
    const mesh = points.current;
    if (!mesh) return;
    const delta = Math.min(rawDelta, 0.05);
    const positions = mesh.geometry.attributes.position as BufferAttribute;
    const colors = mesh.geometry.attributes.color as BufferAttribute;

    const rate = telemetry.scrape > 0.05 ? burstRate : telemetry.kph > flatOutKph ? flatOutRate : 0;
    if (rate > 0) {
      const u = lapPosition(telemetry.progress);
      circuit.getPointAt((u - 2.4 / circuitLength + 1) % 1, point);
      circuit.getTangentAt(u, tangent);
      side.crossVectors(tangent, up).normalize();
      const carSpeed = telemetry.speed * 60;
      for (let i = 0; i < 6; i++) {
        if (Math.random() > rate) continue;
        const spark = nextSpark;
        nextSpark = (spark + 1) % count;
        const across = (Math.random() - 0.5) * 1.2;
        positions.setXYZ(spark, point.x + side.x * across, point.y + 0.08, point.z + side.z * across);
        velocity[spark * 3] = -tangent.x * carSpeed * 0.3 + side.x * across * 7;
        velocity[spark * 3 + 1] = 1.5 + Math.random() * 6;
        velocity[spark * 3 + 2] = -tangent.z * carSpeed * 0.3 + side.z * across * 7;
        life[spark] = 0.25 + Math.random() * 0.4;
      }
    }

    let alive = 0;
    for (let i = 0; i < count; i++) {
      if (life[i] <= 0) {
        colors.setXYZ(i, 0, 0, 0);
        continue;
      }
      alive += 1;
      life[i] -= delta;
      velocity[i * 3 + 1] -= gravity * delta;
      positions.setXYZ(
        i,
        positions.getX(i) + velocity[i * 3] * delta,
        positions.getY(i) + velocity[i * 3 + 1] * delta,
        positions.getZ(i) + velocity[i * 3 + 2] * delta,
      );
      const heat = Math.max(life[i], 0) * 6;
      colors.setXYZ(i, heat * 1.4, heat * 0.7, heat * 0.18);
    }
    positions.needsUpdate = true;
    colors.needsUpdate = true;
    if (alive > 0) invalidate();
  });

  return (
    <points ref={points} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        vertexColors
        map={dot}
        size={0.09}
        sizeAttenuation
        transparent
        blending={AdditiveBlending}
        depthWrite={false}
        fog={false}
      />
    </points>
  );
}
