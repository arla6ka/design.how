// Liquid metal (https://design.how/vault/liquid-metal), text-mask.ts.
// FIXED. Change the VARIABLE values in params instead (WORD, RAMPS, DEFAULT_RAMP, FONT_CSS, FONT_WEIGHT).
import { FONT_WEIGHT as WEIGHT } from "./params";

export async function makeMetalField(
  word: string,
  blurPx: number,
  w: number,
  h: number,
  fontFamily: string,
): Promise<HTMLCanvasElement> {
  const W = Math.max(1, Math.round(w));
  const H = Math.max(1, Math.round(h));

  const crisp = document.createElement("canvas");
  crisp.width = W;
  crisp.height = H;
  const cx = crisp.getContext("2d")!;

  const text = (word || "").trim();
  if (text) {
    let size = H * 0.56;
    cx.font = `${WEIGHT} ${size}px ${fontFamily}`;
    const maxW = W * 0.82;
    const measured = cx.measureText(text).width;
    if (measured > maxW) {
      size *= maxW / measured;
      cx.font = `${WEIGHT} ${size}px ${fontFamily}`;
    }
    cx.fillStyle = "#fff";
    cx.textAlign = "center";
    cx.textBaseline = "middle";
    const ls = size * -0.05;
    const chars = [...text];
    const widths = chars.map((c) => cx.measureText(c).width);
    const total = widths.reduce((a, b) => a + b, 0) + ls * (chars.length - 1);
    let x = W / 2 - total / 2;
    cx.textAlign = "left";
    for (let i = 0; i < chars.length; i++) {
      cx.fillText(chars[i], x, H * 0.5);
      x += widths[i] + ls;
    }
  }

  const wide = blurTo(crisp, W, H, Math.max(0.5, blurPx * 1.15));
  const tight = blurTo(crisp, W, H, Math.max(0.5, blurPx * 0.4));

  const cData = cx.getImageData(0, 0, W, H).data;
  const wData = wide.getContext("2d")!.getImageData(0, 0, W, H).data;
  const tData = tight.getContext("2d")!.getImageData(0, 0, W, H).data;
  const out = document.createElement("canvas");
  out.width = W;
  out.height = H;
  const ox = out.getContext("2d")!;
  const packed = ox.createImageData(W, H);
  const p = packed.data;
  for (let i = 0; i < p.length; i += 4) {
    p[i] = cData[i + 3];
    p[i + 1] = wData[i + 3];
    p[i + 2] = tData[i + 3];
    p[i + 3] = 255;
  }
  ox.putImageData(packed, 0, 0);
  return out;
}

function blurTo(
  src: HTMLCanvasElement,
  W: number,
  H: number,
  px: number,
): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const x = c.getContext("2d")!;
  x.filter = `blur(${px.toFixed(2)}px)`;
  x.drawImage(src, 0, 0);
  x.filter = "none";
  return c;
}
