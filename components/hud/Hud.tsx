"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { corners } from "@/lib/monaco";
import { formatLap, startTelemetry, subscribeFrames, telemetry } from "@/lib/telemetry";
import { useLapMode } from "@/lib/useLapMode";
import { TrackMap } from "./TrackMap";

const revColors = [
  ...Array<string>(5).fill("bg-green"),
  ...Array<string>(5).fill("bg-red"),
  ...Array<string>(5).fill("bg-purple"),
];

const drsSpeed = 280;
const idleDelay = 1400;
const idleAfterProgress = 0.03;
const gridProgress = 0.008;
const traceLength = 80;
const traceHeight = 30;

function cornerAt(progress: number) {
  return corners.findLast(({ at }) => at <= progress)?.name ?? corners[0].name;
}

function setText(element: HTMLElement | null, text: string) {
  if (element && element.textContent !== text) element.textContent = text;
}

export function Hud() {
  const mode = useLapMode();
  return mode === "off" ? null : <Dash />;
}

function Dash() {
  const root = useRef<HTMLDivElement>(null);
  const speed = useRef<HTMLSpanElement>(null);
  const gear = useRef<HTMLSpanElement>(null);
  const lap = useRef<HTMLSpanElement>(null);
  const revs = useRef<HTMLDivElement>(null);
  const drs = useRef<HTMLAnchorElement>(null);
  const sectors = useRef<(HTMLSpanElement | null)[]>([]);
  const trace = useRef<SVGPolylineElement>(null);
  const corner = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const speedHistory: number[] = Array.from({ length: traceLength }, () => 0);

    function update() {
      speedHistory.push(telemetry.speed);
      speedHistory.shift();
      trace.current?.setAttribute(
        "points",
        speedHistory.map((value, i) => `${i},${(traceHeight - 1 - value * (traceHeight - 3)).toFixed(1)}`).join(" "),
      );

      setText(speed.current, String(telemetry.kph));
      setText(gear.current, telemetry.gear ? String(telemetry.gear) : "N");
      setText(lap.current, formatLap(telemetry.lapMs));
      setText(corner.current, cornerAt(telemetry.progress));

      const litCount = telemetry.gear ? Math.ceil(telemetry.revs * revColors.length) : 0;
      revs.current?.childNodes.forEach((led, index) => {
        (led as HTMLElement).style.opacity = index < litCount ? "1" : "0.12";
      });

      telemetry.splits.forEach((split, index) => {
        const element = sectors.current[index];
        setText(element, split ? (split / 1000).toFixed(1) : "--.-");
        element?.parentElement?.classList.toggle("text-lime", index === telemetry.sector);
      });

      drs.current?.classList.toggle("drs-open", telemetry.kph >= drsSpeed);
    }

    // The dash steps aside for the contact form and finish screen, and whenever
    // the car stops, so it never sits on top of text someone is reading
    const hidden = new Set<Element>();
    let idle = false;
    let idleTimer = 0;

    function refresh() {
      const onGrid = telemetry.progress < gridProgress;
      const hide = hidden.size > 0 || idle || onGrid;
      root.current?.classList.toggle("opacity-0", hide);
      root.current?.classList.toggle("invisible", hide);
    }

    function waitForIdle() {
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        idle = telemetry.progress > idleAfterProgress;
        refresh();
      }, idleDelay);
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) hidden.add(entry.target);
        else hidden.delete(entry.target);
      });
      refresh();
    });
    ["pit-lane", "finish"].forEach((id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });

    const stop = startTelemetry();
    const unsubscribe = subscribeFrames(() => {
      update();
      idle = false;
      refresh();
      waitForIdle();
    });
    update();
    refresh();
    waitForIdle();

    return () => {
      stop();
      unsubscribe();
      observer.disconnect();
      window.clearTimeout(idleTimer);
    };
  }, []);

  return (
    <div
      ref={root}
      className="hud-bar glass pointer-events-none fixed inset-x-0 bottom-0 z-40 transition-opacity duration-300"
    >
      <div ref={revs} aria-hidden className="flex gap-px">
        {revColors.map((color, index) => (
          <span key={index} className={`h-1 flex-1 ${color}`} style={{ opacity: 0.12 }} />
        ))}
      </div>

      <div className="flex h-11 items-center gap-4 px-4 sm:px-6 lg:gap-6 lg:px-10">
        <div aria-hidden className="flex min-w-0 flex-1 items-center gap-4 font-mono lg:gap-6">
          <div className="hidden w-12 shrink-0 lg:block">
            <TrackMap />
          </div>
          <p ref={corner} className="hidden w-40 shrink-0 truncate text-xs font-medium text-lime md:block">
            {corners[0].name}
          </p>
          <p className="flex shrink-0 items-baseline gap-1">
            <span ref={speed} className="w-9 text-right text-base leading-none text-ink">
              0
            </span>
            <span className="text-[0.65rem] text-muted">km/h</span>
          </p>
          <span ref={gear} className="font-display w-5 shrink-0 text-center text-2xl leading-none text-lime">
            N
          </span>
          <p className="ml-auto flex shrink-0 items-baseline gap-1.5 md:ml-0">
            <span className="text-[0.65rem] text-muted">Lap</span>
            <span ref={lap} className="text-sm leading-none text-ink">
              0:00.000
            </span>
          </p>
          <div className="hidden shrink-0 gap-4 text-xs text-muted lg:flex">
            {[0, 1, 2].map((index) => (
              <p key={index}>
                S{index + 1}{" "}
                <span
                  ref={(node) => {
                    sectors.current[index] = node;
                  }}
                >
                  --.-
                </span>
              </p>
            ))}
          </div>
          <svg
            viewBox={`0 0 ${traceLength - 1} ${traceHeight}`}
            preserveAspectRatio="none"
            className="hidden h-6 min-w-0 flex-1 xl:block"
          >
            <polyline
              ref={trace}
              fill="none"
              stroke="var(--color-lime)"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        <Link
          ref={drs}
          href="/#results"
          className="drs pointer-events-auto hidden shrink-0 border border-line px-3 py-1 font-mono text-xs text-muted hover:border-lime hover:text-lime md:block"
        >
          DRS
        </Link>
      </div>
    </div>
  );
}
