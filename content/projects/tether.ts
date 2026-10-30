import type { Project } from "../types";

export const tether: Project = {
  slug: "tether",
  name: "Tether",
  code: "TTH",
  position: 5,
  timing: "green",
  towerStat: "0 bytes stored",
  tagline: "Browser-to-browser file transfer over WebRTC, where the server never touches your files.",
  date: "Sep 2026",
  team: "Solo",
  stats: [
    { value: "P2P", label: "Direct transfer" },
    { value: "0", label: "File bytes on the server" },
    { value: "10 min", label: "Room expiry" },
    { value: "DTLS", label: "Encrypted connection" },
  ],
  problem:
    "Sending a file between two devices usually means uploading it to someone else's server first.",
  build: [
    "Keeps signalling and file data strictly apart. The server only introduces the two browsers.",
    "Files stream directly between peers over a WebRTC RTCDataChannel on an encrypted DTLS connection.",
    "One browser creates a room and shares its code. Rooms expire after 10 minutes, and nothing is stored.",
    "Uses STUN by default and can use TURN credentials to get through strict firewalls.",
  ],
  pipeline: {
    title: "Who sees what",
    note: "The signalling server carries connection setup messages only. File bytes never pass through it.",
    stages: [
      [{ label: "Sender browser", detail: "Creates a room and gets a code" }],
      [{ label: "Signalling server", detail: "Relays SDP offers, answers and ICE candidates" }],
      [{ label: "Receiver browser", detail: "Joins with the code" }],
      [{ label: "RTCDataChannel", detail: "File bytes go directly between browsers" }],
    ],
  },
  charts: [],
  incidents: [],
  notes: [
    "Without TURN credentials it falls back to STUN only, so some strict networks won't connect.",
    "The signalling server needs a long-running host that supports WebSockets, separate from the static frontend.",
  ],
  stack: ["TypeScript", "React", "Vite", "Tailwind CSS", "WebRTC", "WebSocket", "Node.js"],
  links: [{ label: "Source", href: "https://github.com/shlok7120/tether" }],
};
