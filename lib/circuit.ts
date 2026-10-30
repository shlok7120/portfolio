import { CatmullRomCurve3, Vector3 } from "three";
import { heightProfile, monacoPoints, seaStretch } from "./monaco";

const scale = 1.25;

function heightAt(lap: number) {
  const next = heightProfile.findIndex(({ at }) => at > lap);
  const low = heightProfile[next - 1];
  const high = heightProfile[next];
  const mix = (lap - low.at) / (high.at - low.at);
  return low.height + (high.height - low.height) * (mix * mix * (3 - 2 * mix));
}

export const circuit = new CatmullRomCurve3(
  monacoPoints.map(
    ([east, north], i) => new Vector3(east * scale, heightAt(i / monacoPoints.length), -north * scale),
  ),
  true,
  "centripetal",
);
circuit.arcLengthDivisions = 4000;

export const circuitLength = circuit.getLength();
export const trackHalfWidth = 6;

// The car starts just past the line and crosses it again at the end of the page
const startOffset = 0.004;
const lapSpan = 0.996;

export function lapPosition(progress: number) {
  return (startOffset + progress * lapSpan) % 1;
}

export type TrackSample = { point: Vector3; tangent: Vector3; side: Vector3; bend: number };

export function sampleTrack(count: number): TrackSample[] {
  const up = new Vector3(0, 1, 0);
  const tangents = Array.from({ length: count }, (_, i) => circuit.getTangentAt(i / count));

  return tangents.map((tangent, i) => ({
    point: circuit.getPointAt(i / count),
    tangent,
    side: new Vector3().crossVectors(tangent, up).normalize(),
    bend: tangent.angleTo(tangents[(i + Math.ceil(count / 200)) % count]),
  }));
}

const coarseTrack = sampleTrack(500);

export function distanceToTrack(x: number, z: number) {
  return Math.min(...coarseTrack.map(({ point }) => Math.hypot(point.x - x, point.z - z)));
}

function nearestTrack(x: number, z: number) {
  let nearest = coarseTrack[0].point;
  let best = Infinity;
  for (let i = 0; i < coarseTrack.length; i += 2) {
    const { point } = coarseTrack[i];
    const distance = (point.x - x) ** 2 + (point.z - z) ** 2;
    if (distance < best) {
      best = distance;
      nearest = point;
    }
  }
  return { point: nearest, distance: Math.sqrt(best) };
}

// Ground follows the road, then climbs into the mountains behind the town
export function groundAt(x: number, z: number) {
  if (inSea(x, z)) return -3;
  const { point, distance } = nearestTrack(x, z);
  const inland = Math.max(0, (z < 200 ? -z - 150 : 0) + (x < -300 ? -x - 300 : 0)) / 700;
  const rise = Math.min(inland, 1);
  const shoulder = Math.min(Math.max(distance - 30, 0) / 90, 1);
  return point.y - 8 + shoulder * 9 + rise * rise * (3 - 2 * rise) * 190;
}

// The coast follows the left edge of the track, then runs out to open water
export function seaOutline() {
  const coast: [number, number][] = [];
  const steps = 160;
  for (let i = 0; i <= steps; i++) {
    const u = seaStretch.from + ((seaStretch.to - seaStretch.from) * i) / steps;
    const point = circuit.getPointAt(u);
    const tangent = circuit.getTangentAt(u);
    const side = new Vector3().crossVectors(tangent, new Vector3(0, 1, 0)).normalize();
    const edge = point.addScaledVector(side, -(trackHalfWidth + 3));
    coast.push([edge.x, edge.z]);
  }
  const [lastX] = coast[coast.length - 1];
  const [firstX, firstZ] = coast[0];
  return [...coast, [lastX + 40, 1900], [2000, 1900], [2000, firstZ - 40], [firstX + 200, firstZ - 40]] as [number, number][];
}

const outline = seaOutline();

function besideTrack(lap: number, offset: number): [number, number] {
  const point = circuit.getPointAt(lap);
  const side = new Vector3().crossVectors(circuit.getTangentAt(lap), new Vector3(0, 1, 0)).normalize();
  const spot = point.addScaledVector(side, offset);
  return [spot.x, spot.z];
}

export const casinoSpot = besideTrack(0.27, trackHalfWidth + 34);
export const hotelSpot = besideTrack(0.245, -(trackHalfWidth + 26));
const landmarkSpots: [number, number, number][] = [
  [...casinoSpot, 62],
  [...hotelSpot, 46],
];

export function inSea(x: number, z: number) {
  let inside = false;
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
    const [xi, zi] = outline[i];
    const [xj, zj] = outline[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

export function nearLandmark(x: number, z: number) {
  return landmarkSpots.some(([spotX, spotZ, radius]) => Math.hypot(spotX - x, spotZ - z) < radius);
}
