"use client";

import { useEffect, useState } from "react";

const queries = [
  {
    question: "What changed at Lake Mead between 2018 and 2022?",
    steps: ["Query received", "Input validated", "Task: change detection", "Compatibility passed", "Specialist selected", "Executed", "Evidence attached"],
    outcome: "Planned the Siamese CNN, then ran the deterministic method because the imagery is coarser than the model's training data.",
    verdict: "Answered with a fallback",
  },
  {
    question: "What changed between these two different cities?",
    steps: ["Query received", "Input validated", "Task: change detection", "Compatibility failed"],
    outcome: "The metadata shows the scenes cover different areas, so it states a refusal instead of returning a percentage.",
    verdict: "Refused",
  },
  {
    question: "Show me the built-up area.",
    steps: ["Query received", "Input validated", "Task: spatial grounding", "Specialist selected", "Executed", "Evidence attached"],
    outcome: "Routed to the deterministic grounding specialist, which draws boxes over matching land cover. It knows 5 land-cover classes.",
    verdict: "Routed to grounding",
  },
];

const stepTime = 420;

export function SatQueryDemo() {
  const [selected, setSelected] = useState(0);
  const [reached, setReached] = useState(0);
  const query = queries[selected];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setReached((step) => {
        if (step >= query.steps.length) window.clearInterval(timer);
        return Math.min(step + 1, query.steps.length);
      });
    }, stepTime);
    return () => window.clearInterval(timer);
  }, [query, selected]);

  const choose = (index: number) => {
    setReached(0);
    setSelected(index);
  };
  const finished = reached >= query.steps.length;

  return (
    <div>
      <h3 className="font-display text-3xl">Watch the agent route a question</h3>
      <p className="mt-2 text-sm text-muted">
        A scripted replay of how the agent routes each type of question. The models and images aren&apos;t running here.
      </p>
      <div className="mt-4 flex flex-col gap-2">
        {queries.map(({ question }, index) => (
          <button
            key={question}
            type="button"
            aria-pressed={selected === index}
            onClick={() => choose(index)}
            className="border border-line px-3 py-2 text-left text-sm hover:border-lime aria-pressed:border-lime"
          >
            {question}
          </button>
        ))}
      </div>
      <ol className="mt-4 space-y-1 font-mono text-xs">
        {query.steps.map((step, index) => (
          <li key={step} className={index < reached ? "text-ink" : "text-muted"}>
            <span aria-hidden className={index < reached ? "text-lime" : ""}>
              {index < reached ? "■ " : "□ "}
            </span>
            {step}
          </li>
        ))}
      </ol>
      <div aria-live="polite" className="mt-4 min-h-24 border-l-4 border-l-lime p-4">
        {finished && (
          <>
            <p className="font-display text-2xl">{query.verdict}</p>
            <p className="mt-1 text-sm text-muted">{query.outcome}</p>
          </>
        )}
      </div>
    </div>
  );
}
