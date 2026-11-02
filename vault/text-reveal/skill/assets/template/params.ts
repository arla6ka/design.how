// Text reveal (https://design.how/vault/text-reveal), params.ts.
// VARIABLE: TEXT_PAIRS, BG, INK, EDGE, HOLD_MS, K_IN, K_OUT, DAMP, MAX_BLUR, PARALLAX_AMP, WASH_SECONDS, FONT_CSS, FONT_WEIGHT. Change these freely. Everything else here is FIXED: it is the effect, so changing it makes a different visual.
export const TEXT_PAIRS: { top: string[]; bottom: string[] }[] = [
  {
    top: ["The text fades in on its own,", "one corner at a time."],
    bottom: ["Then it clears the same way,", "and quietly starts over."],
  },
  {
    top: ["Type can move like weather,", "rolling in from an edge."],
    bottom: ["It gathers, holds for a beat,", "then rolls back out again."],
  },
  {
    top: ["Small things, done really well,", "read as calm, not loud."],
    bottom: ["Motion with a clear direction", "always feels intentional."],
  },
];

export const BG = "#fdfdfb";
export const INK = "#242320";
export const EDGE = "#f2f1ec";

export const FONT_CSS = "var(--visual-display), Georgia, serif";
export const FONT_WEIGHT = 500;

export const WHITE_WASH = [
  "radial-gradient(55% 75% at 18% 12%, rgba(255,255,255,0.95), transparent 60%)",
  "radial-gradient(48% 66% at 82% 22%, rgba(255,255,255,0.80), transparent 62%)",
  "radial-gradient(65% 55% at 50% 0%,  rgba(255,255,255,0.70), transparent 55%)",
  "radial-gradient(42% 52% at 8% 85%,  rgba(255,255,255,0.75), transparent 60%)",
  "radial-gradient(52% 60% at 92% 88%, rgba(255,255,255,0.65), transparent 62%)",
  "radial-gradient(38% 38% at 65% 55%, rgba(255,255,255,0.55), transparent 70%)",
  "radial-gradient(85% 46% at 50% 100%,rgba(255,255,255,0.55), transparent 55%)",
  "radial-gradient(28% 28% at 30% 45%, rgba(255,255,255,0.45), transparent 72%)",
].join(", ");
export const WASH_SECONDS = 48;

export const GRAIN_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='140' height='140' filter='url(%23n)' opacity='0.5'/></svg>`,
  );

export const HOLD_MS = 320;
export const OUT_HOLD_MS = 80;
export const MAX_BLUR = 16;
export const K_IN = 16;
export const K_OUT = 22;
export const DAMP = 1.12;
export const REVEALED_AT = 0.95;
export const GONE_AT = 0.02;
export const PARALLAX_AMP = 0.006;
export const TL_ANCHOR: [number, number] = [0.16, 0.18];
export const BR_ANCHOR: [number, number] = [0.84, 0.82];
