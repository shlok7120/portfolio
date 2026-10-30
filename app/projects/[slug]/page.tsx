import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Backdrop } from "@/components/report/Backdrop";
import { SectorRail } from "@/components/report/SectorRail";
import { BarChart } from "@/components/ui/BarChart";
import { CompareSlider } from "@/components/ui/CompareSlider";
import { PipelineDiagram } from "@/components/ui/PipelineDiagram";
import { TimingBadge } from "@/components/ui/TimingBadge";
import { TraceList } from "@/components/ui/TraceList";
import { getProject, projects } from "@/content/projects";

export const instant = false;

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return { title: project.name, description: project.tagline };
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const index = projects.indexOf(project);
  const next = projects[(index + 1) % projects.length];
  const hasEvidence = Boolean(project.comparison || project.media?.length || project.trace);

  const stages = [
    { id: "qualifying", label: "Qualifying", show: true },
    { id: "race", label: "The race", show: true },
    { id: "design", label: "Design", show: Boolean(project.pipeline) },
    { id: "evidence", label: "Onboard", show: hasEvidence },
    { id: "telemetry", label: "Telemetry", show: project.charts.length > 0 },
    { id: "race-control", label: "Race control", show: project.incidents.length > 0 },
    { id: "stewards", label: "Stewards", show: project.notes.length > 0 },
    { id: "car-setup", label: "Car setup", show: true },
  ]
    .filter((stage) => stage.show)
    .map(({ id, label }) => ({ id, label }));

  return (
    <>
      <div aria-hidden className="lap-only fixed inset-0 z-0">
        <Backdrop slug={project.slug} priority />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-carbon/12 to-carbon/70" />
      </div>

      <main className="relative z-10 min-w-0">
        <header className="report-hero flex min-h-[86dvh] flex-col justify-between gap-10 bg-gradient-to-r from-carbon/40 to-transparent px-4 pb-8 pt-20 sm:px-6 lg:px-10">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs">
            <Link href="/#results" className="font-bold text-ink hover:text-lime">
              ← Race results
            </Link>
            <span className="text-ink">
              Round {project.position} of {projects.length}
            </span>
            <span className="text-ink">{project.date}</span>
          </div>

          <div>
            <p className="tag">
              P{project.position} · {project.code} · {project.team}
            </p>
            <h1 className="rise-in font-display mt-3 max-w-5xl break-words text-[clamp(3.2rem,9.5vw,9rem)]">
              {project.name}
            </h1>
            <div className="glass mt-5 max-w-2xl px-5 py-4">
              <p className="text-base leading-relaxed sm:text-lg">{project.tagline}</p>
              {project.role && <p className="mt-2 font-mono text-sm text-muted">{project.role}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <TimingBadge timing={project.timing} />
                {project.links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-race"
                  >
                    {link.label} ↗
                  </a>
                ))}
              </div>
            </div>
          </div>
        </header>

        <dl className="glass mx-4 grid grid-cols-2 sm:mx-6 lg:mx-10 lg:auto-cols-fr lg:grid-flow-col lg:grid-cols-none">
          {project.stats.map((stat) => (
            <div
              key={stat.label}
              className="border-b border-r border-line/70 p-4 odd:last:col-span-2 sm:p-5 lg:border-b-0 lg:odd:last:col-span-1 lg:last:border-r-0"
            >
              <dd className="font-display text-3xl text-lime sm:text-4xl">{stat.value}</dd>
              <dt className="mt-2 font-mono text-xs text-muted">{stat.label}</dt>
            </div>
          ))}
        </dl>

        <div className="mt-4 grid items-start gap-4 px-4 pb-16 sm:px-6 lg:grid-cols-[11rem_minmax(0,1fr)] lg:px-10">
          <SectorRail stages={stages} />

          <div className="min-w-0 space-y-4">
            <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
              <section id="qualifying">
                <h2 className="tag">Qualifying · The problem</h2>
                <p className="glass p-5 text-lg leading-relaxed sm:p-6">{project.problem}</p>
              </section>
              <section id="race">
                <h2 className="tag">The race · What I built</h2>
                <ol className="glass p-5 sm:p-6">
                  {project.build.map((item, step) => (
                    <li
                      key={item}
                      className="grid grid-cols-[2rem_1fr] border-b border-line/60 py-2.5 leading-relaxed first:pt-0 last:border-b-0 last:pb-0"
                    >
                      <span className="font-mono text-xs leading-7 text-lime">L{step + 1}</span>
                      <span className="text-muted">{item}</span>
                    </li>
                  ))}
                </ol>
              </section>
            </div>

            {project.pipeline && (
              <section id="design">
                <h2 className="tag">Design</h2>
                <div className="glass p-5 sm:p-7">
                  <PipelineDiagram pipeline={project.pipeline} />
                </div>
              </section>
            )}

            {hasEvidence && (
              <section id="evidence" className="space-y-4">
                <h2 className="tag">Onboard · The evidence</h2>
                {project.comparison && (
                  <div className="glass p-5 sm:p-7">
                    <CompareSlider comparison={project.comparison} />
                  </div>
                )}
                {project.media?.map((item) => (
                  <figure key={item.src} className="glass p-3 sm:p-4">
                    <Image
                      src={item.src}
                      alt={item.alt}
                      width={item.width}
                      height={item.height}
                      className="mx-auto max-h-[75dvh] w-auto"
                    />
                    <figcaption className="mt-3 px-1 text-sm text-muted">{item.caption}</figcaption>
                  </figure>
                ))}
                {project.trace && (
                  <div className="glass p-5 sm:p-7">
                    <TraceList trace={project.trace} />
                  </div>
                )}
              </section>
            )}

            {project.charts.length > 0 && (
              <section id="telemetry">
                <h2 className="tag">Telemetry</h2>
                <div className={`grid gap-4 ${project.charts.length > 1 ? "xl:grid-cols-2" : ""}`}>
                  {project.charts.map((chart) => (
                    <div key={chart.title} className="glass p-5 sm:p-7">
                      <BarChart chart={chart} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {project.incidents.length > 0 && (
              <section id="race-control">
                <h2 className="tag">Race control · What went wrong</h2>
                <ol className="grid gap-4 md:grid-cols-2">
                  {project.incidents.map((incident, number) => (
                    <li key={incident.title} className="glass border-l-4 border-l-yellow p-5 md:odd:last:col-span-2">
                      <p className="font-mono text-xs font-bold text-yellow">
                        Incident {String(number + 1).padStart(2, "0")} · Investigated
                      </p>
                      <h3 className="font-display mt-2 text-xl">{incident.title}</h3>
                      <p className="mt-3 leading-relaxed text-muted">{incident.happened}</p>
                      <p className="mt-3 border-t border-line/70 pt-3 leading-relaxed">
                        <span className="font-mono text-xs font-bold text-lime">Decision </span>
                        {incident.fix}
                      </p>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {project.notes.length > 0 && (
              <section id="stewards">
                <h2 className="tag">Stewards&apos; notes</h2>
                <ol className="glass p-5 sm:p-6">
                  {project.notes.map((note, number) => (
                    <li
                      key={note}
                      className="grid grid-cols-[4.5rem_1fr] gap-x-3 border-b border-line/60 py-2.5 leading-relaxed first:pt-0 last:border-b-0 last:pb-0"
                    >
                      <span className="font-mono text-xs leading-7 text-muted">
                        Doc {String(number + 1).padStart(2, "0")}
                      </span>
                      <span className="text-muted">{note}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            <section id="car-setup">
              <h2 className="tag">Car setup</h2>
              <ul className="glass flex flex-wrap gap-2 p-4">
                {project.stack.map((tech) => (
                  <li key={tech} className="border border-line px-3 py-1.5 font-mono text-sm">
                    {tech}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        <Link
          href={`/projects/${next.slug}`}
          className="group relative block min-h-[46dvh] overflow-hidden bg-carbon"
        >
          <span aria-hidden className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
            <Backdrop slug={next.slug} />
          </span>
          <span className="absolute inset-0 bg-gradient-to-r from-carbon/85 via-carbon/30 to-transparent" />
          <span className="relative flex min-h-[46dvh] flex-col justify-end px-4 pb-10 sm:px-6 lg:px-10">
            <span className="tag w-fit">Next race · Round {next.position}</span>
            <span className="font-display glass w-fit max-w-full break-words px-5 py-3 text-4xl sm:text-6xl lg:text-7xl">
              {next.name} →
            </span>
          </span>
        </Link>
      </main>
    </>
  );
}
