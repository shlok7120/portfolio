"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BackSide, Color, type Mesh, ShaderMaterial, Vector3 } from "three";

const vertexShader = /* glsl */ `
  varying vec3 direction;
  void main() {
    direction = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 top;
  uniform vec3 horizon;
  uniform vec3 sun;
  uniform float sunStrength;
  uniform float clouds;
  uniform float stars;
  varying vec3 direction;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + 1.0), f.x), f.y);
  }

  float fbm(vec2 p) {
    float total = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
      total += noise(p) * amplitude;
      p *= 2.03;
      amplitude *= 0.5;
    }
    return total;
  }

  void main() {
    vec3 ray = normalize(direction);
    float height = clamp(ray.y * 1.8, 0.0, 1.0);
    vec3 colour = mix(horizon, top, pow(height, 0.6));

    if (ray.y > 0.0) {
      vec2 plane = ray.xz / (ray.y + 0.12);
      float cover = smoothstep(0.5, 0.8, fbm(plane * 1.3));
      colour = mix(colour, vec3(1.0), cover * clouds * smoothstep(0.0, 0.16, ray.y));

      vec2 cell = floor(ray.xz / (ray.y + 0.6) * 620.0);
      colour += stars * 0.8 * step(0.9972, hash(cell)) * hash(cell + 3.0) * smoothstep(0.03, 0.3, ray.y);
    }

    float glow = max(dot(ray, sun), 0.0);
    colour += vec3(1.0, 0.92, 0.78) * sunStrength * (pow(glow, 1200.0) * 6.0 + pow(glow, 32.0) * 0.3);
    gl_FragColor = vec4(colour, 1.0);
  }
`;

type SkyProps = {
  top: string;
  horizon: string;
  sun: [number, number, number];
  sunStrength: number;
  clouds: number;
  stars: number;
};

export function Sky({ top, horizon, sun, sunStrength, clouds, stars }: SkyProps) {
  const dome = useRef<Mesh>(null);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        side: BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          top: { value: new Color(top) },
          horizon: { value: new Color(horizon) },
          sun: { value: new Vector3(...sun).normalize() },
          sunStrength: { value: sunStrength },
          clouds: { value: clouds },
          stars: { value: stars },
        },
      }),
    [top, horizon, sun, sunStrength, clouds, stars],
  );

  useFrame(({ camera }) => {
    dome.current?.position.copy(camera.position);
  });

  return (
    <mesh ref={dome} material={material} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[1100, 32, 16]} />
    </mesh>
  );
}
