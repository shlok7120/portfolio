import { SectionHeader } from "@/components/ui/SectionHeader";
import { compounds, setup } from "@/content/skills";

const compoundStyles = {
  hard: "border-ink text-ink",
  medium: "border-yellow text-yellow",
  soft: "border-red text-red",
};

export function Setup() {
  return (
    <section id="setup" className="px-4 py-28 sm:px-6 lg:px-10">
      <SectionHeader kicker="Sector 3 · Car setup" title="What's under the bodywork" />

      <ul className="glass reveal mt-3 flex w-fit flex-wrap gap-x-6 gap-y-2 px-4 py-2.5 font-mono text-sm text-muted">
        {compounds.map((compound) => (
          <li key={compound.id} className="flex items-center gap-2">
            <span
              aria-hidden
              className={`flex size-6 items-center justify-center rounded-full border-2 text-[0.65rem] font-bold ${compoundStyles[compound.id]}`}
            >
              {compound.letter}
            </span>
            {compound.label}: {compound.meaning}
          </li>
        ))}
      </ul>

      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {setup.map((group) => (
          <article key={group.part} className="glass reveal group p-6 md:last:col-span-2">
            <p className="font-mono text-xs text-muted">{group.area}</p>
            <h3 className="font-display mt-2 text-2xl">{group.part}</h3>
            <ul className="mt-5 grid gap-2.5 md:group-last:grid-cols-2">
              {group.skills.map((skill) => (
                <li key={skill.name} className="flex items-center gap-2.5 text-sm">
                  <span
                    role="img"
                    aria-label={skill.compound}
                    className={`flex size-5 items-center justify-center rounded-full border-2 font-mono text-[0.6rem] font-bold ${compoundStyles[skill.compound]}`}
                  >
                    {skill.compound[0].toUpperCase()}
                  </span>
                  {skill.name}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
