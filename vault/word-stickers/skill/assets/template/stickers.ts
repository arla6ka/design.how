// Word stickers (https://design.how/vault/word-stickers), stickers.ts.
// FIXED. Change the VARIABLE values in params instead (STICKERS, GRAB_SCALE, THROW_SCALE, FRICTION, BOUNCE, PEEL_ELEVATION).
export interface StickerDef {
  word: string;
  font: string;
  weight: number;
  fill: string;
  outline: string;
  x: number;
  y: number;
  rot: number;
}

export const FONT_VAR = "--visual-pixel";
const FONT = `var(${FONT_VAR})`;

export const STICKERS: StickerDef[] = [
  { word: "wow", font: FONT, weight: 400, outline: "#ff2e6e", fill: "#2b0b4f", x: 0.17, y: 0.28, rot: 0 },
  { word: "design", font: FONT, weight: 400, outline: "#7c4dff", fill: "#eaff5a", x: 0.66, y: 0.24, rot: 0 },
  { word: "vault", font: FONT, weight: 400, outline: "#00b3a4", fill: "#ff3d6e", x: 0.82, y: 0.7, rot: 0 },
  { word: "yes!", font: FONT, weight: 400, outline: "#ff7a1a", fill: "#0a2f6b", x: 0.3, y: 0.74, rot: 0 },
  { word: "hello", font: FONT, weight: 400, outline: "#ffd21e", fill: "#c81e5b", x: 0.52, y: 0.55, rot: 0 },
  { word: "ship it", font: FONT, weight: 400, outline: "#1668ff", fill: "#7dffb0", x: 0.2, y: 0.55, rot: 0 },
];
