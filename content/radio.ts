export type RadioCall = { at: number; text: string; href?: string; link?: string };

// Lines the pit wall sends as the car reaches each part of the lap
export const radioCalls: RadioCall[] = [
  { at: 0.05, text: "Radio check. Scroll to drive. Full lap is one page.", href: "/#results", link: "Box for results" },
  { at: 0.2, text: "Driver profile up next. Third-year, full-stack and applied ML." },
  {
    at: 0.33,
    text: "Fastest entry on the board is Fleet Credit Tracker. Try the fraud rules yourself.",
    href: "/projects/fleet-credit-tracker#test-drive",
    link: "Test drive",
  },
  {
    at: 0.5,
    text: "Tunnel ahead. SatQuery AI refuses to answer when it can't back it up.",
    href: "/projects/satquery-ai#test-drive",
    link: "Replay a query",
  },
  { at: 0.66, text: "Car setup coming up. Open the garage to see every part.", href: "/#setup", link: "Go to setup" },
  {
    at: 0.8,
    text: "TimeWeave has a live solver. Race the algorithms against each other.",
    href: "/projects/timeweave#test-drive",
    link: "Run it",
  },
  { at: 0.93, text: "Last corner. Box box, the pit wall is open.", href: "/#pit-lane", link: "Open team radio" },
];
