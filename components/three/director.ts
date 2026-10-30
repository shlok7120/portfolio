import { MathUtils, Vector3 } from "three";
import { circuit, circuitLength } from "@/lib/circuit";

export type ShotName = "hero" | "chase" | "lowRear" | "front" | "side" | "heli" | "onboard" | "harbour";

export type Cue = { at: number; shot: ShotName };

export type Pose = {
  point: Vector3;
  tangent: Vector3;
  side: Vector3;
  u: number;
  orbit: number;
};

type Frame = { position: Vector3; target: Vector3; fov: number };

const up = new Vector3(0, 1, 0);
const from = { position: new Vector3(), target: new Vector3(), fov: 50 };
const to = { position: new Vector3(), target: new Vector3(), fov: 50 };

function frameShot(shot: ShotName, { point, tangent, side, u, orbit }: Pose, out: Frame) {
  const { position, target } = out;
  switch (shot) {
    case "hero":
      position
        .copy(point)
        .addScaledVector(tangent, 8.2 * Math.cos(orbit) + 8.4 * Math.sin(orbit))
        .addScaledVector(side, -8.4 * Math.cos(orbit) + 8.2 * Math.sin(orbit))
        .addScaledVector(up, 1.25);
      target.copy(point).addScaledVector(tangent, 0.15).addScaledVector(up, 0.42);
      out.fov = 30;
      break;
    case "chase":
      circuit.getPointAt((u - 7.6 / circuitLength + 1) % 1, position);
      position.addScaledVector(up, 2.1);
      target.copy(point).addScaledVector(tangent, 8).addScaledVector(up, 0.8);
      out.fov = 52;
      break;
    case "lowRear":
      position.copy(point).addScaledVector(tangent, -6).addScaledVector(side, 1.5).addScaledVector(up, 0.42);
      target.copy(point).addScaledVector(tangent, 6).addScaledVector(up, 0.55);
      out.fov = 60;
      break;
    case "front":
      position.copy(point).addScaledVector(tangent, 7.4).addScaledVector(side, -1.7).addScaledVector(up, 0.45);
      target.copy(point).addScaledVector(up, 0.45);
      out.fov = 36;
      break;
    case "side":
      position.copy(point).addScaledVector(tangent, -1.2).addScaledVector(side, 5).addScaledVector(up, 2.6);
      target.copy(point).addScaledVector(tangent, 0.5).addScaledVector(up, 0.3);
      out.fov = 32;
      break;
    case "heli":
      position.copy(point).addScaledVector(tangent, -15).addScaledVector(side, 9).addScaledVector(up, 11);
      target.copy(point).addScaledVector(tangent, 3);
      out.fov = 30;
      break;
    case "harbour":
      // Hovers out over the water, looking back across the yachts at the car on the quay
      position.copy(point).addScaledVector(side, -34).addScaledVector(tangent, -16).addScaledVector(up, 13);
      target.copy(point).addScaledVector(up, 1.5);
      out.fov = 34;
      break;
    case "onboard":
      position.copy(point).addScaledVector(tangent, -0.5).addScaledVector(up, 1.04);
      target.copy(point).addScaledVector(tangent, 18).addScaledVector(up, 0.5);
      out.fov = 72;
      break;
  }
}

// Each cue holds its shot, then the camera moves through to the next one
export function directCamera(cues: Cue[], progress: number, pose: Pose, out: Frame) {
  let next = cues.findIndex((cue) => cue.at > progress);
  if (next < 0) next = cues.length - 1;
  const previous = Math.max(next - 1, 0);
  const a = cues[previous];
  const b = cues[next];
  const span = Math.max(b.at - a.at, 0.0001);
  const mix = MathUtils.smootherstep(MathUtils.clamp((progress - a.at) / span, 0, 1), 0.35, 1);

  frameShot(a.shot, pose, from);
  frameShot(b.shot, pose, to);
  out.position.lerpVectors(from.position, to.position, mix);
  out.target.lerpVectors(from.target, to.target, mix);
  out.fov = MathUtils.lerp(from.fov, to.fov, mix);
}
