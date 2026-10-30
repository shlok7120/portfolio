import { LapSummary } from "@/components/hud/LapSummary";
import { profile } from "@/content/profile";

export function Finish() {
  return (
    <footer id="finish" className="bg-carbon">
      <div aria-hidden className="chequered h-12" />
      <div className="px-4 py-16 sm:px-6 lg:px-10">
        <p className="font-display text-5xl sm:text-7xl">Chequered flag</p>
        <LapSummary />
        <ul className="mt-8 flex flex-wrap gap-3">
          {profile.links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="block border border-line px-4 py-2 font-mono text-sm hover:border-lime hover:text-lime"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-10 max-w-2xl font-mono text-xs text-muted">
          {profile.name}. A fan-made theme. Not affiliated with Formula 1 or any racing team.
        </p>
      </div>
    </footer>
  );
}
