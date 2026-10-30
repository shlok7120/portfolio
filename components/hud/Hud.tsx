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
      className="dash glass pointer-events-none fixed inset-x-0 bottom-0 z-40 transition-opacity duration-300 md:inset-x-auto md:bottom-5 md:right-5 md:w-80 md:p-4"
    >
      <div aria-hidden>
        <div className="hidden md:block">
          <TrackMap />
        </div>
        <p ref={corner} className="mb-2 mt-1 hidden font-mono text-xs font-bold text-lime md:block">
          {corners[0].name}
        </p>

        <div ref={revs} className="flex gap-0.5 md:gap-1">
          {revColors.map((color, index) => (
            <span key={index} className={`h-1 flex-1 md:h-2 ${color}`} style={{ opacity: 0.12 }} />
          ))}
        </div>

        <div className="grid grid-cols-3 items-center px-4 py-1.5 font-mono md:px-0 md:py-2">
          <p>
            <span ref={speed} className="block text-lg leading-none text-ink md:text-2xl">
              0
            </span>
            <span className="text-[0.65rem] text-muted">km/h</span>
          </p>
          <span ref={gear} className="font-display text-center text-3xl text-lime md:text-5xl">
            N
          </span>
          <p className="text-right">
            <span ref={lap} className="block text-sm leading-none text-ink md:text-base">
              0:00.000
            </span>
            <span className="text-[0.65rem] text-muted">Lap</span>
          </p>
        </div>

        <svg
          viewBox={`0 0 ${traceLength - 1} ${traceHeight}`}
          preserveAspectRatio="none"
          className="mb-2 hidden h-8 w-full md:block"
        >
          <polyline
            ref={trace}
            fill="none"
            stroke="var(--color-lime)"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <div className="hidden grid-cols-3 border-t border-line pt-2 font-mono text-xs text-muted md:grid">
          {[0, 1, 2].map((index) => (
            <p key={index} className={index === 1 ? "text-center" : index === 2 ? "text-right" : ""}>
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
      </div>

      <Link
        ref={drs}
        href="/#results"
        className="drs pointer-events-auto mt-2 hidden border border-line py-1.5 text-center font-mono text-xs text-muted hover:border-lime hover:text-lime md:block"
      >
        DRS · Skip to results
      </Link>
    </div>
  );
}
