"use client";

import Image from "next/image";
import { useState } from "react";
import type { Comparison } from "@/content/types";

export function CompareSlider({ comparison }: { comparison: Comparison }) {
  const [position, setPosition] = useState(50);
  const { before, after, beforeLabel, afterLabel, alt, caption, width, height } = comparison;

  return (
    <figure className="mx-auto max-w-xl">
      <div className="relative overflow-hidden border border-line">
        <Image src={before} alt={`${alt}, ${beforeLabel}`} width={width} height={height} className="block w-full" />
        <Image
          src={after}
          alt={`${alt}, ${afterLabel}`}
          width={width}
          height={height}
          className="absolute inset-0 w-full"
          style={{ clipPath: `inset(0 0 0 ${position}%)` }}
        />
        <span aria-hidden className="absolute inset-y-0 w-0.5 bg-lime" style={{ left: `${position}%` }} />
        <span className="absolute left-2 top-2 bg-carbon/85 px-2 py-1 font-mono text-xs">{beforeLabel}</span>
        <span className="absolute right-2 top-2 bg-carbon/85 px-2 py-1 font-mono text-xs">{afterLabel}</span>
        <input
          type="range"
          min={0}
          max={100}
          value={position}
          onChange={(event) => setPosition(Number(event.target.value))}
          aria-label={`Compare ${beforeLabel} and ${afterLabel}`}
          className="absolute inset-0 size-full cursor-ew-resize opacity-0"
        />
      </div>
      <figcaption className="mt-3 text-sm text-muted">{caption}</figcaption>
    </figure>
  );
}
