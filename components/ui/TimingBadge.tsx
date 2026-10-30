import type { Timing } from "@/content/types";

const timings: Record<Timing, { label: string; dot: string }> = {
  purple: { label: "Fastest", dot: "bg-purple" },
  green: { label: "Strong", dot: "bg-green" },
  yellow: { label: "In progress", dot: "bg-yellow" },
};

export function TimingBadge({ timing }: { timing: Timing }) {
  const { label, dot } = timings[timing];
  return (
    <span className="inline-flex items-center gap-2 font-mono text-xs text-muted">
      <span aria-hidden className={`size-2 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
