// Pixel threshold (https://design.how/vault/pixel-threshold), text-mask.ts.
// FIXED. Change the VARIABLE values in params instead (SEQUENCE, COLORWAYS, DEFAULTS.threshold, FINE, COARSE, HOLD_MS, COLLAPSE_MS, RESOLVE_MS, DEFAULTS.halo, DEFAULTS.keyline, DEFAULTS.keylineOffset, DEFAULTS.texture, FONT_CSS, FONT_WEIGHT).
import { FONT_WEIGHT as WEIGHT } from "./params";

export interface FieldOpts {
  word: string;
  cols: number;
  halo: number;
  keyline: number;
  keylineOffset: [number, number];
  italic: boolean;
  w: number;
  h: number;
  fontFamily: string;
}

function dilate(
  src: Uint8Array,
  cols: number,
  rows: number,
  cells: number,
): Uint8Array {
  let cur = src;
  for (let pass = 0; pass < cells; pass++) {
    const out = new Uint8Array(cols * rows);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        if (cur[i]) {
          out[i] = 1;
          continue;
        }
        if (
          (x > 0 && cur[i - 1]) ||
          (x < cols - 1 && cur[i + 1]) ||
          (y > 0 && cur[i - cols]) ||
          (y < rows - 1 && cur[i + cols])
        ) {
          out[i] = 1;
        }
      }
    }
    cur = out;
  }
  return cur;
}

export function makeThresholdField(o: FieldOpts): HTMLCanvasElement {
  const W = Math.max(1, Math.round(o.w));
  const H = Math.max(1, Math.round(o.h));

  const cols = Math.max(24, Math.round(o.cols));
  const rows = Math.max(8, Math.round(cols * (H / W)));

  const low = document.createElement("canvas");
  low.width = cols;
  low.height = rows;
  const lx = low.getContext("2d", { willReadFrequently: true })!;
  lx.clearRect(0, 0, cols, rows);

  const text = (o.word || "").trim();
  if (text) {
    const pad = o.keyline + 2;
    let size = rows * 0.46;
    const fit = (s: number) => {
      lx.font = `${o.italic ? "italic " : ""}${WEIGHT} ${s}px ${o.fontFamily}`;
      return lx.measureText(text).width;
    };
    const maxW = (cols - pad * 2) * 0.72;
    if (fit(size) > maxW) size *= maxW / fit(size);
    lx.font = `${o.italic ? "italic " : ""}${WEIGHT} ${size}px ${o.fontFamily}`;
    lx.fillStyle = "#fff";
    lx.textAlign = "center";
    lx.textBaseline = "middle";
    lx.fillText(text, cols / 2, rows * 0.5);
  }

  const src = lx.getImageData(0, 0, cols, rows).data;
  const face = new Uint8Array(cols * rows);
  for (let i = 0, c = 0; i < src.length; i += 4, c++) {
    face[c] = src[i + 3] > 127 ? 1 : 0;
  }

  const halo = dilate(face, cols, rows, o.halo);
  const keyGrown = dilate(face, cols, rows, o.keyline);
  const [odx, ody] = o.keylineOffset;
  const key =
    odx === 0 && ody === 0
      ? keyGrown
      : (() => {
          const out = new Uint8Array(cols * rows);
          for (let y = 0; y < rows; y++) {
            const sy = y - ody;
            if (sy < 0 || sy >= rows) continue;
            for (let x = 0; x < cols; x++) {
              const sx = x - odx;
              if (sx < 0 || sx >= cols) continue;
              out[y * cols + x] = keyGrown[sy * cols + sx];
            }
          }
          for (let i = 0; i < out.length; i++) if (keyGrown[i]) out[i] = 1;
          return out;
        })();

  const packLow = document.createElement("canvas");
  packLow.width = cols;
  packLow.height = rows;
  const px = packLow.getContext("2d")!;
  const img = px.createImageData(cols, rows);
  for (let c = 0; c < cols * rows; c++) {
    img.data[c * 4] = face[c] ? 255 : 0;
    img.data[c * 4 + 1] = halo[c] ? 255 : 0;
    img.data[c * 4 + 2] = key[c] ? 255 : 0;
    img.data[c * 4 + 3] = 255;
  }
  px.putImageData(img, 0, 0);

  const out = document.createElement("canvas");
  out.width = W;
  out.height = H;
  const ox = out.getContext("2d")!;
  ox.imageSmoothingEnabled = false;
  ox.drawImage(packLow, 0, 0, W, H);
  return out;
}
