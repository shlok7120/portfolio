import { CanvasTexture, Color, type MeshStandardMaterial, RepeatWrapping, SRGBColorSpace } from "three";

function noisyTexture(width: number, height: number, paint: (context: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (context) paint(context);
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

// Speckled tarmac with a rubbered-in racing line down the middle of the road
export function tarmacTexture() {
  return noisyTexture(512, 512, (context) => {
    const image = context.createImageData(512, 512);
    for (let i = 0; i < image.data.length; i += 4) {
      const x = (i / 4) % 512;
      const across = Math.abs(x / 512 - 0.5) * 2;
      const rubber = 1 - Math.max(0, 1 - across / 0.42) * 0.3;
      const value = (195 + Math.random() * 60) * rubber;
      image.data.set([value, value, value + 3, 255], i);
    }
    context.putImageData(image, 0, 0);
  });
}


export function crowdTexture() {
  const texture = noisyTexture(512, 64, (context) => {
    const colours = ["#8f96a0", "#6d7480", "#a7adb5", "#58606b", "#7a8fa8", "#9a8f85", "#b8a58f", "#505660"];
    context.fillStyle = "#1a1d22";
    context.fillRect(0, 0, 512, 64);
    for (let y = 2; y < 64; y += 6) {
      for (let x = 1; x < 512; x += 4) {
        context.fillStyle = colours[Math.floor(Math.random() * colours.length)];
        context.fillRect(x, y, 3, 4);
      }
    }
  });
  texture.repeat.set(4, 1);
  return texture;
}

// Draws window grids from world position, so every tower gets correctly sized windows
export function addWindows(material: MeshStandardMaterial, glass: string, lit: number) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.windowGlass = { value: new Color(glass) };
    shader.uniforms.windowLit = { value: lit };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vWindowPosition;")
      .replace(
        "#include <project_vertex>",
        `#include <project_vertex>
        vec4 windowPosition = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          windowPosition = instanceMatrix * windowPosition;
        #endif
        vWindowPosition = (modelMatrix * windowPosition).xyz;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vWindowPosition;
        uniform vec3 windowGlass;
        uniform float windowLit;`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        vec3 windowNormal = normalize(cross(dFdx(vWindowPosition), dFdy(vWindowPosition)));
        if (abs(windowNormal.y) < 0.5) {
          float along = abs(windowNormal.x) > 0.5 ? vWindowPosition.z : vWindowPosition.x;
          vec2 grid = vec2(along / 3.4, vWindowPosition.y / 3.8);
          vec2 pane = fract(grid);
          float glassPane = step(0.14, pane.x) * step(pane.x, 0.86) * step(0.22, pane.y) * step(pane.y, 0.8);
          float chance = fract(sin(dot(floor(grid), vec2(12.9898, 78.233))) * 43758.5453);
          diffuseColor.rgb = mix(diffuseColor.rgb, windowGlass, glassPane);
          totalEmissiveRadiance += glassPane * step(0.64, chance) * windowLit * vec3(1.5, 0.9, 0.38) * (0.3 + chance * 0.7);
        }`,
      );
  };
  material.customProgramCacheKey = () => `windows-${glass}-${lit}`;
  material.needsUpdate = true;
}
