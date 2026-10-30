import type { Project } from "../types";

export const fleetCreditTracker: Project = {
  slug: "fleet-credit-tracker",
  name: "Fleet Credit Tracker",
  code: "FLT",
  position: 1,
  timing: "purple",
  towerStat: "3.1% false +",
  tagline: "A petrol pump's paper credit ledger, rebuilt as a three-service platform with fraud detection.",
  date: "Sep 2026",
  team: "Solo",
  role: "Built solo, from the database schema to the deployment.",
  stats: [
    { value: "3", label: "Services" },
    { value: "3", label: "User roles" },
    { value: "5", label: "Fraud model features" },
    { value: "3.1%", label: "False-positive rate" },
  ],
  problem:
    "Corporate fleets fuel on credit, and the pump tracked it by hand. That left credit limits hard to enforce, billing slow, and fuel theft easy to miss.",
  build: [
    "Tracks every litre, enforces each fleet's credit limit in real time and issues an invoice every billing cycle.",
    "Role checks live in Express middleware, so admins, fleet managers and attendants are separated on the server and not only in the React UI.",
    "Fraud detection pairs an Isolation Forest over five behavioural features with hard and soft rules. Something physically impossible flags alone; a soft signal needs a second signal or model agreement.",
    "The ML service is an advisor, not a gatekeeper. If Python goes down, fuelling carries on.",
    "ARIMA forecasts 14 days of demand, so the pump can plan stock and a client can see whether their credit will last.",
    "The ML dependencies total 372 MB against Vercel's 250 MB function limit, so that service runs on its own host.",
  ],
  pipeline: {
    title: "How the car is built",
    note: "Each service uses the language best suited to its job, and the API keeps working without the ML service.",
    stages: [
      [{ label: "React 19 frontend", detail: "Admin, fleet manager and attendant screens" }],
      [{ label: "Express API", detail: "Auth, credit rules and billing" }],
      [
        { label: "PostgreSQL", detail: "The ledger of record" },
        { label: "FastAPI ML service", detail: "Fraud scoring and forecasting, advisory only" },
      ],
    ],
  },
  charts: [
    {
      title: "False-positive rate",
      note: "Lower is better. Fewer false alarms means an alert list the admin will actually read.",
      rows: [
        { label: "Trained on synthetic data", value: 15.8, display: "15.8%" },
        { label: "Retrained on ledger history", value: 3.1, display: "3.1%" },
      ],
    },
    {
      title: "Detection on seeded data",
      note: "Planted anomalies in 90 days of seeded history. The seed randomises, so figures move a little between runs.",
      max: 100,
      rows: [
        { label: "Planted overfills caught", value: 100, display: "100%" },
        { label: "Micro-dispenses caught", value: 100, display: "100%" },
        { label: "Odd-hours fills caught", value: 67, display: "67-100%" },
        { label: "Ordinary fills flagged", value: 1.6, display: "~1.6%" },
      ],
    },
  ],
  incidents: [
    {
      title: "Every fill failed in production",
      happened:
        "A patch for exact money arithmetic rewrote a call to lineTotal() but missed its import, so the fill endpoint returned a 500 and no fill could be recorded.",
      fix: "Restored the import, and worked out why my check had passed: the search matched the usage line, so it proved nothing about the import.",
    },
    {
      title: "A paisa out on 7 of 619 fills",
      happened:
        "JavaScript floats and Postgres NUMERIC round differently. 28.13 litres at 102.50 came to 2883.32 in one and 2883.33 in the other. Nothing failed loudly, and an audit found it.",
      fix: "Moved totals to exact money arithmetic.",
    },
    {
      title: "An open billing endpoint",
      happened:
        "The cron guard skipped itself when its secret was unset, so a missing variable left a public endpoint that emails every client their invoice. Anonymous requests got a 200 on the live deployment.",
      fix: "Made it fail closed, because a security control should never be switched off by its own absence.",
    },
    {
      title: "Midnight fills in the wrong month",
      happened:
        "Billing used the database session's timezone, which was UTC, so a fill at 00:30 IST on the 1st landed in the previous month. The odd-hours fraud rule had the same bug.",
      fix: "Compute cycle boundaries and the odd-hours rule in the pump's own timezone.",
    },
    {
      title: "Payments left no record",
      happened:
        "Recording a payment only subtracted from a balance. Nothing kept who paid, how much, by what method or who entered it, so a mis-keyed amount couldn't be traced.",
      fix: "Payments are now stored as records of their own.",
    },
    {
      title: "Too many alerts to read",
      happened: "The first rule set flagged every fill after 11 p.m. and buried the admin in false positives.",
      fix: "Split the rules into hard and soft tiers, and accepted that a lone 3 a.m. fill may go unflagged.",
    },
  ],
  notes: [
    "Detection figures come from seeded data with planted anomalies, so they show that the method works and aren't a field result.",
    "Odd-hours detection stays below 100% on purpose. Reaching 100% would mean flagging every late-night fill.",
  ],
  demo: "fleet",
  stack: ["React 19", "Vite", "Tailwind CSS", "Node.js", "Express", "FastAPI", "scikit-learn", "statsmodels", "PostgreSQL", "Vercel"],
  links: [
    { label: "Live demo", href: "https://fleet-credit-tracker.vercel.app" },
    { label: "Source", href: "https://github.com/shlok7120/fleet-credit-tracker" },
  ],
};
