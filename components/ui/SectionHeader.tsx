export function SectionHeader({ kicker, title }: { kicker: string; title: string }) {
  return (
    <header className="reveal">
      <p className="tag">{kicker}</p>
      <div className="glass w-fit max-w-full px-5 py-4 sm:px-7 sm:py-5">
        <h2 className="font-display text-5xl sm:text-7xl lg:text-8xl">{title}</h2>
      </div>
    </header>
  );
}
