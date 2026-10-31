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

const blendStep = 3;
const roadClearance = 1.2;
const roadShoulder = 38;

// Height of the land before the mountains: a smooth blend of the road levels around it,
// so two roads at different heights get a slope between them and not a step
function townHeight(x: number, z: number) {
  let total = 0;
  let weights = 0;
  let nearest = Infinity;
  let lowestY = Infinity;
  for (let i = 0; i < coarseTrack.length; i += blendStep) {
    const { point } = coarseTrack[i];
    const distance = (point.x - x) ** 2 + (point.z - z) ** 2;
    const weight = 1 / (distance + 100) ** 2;
    total += point.y * weight;
    weights += weight;
    nearest = Math.min(nearest, distance);
    if (distance < roadShoulder ** 2) lowestY = Math.min(lowestY, point.y);
  }
  return { height: total / weights, lowestY, distance: Math.sqrt(nearest) };
}

// Ground stays just under the road, then climbs into the mountains behind the town
export function groundAt(x: number, z: number) {
  if (inSea(x, z)) return -3;
  const { height, lowestY, distance } = townHeight(x, z);
  const inland = Math.max(0, (z < 200 ? -z - 150 : 0) + (x < -300 ? -x - 300 : 0)) / 700;
  const rise = Math.min(inland, 1);
  const mountain = rise * rise * (3 - 2 * rise) * 190 * smooth((distance - 70) / 260);
  const ground = height - roadClearance + smooth(distance / 200) * 3 + mountain;
  // Where roads pass at different levels, the ground sits below the lowest and the upper one gets a retaining wall
  return Math.min(ground, lowestY - roadClearance);
}

function smooth(value: number) {
  const t = Math.min(Math.max(value, 0), 1);
  return t * t * (3 - 2 * t);
}

// How far the pavement can spread at this point of the lap before it reaches another stretch of road
export function clearReach(x: number, z: number, sideX: number, sideZ: number, lap: number, reach: number, least: number) {
  for (let edge = reach; edge > least; edge -= 0.8) {
    const edgeX = x + sideX * edge;
    const edgeZ = z + sideZ * edge;
    const blocked = coarseTrack.some(({ point }, i) => {
      const apart = Math.abs(i / coarseTrack.length - lap);
      if (Math.min(apart, 1 - apart) < 0.012) return false;
      return Math.hypot(point.x - edgeX, point.z - edgeZ) < trackHalfWidth + 1;
    });
    if (!blocked) return edge;
  }
  return least;
}

export const terrainSize = 3400;
export const terrainSteps = 180;
const terrainCell = terrainSize / terrainSteps;
let terrainGrid: Float32Array | null = null;

function readTerrain() {
  if (terrainGrid) return terrainGrid;
  const rows = terrainSteps + 1;
  terrainGrid = new Float32Array(rows * rows);
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < rows; column++) {
      terrainGrid[row * rows + column] = groundAt(column * terrainCell - terrainSize / 2, row * terrainCell - terrainSize / 2);
    }
  }
  return terrainGrid;
}

// The height of the terrain mesh itself, which is what buildings have to stand on
export function terrainHeight(x: number, z: number) {
  const grid = readTerrain();
  const rows = terrainSteps + 1;
  const column = Math.min(Math.max((x + terrainSize / 2) / terrainCell, 0), terrainSteps - 0.001);
  const row = Math.min(Math.max((z + terrainSize / 2) / terrainCell, 0), terrainSteps - 0.001);
  const left = Math.floor(column);
  const top = Math.floor(row);
  const across = column - left;
  const down = row - top;
  const at = (r: number, c: number) => grid[r * rows + c];
  const near = at(top, left) * (1 - across) + at(top, left + 1) * across;
  const far = at(top + 1, left) * (1 - across) + at(top + 1, left + 1) * across;
  return near * (1 - down) + far * down;
}

// The lowest ground under a footprint, so nothing built on it hangs over a slope
export function seatAt(x: number, z: number, reach: number) {
  let lowest = Infinity;
  for (const dx of [-reach, 0, reach]) {
    for (const dz of [-reach, 0, reach]) lowest = Math.min(lowest, terrainHeight(x + dx, z + dz));
  }
  return lowest;
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

// Chosen so each footprint stays 14 clear of every part of the road, with its front facing the track
export const casinoSpot: [number, number] = [127.1, -379.6];
export const casinoYaw = 1.12;
export const hotelSpot: [number, number] = [266.4, -386.9];
export const hotelYaw = -2.212;
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
