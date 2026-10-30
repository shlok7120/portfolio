import type { Project } from "../types";

export const athletix: Project = {
  slug: "athletix",
  name: "Athletix",
  code: "ATH",
  position: 7,
  timing: "yellow",
  towerStat: "Android",
  tagline: "An Android workout logger with live route tracking, photos and an on-device history.",
  date: "Oct 2026",
  team: "Team project",
  stats: [
    { value: "Android", label: "Native app" },
    { value: "SQLite", label: "On-device history" },
    { value: "GPS", label: "Route on a live map" },
  ],
  problem: "Workout notes get lost when they're scattered across paper and phone notes.",
  build: [
    "Log a workout with its category, intensity and notes, and review it later in a history screen.",
    "Tracks location and draws the route on a Google Map.",
    "Captures photos with the device camera.",
    "Stores everything on the device in SQLite.",
  ],
  charts: [],
  incidents: [],
  notes: [],
  stack: ["Java", "Android SDK", "SQLite", "Google Maps", "Location services"],
  links: [{ label: "Source", href: "https://github.com/khushhh-14/Athletix-Android-App" }],
};
