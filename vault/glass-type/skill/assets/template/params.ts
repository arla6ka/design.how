// Glass type (https://design.how/vault/glass-type), params.ts.
// VARIABLE: A_TEXT, B_WORDS, C_WORDS, LENS, DISPERSE, SCENE_SECONDS, POINTER_PULL, INK, PAPER, FONT_VAR, FONT_WEIGHT. Change these freely. Everything else here is FIXED: it is the effect, so changing it makes a different visual.
export const PAPER = "#ffffff";
export const INK = "#0a0a0a";

export const A_TEXT = "(clear) your view";
export const A_FRAMES = 41;
export const A_Y = [
  0.864, 0.842, 0.826, 0.812, 0.801, 0.792, 0.784, 0.777, 0.733, 0.71, 0.689,
  0.63, 0.611, 0.593, 0.579, 0.567, 0.556, 0.546, 0.537, 0.528, 0.52, 0.511,
  0.503, 0.494, 0.486, 0.476, 0.464, 0.453, 0.439, 0.426, 0.409, 0.391, 0.371,
  0.349, 0.323, 0.292, 0.256, 0.182, 0.133, 0.104, 0.069,
];
export const A_TEXT_W = 1.49;

export const B_WORDS = ["Slow Light", "Refraction"];
export const B_FRAMES = 35;
export const B_SWAP_FRAME = 15;
export const B_R = [
  0.641, 0.664, 0.679, 0.69, 0.697, 0.702, 0.706, 0.707, 0.707, 0.706, 0.702,
  0.699, 0.693, 0.687, 0.659, 0.567, 0.539, 0.518, 0.512, 0.506, 0.502, 0.5,
  0.498, 0.49, 0.494, 0.494, 0.494, 0.494, 0.494, 0.493, 0.496, 0.491, 0.492,
  0.488, 0.486,
];
export const B_TEXT_W = 0.56;

export const C_WORDS = ["Light", "is", "soft"] as const;
export const C_FRAMES = 52;
export const C_SEGMENTS: [number, number][] = [
  [0, 17],
  [18, 34],
  [35, 51],
];
export const C_X = [
  0.422, 0.21, 0.113, 0.068, 0.042, 0.026, 0.014, 0.007, 0.001, -0.002,
  -0.004, -0.004, -0.006, -0.01, -0.016, -0.027, -0.043, -0.076, 0.416, 0.304,
  0.223, 0.159, 0.107, 0.069, 0.019, 0.004, -0.004, -0.009, -0.011, -0.013,
  -0.023, -0.039, -0.066, -0.108, -0.169, 0.45, 0.268, 0.156, 0.093, 0.056,
  0.031, 0.017, 0.008, 0, -0.004, -0.007, -0.007, -0.009, -0.02, -0.031,
  -0.053, -0.093,
];
export const C_TEXT_W = 0.76;

export const FPS = 24;

export const FONT_STACK = 'Georgia, "Times New Roman", serif';
export const FONT_VAR = "--visual-display";
export const FONT_WEIGHT = 500;

export const LENS = {
  a: { rl: 1.05, str: 2.4, pow: 3.0, rip: 0.35, wave: 0.34, rim0: 0.25 },
  b: { rl: 0.49, str: 1.7, pow: 2.4, rip: 0.55, wave: 0.16, rim0: 0.35 },
  c: { rl: 0.85, str: 0.9, pow: 2.2, rip: 0.28, wave: 0.42, rim0: 0.1 },
};
export const B_R_SCALE = 1.0;

export const RIP_DRIFT = 1.1;

export const RING_WOBBLE: [number, number, number][] = [
  [3, 0.010, 1.3],
  [7, 0.007, -2.1],
  [11, 0.005, 3.7],
];
export const RING_STROKE = 0.008;
export const RING_THIN = 0.35;
export const RING_BOIL_FPS = 12;

export const SCENE_SECONDS = 5;

export const DISPERSE = 0.016;

export const POINTER_PULL = 0.72;
export const POINTER_EASE = 6.0;
export const POINTER_IN = 0.22;
export const POINTER_OUT = 0.5;

export const TEX_SS = 2;

