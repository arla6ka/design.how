export type EmbossParams = {
  depth: number;
  size: number;
  soften: number;
  angle: number;
  altitude: number;
  highlight: number;
  shadow: number;
  contrast: number;
  bright: number;
  tint: [number, number, number];
  texOffset: [number, number];
  texScale: number;
};

function fromSpec(a: {
  depth: number;
  size: number;
  soften: number;
  angle: number;
  alt: number;
  hi: number;
  sh: number;
}): Omit<EmbossParams, "tint" | "texOffset" | "texScale" | "contrast" | "bright"> {
  return {
    depth: 0.55 + (Math.min(a.depth, 1000) / 1000) * 1.2,
    size: Math.min(6, Math.max(1, (a.size / 4.17) * 2.2)),
    soften: Math.min(2, a.soften / 4.17),
    angle: a.angle,
    altitude: a.alt,
    highlight: a.hi / 100,
    shadow: a.sh / 100,
  };
}

export type Preset = { id: string; name: string; params: EmbossParams };

const SURFACE = { contrast: 0.32, bright: 2.0 };
type RGB = [number, number, number];
type XY = [number, number];

export const PRESETS: Preset[] = [
  { id: "sharp", name: "Sharp",
    params: { ...fromSpec({ depth: 188, size: 1, soften: 1, angle: 73, alt: 21, hi: 15, sh: 10 }), ...SURFACE, tint: [1.0, 0.42, 0.42] as RGB, texOffset: [0.0, 0.0] as XY, texScale: 1.35 } },
  { id: "press", name: "Press",
    params: { ...fromSpec({ depth: 188, size: 5, soften: 3, angle: 73, alt: 21, hi: 20, sh: 20 }), ...SURFACE, tint: [1.0, 0.62, 0.24] as RGB, texOffset: [0.4, 0.15] as XY, texScale: 1.0 } },
  { id: "brutal", name: "Brutal",
    params: { ...fromSpec({ depth: 1000, size: 20, soften: 10, angle: 73, alt: 21, hi: 25, sh: 20 }), ...SURFACE, tint: [0.98, 0.85, 0.2] as RGB, texOffset: [0.6, 0.55] as XY, texScale: 1.9 } },
  { id: "soft", name: "Soft",
    params: { ...fromSpec({ depth: 188, size: 15, soften: 7, angle: 73, alt: 21, hi: 12, sh: 8 }), ...SURFACE, tint: [0.42, 0.9, 0.42] as RGB, texOffset: [0.2, 0.7] as XY, texScale: 0.7 } },
  { id: "wide", name: "Wide",
    params: { ...fromSpec({ depth: 469, size: 20, soften: 5, angle: 90, alt: 30, hi: 10, sh: 10 }), ...SURFACE, tint: [0.2, 0.85, 0.75] as RGB, texOffset: [0.75, 0.1] as XY, texScale: 1.5 } },
  { id: "deep", name: "Deep",
    params: { ...fromSpec({ depth: 1000, size: 12, soften: 12, angle: 90, alt: 30, hi: 10, sh: 6 }), ...SURFACE, tint: [0.34, 0.62, 1.0] as RGB, texOffset: [0.1, 0.4] as XY, texScale: 2.2 } },
  { id: "crisp", name: "Crisp",
    params: { ...fromSpec({ depth: 1000, size: 2, soften: 3, angle: 90, alt: 30, hi: 20, sh: 10 }), ...SURFACE, tint: [0.55, 0.45, 1.0] as RGB, texOffset: [0.55, 0.8] as XY, texScale: 1.15 } },
  { id: "highkey", name: "High key",
    params: { ...fromSpec({ depth: 646, size: 4, soften: 4, angle: 90, alt: 30, hi: 25, sh: 25 }), ...SURFACE, tint: [0.82, 0.42, 1.0] as RGB, texOffset: [0.3, 0.25] as XY, texScale: 0.85 } },
  { id: "pillow", name: "Pillow",
    params: { ...fromSpec({ depth: 1000, size: 5, soften: 16, angle: 73, alt: 21, hi: 10, sh: 10 }), ...SURFACE, tint: [1.0, 0.42, 0.78] as RGB, texOffset: [0.85, 0.6] as XY, texScale: 0.6 } },
];

export function defaultParams(): EmbossParams {
  return { ...PRESETS[1].params };
}

function randomSurface(): Pick<
  EmbossParams,
  "tint" | "texOffset" | "texScale" | "contrast" | "bright"
> {
  const hue = Math.random() * 360;
  const s = 0.55 + Math.random() * 0.2;
  const c = s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const seg = [
    [c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x],
  ][Math.floor(hue / 60) % 6];
  const lift = 0.55;
  const tint: [number, number, number] = [
    seg[0] * (1 - lift) + lift,
    seg[1] * (1 - lift) + lift,
    seg[2] * (1 - lift) + lift,
  ];
  return {
    tint,
    texOffset: [Math.random(), Math.random()],
    texScale: 0.85 + Math.random() * 0.9,
    contrast: 0.25 + Math.random() * 0.2,
    bright: 1.85 + Math.random() * 0.2,
  };
}

export function remixParams(): EmbossParams {
  const preset = PRESETS[Math.floor(Math.random() * PRESETS.length)];
  const surf = randomSurface();
  return {
    ...preset.params,
    ...surf,
    highlight: Math.max(preset.params.highlight, 0.22),
    shadow: Math.max(preset.params.shadow, 0.3),
    depth: Math.max(preset.params.depth, 1.0),
    size: 1 + Math.random() * 1.5,
    soften: Math.random() * 0.6,
  };
}
