import { PitWall } from "@/components/sections/PitWall";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { season } from "@/content/season";

export function Season() {
  return (
    <section id="season" className="px-4 py-28 sm:px-6 lg:px-10">
      <SectionHeader kicker="Season calendar" title="Race weekends" />

      <ol className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {season.map((round, index) => (
          <li key={round.title} className="glass reveal flex flex-col p-6 sm:odd:last:col-span-2 xl:odd:last:col-span-4">
            <p className="font-mono text-xs text-lime">
              R{String(index + 1).padStart(2, "0")} · {round.date}
            </p>
            <h3 className="font-display mt-3 text-xl">{round.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">{round.detail}</p>
          </li>
        ))}
      </ol>
      <PitWall />
    </section>
  );
}
