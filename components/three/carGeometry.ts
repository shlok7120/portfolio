import {
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  ExtrudeGeometry,
  LatheGeometry,
  Shape,
  TubeGeometry,
  Vector2,
  Vector3,
} from "three";

export type Section = { z: number; w: number; top: number; bottom: number; x?: number };

const ringPoints = 28;

// Skins a smooth shell over cross-sections listed from front to back: rounded on
// top and nearly flat underneath, like a real monocoque
export function loft(sections: Section[], steps = 72) {
  const shape = new CatmullRomCurve3(sections.map(({ z, w, top }) => new Vector3(z, w, top)));
  const floor = new CatmullRomCurve3(sections.map(({ bottom, x = 0 }, i) => new Vector3(i, bottom, x)));
  const positions: number[] = [];
  const uvs: number[] = [];
  const index: number[] = [];

  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const { x: z, y: w, z: top } = shape.getPoint(t);
    const { y: bottom, z: centre } = floor.getPoint(t);
    const middle = (top + bottom) / 2;
    const half = (top - bottom) / 2;
    for (let i = 0; i <= ringPoints; i++) {
      const angle = -Math.PI / 2 + (i / ringPoints) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const squareness = sin < 0 ? 0.32 : 0.62;
      positions.push(
        centre + Math.sign(cos) * Math.abs(cos) ** squareness * w,
        middle + Math.sign(sin) * Math.abs(sin) ** squareness * half,
        z,
      );
      uvs.push(t, i / ringPoints);
    }
  }

  const row = ringPoints + 1;
  for (let s = 0; s < steps; s++) {
    for (let i = 0; i < ringPoints; i++) {
      const a = s * row + i;
      const b = a + 1;
      const c = a + row;
      const d = c + 1;
      index.push(a, c, b, b, c, d);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute("uv", new BufferAttribute(new Float32Array(uvs), 2));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  return geometry;
}

type WingOptions = {
  halfSpan: number;
  chord: (t: number) => number;
  y: (t: number) => number;
  z: (t: number) => number;
  pitch: (t: number) => number;
  thickness?: number;
};

// A thin aerofoil swept across the span. Each function receives 0 at the centre and 1 at the tip
export function wing({ halfSpan, chord, y, z, pitch, thickness = 0.014 }: WingOptions) {
  const steps = 32;
  const profile: [number, number][] = [];
  const chordSteps = 7;
  for (let i = 0; i <= chordSteps; i++) {
    const a = i / chordSteps;
    profile.push([a, Math.sin(Math.PI * a ** 0.6) * thickness * 1.5]);
  }
  for (let i = chordSteps - 1; i > 0; i--) {
    const a = i / chordSteps;
    profile.push([a, -Math.sin(Math.PI * a ** 0.6) * thickness * 0.5]);
  }

  const positions: number[] = [];
  const index: number[] = [];
  for (let s = 0; s <= steps; s++) {
    const span = (s / steps) * 2 - 1;
    const t = Math.abs(span);
    const angle = pitch(t);
    const length = chord(t);
    const dirY = Math.sin(angle);
    const dirZ = -Math.cos(angle);
    profile.forEach(([along, off]) => {
      positions.push(
        span * halfSpan,
        y(t) + dirY * along * length + Math.cos(angle) * off,
        z(t) + dirZ * along * length + Math.sin(angle) * off,
      );
    });
  }

  const row = profile.length;
  for (let s = 0; s < steps; s++) {
    for (let i = 0; i < row; i++) {
      const a = s * row + i;
      const b = s * row + ((i + 1) % row);
      const c = a + row;
      const d = b + row;
      index.push(a, b, c, b, d, c);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  return geometry;
}

// A flat plate cut from a side-on outline given as [z, y] points
export function sidePlate(points: [number, number][], x: number, thickness = 0.018) {
  const shape = new Shape(points.map(([z, y]) => new Vector2(z, y)));
  const geometry = new ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelSize: 0.004,
    bevelThickness: 0.004,
    bevelSegments: 1,
  });
  geometry.rotateY(-Math.PI / 2);
  geometry.translate(x + thickness / 2, 0, 0);
  return geometry;
}

// A flat plate cut from a top-down outline given as [x, z] points
export function floorPlate(points: [number, number][], y: number, thickness = 0.03) {
  const shape = new Shape(points.map(([x, z]) => new Vector2(x, z)));
  const geometry = new ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, y + thickness, 0);
  return geometry;
}

export function strut(from: Vector3, to: Vector3, radius = 0.014) {
  return new TubeGeometry(new CatmullRomCurve3([from, to]), 1, radius, 6);
}

export function tube(points: Vector3[], radius: number, segments = 40) {
  return new TubeGeometry(new CatmullRomCurve3(points), segments, radius, 8);
}

// Rounded shoulders are what make a tyre read as a tyre instead of a cylinder
export function tyre(radius: number, width: number) {
  const half = width / 2;
  const profile = [
    [radius * 0.56, -half + 0.012],
    [radius * 0.72, -half],
    [radius * 0.9, -half + 0.004],
    [radius * 0.97, -half + 0.028],
    [radius, -half + 0.07],
    [radius, half - 0.07],
    [radius * 0.97, half - 0.028],
    [radius * 0.9, half - 0.004],
    [radius * 0.72, half],
    [radius * 0.56, half - 0.012],
  ].map(([r, y]) => new Vector2(r, y));
  const geometry = new LatheGeometry(profile, 56);
  geometry.computeVertexNormals();
  return geometry;
}
