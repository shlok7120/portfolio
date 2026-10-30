import Image from "next/image";

const variants = [
  { name: "day", className: "only-day" },
  { name: "golden", className: "only-golden" },
  { name: "night", className: "only-night" },
];

// Both versions are in the page, and CSS shows whichever matches the theme
export function Backdrop({ slug, priority = false }: { slug: string; priority?: boolean }) {
  return variants.map(({ name, className }) => (
    <Image
      key={name}
      src={`/lap/${slug}-${name}.webp`}
      alt=""
      fill
      sizes="100vw"
      loading={priority ? "eager" : "lazy"}
      className={`${className} object-cover`}
    />
  ));
}
