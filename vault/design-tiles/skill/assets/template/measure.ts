// Design tiles (https://design.how/vault/design-tiles), measure.ts.
// FIXED. Change the VARIABLE values in params instead (WORDS, SWATCHES, INITIAL, SHUFFLE_MIN, SHUFFLE_MAX, FLY_STAGGER, FLY_MS, WORD_HEIGHT, FONT_STACK).
import {capDpr} from './runtime/dispose';

export const REF_FS = 100;
export const BASELINE_Y = 130;

export type GlyphBox = {
  ch: string;
  x: number;
  w: number;
  top: number;
  bottom: number;
};

export type WordMetrics = {
  glyphs: GlyphBox[];
  width: number;
  fontSize: number;
};

let cv: HTMLCanvasElement | null = null;

export function measureWord(text: string, fontFamily: string, weight = "500"): WordMetrics | null {
  if (typeof document === "undefined") return null;

  if (!cv) cv = document.createElement("canvas");
  const pad = 40;
  const cellW = REF_FS * 2;
  const cellH = REF_FS * 2 + pad * 2;
  const k = capDpr();
  const pw = Math.ceil(cellW * k);
  const ph = Math.ceil(cellH * k);
  cv.width = pw;
  cv.height = ph;
  const ctx = cv.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.setTransform(k, 0, 0, k, 0, 0);

  const font = `${weight} ${REF_FS}px ${fontFamily}`;
  const baseY = REF_FS + pad;
  const glyphX = pad;

  ctx.font = font;
  ctx.textBaseline = "alphabetic";

  const advances: number[] = [];
  let cursor = 0;
  for (const ch of text) {
    const w = ctx.measureText(ch).width;
    advances.push(w);
    cursor += w;
  }
  const totalWidth = cursor;

  const glyphs: GlyphBox[] = [];
  let anyPainted = false;
  let x = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const adv = advances[i];
    if (ch === " ") {
      glyphs.push({ ch, x, w: adv, top: BASELINE_Y, bottom: BASELINE_Y });
      x += adv;
      continue;
    }

    ctx.clearRect(0, 0, cellW, cellH);
    ctx.fillStyle = "#000";
    ctx.font = font;
    ctx.textBaseline = "alphabetic";
    ctx.fillText(ch, glyphX, baseY);
    const data = ctx.getImageData(0, 0, pw, ph).data;

    let topPx = -1;
    let bottomPx = -1;
    for (let y = 0; y < ph; y++) {
      let has = false;
      const row = y * pw;
      for (let px = 0; px < pw; px++) {
        if (data[(row + px) * 4 + 3] > 12) {
          has = true;
          break;
        }
      }
      if (has) {
        if (topPx < 0) topPx = y / k;
        bottomPx = y / k;
      }
    }

    if (topPx < 0) {
      glyphs.push({ ch, x, w: adv, top: BASELINE_Y - REF_FS * 0.5, bottom: BASELINE_Y });
    } else {
      anyPainted = true;
      const top = BASELINE_Y + (topPx - baseY);
      const bottom = BASELINE_Y + (bottomPx - baseY);
      glyphs.push({ ch, x, w: adv, top, bottom });
    }
    x += adv;
  }

  if (!anyPainted || totalWidth < 1) return null;
  return { glyphs, width: totalWidth, fontSize: REF_FS };
}
