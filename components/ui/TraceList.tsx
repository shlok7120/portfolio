import type { Trace } from "@/content/types";

export function TraceList({ trace }: { trace: Trace }) {
  return (
    <figure>
      <figcaption className="font-display text-xl sm:text-2xl">{trace.title}</figcaption>
      <p className="mt-4 border-l-2 border-yellow pl-3 text-sm leading-relaxed text-ink">
        {trace.notice}
      </p>
      <ol className="mt-5">
        {trace.steps.map((step, index) => (
          <li
            key={step.label}
            className="grid grid-cols-[1.75rem_1fr_auto] gap-x-3 border-b border-line/60 py-2.5 last:border-b-0"
          >
            <span className="font-mono text-xs leading-5 text-muted">{index + 1}</span>
            <div className="min-w-0">
              <p className="font-mono text-sm text-ink">{step.label}</p>
              <p className="mt-0.5 text-sm text-muted">{step.detail}</p>
            </div>
            <span className="font-mono text-xs leading-5 text-muted">{step.ms} ms</span>
          </li>
        ))}
      </ol>
    </figure>
  );
}
