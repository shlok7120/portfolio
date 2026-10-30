"use client";

import { useEffect, useRef, useState } from "react";

type Stage = { id: string; label: string };

export function SectorRail({ stages }: { stages: Stage[] }) {
  const [active, setActive] = useState(stages[0]?.id);
  const fill = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-35% 0px -60% 0px" },
    );
    stages.forEach(({ id }) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });

    function trackScroll() {
      const first = document.getElementById(stages[0].id);
      const last = document.getElementById(stages[stages.length - 1].id);
      if (!first || !last || !fill.current) return;
      const start = first.offsetTop - window.innerHeight * 0.4;
      const end = last.offsetTop + last.offsetHeight - window.innerHeight * 0.6;
      const progress = Math.min(Math.max((window.scrollY - start) / (end - start), 0), 1);
      fill.current.style.transform = `scaleY(${progress})`;
    }

    trackScroll();
    window.addEventListener("scroll", trackScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", trackScroll);
    };
  }, [stages]);

  return (
    <nav aria-label="Report sections" className="glass sticky top-24 hidden self-start p-4 lg:block">
      <p className="font-mono text-xs text-muted">Lap progress</p>
      <div className="relative mt-3">
        <span aria-hidden className="absolute bottom-1 left-[3px] top-1 w-0.5 bg-line" />
        <span
          ref={fill}
          aria-hidden
          className="absolute bottom-1 left-[3px] top-1 w-0.5 origin-top scale-y-0 bg-lime"
        />
        <ol className="relative space-y-2.5">
          {stages.map(({ id, label }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                aria-current={active === id ? "true" : undefined}
                className="flex items-center gap-2.5 font-mono text-xs text-muted hover:text-lime aria-[current]:font-bold aria-[current]:text-ink"
              >
                <span
                  aria-hidden
                  className={`size-2 shrink-0 ${active === id ? "bg-lime" : "bg-line"}`}
                />
                {label}
              </a>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
