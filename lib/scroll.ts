export function scrollProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? Math.min(window.scrollY / max, 1) : 0;
}

export function progressAtCentre(element: Element) {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const { top, height } = element.getBoundingClientRect();
  return (top + window.scrollY + height / 2 - window.innerHeight / 2) / max;
}
