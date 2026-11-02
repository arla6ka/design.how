import { WORDS, FABRIC, type WordPatch } from "./patches";

export type Scene = {
  art: HTMLCanvasElement;
  field: { data: Uint8Array; width: number; height: number };
};

export async function makeScene(
  w: number,
  h: number,
  fontFamily: string,
): Promise<Scene> {
  const W = Math.max(1, Math.round(w));
  const H = Math.max(1, Math.round(h));
  const mk = () => {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    return c;
  };

  const borderPx = Math.max(3, H * 0.018);
  const bevelPx = Math.max(1.5, H * 0.007);

  const cover = mk();
  const coverX = cover.getContext("2d")!;
  const ink = mk();
  const inkX = ink.getContext("2d")!;
  const ring = mk();
  const ringX = ring.getContext("2d")!;
  const dir = mk();
  const dirX = dir.getContext("2d")!;
  const art = mk();
  const artX = art.getContext("2d")!;
  artX.fillStyle = rgb(FABRIC);
  artX.fillRect(0, 0, W, H);

  coverX.globalCompositeOperation = "lighten";
  inkX.globalCompositeOperation = "lighten";
  ringX.globalCompositeOperation = "lighten";

  for (const wp of WORDS) {
    const glyph = mk();
    const gx = glyph.getContext("2d")!;
    drawWord(gx, wp, W, H, fontFamily);

    const sil = mk();
    const sx = sil.getContext("2d")!;
    dilate(sx, glyph, borderPx * 2.1);

    const inner = mk();
    const ix = inner.getContext("2d")!;
    dilate(ix, glyph, borderPx * 1.05);
    const bandC = mk();
    const bx = bandC.getContext("2d")!;
    bx.drawImage(sil, 0, 0);
    bx.globalCompositeOperation = "destination-out";
    bx.drawImage(inner, 0, 0);
    bx.globalCompositeOperation = "source-over";

    const layer = mk();
    const lx = layer.getContext("2d")!;
    lx.drawImage(sil, 0, 0);
    lx.globalCompositeOperation = "source-in";
    lx.fillStyle = rgb(wp.fill);
    lx.fillRect(0, 0, W, H);
    lx.globalCompositeOperation = "source-over";
    paintMasked(lx, bandC, wp.border);
    paintMasked(lx, glyph, wp.ink);
    artX.drawImage(layer, 0, 0);

    coverX.drawImage(sil, 0, 0);
    punchThenAdd(inkX, sil, glyph);
    punchThenAdd(ringX, sil, bandC);
    dirX.drawImage(glyph, 0, 0);
  }

  const puff = mk();
  const px = puff.getContext("2d")!;
  px.filter = `blur(${bevelPx.toFixed(2)}px)`;
  px.drawImage(cover, 0, 0);
  px.filter = "none";

  const gsrc = mk();
  const gx2 = gsrc.getContext("2d")!;
  gx2.filter = `blur(${Math.max(2, H * 0.02).toFixed(2)}px)`;
  gx2.drawImage(dir, 0, 0);
  gx2.filter = "none";
  const rsrc = mk();
  const rx2 = rsrc.getContext("2d")!;
  rx2.filter = `blur(${Math.max(2, H * 0.016).toFixed(2)}px)`;
  rx2.drawImage(cover, 0, 0);
  rx2.filter = "none";

  const cData = px.getImageData(0, 0, W, H).data;
  const iData = inkX.getImageData(0, 0, W, H).data;
  const rData = ringX.getImageData(0, 0, W, H).data;
  const gData = gx2.getImageData(0, 0, W, H).data;
  const rimData = rx2.getImageData(0, 0, W, H).data;
  const p = new Uint8Array(W * H * 4);
  const grad = (a: Uint8ClampedArray, x: number, y: number) => {
    const at = (xx: number, yy: number) => {
      xx = xx < 0 ? 0 : xx >= W ? W - 1 : xx;
      yy = yy < 0 ? 0 : yy >= H ? H - 1 : yy;
      return a[(yy * W + xx) * 4 + 3];
    };
    return [at(x + 1, y) - at(x - 1, y), at(x, y + 1) - at(x, y - 1)] as const;
  };
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const isBorder = rData[i + 3] > 40 && iData[i + 3] < 40;
      const [dx, dy] = isBorder ? grad(rimData, x, y) : grad(gData, x, y);
      let ang = Math.atan2(dy, dx) + Math.PI / 2;
      ang = ((ang % Math.PI) + Math.PI) % Math.PI;
      p[i] = cData[i + 3];
      p[i + 1] = iData[i + 3];
      p[i + 2] = rData[i + 3];
      p[i + 3] = Math.round((ang / Math.PI) * 255);
    }
  }

  return { art, field: { data: p, width: W, height: H } };
}

function rgb(c: [number, number, number]): string {
  const to = (v: number) => Math.round(Math.max(0, Math.min(1, v)) * 255);
  return `rgb(${to(c[0])},${to(c[1])},${to(c[2])})`;
}

function paintMasked(
  ctx: CanvasRenderingContext2D,
  mask: HTMLCanvasElement,
  color: [number, number, number],
) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const t = document.createElement("canvas");
  t.width = W;
  t.height = H;
  const tx = t.getContext("2d")!;
  tx.drawImage(mask, 0, 0);
  tx.globalCompositeOperation = "source-in";
  tx.fillStyle = rgb(color);
  tx.fillRect(0, 0, W, H);
  ctx.drawImage(t, 0, 0);
}

function dilate(
  ctx: CanvasRenderingContext2D,
  src: HTMLCanvasElement,
  r: number,
) {
  const steps = 28;
  for (let s = 1; s >= 0.5; s -= 0.5) {
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      ctx.drawImage(src, Math.cos(a) * r * s, Math.sin(a) * r * s);
    }
  }
  ctx.drawImage(src, 0, 0);
}

function punchThenAdd(
  acc: CanvasRenderingContext2D,
  sil: HTMLCanvasElement,
  add: HTMLCanvasElement,
) {
  acc.globalCompositeOperation = "destination-out";
  acc.drawImage(sil, 0, 0);
  acc.globalCompositeOperation = "lighten";
  acc.drawImage(add, 0, 0);
}

function drawWord(
  ctx: CanvasRenderingContext2D,
  wp: WordPatch,
  W: number,
  H: number,
  fontFamily: string,
) {
  const size = wp.scale * H;
  ctx.save();
  ctx.translate(wp.cx * W, wp.cy * H);
  ctx.rotate((wp.rotDeg * Math.PI) / 180);
  ctx.font = `800 ${size}px ${fontFamily}`;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(wp.word, 0, 0);
  ctx.restore();
}
