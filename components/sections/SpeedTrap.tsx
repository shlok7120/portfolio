import Link from "next/link";
import { BarChart } from "@/components/ui/BarChart";
import { getProject } from "@/content/projects";

export function SpeedTrap() {
  const fleet = getProject("fleet-credit-tracker");
  const chart = fleet?.charts[0];
  if (!fleet || !chart) return null;

  return (
    <section
      id="speed-trap"
      className="relative flex min-h-[120dvh] items-end overflow-hidden px-4 py-24 sm:px-6 lg:px-10"
    >
      <div className="reveal grid w-full items-end gap-3 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <p className="tag">Speed trap · Fastest of the season</p>
          <div className="glass p-5 sm:p-7">
          <h2 className="font-display text-[clamp(3.6rem,11vw,10rem)]">
            <span className="text-muted">15.8</span>
            <span className="text-lime"> → 3.1</span>
          </h2>
          <p className="mt-6 max-w-xl text-lg text-muted sm:text-xl">
            The fraud model&apos;s false-positive rate, in percent, after retraining it on the
            ledger&apos;s own transaction history instead of synthetic patterns.
          </p>
          <Link
            href={`/projects/${fleet.slug}`}
            className="btn-race mt-6"
          >
            Read the race report
          </Link>
          </div>
        </div>
        <div className="glass p-5 sm:p-7">
          <BarChart chart={chart} />
        </div>
      </div>
    </section>
  );
}
