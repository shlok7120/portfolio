import type { Pipeline } from "@/content/types";

export function PipelineDiagram({ pipeline }: { pipeline: Pipeline }) {
  return (
    <figure>
      <figcaption className="font-display text-xl sm:text-2xl">{pipeline.title}</figcaption>
      <ol className="mt-6 flex flex-col gap-2 lg:flex-row lg:items-stretch">
        {pipeline.stages.map((stage, index) => (
          <li key={index} className="flex flex-1 flex-col gap-2 lg:flex-row lg:items-center">
            {index > 0 && (
              <span aria-hidden className="text-center font-mono text-lime lg:px-1">
                <span className="lg:hidden">↓</span>
                <span className="hidden lg:inline">→</span>
              </span>
            )}
            <div className="flex flex-1 flex-col gap-2 self-stretch">
              {stage.map((node) => (
                <div key={node.label} className="flex-1 border border-line bg-carbon p-3">
                  <p className="font-mono text-sm text-ink">{node.label}</p>
                  <p className="mt-1 text-sm leading-snug text-muted">{node.detail}</p>
                </div>
              ))}
            </div>
          </li>
        ))}
      </ol>
      {pipeline.note && <p className="mt-4 text-sm text-muted">{pipeline.note}</p>}
    </figure>
  );
}
