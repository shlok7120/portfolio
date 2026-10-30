"use client";

import { useEffect, useRef } from "react";
import { circuitPath, circuitViewBox } from "@/components/ui/CircuitLine";
import { subscribeFrames, telemetry } from "@/lib/telemetry";

export function TrackMap() {
  const path = useRef<SVGPathElement>(null);
  const trail = useRef<SVGPathElement>(null);
  const dot = useRef<SVGCircleElement>(null);

  useEffect(() => {
    function update() {
      if (!path.current || !dot.current || !trail.current) return;
      const { x, y } = path.current.getPointAtLength(path.current.getTotalLength() * telemetry.progress);
      dot.current.setAttribute("cx", String(x));
      dot.current.setAttribute("cy", String(y));
      trail.current.style.strokeDashoffset = String(1 - telemetry.progress);
    }

    update();
    return subscribeFrames(update);
  }, []);

  return (
    <svg viewBox={circuitViewBox} fill="none" className="w-full">
      <path ref={path} d={circuitPath} stroke="var(--color-line)" strokeWidth="24" strokeLinejoin="round" />
      <path
        ref={trail}
        d={circuitPath}
        pathLength={1}
        stroke="var(--color-lime)"
        strokeWidth="12"
        strokeLinejoin="round"
        strokeDasharray="1"
        strokeDashoffset="1"
      />
      <circle ref={dot} r="26" fill="var(--color-lime)" stroke="var(--color-carbon)" strokeWidth="5" />
    </svg>
  );
}
