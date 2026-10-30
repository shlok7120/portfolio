"use client";

import { useState } from "react";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const periods = 4;
const rooms = 2;
const slotCount = days.length * periods * rooms;

// A small timetable: every session needs a slot, and no teacher, class or room may clash
const sessions = ["AI", "AI", "AI", "OS", "OS", "OS", "DBMS", "DBMS", "DBMS", "CN", "CN", "SE", "SE", "TOC", "TOC", "AI Lab", "OS Lab", "DB Lab"].flatMap(
  (course) => ["A", "B"].map((division) => ({ course, division, teacher: course.split(" ")[0] })),
);

type Slot = { time: number; room: number };

function clashes(a: Slot, sessionA: (typeof sessions)[number], b: Slot, sessionB: (typeof sessions)[number]) {
  if (a.time !== b.time) return false;
  return a.room === b.room || sessionA.teacher === sessionB.teacher || sessionA.division === sessionB.division;
}

const allSlots: Slot[] = Array.from({ length: slotCount }, (_, i) => ({
  time: Math.floor(i / rooms),
  room: i % rooms,
}));

function hardest<T>(items: T[], size: (item: T) => number) {
  return items.reduce((best, item) => (size(item) < size(best) ? item : best));
}

function solve(useForwardChecking: boolean, budget = 400000) {
  const order = sessions.map((_, i) => i);
  const placed: (Slot | null)[] = sessions.map(() => null);
  let nodes = 0;

  function search(depth: number, domains: Slot[][]): boolean {
    if (depth === order.length) return true;
    if (nodes > budget) return false;
    const pending = order.filter((i) => !placed[i]);
    const session = useForwardChecking ? hardest(pending, (i) => domains[i].length) : pending[0];

    for (const slot of domains[session]) {
      nodes += 1;
      const valid =
        useForwardChecking ||
        placed.every((other, i) => !other || !clashes(slot, sessions[session], other, sessions[i]));
      if (!valid) continue;

      placed[session] = slot;
      const next = useForwardChecking
        ? domains.map((domain, i) =>
            placed[i] ? domain : domain.filter((option) => !clashes(slot, sessions[session], option, sessions[i])),
          )
        : domains;
      if (!useForwardChecking || pending.every((i) => placed[i] || next[i].length > 0)) {
        if (search(depth + 1, next)) return true;
      }
      placed[session] = null;
      if (nodes > budget) return false;
    }
    return false;
  }

  const started = performance.now();
  const solved = search(0, sessions.map(() => allSlots));
  return {
    solved,
    nodes,
    milliseconds: performance.now() - started,
    timetable: placed.map((slot, i) => ({ slot, ...sessions[i] })),
  };
}

type Result = ReturnType<typeof solve>;

export function TimeWeaveDemo() {
  const [runs, setRuns] = useState<{ naive: Result; smart: Result } | null>(null);

  const race = () => setRuns({ naive: solve(false), smart: solve(true) });
  const timetable = runs?.smart.timetable ?? [];

  return (
    <div>
      <h3 className="font-display text-3xl">Race two solvers, live</h3>
      <p className="mt-2 text-sm text-muted">
        This really runs in your browser on a small sample timetable of {sessions.length} sessions. It&apos;s a
        simplified version of the project&apos;s solvers.
      </p>
      <button type="button" onClick={race} className="btn-race mt-4">
        {runs ? "Race again" : "Start the race"}
      </button>

      {runs && (
        <>
          <dl aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              { name: "Plain backtracking", run: runs.naive },
              { name: "Forward checking + MRV", run: runs.smart },
            ].map(({ name, run }) => (
              <div key={name} className="border border-line p-3">
                <dt className="font-mono text-xs text-muted">{name}</dt>
                <dd className="font-display mt-1 text-3xl text-lime">{run.nodes.toLocaleString("en-IN")}</dd>
                <dd className="font-mono text-xs text-muted">
                  options tried in {run.milliseconds.toFixed(1)} ms{run.solved ? "" : ", gave up"}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse font-mono text-xs">
              <caption className="sr-only">Generated timetable</caption>
              <thead>
                <tr>
                  <th scope="col" className="p-1 text-left text-muted">Period</th>
                  {days.map((day) => (
                    <th key={day} scope="col" className="p-1 text-left text-muted">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: periods }, (_, period) => (
                  <tr key={period} className="border-t border-line/60">
                    <th scope="row" className="p-1 text-left font-normal text-muted">{period + 1}</th>
                    {days.map((day, dayIndex) => (
                      <td key={day} className="p-1 align-top">
                        {timetable
                          .filter(({ slot }) => slot?.time === dayIndex * periods + period)
                          .map(({ course, division }) => (
                            <span key={`${course}-${division}`} className="block">
                              {course} <span className="text-lime">{division}</span>
                            </span>
                          ))}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
