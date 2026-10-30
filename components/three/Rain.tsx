"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BufferAttribute, BufferGeometry, type LineSegments } from "three";
import { telemetry } from "@/lib/telemetry";

const drops = 1600;
const spread = 70;
const height = 40;
const fallSpeed = 55;

export function Rain() {
  const lines = useRef<LineSegments>(null);
  const fall = useRef(0);

  const geometry = useMemo(() => {
    // Each drop appears twice, one loop height apart, so the fall wraps without a jump
    const positions = new Float32Array(drops * 12);
    for (let i = 0; i < drops; i++) {
      const x = Math.sin(i * 12.9898) * 0.5 * spread;
      const z = Math.cos(i * 78.233) * 0.5 * spread;
      const y = ((i * 0.618034) % 1) * height;
      positions.set([x, y, z, x, y + 1.1, z, x, y + height, z, x, y + height + 1.1, z], i * 12);
    }
    return new BufferGeometry().setAttribute("position", new BufferAttribute(positions, 3));
  }, []);

  useFrame((frame, delta) => {
    if (!lines.current) return;
    fall.current = (fall.current + Math.min(delta, 0.05) * fallSpeed * (1 + telemetry.speed)) % height;
    lines.current.position.set(frame.camera.position.x, -fall.current, frame.camera.position.z);
    frame.invalidate();
  });

  return (
    <lineSegments ref={lines} geometry={geometry} frustumCulled={false}>
      <lineBasicMaterial color="#9fb6cc" transparent opacity={0.34} fog={false} />
    </lineSegments>
  );
}
