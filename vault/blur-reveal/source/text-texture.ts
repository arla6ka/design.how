export interface TextTexture {
  canvas: HTMLCanvasElement;
  cssW: number;
  cssH: number;
}

export interface TextOpts {
  line: string;
  font: string;
  fill: string;
  cardW: number;
  cardH: number;
  dpr?: number;
}

export function renderText(o: TextOpts): TextTexture {
  const dpr = o.dpr ?? Math.min(window.devicePixelRatio || 1, 2);
  const cssW = Math.max(1, Math.round(o.cardW));
  const cssH = Math.max(1, Math.round(o.cardH));

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);

  ctx.fillStyle = o.fill;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const maxW = cssW * 0.86;
  let fontSize = Math.min(58, cssW * 0.1);
  for (let i = 0; i < 24; i++) {
    ctx.font = `500 ${fontSize}px ${o.font}`;
    if (ctx.measureText(o.line).width <= maxW || fontSize <= 16) break;
    fontSize -= 2;
  }
  ctx.fillText(o.line, cssW / 2, cssH / 2);

  return { canvas, cssW, cssH };
}
