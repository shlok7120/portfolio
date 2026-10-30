"use client";

import Image from "next/image";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { circuitPath, circuitViewBox } from "@/components/ui/CircuitLine";
import { getModes, getServerModes, subscribeModes } from "@/lib/modes";
import { scrollProgress } from "@/lib/scroll";

export function LapFallback() {
  const path = useRef<SVGPathElement>(null);
  const trail = useRef<SVGPathElement>(null);
  const dot = useRef<SVGCircleElement>(null);
  const { day, golden } = useSyncExternalStore(subscribeModes, getModes, getServerModes);

  useEffect(() => {
    function update() {
      if (!path.current || !dot.current || !trail.current) return;
      const length = path.current.getTotalLength();
      const progress = scrollProgress();
      const { x, y } = path.current.getPointAtLength(length * progress);
      dot.current.setAttribute("cx", String(x));
      dot.current.setAttribute("cy", String(y));
      trail.current.style.strokeDashoffset = String(1 - progress);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <>
    <Image
      src={`/lap/poster-${day ? "day" : golden ? "golden" : "night"}.webp`}
      alt=""
      fill
      sizes="100vw"
      priority
      className="object-cover object-[64%_50%]"
    />
    <svg viewBox={circuitViewBox} fill="none" className="absolute inset-x-6 bottom-20 w-1/2 opacity-90">
      <path ref={path} d={circuitPath} stroke="var(--color-carbon)" strokeWidth="18" strokeLinejoin="round" />
      <path
        ref={trail}
        d={circuitPath}
        pathLength={1}
        stroke="var(--color-lime)"
        strokeWidth="7"
        strokeLinejoin="round"
        strokeDasharray="1"
        strokeDashoffset="1"
      />
      <circle ref={dot} r="16" fill="var(--color-lime)" />
    </svg>
    </>
  );
}
