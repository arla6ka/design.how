export const N = 16;
export const FRAMES = 32;
export const FPS = 18;
export const STILL_FRAME = 16;

export const BURN_RADIUS = 2.8;
export const HEAL_RATE = 6.0;
export const SWAY_MAX = 2.0;
export const FIRE_FRAC = 0.6;

export const GROUND = '#f0f7ee';

export const FLAME = ['#7a1500', '#b82a00', '#e85500', '#ff8c00', '#ffbe1a', '#ffe66b', '#fff8d0'];
export const LIT_AT = 0.14;
export const COOL_MIN = 0.02;
export const COOL_RANDOM = 0.065;

export const BLOCK = ['#2a0c0c', '#3d1212', '#521a17', '#66231d', '#7a2e24'];

export const SEED = 7;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hex = (c: string) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];

export function flipbook(seed = SEED): Uint8ClampedArray<ArrayBuffer>[] {
  const rand = mulberry32(seed);
  const rows = N + 1;
  const heat = new Float32Array(N * rows);
  const colours = FLAME.map(hex);
  const step = () => {
    for (let x = 0; x < N; x++) {
      const edge = 1 - Math.abs(x - (N - 1) / 2) / N;
      heat[N * N + x] = Math.min(1, edge * (1.05 + 0.2 * rand()));
    }
    for (let y = 1; y < rows; y++) {
      for (let x = 0; x < N; x++) {
        const dst = Math.min(N - 1, Math.max(0, x + Math.round(rand() * 2 - 1)));
        heat[(y - 1) * N + dst] = Math.max(0, heat[y * N + x] - (COOL_MIN + rand() * COOL_RANDOM));
      }
    }
  };
  for (let i = 0; i < 48; i++) step();
  const out: Uint8ClampedArray<ArrayBuffer>[] = [];
  for (let f = 0; f < FRAMES; f++) {
    step();
    const data = new Uint8ClampedArray(N * N * 4);
    for (let i = 0; i < N * N; i++) {
      const h = heat[i];
      if (h < LIT_AT) continue;
      const c = colours[Math.min(colours.length - 1, Math.floor(((h - LIT_AT) / (1 - LIT_AT)) * colours.length))];
      data.set([c[0], c[1], c[2], 255], i * 4);
    }
    out.push(data);
  }
  return out;
}

export function block(seed = SEED): Uint8ClampedArray<ArrayBuffer> {
  const rand = mulberry32(seed * 31 + 1);
  const colours = BLOCK.map(hex);
  const data = new Uint8ClampedArray(N * N * 4);
  for (let i = 0; i < N * N; i++) {
    const c = colours[Math.floor(Math.pow(rand(), 1.4) * colours.length)];
    data.set([c[0], c[1], c[2], 255], i * 4);
  }
  return data;
}
