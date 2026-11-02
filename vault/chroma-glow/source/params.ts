import { CHROMA_DEFAULTS, type ChromaParams } from "./engine";

export type ChromaPreset = { id: string; name: string; params: Partial<ChromaParams> };

export const CHROMA_PRESETS: ChromaPreset[] = [
  {
    id: "peachsteel",
    name: "Peach / Steel",
    params: { warm: [1.0, 0.66, 0.5], cool: [0.42, 0.6, 0.95], red: [1.0, 0.42, 0.6], split: 9.0, bloom: 1.62, core: 1.06, noise: 0.15, spectral: 0.6, bg: [0.11, 0.13, 0.2] },
  },
  {
    id: "chartviolet",
    name: "Chartreuse / Violet",
    params: { warm: [0.78, 0.95, 0.2], cool: [0.55, 0.3, 1.0], red: [0.3, 0.7, 1.0], split: 10.5, bloom: 1.52, core: 1.04, noise: 0.17, spectral: 0.85, bg: [0.15, 0.08, 0.19] },
  },
  {
    id: "pinkamber",
    name: "Hot Pink / Amber",
    params: { warm: [1.0, 0.22, 0.62], cool: [1.0, 0.72, 0.24], red: [1.0, 0.5, 0.85], split: 8.0, bloom: 1.55, core: 1.05, noise: 0.16, spectral: 0.5, bg: [0.19, 0.08, 0.15] },
  },
  {
    id: "rustmint",
    name: "Rust / Mint",
    params: { warm: [0.92, 0.42, 0.22], cool: [0.5, 0.95, 0.78], red: [0.3, 0.85, 0.7], split: 7.5, bloom: 1.5, core: 1.02, noise: 0.13, spectral: 0.45, bg: [0.07, 0.16, 0.13] },
  },
  {
    id: "sandcobalt",
    name: "Sand / Cobalt",
    params: { warm: [1.0, 0.55, 0.42], cool: [0.24, 0.36, 0.95], red: [0.95, 0.34, 0.5], split: 9.0, bloom: 1.5, core: 1.0, noise: 0.09, spectral: 0.6, bg: [0.95, 0.9, 0.8], invert: true },
  },
  {
    id: "blushsky",
    name: "Blush / Sky",
    params: { warm: [1.0, 0.44, 0.5], cool: [0.34, 0.72, 1.0], red: [0.6, 0.5, 1.0], split: 9.5, bloom: 1.52, core: 1.0, noise: 0.09, spectral: 0.7, bg: [0.97, 0.9, 0.92], invert: true },
  },
];

export function defaultChromaParams(): ChromaParams {
  return { ...CHROMA_DEFAULTS, ...CHROMA_PRESETS[0].params };
}

export const HERO_CYCLE: { word: string; params: Partial<ChromaParams> }[] = [
  { word: "boom", params: CHROMA_PRESETS[0].params },
  { word: "poof", params: CHROMA_PRESETS[3].params },
  { word: "zap",  params: CHROMA_PRESETS[1].params },
  { word: "pow",  params: CHROMA_PRESETS[2].params },
  { word: "yeet", params: CHROMA_PRESETS[5].params },
  { word: "oof",  params: CHROMA_PRESETS[4].params },
];

export const SFX_WORDS = [
  "boom", "bonk", "pow", "zap", "yeet", "oof", "whoa", "meep",
  "honk", "blip", "splat", "womp", "boing", "poof", "zoom", "fizz",
];

export const toHex = (c: [number, number, number]) =>
  "#" + c.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0")).join("");
export const fromHex = (h: string): [number, number, number] => {
  const n = h.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2) || "0", 16) / 255) as [number, number, number];
};

function vividHue(hue: number, lift = 0.15): [number, number, number] {
  const c = 1;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const seg = [
    [c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x],
  ][Math.floor(hue / 60) % 6];
  return [seg[0] * (1 - lift) + lift, seg[1] * (1 - lift) + lift, seg[2] * (1 - lift) + lift];
}

function suitedBg(warm: [number, number, number], cool: [number, number, number]): [number, number, number] {
  const avg = [(warm[0] + cool[0]) / 2, (warm[1] + cool[1]) / 2, (warm[2] + cool[2]) / 2];
  const max = Math.max(avg[0], avg[1], avg[2], 0.001);
  const floor = 0.05;
  const peak = 0.17;
  return [0, 1, 2].map((i) => floor + (avg[i] / max) * (peak - floor)) as unknown as [number, number, number];
}

export function remixChromaParams(): Partial<ChromaParams> {
  const h = Math.random() * 360;
  const warm = vividHue(h);
  const cool = vividHue((h + 150 + Math.random() * 60) % 360);
  const red = vividHue((h + 40 + Math.random() * 40) % 360, 0.1);
  const invert = Math.random() < 0.34;
  const bg = invert ? suitedLightBg(warm, cool) : suitedBg(warm, cool);
  return {
    word: SFX_WORDS[Math.floor(Math.random() * SFX_WORDS.length)],
    warm,
    cool,
    red,
    bg,
    invert,
    split: 4 + Math.random() * 8,
    bloom: 1.0 + Math.random() * 0.4,
    noise: 0.06 + Math.random() * 0.14,
    spectral: 0.3 + Math.random() * 0.6,
  };
}

function suitedLightBg(warm: [number, number, number], cool: [number, number, number]): [number, number, number] {
  const avg = [(warm[0] + cool[0]) / 2, (warm[1] + cool[1]) / 2, (warm[2] + cool[2]) / 2];
  const max = Math.max(avg[0], avg[1], avg[2], 0.001);
  return [0, 1, 2].map((i) => 0.88 + (avg[i] / max) * 0.08) as unknown as [number, number, number];
}
