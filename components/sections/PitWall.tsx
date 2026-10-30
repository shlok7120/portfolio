import { cacheLife } from "next/cache";

const githubUser = "shlok7120";
const showcaseRepos = ["fleet-credit-tracker", "Timeweave", "tether", "Decision-Matrix-Maker", "hh-goa-2026"];
const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

type Repo = { name: string; html_url: string; pushed_at: string };

async function getActivity() {
  "use cache";
  cacheLife("hours");

  try {
    const response = await fetch(`https://api.github.com/users/${githubUser}/repos?sort=pushed&per_page=30`, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!response.ok) return [];
    const repos: Repo[] = await response.json();
    return repos.filter((repo) => showcaseRepos.includes(repo.name)).slice(0, 4);
  } catch {
    return [];
  }
}

export async function PitWall() {
  const repos = await getActivity();
  if (repos.length === 0) return null;

  return (
    <aside aria-label="Latest GitHub activity" className="glass reveal mt-3 p-4">
      <h3 className="font-mono text-sm text-lime">Pit wall · Latest GitHub activity</h3>
      <ul className="mt-3 grid gap-px bg-line sm:grid-cols-2 xl:grid-cols-4">
        {repos.map((repo) => (
          <li key={repo.name} className="bg-carbon">
            <a href={repo.html_url} className="block p-4 hover:text-lime">
              <span className="block truncate font-mono text-sm">{repo.name}</span>
              <span className="mt-1 block font-mono text-xs text-muted">
                Last push {dateFormat.format(new Date(repo.pushed_at))}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
