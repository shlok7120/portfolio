import type { Project } from "../types";

export const timeweave: Project = {
  slug: "timeweave",
  name: "TimeWeave",
  code: "TWV",
  position: 3,
  timing: "green",
  towerStat: "10^190 space",
  tagline: "Timetable generation that compares seven AI search techniques and explains why a schedule can't exist.",
  date: "Sep 2026",
  team: "With Khush Patel",
  stats: [
    { value: "10^190", label: "Search space" },
    { value: "7", label: "Solvers from scratch" },
    { value: "35", label: "Automated tests" },
    { value: "0", label: "Solver claims rejected" },
  ],
  problem:
    "Departments build timetables by hand in spreadsheets, and clashes usually surface after they're published. When no valid timetable exists, nobody can say why.",
  build: [
    "Modelled scheduling as a constraint satisfaction problem with seven hard clash rules and five weighted preferences.",
    "Wrote every solver from scratch, with no CSP or optimisation library, behind one interface so comparisons are fair.",
    "An independent audit re-checks every returned timetable against all seven hard rules: 309 valid, 0 rejected.",
    "When no timetable exists, counting arguments and QuickXplain name the constraints in conflict.",
    "An ID3 decision tree learns preferences from accept and reject feedback, because the hand-set weights are guesses.",
  ],
  pipeline: {
    title: "From department to timetable",
    stages: [
      [{ label: "Department data", detail: "Courses, rooms, faculty, availability" }],
      [{ label: "CSP model", detail: "Variables, domains and constraints" }],
      [{ label: "Seven solvers", detail: "Same interface, same budget" }],
      [{ label: "Audit", detail: "Every result re-checked" }],
      [
        { label: "Timetable", detail: "Then optimised for preferences" },
        { label: "Explanation", detail: "Why none can exist" },
      ],
    ],
  },
  media: [
    {
      src: "/projects/timeweave-timetable.webp",
      alt: "TimeWeave timetable grid with lectures and labs across a week, beside run statistics",
      caption: "A generated timetable with its audit result and soft-constraint penalty. Faculty names are sample data.",
      width: 1400,
      height: 787,
    },
    {
      src: "/projects/timeweave-explain.webp",
      alt: "Output stating no timetable exists and naming the conflicting faculty availability",
      caption: "When no timetable exists, it proves why and names the smallest set of constraints in conflict.",
      width: 1012,
      height: 264,
    },
  ],
  charts: [
    {
      title: "Instances solved, out of 50",
      note: "Same instances and budget for each solver.",
      max: 50,
      rows: [
        { label: "Forward checking", value: 50, display: "50/50" },
        { label: "AC-3 (MAC)", value: 50, display: "50/50" },
        { label: "Backjumping", value: 50, display: "50/50" },
        { label: "Min-conflicts", value: 50, display: "50/50" },
        { label: "MRV / Degree / LCV", value: 49, display: "49/50" },
        { label: "Genetic algorithm", value: 31, display: "31/50" },
        { label: "Naive backtracking", value: 29, display: "29/50" },
      ],
    },
    {
      title: "Soft penalty, like for like",
      note: "Lower is better. Average across the 31 instances both solvers solved.",
      rows: [
        { label: "Forward checking", value: 80.9, display: "80.9" },
        { label: "Genetic algorithm", value: 62.7, display: "62.7" },
      ],
    },
  ],
  incidents: [
    {
      title: "Naive search ran out of road",
      happened: "Naive backtracking hit its 5 million node budget on 21 of 50 runs and found nothing.",
      fix: "Forward checking solved all 21 in 40 to 100 nodes. That gap is the main result of the project.",
    },
    {
      title: "A heuristic that didn't pay",
      happened: "LCV costs more per node than it saves in nodes. Implemented naively, it dominated the runtime.",
      fix: "Indexed each neighbour's domain to make it affordable, and reported that it still isn't a win.",
    },
    {
      title: "A conflict set that wasn't minimal",
      happened: "The first version of the explainer shipped a non-minimal conflict set.",
      fix: "A dedicated test caught it. The report now says proven minimal only when no search hit its budget.",
    },
  ],
  notes: [
    "The genetic algorithm gives the best soft penalty on small instances but fails to reach hard feasibility on the largest.",
    "Min-conflicts is the fastest route to a good timetable, but it can never prove that no timetable exists.",
  ],
  stack: ["Python", "Flask", "Constraint satisfaction", "Local search", "ID3", "pytest"],
  links: [
    { label: "Live demo", href: "https://timeweave-one.vercel.app" },
    { label: "Source", href: "https://github.com/shlok7120/Timeweave" },
  ],
};
