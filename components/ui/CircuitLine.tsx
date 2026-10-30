import { monacoPoints } from "@/lib/monaco";

const margin = 30;
const width = 900;

const xs = monacoPoints.map(([east]) => east);
const ys = monacoPoints.map(([, north]) => north);
const left = Math.min(...xs);
const bottom = Math.min(...ys);
const size = Math.max(Math.max(...ys) - bottom, Math.max(...xs) - left);
const fit = (width - margin * 2) / size;

// Turned on its side so the long, thin lap fits a wide map
const flat = monacoPoints.map(
  ([east, north]) =>
    [margin + (north - bottom) * fit, margin + (east - left) * fit] as const,
);

export const circuitViewBox = `0 0 ${width} ${Math.ceil(margin * 2 + (Math.max(...xs) - left) * fit)}`;

export const circuitPath = `M${flat.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L")} Z`;
