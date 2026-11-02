// Badge trail (https://design.how/vault/badge-trail), badges.ts.
// FIXED. Change the VARIABLE values in params instead (WORDS, COLORS, GROUND, FONT_PX, DROP_MS, MIN_TRAVEL, APPEAR_MS, HOLD_MS, FADE_MS, MAX_LIVE, DESIGN_WIDTH, FONT_VAR).
export const WORDS = [
  "kerning",
  "baseline",
  "leading",
  "tracking",
  "x-height",
  "ligature",
  "serif",
  "grotesk",
  "bezier",
  "raster",
  "vector",
  "stroke",
  "gamut",
  "bleed",
  "weight",
  "grid",
  "hue",
  "counter",
  "ascender",
  "hinting",
  "widow",
  "orphan",
  "gutter",
  "opacity",
];

export const COLORS = [
  "#c6ff3d",
  "#ff3d81",
  "#38e0ff",
  "#ff8a3d",
  "#b56bff",
  "#ffe234",
  "#ff5c5c",
  "#3dffb0",
  "#4d8dff",
  "#ff5cf0",
];

const HUE_STEP = 24;

function hslHex(h: number, s = 0.85, l = 0.62): string {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const hex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

export function makeHueWalker(seedHue: number) {
  let h = seedHue;
  return (intensity = 1) => {
    h += HUE_STEP;
    const t = Math.max(0, Math.min(1, intensity));
    const s = 0.32 + 0.53 * t;
    const l = 0.78 - 0.16 * t;
    return hslHex(h, s, l);
  };
}

export function nextWordBag(): () => string {
  let bag: number[] = [];
  return () => {
    if (!bag.length) {
      bag = Array.from({length: WORDS.length}, (_, i) => i);
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
    }
    return WORDS[bag.pop()!];
  };
}
