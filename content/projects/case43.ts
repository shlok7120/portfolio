import type { Project } from "../types";

export const case43: Project = {
  slug: "case-43-mfa-recovery",
  name: "Case 43: MFA Recovery",
  code: "C43",
  position: 6,
  timing: "green",
  towerStat: "19 tests",
  tagline: "A case study of an AI-written account recovery flow that was weaker than the login it backed up.",
  date: "Oct 2026",
  team: "Solo · Coursework",
  stats: [
    { value: "19", label: "Tests passing" },
    { value: "2", label: "Prototypes compared" },
    { value: "3", label: "Recovery paths" },
  ],
  problem:
    "In this case, an AI assistant wrote the recovery flow for a login protected by multi-factor authentication. It let anyone recover an account using one detail that can be found in public, so an attacker could skip the login entirely.",
  build: [
    "Traced the root cause to a missing requirement: nobody said recovery must be as strong as the factor it replaces.",
    "Rebuilt the likely defect as a vulnerable Python prototype, then wrote a secure one to compare side by side.",
    "Recovery now needs the password plus a single-use backup code, or an emailed code followed by a 24-hour delay the real owner can cancel.",
    "Students with neither go to an IT desk ID check approved by two staff members.",
    "Every path is rate-limited, gives a generic message, revokes old sessions, forces MFA re-enrolment and notifies the owner.",
  ],
  pipeline: {
    title: "How the failure builds",
    note: "Steps one to four are my reconstruction. The case gives the final failure, not how it happened.",
    stages: [
      [{ label: "Vague prompt", detail: "Add recovery for lost MFA phones" }],
      [{ label: "AI default", detail: "Check a stored field such as date of birth" }],
      [{ label: "Weak review", detail: "Happy-path test passes, no threat model" }],
      [{ label: "Deployed", detail: "No rate limit, no owner notification" }],
      [{ label: "Takeover", detail: "One public detail replaces both factors" }],
    ],
  },
  charts: [],
  incidents: [],
  notes: [
    "This is coursework on an assigned case. It didn't include code, so the defect is reconstructed and the prototype isn't a production system.",
    "The key test replays the original attack and expects a rejection with MFA still enrolled. Mutation testing confirmed the tests fail when the defect is put back.",
  ],
  demo: "recovery",
  stack: ["Python", "pytest", "Threat modelling", "NIST SP 800-63B"],
  links: [],
};
