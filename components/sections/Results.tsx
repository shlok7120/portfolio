import Link from "next/link";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TimingBadge } from "@/components/ui/TimingBadge";
import { projects } from "@/content/projects";
import type { Timing } from "@/content/types";

const teamColours: Record<Timing, string> = {
  purple: "bg-purple",
  green: "bg-green",
  yellow: "bg-yellow",
};

export function Results() {
  return (
    <section id="results" className="px-4 py-28 sm:px-6 lg:px-10">
      <SectionHeader kicker="Sector 2 · Race results" title="The classification" />

      <div className="glass reveal mt-8">
        <div
          aria-hidden
          className="hidden grid-cols-[3.5rem_0.3rem_4.5rem_1fr_11rem_7rem_2rem] gap-x-4 border-b border-line px-5 py-2.5 font-mono text-xs text-muted lg:grid"
        >
          <span>Pos</span>
          <span />
          <span>Code</span>
          <span>Entry</span>
          <span>Best sector</span>
          <span>Status</span>
          <span />
        </div>
        <ol>
          {projects.map((project) => (
            <li key={project.slug} className="border-b border-line/70 last:border-b-0">
              <Link
                href={`/projects/${project.slug}`}
                className="timing-row group grid grid-cols-[2.5rem_0.3rem_1fr_auto] items-center gap-x-3 px-3 py-4 sm:px-5 lg:grid-cols-[3.5rem_0.3rem_4.5rem_1fr_11rem_7rem_2rem] lg:gap-x-4"
              >
                <span className="font-display text-2xl text-ink group-hover:text-carbon sm:text-3xl">
                  {project.position}
                </span>
                <span aria-hidden className={`h-9 ${teamColours[project.timing]} group-hover:bg-carbon`} />
                <span className="hidden font-mono text-sm font-bold group-hover:text-carbon lg:block">
                  {project.code}
                </span>
                <span className="min-w-0">
                  <span className="font-display block break-words text-2xl group-hover:text-carbon sm:text-3xl">
                    {project.name}
                  </span>
                  <span className="mt-1 block text-sm text-muted group-hover:text-carbon">{project.tagline}</span>
                </span>
                <span className="hidden font-mono text-sm group-hover:text-carbon lg:block">
                  {project.towerStat}
                </span>
                <span className="hidden group-hover:opacity-0 lg:block">
                  <TimingBadge timing={project.timing} />
                </span>
                <span aria-hidden className="font-mono text-lg group-hover:text-carbon">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
