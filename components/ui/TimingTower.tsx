import Link from "next/link";
import { TimingBadge } from "@/components/ui/TimingBadge";
import { profile } from "@/content/profile";
import { projects } from "@/content/projects";

export function TimingTower() {
  return (
    <aside aria-label="Project standings" className="glass mt-20 w-full max-w-md self-start">
      <h2 className="flex items-center justify-between border-b border-line px-4 py-3 font-mono text-xs text-muted">
        <span>Live timing</span>
        <span>Season {profile.season}</span>
      </h2>
      <ol>
        {projects.map((project) => (
          <li key={project.slug} className="border-b border-line/60 last:border-b-0">
            <Link
              href={`/projects/${project.slug}`}
              className="grid grid-cols-[2rem_3.5rem_1fr_auto] items-center gap-2 px-4 py-2.5 font-mono text-sm hover:bg-lime/10"
            >
              <span className="text-muted">{project.position}</span>
              <span className="font-semibold">{project.code}</span>
              <span className="truncate text-muted">{project.towerStat}</span>
              <TimingBadge timing={project.timing} />
            </Link>
          </li>
        ))}
      </ol>
    </aside>
  );
}
