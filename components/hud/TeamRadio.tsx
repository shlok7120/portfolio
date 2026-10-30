"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { type RadioCall, radioCalls } from "@/content/radio";
import { radioBeep } from "@/lib/audio";
import { subscribeFrames, telemetry } from "@/lib/telemetry";

const showFor = 7000;

export function TeamRadio() {
  const [call, setCall] = useState<RadioCall | null>(null);
  const reached = useRef(0);

  useEffect(() => {
    return subscribeFrames(() => {
      const { progress } = telemetry;
      const next = radioCalls.findLastIndex(({ at }) => at <= progress) + 1;
      // Rolling back to the start of the lap lets the calls play again
      if (next < reached.current - 1) reached.current = next;
      if (next > reached.current) {
        reached.current = next;
        setCall(radioCalls[next - 1]);
        radioBeep();
      }
    });
  }, []);

  useEffect(() => {
    if (!call) return;
    const timer = window.setTimeout(() => setCall(null), showFor);
    return () => window.clearTimeout(timer);
  }, [call]);

  if (!call) return null;

  return (
    <aside
      role="status"
      className="radio-in glass fixed right-4 top-20 z-40 w-[min(22rem,calc(100vw-2rem))] sm:right-6 lg:right-10"
    >
      <div className="flex items-center gap-2 border-b border-line/70 px-3 py-1.5 font-mono text-xs">
        <span aria-hidden className="flex h-3 items-end gap-0.5">
          {[0, 1, 2, 3].map((bar) => (
            <span key={bar} className="radio-bar w-0.5 bg-lime" style={{ animationDelay: `${bar * 0.12}s` }} />
          ))}
        </span>
        <span className="font-medium text-lime">Team radio</span>
        <span className="text-muted">Pit wall to car 75</span>
        <button
          type="button"
          aria-label="Dismiss radio message"
          onClick={() => setCall(null)}
          className="ml-auto text-muted hover:text-lime"
        >
          ✕
        </button>
      </div>
      <p className="px-3 py-2.5 text-sm leading-relaxed">{call.text}</p>
      {call.href && (
        <Link href={call.href} className="block px-3 pb-2.5 font-mono text-xs text-lime hover:underline">
          {call.link} →
        </Link>
      )}
    </aside>
  );
}
