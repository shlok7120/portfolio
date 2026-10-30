import type { ReactNode } from "react";

export function SectorGate({
  sector,
  label,
  children,
}: {
  sector: string;
  label: string;
  children?: ReactNode;
}) {
  return (
    <div
      data-gate
      data-title={sector}
      data-label={label}
      className="lap-only flex min-h-[105dvh] flex-wrap items-end justify-between gap-8 px-4 pb-14 sm:px-6 lg:px-10"
    >
      <div aria-hidden>
        <p className="tag">{label}</p>
        <p className="font-display glass px-5 py-3 text-5xl sm:px-7 sm:text-7xl lg:text-8xl">{sector}</p>
      </div>
      {children}
    </div>
  );
}
