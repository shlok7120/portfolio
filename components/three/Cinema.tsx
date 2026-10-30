"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  BloomEffect,
  Effect,
  EffectAttribute,
  EffectComposer,
  EffectPass,
  RenderPass,
  ToneMappingEffect,
  ToneMappingMode,
  VignetteEffect,
} from "postprocessing";
import { HalfFloatType, Uniform } from "three";
import { getModes } from "@/lib/modes";
import { telemetry } from "@/lib/telemetry";

const radialBlur = /* glsl */ `
  uniform float strength;
  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec2 direction = uv - vec2(0.5, 0.56);
    float reach = strength * smoothstep(0.02, 0.5, length(direction));
    vec3 colour = inputColor.rgb;
    for (int i = 1; i < 7; i++) {
      colour += texture2D(inputBuffer, uv - direction * reach * float(i) / 6.0).rgb;
    }
    outputColor = vec4(colour / 7.0, inputColor.a);
  }
`;

class SpeedBlur extends Effect {
  constructor() {
    super("SpeedBlur", radialBlur, {
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map([["strength", new Uniform(0)]]),
    });
  }
}

type Rig = { composer: EffectComposer; bloom: BloomEffect; blur: SpeedBlur };

export function Cinema() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const dpr = useThree((state) => state.viewport.dpr);
  const rig = useRef<Rig | null>(null);

  useEffect(() => {
    const composer = new EffectComposer(gl, { frameBufferType: HalfFloatType, multisampling: 2 });
    const bloom = new BloomEffect({ mipmapBlur: true, luminanceThreshold: 1, luminanceSmoothing: 0.25, intensity: 0.8 });
    const blur = new SpeedBlur();
    const vignette = new VignetteEffect({ offset: 0.32, darkness: 0.5 });
    const toneMapping = new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC });

    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new EffectPass(camera, bloom));
    composer.addPass(new EffectPass(camera, blur));
    composer.addPass(new EffectPass(camera, vignette, toneMapping));
    rig.current = { composer, bloom, blur };

    return () => {
      rig.current = null;
      composer.dispose();
    };
  }, [gl, scene, camera]);

  useEffect(() => {
    rig.current?.composer.setSize(size.width, size.height);
  }, [size, dpr]);

  useFrame((_, delta) => {
    const current = rig.current;
    if (!current) return;
    current.bloom.intensity = getModes().day ? 0.12 : 0.8;
    current.blur.uniforms.get("strength")!.value = telemetry.speed ** 2 * 0.09;
    current.composer.render(delta);
  }, 1);

  return null;
}
