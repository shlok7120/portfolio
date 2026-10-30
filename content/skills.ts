import type { Compound } from "./types";

export const compounds: { id: Compound; letter: string; label: string; meaning: string }[] = [
  { id: "hard", letter: "H", label: "Hard", meaning: "production-ready" },
  { id: "medium", letter: "M", label: "Medium", meaning: "comfortable" },
  { id: "soft", letter: "S", label: "Soft", meaning: "learning" },
];

export const setup: {
  part: string;
  area: string;
  skills: { name: string; compound: Compound }[];
}[] = [
  {
    part: "Power unit",
    area: "Backend",
    skills: [
      { name: "Node.js & Express", compound: "hard" },
      { name: "Python FastAPI", compound: "hard" },
      { name: "REST APIs", compound: "hard" },
      { name: "JWT, bcrypt & role-based access", compound: "hard" },
      { name: "Flask", compound: "medium" },
    ],
  },
  {
    part: "Aerodynamics",
    area: "Frontend",
    skills: [
      { name: "React 19", compound: "hard" },
      { name: "Vite", compound: "hard" },
      { name: "Tailwind CSS", compound: "hard" },
      { name: "React Router", compound: "medium" },
      { name: "Recharts", compound: "medium" },
    ],
  },
  {
    part: "Telemetry",
    area: "Data & ML",
    skills: [
      { name: "PostgreSQL", compound: "hard" },
      { name: "scikit-learn", compound: "medium" },
      { name: "pandas & NumPy", compound: "medium" },
      { name: "OpenCV", compound: "medium" },
      { name: "statsmodels", compound: "soft" },
      { name: "MongoDB", compound: "soft" },
    ],
  },
  {
    part: "Chassis",
    area: "Languages",
    skills: [
      { name: "JavaScript", compound: "hard" },
      { name: "Python", compound: "hard" },
      { name: "SQL", compound: "medium" },
      { name: "C++", compound: "medium" },
      { name: "Java", compound: "medium" },
    ],
  },
  {
    part: "Pit crew",
    area: "Tools & platforms",
    skills: [
      { name: "Git & GitHub", compound: "hard" },
      { name: "Vercel", compound: "medium" },
      { name: "Render", compound: "medium" },
      { name: "Linux & macOS", compound: "medium" },
    ],
  },
];
