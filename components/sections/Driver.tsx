import { SectionHeader } from "@/components/ui/SectionHeader";
import { profile } from "@/content/profile";

export function Driver() {
  return (
    <section id="driver" className="px-4 py-28 sm:px-6 lg:px-10">
      <SectionHeader kicker="Sector 1 · Driver profile" title="Built to ship" />

      <div className="reveal mt-8 grid items-start gap-4 lg:grid-cols-[minmax(0,26rem)_1fr]">
        <article className="glass relative overflow-hidden p-6">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-lime" />
          <div className="flex items-start justify-between gap-4">
            <p className="font-mono text-xs text-muted">Driver licence · {profile.season}</p>
            <p data-easter className="font-display select-none text-5xl text-lime">
              {profile.number}
            </p>
          </div>
          <p className="font-display mt-8 text-3xl">{profile.name}</p>
          <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5">
            {profile.licence.map((item) => (
              <div key={item.label}>
                <dt className="font-mono text-xs text-muted">{item.label}</dt>
                <dd className="mt-1 text-sm">{item.value}</dd>
              </div>
            ))}
          </dl>
        </article>

        <div className="glass max-w-3xl p-6 sm:p-8">
          {profile.about.map((paragraph) => (
            <p key={paragraph} className="mb-5 text-lg leading-relaxed text-muted last:mb-0 sm:text-xl">
              {paragraph}
            </p>
          ))}
          <p className="mt-8 font-mono text-sm text-muted">{profile.coursework}</p>
        </div>
      </div>
    </section>
  );
}
