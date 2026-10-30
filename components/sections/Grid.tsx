import Link from "next/link";
import { DriveButton } from "@/components/hud/DriveButton";
import { profile } from "@/content/profile";

export function Grid() {
  const tickerItems = [...profile.ticker, ...profile.ticker];

  return (
    <section id="grid" className="relative flex min-h-dvh flex-col overflow-hidden pt-14">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-carbon/75 via-carbon/15 to-transparent" />

      <div className="relative flex flex-1 flex-col justify-between gap-8 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs">
            <span className="flex items-center gap-2 font-bold text-red">
              <span aria-hidden className="live-dot size-2 rounded-full bg-red" />
              LIVE
            </span>
            <span className="text-ink">Season {profile.season}</span>
            <span className="text-ink">{profile.circuit}</span>
            <span className="text-ink">{profile.team}</span>
          </div>

          <h1 className="font-display mt-5 text-[clamp(4.6rem,17vw,15.5rem)] leading-[0.84]">
            <span className="mask">
              <span className="rise">{profile.firstName}</span>
            </span>
            <span className="mask">
              <span className="rise">{profile.lastName}</span>
            </span>
          </h1>
        </div>

        <div className="max-w-xl">
          <p className="tag">Driver {profile.number} · Full-stack &amp; applied ML</p>
          <div className="glass px-5 py-4">
            <p className="text-base leading-relaxed sm:text-lg">{profile.role}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <DriveButton />
              <Link href="/#results" className="btn-race btn-ghost">
                View race results
              </Link>
              <Link href="/#pit-lane" className="btn-race btn-ghost">
                Radio the pit wall
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div aria-hidden className="lap-only relative flex items-stretch overflow-hidden bg-carbon font-mono text-sm">
        <span className="relative z-10 flex items-center bg-[#c5121a] px-4 font-bold text-white">LIVE</span>
        <div className="overflow-hidden py-2.5 text-ink">
          <div className="ticker flex w-max gap-10 whitespace-nowrap">
            {tickerItems.map((item, index) => (
              <span key={`${item}-${index}`}>{item}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
