import type { Project } from "../types";

export const satquery: Project = {
  slug: "satquery-ai",
  name: "SatQuery AI",
  code: "SAT",
  position: 2,
  timing: "purple",
  towerStat: "292 tests",
  tagline: "Ask a satellite image a question and get an answer backed by evidence and a replayable audit trail.",
  date: "Sep 2026 · SIH PS 26167",
  team: "Team of 6",
  role: "Team Stack Overflower at Smart India Hackathon 2026.",
  stats: [
    { value: "6", label: "Routed specialists" },
    { value: "292", label: "Automated tests" },
    { value: "8", label: "Timed steps per query" },
    { value: "591 ms", label: "Full query, end to end" },
  ],
  problem:
    "A single general model will happily make up an answer about a satellite image. Analysts need to know which tool answered, what it actually detected, and when it should have refused.",
  build: [
    "The product is the agent. It checks each question and image pair, picks the specialist able to answer, and rejects combinations that aren't valid.",
    "Specialists include a local SmolVLM vision-language model and deterministic OpenCV and NumPy pipelines for grounding, change detection and optical + SAR analysis.",
    "We trained two models: a roughly 4.9M-parameter Siamese CNN for binary change detection, and a vision-language adapter for remote sensing.",
    "Both models were trained and are served on one laptop with a 4 GB GPU, with no cloud service or API key at query time.",
    "It refuses to answer when two scenes can't be compared, and shows confidence only where a meaningful number exists.",
  ],
  pipeline: {
    title: "How a query is routed",
    stages: [
      [{ label: "Question + images", detail: "Plain English, one or two scenes" }],
      [{ label: "Agent planner", detail: "Classifies intent and checks compatibility" }],
      [
        { label: "Vision-language", detail: "Visual question answering" },
        { label: "Deterministic CV", detail: "Grounding, change and fusion" },
        { label: "Siamese CNN", detail: "Learned change detection" },
      ],
      [{ label: "Evidence + trace", detail: "Overlays, masks and a timed record" }],
    ],
  },
  media: [
    {
      src: "/projects/satquery-lake-mead.webp",
      alt: "Satellite view of Lake Mead with changed shoreline pixels highlighted in red",
      caption: "Lake Mead, 2018 to 2022: 7,776,900 m² of measured change, highlighted on the after image.",
      width: 1400,
      height: 708,
    },
  ],
  trace: {
    title: "One query, replayed",
    notice:
      "Used fallback: planned the Siamese CNN but ran the deterministic method, because this imagery is about 10 m per pixel and the model was trained on 0.5-3 m aerial pairs.",
    steps: [
      { label: "Query received", detail: "2 images resolved", ms: 5 },
      { label: "Input validation", detail: "Change query with 2 compatible same-modality images", ms: 0 },
      { label: "Task selected", detail: "Classified as change detection", ms: 0 },
      { label: "Compatibility", detail: "All checks passed", ms: 0 },
      { label: "Specialist selected", detail: "Highest-priority available specialist", ms: 4 },
      { label: "Execution", detail: "Deterministic method completed", ms: 323 },
      { label: "Evidence", detail: "8 boxes and a change mask", ms: 0 },
      { label: "Result", detail: "Answer produced", ms: 0 },
    ],
  },
  charts: [
    {
      title: "Rural / urban accuracy on RSVQA-LR",
      note: "60 questions, roughly ±12 points. This is the one gain clearly outside the noise; other question types moved less, and presence got slightly worse.",
      max: 100,
      rows: [
        { label: "Base model", value: 40.7, display: "40.7%" },
        { label: "With our adapter", value: 61.7, display: "61.7%" },
      ],
    },
    {
      title: "Latency on a 4 GB laptop GPU",
      note: "Warm median in milliseconds on an RTX 2050, with the first call discarded.",
      rows: [
        { label: "Change model, per pair", value: 24, display: "24 ms" },
        { label: "Full change query", value: 591, display: "591 ms" },
        { label: "Short visual answer", value: 1373, display: "1,373 ms" },
        { label: "Descriptive answer", value: 2198, display: "2,198 ms" },
      ],
    },
  ],
  incidents: [
    {
      title: "A model outside its training",
      happened:
        "The Lake Mead pair is 10 m per pixel, and our change model only learned 0.5-3 m aerial imagery. Trusting it there would have meant reporting a result from outside what it learned.",
      fix: "A training-domain gate skips the model, runs the deterministic method and records why, so the planned and executed tools both appear in the trace.",
    },
    {
      title: "0 of 51 referring samples",
      happened:
        "On VRSBench, no referring question ever reached our grounding specialist. It knows 5 land-cover classes and the benchmark asks about 26 object classes, with no overlap.",
      fix: "Reported it as a capability gap and published no score for it.",
    },
  ],
  notes: [
    "Change detection is binary. It says that something changed, not what it became.",
    "Grounding covers 5 land-cover classes, and counting is still unreliable.",
    "Evaluation samples are small, and the change model's benchmark uses the same image source it trained on. A committed script confirmed none of CDVQA's 968 test pairs were in training.",
  ],
  demo: "satquery",
  stack: ["React", "FastAPI", "PostgreSQL", "SmolVLM", "OpenCV", "NumPy", "PyTorch"],
  links: [{ label: "Source", href: "https://github.com/harshkulkarni2234/SatQuery-Ai_SIH" }],
};
