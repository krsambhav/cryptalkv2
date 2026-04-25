/**
 * Generates 8 placeholder cover PNGs into /public/covers/.
 *
 * These are procedurally generated landscapes (gradient skies + horizons +
 * subtle noise) at 2000×1500. They are placeholders — swap with real
 * 24-bit RGB photographs before final submission. The crypto and stego
 * code does not care about the content, only that pixels exist with
 * varied LSBs, which procedural generation gives us.
 */
import { PNG } from "pngjs";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const WIDTH = 2000;
const HEIGHT = 1500;
const OUT_DIR = resolve(process.cwd(), "public", "covers");

type Palette = {
  name: string;
  sky: [number, number, number];
  horizon: [number, number, number];
  ground: [number, number, number];
  accent: [number, number, number];
};

const PALETTES: Palette[] = [
  // each palette is a moodboard, not a literal landscape
  { name: "01-amber-dusk",   sky: [38, 22, 30],   horizon: [180, 90, 50],  ground: [22, 14, 12],   accent: [240, 180, 90]  },
  { name: "02-sea-cliffs",   sky: [40, 60, 90],   horizon: [120, 150, 170], ground: [25, 35, 50],  accent: [220, 220, 230] },
  { name: "03-pine-woods",   sky: [60, 80, 70],   horizon: [40, 70, 50],   ground: [20, 35, 25],   accent: [200, 220, 180] },
  { name: "04-desert-sand",  sky: [200, 150, 110], horizon: [180, 120, 80], ground: [80, 50, 30],  accent: [240, 220, 180] },
  { name: "05-night-snow",   sky: [25, 30, 45],   horizon: [60, 70, 90],   ground: [180, 190, 210], accent: [120, 140, 180] },
  { name: "06-rose-fields",  sky: [180, 150, 170], horizon: [200, 110, 130], ground: [80, 60, 70], accent: [230, 180, 200] },
  { name: "07-volcano",      sky: [30, 20, 30],   horizon: [120, 40, 30],  ground: [25, 18, 20],   accent: [220, 90, 50]   },
  { name: "08-misty-lake",   sky: [110, 130, 130], horizon: [150, 160, 160], ground: [60, 80, 80], accent: [200, 210, 210] },
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
function lerp3(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}
function clamp255(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

// cheap hash-noise — deterministic, so identical builds produce identical PNGs.
function hashNoise(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 43.7654) * 43758.5453;
  return n - Math.floor(n); // 0..1
}

function smoothNoise(x: number, y: number, seed: number): number {
  // box-blur over a 3x3 neighborhood for less blocky noise
  let total = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      total += hashNoise(x + dx, y + dy, seed);
    }
  }
  return total / 9;
}

function generate(palette: Palette, seed: number): PNG {
  const png = new PNG({ width: WIDTH, height: HEIGHT });
  const data = png.data;

  const horizonY = HEIGHT * 0.55;
  const sunX = WIDTH * 0.72;
  const sunY = HEIGHT * 0.32;
  const sunR = 380;

  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const idx = (y * WIDTH + x) * 4;

      // base — vertical gradient from sky to horizon to ground
      let color: [number, number, number];
      if (y < horizonY) {
        const t = y / horizonY;
        color = lerp3(palette.sky, palette.horizon, Math.pow(t, 1.4));
      } else {
        const t = (y - horizonY) / (HEIGHT - horizonY);
        color = lerp3(palette.horizon, palette.ground, Math.pow(t, 0.8));
      }

      // sun glow — soft radial bloom near horizon
      const dx = x - sunX;
      const dy = y - sunY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const sunFalloff = Math.max(0, 1 - dist / sunR);
      const sunWeight = Math.pow(sunFalloff, 2.2) * 0.55;
      color = [
        lerp(color[0], palette.accent[0], sunWeight),
        lerp(color[1], palette.accent[1], sunWeight),
        lerp(color[2], palette.accent[2], sunWeight),
      ];

      // subtle film grain — gives LSB embedding plenty of entropy to land in
      const grain = (smoothNoise(x * 0.3, y * 0.3, seed) - 0.5) * 14;
      color[0] += grain;
      color[1] += grain;
      color[2] += grain;

      // long horizontal cloud bands
      const cloud = smoothNoise(x * 0.005, y * 0.02, seed + 1.7);
      const cloudBand = (1 - Math.abs(y - HEIGHT * 0.32) / (HEIGHT * 0.18)) * cloud;
      const cloudW = Math.max(0, cloudBand) * 0.4;
      color = [
        lerp(color[0], 235, cloudW),
        lerp(color[1], 230, cloudW),
        lerp(color[2], 225, cloudW),
      ];

      data[idx] = clamp255(color[0]);
      data[idx + 1] = clamp255(color[1]);
      data[idx + 2] = clamp255(color[2]);
      data[idx + 3] = 255;
    }
  }

  return png;
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  console.log(`generating ${PALETTES.length} covers into ${OUT_DIR}`);
  PALETTES.forEach((palette, i) => {
    console.log(`  ${palette.name}.png`);
    const png = generate(palette, i + 1);
    const buffer = PNG.sync.write(png, { colorType: 6 });
    writeFileSync(resolve(OUT_DIR, `${palette.name}.png`), buffer);
  });
  console.log("done.");
}

main();
