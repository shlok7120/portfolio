"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PMREMGenerator, Plane, type PerspectiveCamera, Vector3 } from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { Car, type CarHandle } from "@/components/three/Car";
import { compounds, setup } from "@/content/skills";

// Each part of the car opens one group of skills
const hotspots = [
  { part: "Power unit", position: new Vector3(0, 0.95, -1.05) },
  { part: "Aerodynamics", position: new Vector3(0.5, 0.42, 2.7) },
  { part: "Telemetry", position: new Vector3(0.74, 0.5, -0.2) },
  { part: "Chassis", position: new Vector3(0, 0.72, 0.95) },
  { part: "Pit crew", position: new Vector3(1.1, 0.72, -1.55) },
];

const clearPlane = new Plane(new Vector3(0, 1, 0), 1000);
const toScreen = new Vector3();

// Read every frame by the camera, so it lives outside React state
const view = { yaw: 0.9, pitch: 0.28, spinning: true };

function Stage({ markers }: { markers: React.RefObject<(HTMLButtonElement | null)[]> }) {
  const car = useRef<CarHandle>(null);
  const size = useThree((state) => state.size);

  useEffect(() => {
    car.current?.setBuild(clearPlane, clearPlane, false);
  }, []);

  useFrame(({ camera }, delta) => {
    if (view.spinning) view.yaw += delta * 0.22;
    const distance = size.width < size.height ? 30 : 11;
    camera.position.set(
      Math.sin(view.yaw) * Math.cos(view.pitch) * distance,
      0.45 + Math.sin(view.pitch) * distance,
      Math.cos(view.yaw) * Math.cos(view.pitch) * distance,
    );
    camera.lookAt(0, 0.4, 0.1);
    camera.updateMatrixWorld();
    (camera as PerspectiveCamera).updateProjectionMatrix();

    hotspots.forEach(({ position }, index) => {
      const marker = markers.current[index];
      if (!marker) return;
      toScreen.copy(position).project(camera);
      const x = (toScreen.x * 0.5 + 0.5) * size.width;
      const y = (-toScreen.y * 0.5 + 0.5) * size.height;
      marker.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    });
  });

  return <Car ref={car} />;
}

export function Garage({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState("Power unit");
  const [backdrop] = useState(() => getComputedStyle(document.documentElement).getPropertyValue("--color-carbon").trim());
  const markers = useRef<(HTMLButtonElement | null)[]>([]);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const group = setup.find(({ part }) => part === selected) ?? setup[0];

  useEffect(() => {
    view.spinning = !matchMedia("(prefers-reduced-motion: reduce)").matches;
    closeButton.current?.focus();
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const handleKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKey);
    return () => {
      document.documentElement.style.overflow = previous;
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  // On body, because the page's sections can't stack above the nav and HUD
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Pit garage" className="fixed inset-0 z-[100] bg-carbon">
      <div
        className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
        onPointerDown={(event) => {
          drag.current = { x: event.clientX, y: event.clientY };
          view.spinning = false;
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!drag.current) return;
          view.yaw -= (event.clientX - drag.current.x) * 0.008;
          view.pitch = Math.min(Math.max(view.pitch + (event.clientY - drag.current.y) * 0.006, 0.03), 1.35);
          drag.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
      >
        <Canvas
          camera={{ fov: 26 }}
          dpr={[1, 2]}
          onCreated={({ gl, scene }) => {
            gl.localClippingEnabled = true;
            const reflections = new PMREMGenerator(gl);
            scene.environment = reflections.fromScene(new RoomEnvironment(), 0.03).texture;
            reflections.dispose();
          }}
        >
          <color attach="background" args={[backdrop]} />
          <fog attach="fog" args={[backdrop, 34, 100]} />
          <hemisphereLight args={["#ffffff", "#332222", 1]} />
          <directionalLight position={[5, 9, 6]} intensity={2.2} />
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[120, 64]} />
            <meshStandardMaterial color="#6d7078" metalness={0.3} roughness={0.5} />
          </mesh>
          <Stage markers={markers} />
        </Canvas>
      </div>

      {hotspots.map(({ part }, index) => (
        <button
          key={part}
          ref={(node) => {
            markers.current[index] = node;
          }}
          type="button"
          aria-label={`Show ${part}`}
          aria-pressed={selected === part}
          onClick={() => setSelected(part)}
          className={`absolute left-0 top-0 size-5 rounded-full border-2 ${
            selected === part ? "border-white bg-lime" : "border-white bg-carbon/70 hover:bg-lime"
          }`}
        />
      ))}

      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4 sm:p-6 lg:p-10">
        <div>
          <p className="tag">Pit garage · Car 75</p>
          <h2 className="font-display text-5xl sm:text-7xl">Under the bodywork</h2>
          <p className="mt-1 font-mono text-xs text-muted">Drag to rotate. Tap a marker to inspect a part.</p>
        </div>
        <button
          ref={closeButton}
          type="button"
          onClick={onClose}
          className="pointer-events-auto border border-line bg-carbon px-3 py-1.5 font-mono text-sm hover:border-lime hover:text-lime"
        >
          Close
        </button>
      </header>

      <aside className="glass absolute inset-x-4 bottom-4 max-h-[42dvh] overflow-y-auto p-5 sm:inset-x-auto sm:left-6 sm:w-80 lg:left-10">
        <p className="font-mono text-xs text-muted">{group.area}</p>
        <h3 className="font-display mt-1 text-3xl">{group.part}</h3>
        <ul className="mt-4 space-y-2 text-sm">
          {group.skills.map((skill) => (
            <li key={skill.name} className="flex items-center justify-between gap-3">
              <span>{skill.name}</span>
              <span className="font-mono text-xs text-lime">
                {compounds.find(({ id }) => id === skill.compound)?.label}
              </span>
            </li>
          ))}
        </ul>
      </aside>
    </div>,
    document.body,
  );
}
