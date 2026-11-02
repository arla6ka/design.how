export const ANCHOR_Y = 0.42;

export function makeWordMask(
  word: string,
  w: number,
  h: number,
  fontFamily: string,
): HTMLCanvasElement {
  const W = Math.max(1, Math.round(w));
  const H = Math.max(1, Math.round(h));

  const out = document.createElement("canvas");
  out.width = W;
  out.height = H;
  const ctx = out.getContext("2d")!;
  ctx.clearRect(0, 0, W, H);

  const text = (word || "").trim();
  if (!text) return out;

  let size = H * 0.34;
  ctx.font = `400 ${size}px ${fontFamily}`;
  const maxW = W * 0.72;
  const measured = ctx.measureText(text).width;
  if (measured > maxW) {
    size *= maxW / measured;
    ctx.font = `400 ${size}px ${fontFamily}`;
  }

  const m = ctx.measureText(text);
  const asc = m.actualBoundingBoxAscent || size * 0.75;
  const desc = m.actualBoundingBoxDescent || size * 0.25;
  const inkMid = (asc - desc) / 2;

  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, W / 2, H * ANCHOR_Y + inkMid);

  return out;
}

export function measureWord(word: string, fontFamily: string): number {
  const probe = document.createElement("canvas").getContext("2d");
  if (!probe) return 0;
  probe.font = `400 100px ${fontFamily}`;
  return Math.round(probe.measureText(word).width);
}
