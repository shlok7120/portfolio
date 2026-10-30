"use client";

import { useEffect, useRef, useState } from "react";
import { formatLap, getRace, type LapResult, subscribeRace } from "@/lib/telemetry";

const showFor = 7000;
const colours = ["#ffb347", "#e10600", "#ffffff", "#ffd21a"];
const gravity = 90;

type Spark = { x: number; y: number; vx: number; vy: number; life: number; size: number; colour: string; paper: boolean };

const random = (low: number, high: number) => low + Math.random() * (high - low);
const pick = () => colours[Math.floor(Math.random() * colours.length)];

function burst(sparks: Spark[], width: number, height: number) {
  const x = random(width * 0.15, width * 0.85);
  const y = random(height * 0.12, height * 0.5);
  const colour = pick();
  for (let i = 0; i < 70; i++) {
    const angle = random(0, Math.PI * 2);
    const speed = random(40, 240);
    sparks.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: random(0.8, 1.5), size: 2, colour, paper: false });
  }
}

function confetti(sparks: Spark[], width: number) {
  for (let i = 0; i < 3; i++) {
    sparks.push({ x: random(0, width), y: -12, vx: random(-30, 30), vy: random(90, 190), life: 5, size: random(5, 10), colour: pick(), paper: true });
  }
}

// Fireworks and confetti over the page when a lap counts
export function Finale() {
  const [lap, setLap] = useState<LapResult | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let previous = getRace().lap;
    return subscribeRace(() => {
      const next = getRace().lap;
      if (next && next !== previous && !next.deleted && !matchMedia("(prefers-reduced-motion: reduce)").matches) setLap(next);
      previous = next;
    });
  }, []);

  useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext("2d");
    if (!lap || !element || !context) return;

    element.width = window.innerWidth;
    element.height = window.innerHeight;
    const { width, height } = element;
    const sparks: Spark[] = [];
    const started = performance.now();
    let last = started;
    let nextBurst = 0;
    let frame = 0;

    function draw(time: number) {
      const seconds = Math.min((time - last) / 1000, 0.05);
      const elapsed = time - started;
      last = time;
      if (elapsed < showFor - 1500) {
        if (elapsed >= nextBurst) {
          burst(sparks, width, height);
          nextBurst = elapsed + random(250, 600);
        }
        confetti(sparks, width);
      }

      context!.clearRect(0, 0, width, height);
      for (let i = sparks.length - 1; i >= 0; i--) {
        const spark = sparks[i];
        spark.life -= seconds;
        if (spark.life <= 0 || spark.y > height + 20) {
          sparks.splice(i, 1);
          continue;
        }
        if (!spark.paper) spark.vy += gravity * seconds;
        spark.x += spark.vx * seconds;
        spark.y += spark.vy * seconds;
        context!.globalAlpha = Math.min(spark.life, 1);
        context!.fillStyle = spark.colour;
        const wobble = spark.paper ? Math.abs(Math.sin(time / 120 + spark.x)) : 1;
        context!.fillRect(spark.x, spark.y, spark.size, spark.size * wobble);
      }

      if (elapsed < showFor) frame = requestAnimationFrame(draw);
      else setLap(null);
    }

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [lap]);

  if (!lap) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[60]">
      <canvas ref={canvas} className="absolute inset-0 size-full" />
      <p className="finale-text font-display absolute inset-x-0 top-[12%] text-center text-[clamp(3rem,10vw,8rem)] text-lime">
        Chequered flag
        <span className="block font-mono text-xl text-ink">{formatLap(lap.ms)}</span>
      </p>
    </div>
  );
}
