export type Timing = "purple" | "green" | "yellow";

export type Chart = {
  title: string;
  note: string;
  max?: number;
  rows: { label: string; value: number; display: string }[];
};

export type Pipeline = {
  title: string;
  note?: string;
  stages: { label: string; detail: string }[][];
};

export type Trace = {
  title: string;
  notice: string;
  steps: { label: string; detail: string; ms: number }[];
};

export type Comparison = {
  before: string;
  after: string;
  beforeLabel: string;
  afterLabel: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
};

export type Media = {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
};

export type Incident = { title: string; happened: string; fix: string };

export type Project = {
  slug: string;
  name: string;
  code: string;
  position: number;
  timing: Timing;
  towerStat: string;
  tagline: string;
  date: string;
  team: string;
  role?: string;
  stats: { value: string; label: string }[];
  problem: string;
  build: string[];
  pipeline?: Pipeline;
  media?: Media[];
  comparison?: Comparison;
  trace?: Trace;
  charts: Chart[];
  incidents: Incident[];
  notes: string[];
  stack: string[];
  links: { label: string; href: string }[];
};

export type Compound = "hard" | "medium" | "soft";
