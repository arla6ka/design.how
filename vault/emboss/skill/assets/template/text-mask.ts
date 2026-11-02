// Realistic emboss (https://design.how/vault/emboss), text-mask.ts.
// FIXED. Change the VARIABLE values in params instead (STYLES, REST_ANGLE, GRUNGE_AMT, BUILTIN_SVGS).
export const PANELS: { x0: number; x1: number }[] = [
  { x0: 0.02, x1: 0.333 },
  { x0: 0.347, x1: 0.653 },
  { x0: 0.667, x1: 0.98 },
];

export type PanelContent = { word: string; svg: string | null };

export async function makeHeightField(
  panels: PanelContent[],
  blurPx: number[],
  w: number,
  h: number,
  fontFamily: string,
): Promise<HTMLCanvasElement> {
  const W = Math.max(1, Math.round(w));
  const H = Math.max(1, Math.round(h));

  const out = document.createElement("canvas");
  out.width = W;
  out.height = H;
  const ox = out.getContext("2d")!;

  const crispC = document.createElement("canvas");
  crispC.width = W;
  crispC.height = H;
  const crispX = crispC.getContext("2d")!;
  const softC = document.createElement("canvas");
  softC.width = W;
  softC.height = H;
  const softX = softC.getContext("2d")!;

  const measure = out.getContext("2d")!;
  let fontSize = H * 0.2;
  for (let i = 0; i < PANELS.length; i++) {
    const word = panels[i]?.word ?? "";
    if (!word) continue;
    const pw = (PANELS[i].x1 - PANELS[i].x0) * W;
    const maxW = pw - pw * 0.1 * 2;
    measure.font = `800 ${fontSize}px ${fontFamily}`;
    const wWidth = measure.measureText(word).width;
    if (wWidth > maxW) fontSize *= maxW / wWidth;
  }

  const scratch = document.createElement("canvas");
  scratch.width = W;
  scratch.height = H;
  const scx = scratch.getContext("2d")!;
  const blurC = document.createElement("canvas");
  blurC.width = W;
  blurC.height = H;
  const blx = blurC.getContext("2d")!;

  crispX.globalCompositeOperation = "lighten";
  softX.globalCompositeOperation = "lighten";
  for (let i = 0; i < PANELS.length; i++) {
    const panel = panels[i];
    if (!panel || (!panel.word && !panel.svg)) continue;
    scx.clearRect(0, 0, W, H);
    if (panel.svg) {
      await drawSvgInPanel(scx, panel.svg, W, H, PANELS[i]);
    } else {
      drawWordInPanel(scx, panel.word, W, H, PANELS[i], fontFamily, fontSize);
    }
    crispX.drawImage(scratch, 0, 0);
    blx.clearRect(0, 0, W, H);
    blx.filter = `blur(${Math.max(0.5, blurPx[i] ?? 2).toFixed(2)}px)`;
    blx.drawImage(scratch, 0, 0);
    blx.filter = "none";
    softX.drawImage(blurC, 0, 0);
  }

  const cData = crispX.getImageData(0, 0, W, H).data;
  const sData = softX.getImageData(0, 0, W, H).data;
  const packed = ox.createImageData(W, H);
  const p = packed.data;
  for (let i = 0; i < p.length; i += 4) {
    p[i] = cData[i + 3];
    p[i + 1] = sData[i + 3];
    p[i + 2] = 0;
    p[i + 3] = 255;
  }
  ox.putImageData(packed, 0, 0);
  return out;
}

async function drawSvgInPanel(
  ctx: CanvasRenderingContext2D,
  svg: string,
  W: number,
  H: number,
  panel: { x0: number; x1: number },
): Promise<void> {
  const forced = svg.replace(
    /<svg([^>]*)>/i,
    `<svg$1><style>*{fill:#fff!important;stroke:#fff!important}</style>`,
  );
  const url = URL.createObjectURL(new Blob([forced], { type: "image/svg+xml" }));
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = rej;
      im.src = url;
    });
    const pw = (panel.x1 - panel.x0) * W;
    const cx = (panel.x0 + panel.x1) / 2 * W;
    const cy = H / 2;
    const size = Math.min(pw * 0.62, H * 0.44);
    const ar = img.width / Math.max(1, img.height);
    let dh = size;
    let dw = size * ar;
    if (dw > pw * 0.68) { dw = pw * 0.68; dh = dw / ar; }
    ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
  } catch {
  } finally {
    URL.revokeObjectURL(url);
  }
}

function drawWordInPanel(
  ctx: CanvasRenderingContext2D,
  word: string,
  W: number,
  H: number,
  panel: { x0: number; x1: number },
  fontFamily: string,
  size: number,
) {
  const text = word;
  const px0 = panel.x0 * W;
  const px1 = panel.x1 * W;
  const cx = (px0 + px1) / 2;
  const cy = H / 2;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `800 ${size}px ${fontFamily}`;
  ctx.fillStyle = "#fff";
  const ls = size * 0.01;
  const widths = [...text].map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + ls * (text.length - 1);
  let x = cx - total / 2;
  ctx.textAlign = "left";
  for (let j = 0; j < text.length; j++) {
    ctx.fillText(text[j], x, cy);
    x += widths[j] + ls;
  }
}
