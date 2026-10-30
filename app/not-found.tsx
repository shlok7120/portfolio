import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-start justify-center gap-6 px-4 sm:px-6 lg:px-10">
      <p className="font-mono text-sm text-muted">404 · Track limits exceeded</p>
      <h1 className="font-display text-5xl sm:text-7xl">Off the circuit</h1>
      <Link href="/" className="font-mono text-sm text-lime underline underline-offset-4">
        Rejoin the track
      </Link>
    </main>
  );
}
