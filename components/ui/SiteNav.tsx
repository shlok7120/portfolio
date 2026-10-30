"use client";

import Link from "next/link";
import { motion, useScroll } from "motion/react";
import { useSyncExternalStore } from "react";
import { LapControls } from "@/components/hud/LapControls";
import { getModes, getServerModes, setDay, setSafety, subscribeModes } from "@/lib/modes";
import { profile } from "@/content/profile";

const stages = [
  { label: "Driver", href: "/#driver" },
  { label: "Results", href: "/#results" },
  { label: "Setup", href: "/#setup" },
  { label: "Season", href: "/#season" },
  { label: "Pit Lane", href: "/#pit-lane" },
];

export function SiteNav() {
  const { scrollYProgress } = useScroll();
  const { day, safety } = useSyncExternalStore(subscribeModes, getModes, getServerModes);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-carbon/85 backdrop-blur">
      <nav
        aria-label="Main"
        className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6 lg:px-10"
      >
        <Link href="/#grid" className="font-display text-lg">
          SP<span className="text-lime">{profile.number}</span>
        </Link>
        <ul className="hidden gap-6 font-mono text-sm text-muted md:flex">
          {stages.map((stage) => (
            <li key={stage.href}>
              <Link href={stage.href} className="hover:text-lime">
                {stage.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/#pit-lane" className="font-mono text-sm text-lime md:hidden">
            Pit Lane
          </Link>
          <LapControls />
          <button
            type="button"
            aria-label={day ? "Day mode, switch to night" : "Night mode, switch to day"}
            onClick={() => setDay(!day)}
            className="border border-line px-2.5 py-1 font-mono text-xs text-ink hover:border-lime hover:text-lime"
          >
            {day ? "Day" : "Night"}
          </button>
          <button
            type="button"
            aria-pressed={safety}
            title="A plain, fast version of this site with no animation"
            onClick={() => setSafety(!safety)}
            className={`border px-2.5 py-1 font-mono text-xs ${
              safety
                ? "border-yellow bg-yellow text-carbon"
                : "border-yellow/60 text-yellow hover:bg-yellow hover:text-carbon"
            }`}
          >
            Safety Car
          </button>
        </div>
      </nav>
      <motion.div
        aria-hidden
        className="h-0.5 origin-left bg-lime"
        style={{ scaleX: scrollYProgress }}
      />
    </header>
  );
}
