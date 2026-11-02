// Loud burst (https://design.how/vault/loud-burst), params.ts.
// VARIABLE: SENTENCES, PAPER, INK, BODY_TINT, FPS, FLECK_COUNT, FONT_CSS. Change these freely. Everything else here is FIXED: it is the effect, so changing it makes a different visual.
export const TICKS = 51;

export const FPS = 34;

export const PAPER = "#fdfdfd";

export const INK = "#1b1b1b";

export interface Theme {
  inks: string[];
  body: string;
  burst: string;
}

export interface SentenceSpec {
  words: string[];
  burst: number;
  theme: Theme;
}

export const SENTENCES: SentenceSpec[] = [
  {
    words: ["make", "it", "bold", "then", "ship"],
    burst: 2,
    theme: {
      inks: ["#ff665e", "#ff6c2f", "#0078bf", "#765ba7"],
      body: "#0078bf",
      burst: "#ff665e",
    },
  },
  {
    words: ["good", "design", "shouts", "then", "leaves"],
    burst: 2,
    theme: {
      inks: ["#ff48b0", "#ff6c2f", "#00a95c", "#00838a"],
      body: "#00838a",
      burst: "#ff48b0",
    },
  },
  {
    words: ["break", "the", "grid", "then", "go"],
    burst: 2,
    theme: {
      inks: ["#0078bf", "#00838a", "#765ba7", "#3255a4"],
      body: "#3255a4",
      burst: "#765ba7",
    },
  },
  {
    words: ["sketch", "it", "loud", "then", "erase"],
    burst: 2,
    theme: {
      inks: ["#914e72", "#ff665e", "#ffb511", "#ff6c2f"],
      body: "#914e72",
      burst: "#ffb511",
    },
  },
];

export const BODY_TINT = 0.45;

export const ARRIVAL_STEP = 2;

export const FONT_FRAC = 0.122;

export const BASELINE_FRAC = 0.541;

export const GAP_EM = 0.17;

export const FONT_CSS = "var(--visual-sans)";
export const FONT_WEIGHT = 600;

export const ARRIVE_SCALE_FIRST = 2.0;
export const ARRIVE_SCALE_REST = 1.35;

export const SCALE_RETAIN = 0.62;

export const THUMP_EXCESS = 0.09;
export const THUMP_STRETCH = 1.045;
export const THUMP_SQUASH = 0.94;

export const SLIDE_EM = 1.0;

export const BLUR_MOST = [3, 1.6, 0.7, 0];
export const BLUR_LAST = [9, 7, 5, 3.2, 1.8, 0.8, 0];

export const RECENTER = [
  0.91, 0.69, 0.36, 0.16, 0.052, -0.011, -0.052, -0.08, -0.092, -0.098,
  -0.103, -0.098, -0.092, -0.086, -0.075, -0.063, -0.052, -0.04, -0.029,
  -0.017, -0.011, -0.006, 0,
];

export const GLIDE_RATE = 1.35;

export const TINT_TICK = 18;
export const TINT_LEN = 6;

export const SHAKE_TICK = 24;
export const SHAKE_END = 37;
export const SHAKE_ROT = 13;
export const SHAKE_DY = 6;
export const SHAKE_DX = 2.5;
export const SHAKE_OMEGA = 1.15;
export const LETTER_DRIFT: [number, number, number][] = [
  [-1.5, 4, -9],
  [-0.5, 1.5, 6],
  [0.5, 4.5, -5],
  [2, 2.5, 11],
];

export const INHALE_TICKS = 3;
export const INHALE_LIFT = 4.5;
export const INHALE_SCALE = 0.055;

export const BURST_TICK = 38;
export const REF_BURST = 44;
export const STROKE_OFFSET = REF_BURST - BURST_TICK;

export const SEG_BANDS = 8;
export const SEG_MAX_PER_LETTER = 16;
export const SEG_MIN_RUN_EM = 0.05;

export const MORPH_LEN = 2.8;
export const MORPH_STAGGER = 0.9;

export const DART_SPIKE_MIN = 0.15;
export const DART_BELLY = 0.7;
export const DART_WOBBLE = 0.12;
export const FINALE_SPIKE = 0.8;

export const SEG_EXIT = 2;

export const SEG_GAP_MUL = 1.4;

export const SLOT_PROG_JIT = 0.06;

export const TRAIL_DT = 0.8;
export const TRAIL_ALPHA = 0.12;

export const RING_TICKS = 3;
export const RING_R0 = 14;
export const RING_V = 42;
export const RING_ALPHA = 0.35;
export const RING_WIDTH = 2.2;

export const ZOOM_MAX = 0.35;
export const ZOOM_EXP = 1.8;

export const THROW_PX = 17;
export const THROW_EXP = 2.5;
export const THROW_BALLISTIC = 1.9;
export const THROW_BALLISTIC_AT = BURST_TICK + 7;

export const WORD_FADE_START = BURST_TICK + 6.5;
export const WORD_FADE_END = BURST_TICK + 8;

export const STREAK_LEN = 90;
export const STREAK_ALPHA = 0.35;
export const STREAK_WIDTH = 1.6;

export const FLECK_COUNT = 14;
export const FLECK_SPD_MIN = 2.5;
export const FLECK_SPD_MAX = 5.5;
export const FLECK_R_MIN = 1.4;
export const FLECK_R_MAX = 3.2;
export const FLECK_DELAY_MAX = 1.5;
export const FLECK_FADE_START = BURST_TICK + 3;
export const FLECK_FADE_LEN = 3;

export const KICK_BASE: [number, number][] = [
  [2.2, -1.4],
  [-1.5, 0.9],
];
export const KICK_JIT = 1.2;
export const KICK_ZOOM = 1.012;

export const STILL_TICK = BURST_TICK + 3;

export const REF_W = 700;
export const REF_H = 392;
export const ORIGIN_X = 358;
export const ORIGIN_Y = 205;

export const SEED = 0x10cd;
