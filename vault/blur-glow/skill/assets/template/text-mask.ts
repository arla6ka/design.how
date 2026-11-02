// Blur glow (https://design.how/vault/blur-glow), text-mask.ts.
// FIXED. Change the VARIABLE values in params instead (WORDS, PALETTES, HOLD_MS, HOLD_SCALE, MORPH_SEC, LETTER_SPREAD, GRAIN, WARP_AMP, WARP_RADIUS).
export interface WordMask {
  canvas: HTMLCanvasElement;
  x0: number;
  x1: number;
}

export function makeWordMask(
  word: string,
  w: number,
  h: number,
  fontFamily: string,
): WordMask {
  const W = Math.max(1, Math.round(w));
  const H = Math.max(1, Math.round(h));

  const out = document.createElement("canvas");
  out.width = W;
  out.height = H;
  const ctx = out.getContext("2d")!;
  ctx.clearRect(0, 0, W, H);

  const text = (word || "").trim();
  if (!text) return { canvas: out, x0: 0.45, x1: 0.55 };

  const cx = W / 2;
  const cy = H * 0.52;
  const maxW = W * 0.66;
  const LOCK = H * 0.34;

  let size = LOCK;
  ctx.font = `600 ${size}px ${fontFamily}`;
  let measured = ctx.measureText(text).width;
  if (measured > maxW) {
    size *= maxW / measured;
    ctx.font = `600 ${size}px ${fontFamily}`;
    measured = ctx.measureText(text).width;
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  const ls = size * 0.015;
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + ls * (chars.length - 1);
  let x = cx - total / 2;
  const left = x;
  const last = Math.max(1, chars.length - 1);
  for (let i = 0; i < chars.length; i++) {
    const idx = i / last;
    ctx.fillStyle = `rgba(${Math.round(idx * 255)}, 0, 0, 1)`;
    ctx.fillText(chars[i], x, cy);
    x += widths[i] + ls;
  }
  return { canvas: out, x0: left / W, x1: (left + total) / W };
}
