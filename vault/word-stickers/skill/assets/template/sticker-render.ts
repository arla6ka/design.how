// Word stickers (https://design.how/vault/word-stickers), sticker-render.ts.
// FIXED. Change the VARIABLE values in params instead (STICKERS, GRAB_SCALE, THROW_SCALE, FRICTION, BOUNCE, PEEL_ELEVATION).
export interface RenderedSticker {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

export interface RenderOpts {
  word: string;
  font: string;
  weight: number;
  fill: string;
  outline: string;
  fontSizePx: number;
  border?: number;
  dpr?: number;
}

export function renderSticker(opts: RenderOpts): RenderedSticker {
  const dpr = opts.dpr ?? Math.min(window.devicePixelRatio || 1, 2);
  const size = opts.fontSizePx;
  const border = opts.border ?? Math.max(6, Math.round(size * 0.16));
  const fontStr = `${opts.weight} ${size}px ${opts.font}`;

  const meas = document.createElement("canvas").getContext("2d")!;
  meas.font = fontStr;
  const m = meas.measureText(opts.word);
  const ascent = m.actualBoundingBoxAscent || size * 0.8;
  const descent = m.actualBoundingBoxDescent || size * 0.2;
  const textW = m.width;
  const textH = ascent + descent;

  const pad = border + 4;
  const cssW = Math.ceil(textW + pad * 2);
  const cssH = Math.ceil(textH + pad * 2);

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(cssW * dpr);
  canvas.height = Math.ceil(cssH * dpr);
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);
  ctx.textBaseline = "alphabetic";
  ctx.font = fontStr;

  const bx = pad;
  const by = pad + ascent;

  const base = document.createElement("canvas");
  base.width = canvas.width;
  base.height = canvas.height;
  const bctx = base.getContext("2d")!;
  bctx.scale(dpr, dpr);
  bctx.font = fontStr;
  bctx.textBaseline = "alphabetic";
  bctx.fillStyle = opts.outline;
  for (let r = border; r > 0.5; r -= 1) {
    const stamps = Math.max(16, Math.ceil(r * 3));
    for (let a = 0; a < stamps; a++) {
      const ang = (a / stamps) * Math.PI * 2;
      bctx.fillText(opts.word, bx + Math.cos(ang) * r, by + Math.sin(ang) * r);
    }
  }
  bctx.fillText(opts.word, bx, by);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(base, 0, 0);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.fillStyle = opts.fill;
  ctx.font = fontStr;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(opts.word, bx, by);

  return { canvas, width: cssW, height: cssH };
}
