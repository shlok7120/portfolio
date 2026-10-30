# One Lap

Shlok Patel's F1-themed portfolio. The page is one flying lap of the Monaco street circuit:
scrolling drives a 3D car while a live HUD shows speed, gear, revs and lap time.

Built with Next.js, TypeScript, Tailwind CSS, React Three Fiber and Lenis. The car and track
are generated in code, and the sound is synthesised, so there are no model or audio files.
The 3D look comes from postprocessing (bloom, tone mapping and speed blur).

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Edit the content

| To change | Edit |
|---|---|
| Name, links and about text | `content/profile.ts` |
| A project's race report | `content/projects/` |
| Skills | `content/skills.ts` |
| Season calendar | `content/season.ts` |

## Environment variables

Copy `.env.example` to `.env.local`. Everything is optional. Without `RESEND_API_KEY`, the
contact form opens the visitor's email app.

## Modes

- **Golden hour, day and night:** starts in golden hour until the visitor picks another in the nav.
- **Team radio:** messages from the pit wall pop up during the lap and link to the projects.
- **Pit garage:** the Setup section opens a 3D view of the car where each part shows a group of skills.
- **Test drive:** four project pages have a demo. The Fleet rules and TimeWeave solvers really run in
  the browser in simplified form, and the SatQuery and Case 43 demos are labelled replays.
- **Safety Car:** a plain version with no animation. It's on by default for people who turn
  off motion in their system settings.
- **Light lap:** phones and touch devices get a 2D track instead of the 3D scene.
- **Pit stop challenge:** enter the Konami code, or tap the car number on the licence card
  seven times.

Not affiliated with Formula 1 or any racing team.
