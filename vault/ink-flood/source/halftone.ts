export function makeHalftoneTile(
  pitch: number,
  radius: number,
  dpr: number,
): HTMLCanvasElement {
  const side = Math.max(2, Math.round(pitch * Math.SQRT2 * dpr));

  const c = document.createElement("canvas");
  c.width = side;
  c.height = side;
  const g = c.getContext("2d")!;

  g.fillStyle = "#808080";
  g.fillRect(0, 0, side, side);
  g.fillStyle = "#4a4a4a";

  const r = radius * dpr;
  const pts: [number, number][] = [
    [0, 0],
    [side, 0],
    [0, side],
    [side, side],
    [side / 2, side / 2],
  ];
  for (const [x, y] of pts) {
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  return c;
}

export interface HalftoneOptions {
  pitch: number;
  radius: number;
  alpha: number;
}

export const HALFTONE_DEFAULTS: HalftoneOptions = {
  pitch: 5,
  radius: 1.6,
  alpha: 0.12,
};

export function drawHalftone(
  ctx: CanvasRenderingContext2D,
  tile: HTMLCanvasElement,
  W: number,
  H: number,
  dpr: number,
  alpha: number,
) {
  const pattern = ctx.createPattern(tile, "repeat");
  if (!pattern) return;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "overlay";
  ctx.globalAlpha = alpha;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, W * dpr, H * dpr);
  ctx.restore();
}
