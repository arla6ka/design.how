// Brick reveal (https://design.how/vault/brick-reveal), scene.ts.
// FIXED. Change the VARIABLE values in params instead (STYLES, STYLE_HOLD, STYLE_FADE, TRAIL_SIZE, TRAIL_SIZE_AUTO, scene()).
export const SIZE = 640;

function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas(size = SIZE): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  return [c, c.getContext("2d", { willReadFrequently: true })!];
}

function ridge(x: number, base: number, amp: number, seed: number): number {
  return base
    - amp * (0.55 * Math.sin(x * 5.1 + seed) + 0.3 * Math.sin(x * 11.7 + seed * 2.3) + 0.15 * Math.sin(x * 23.9 + seed * 0.7))
    - amp * 0.9 * Math.max(0, 1 - Math.abs(x - 0.38 - seed * 0.02) * 3.2);
}

function paintLand(ctx: CanvasRenderingContext2D, S: number, horizon: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, "#22305e");
  sky.addColorStop(0.45, "#6a4f8a");
  sky.addColorStop(0.78, "#e7845a");
  sky.addColorStop(1, "#f7cf86");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, S, horizon);

  const sx = S * 0.64, sy = horizon * 0.74, sr = S * 0.065;
  const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr * 5);
  halo.addColorStop(0, "rgba(255,236,190,0.85)");
  halo.addColorStop(0.25, "rgba(255,200,130,0.35)");
  halo.addColorStop(1, "rgba(255,160,90,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, S, horizon);
  ctx.fillStyle = "#fff1cf";
  ctx.beginPath();
  ctx.arc(sx, sy, sr, 0, Math.PI * 2);
  ctx.fill();

  const range = (base: number, amp: number, seed: number, top: string, bottom: string) => {
    const g = ctx.createLinearGradient(0, base - amp * 2, 0, horizon);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, horizon);
    for (let i = 0; i <= 160; i++) {
      const x = i / 160;
      ctx.lineTo(x * S, ridge(x, base, amp, seed));
    }
    ctx.lineTo(S, horizon);
    ctx.closePath();
    ctx.fill();
  };
  range(horizon * 0.8, S * 0.11, 1.3, "#8d7bb0", "#c98e86");
  range(horizon * 0.93, S * 0.075, 4.1, "#3d3f6b", "#5a4a6e");
}

export function scene(): HTMLCanvasElement {
  const S = SIZE;
  const [c, ctx] = canvas();
  const horizon = Math.round(S * 0.6);
  const rand = seeded(11);

  paintLand(ctx, S, horizon);

  const [land, lx] = canvas();
  paintLand(lx, S, horizon);
  for (let y = horizon; y < S; y += 2) {
    const depth = (y - horizon) / (S - horizon);
    const src = horizon - (y - horizon) * 1.05;
    const wob = Math.sin(y * 0.35) * (2 + depth * 9) + (rand() - 0.5) * 3;
    ctx.globalAlpha = 1;
    ctx.drawImage(land, 0, Math.max(0, src), S, 2, wob, y, S, 2);
  }
  const water = ctx.createLinearGradient(0, horizon, 0, S);
  water.addColorStop(0, "rgba(20,24,56,0.25)");
  water.addColorStop(1, "rgba(10,14,34,0.75)");
  ctx.fillStyle = water;
  ctx.fillRect(0, horizon, S, S - horizon);
  for (let i = 0; i < 220; i++) {
    const y = horizon + 4 + rand() * (S - horizon) * 0.8;
    const spread = 6 + (y - horizon) * 0.35;
    const x = S * 0.64 + (rand() - 0.5) * spread * 2;
    ctx.fillStyle = `rgba(255,${200 + rand() * 40},${140 + rand() * 60},${0.35 + rand() * 0.4})`;
    ctx.fillRect(x, y, 3 + rand() * 9, 1.5);
  }

  ctx.fillStyle = "#14211d";
  ctx.beginPath();
  ctx.moveTo(0, S);
  ctx.lineTo(0, S * 0.7);
  ctx.bezierCurveTo(S * 0.18, S * 0.69, S * 0.32, S * 0.8, S * 0.46, S);
  ctx.closePath();
  ctx.fill();
  const pine = (x: number, base: number, h: number) => {
    ctx.fillStyle = "#0f1a17";
    ctx.fillRect(x - h * 0.03, base - h * 0.2, h * 0.06, h * 0.22);
    for (let k = 0; k < 4; k++) {
      const w = h * (0.34 - k * 0.07);
      const top = base - h * (0.25 + k * 0.22) - h * 0.2;
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x - w, top + h * 0.34);
      ctx.lineTo(x + w, top + h * 0.34);
      ctx.closePath();
      ctx.fill();
    }
  };
  pine(S * 0.06, S * 0.74, S * 0.3);
  pine(S * 0.15, S * 0.76, S * 0.22);
  pine(S * 0.24, S * 0.8, S * 0.17);

  const img = ctx.getImageData(0, 0, S, S);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (rand() - 0.5) * 14;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function cells(src: HTMLCanvasElement, n: number): Uint8ClampedArray {
  const [, ctx] = canvas(n);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, 0, 0, n, n);
  return ctx.getImageData(0, 0, n, n).data;
}

const rgb = (r: number, g: number, b: number, k = 1) => `rgb(${Math.min(255, r * k) | 0},${Math.min(255, g * k) | 0},${Math.min(255, b * k) | 0})`;

export function bricks(src: HTMLCanvasElement, n = 32): HTMLCanvasElement {
  const S = SIZE;
  const [c, ctx] = canvas();
  const px = cells(src, n);
  const cs = S / n;
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, S, S);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const k = (j * n + i) * 4;
    let r = px[k], g = px[k + 1], b = px[k + 2];
    const m = (r + g + b) / 3;
    r = m + (r - m) * 1.35; g = m + (g - m) * 1.35; b = m + (b - m) * 1.35;
    const x = i * cs, y = j * cs;
    ctx.fillStyle = rgb(r, g, b, 0.82);
    ctx.fillRect(x, y, cs, cs);
    ctx.fillStyle = rgb(r, g, b);
    ctx.fillRect(x + 1, y + 1, cs - 2.5, cs - 2.5);
    const cx = x + cs / 2, cy = y + cs / 2, sr = cs * 0.3;
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath(); ctx.arc(cx + cs * 0.06, cy + cs * 0.08, sr, 0, Math.PI * 2); ctx.fill();
    const lit = ctx.createRadialGradient(cx - sr * 0.45, cy - sr * 0.45, sr * 0.1, cx, cy, sr);
    lit.addColorStop(0, rgb(r, g, b, 1.45));
    lit.addColorStop(1, rgb(r, g, b, 0.95));
    ctx.fillStyle = lit;
    ctx.beginPath(); ctx.arc(cx, cy, sr, 0, Math.PI * 2); ctx.fill();
  }
  return c;
}

export function blocks(src: HTMLCanvasElement, n = 40): HTMLCanvasElement {
  const S = SIZE;
  const [c, ctx] = canvas();
  const px = cells(src, n);
  const cs = S / n;
  const q = (v: number) => Math.round((v / 255) * 5) * 51;
  const rand = seeded(5);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const k = (j * n + i) * 4;
    const r = q(px[k]), g = q(px[k + 1]), b = q(px[k + 2]);
    const x = i * cs, y = j * cs;
    const sub = cs / 4;
    for (let v = 0; v < 4; v++) for (let u = 0; u < 4; u++) {
      ctx.fillStyle = rgb(r, g, b, 0.9 + rand() * 0.2);
      ctx.fillRect(x + u * sub, y + v * sub, sub + 0.5, sub + 0.5);
    }
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(x, y, cs, 2);
    ctx.fillRect(x, y, 2, cs);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(x, y + cs - 2, cs, 2);
    ctx.fillRect(x + cs - 2, y, 2, cs);
  }
  return c;
}

export function toon(src: HTMLCanvasElement): HTMLCanvasElement {
  const S = SIZE;
  const [c, ctx] = canvas();
  ctx.filter = "blur(3px)";
  ctx.drawImage(src, 0, 0);
  ctx.filter = "none";
  const img = ctx.getImageData(0, 0, S, S);
  const d = img.data;
  const level = new Uint8Array(S * S);
  for (let p = 0, i = 0; i < d.length; i += 4, p++) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const l = (r * 0.3 + g * 0.59 + b * 0.11) / 255;
    const step = Math.min(4, Math.floor(l * 5));
    const target = (step + 0.6) / 5;
    const k = target / Math.max(0.04, l);
    const m = (r + g + b) / 3;
    d[i] = Math.min(255, (m + (r - m) * 1.5) * k);
    d[i + 1] = Math.min(255, (m + (g - m) * 1.5) * k);
    d[i + 2] = Math.min(255, (m + (b - m) * 1.5) * k);
    level[p] = step;
  }
  for (let y = 1; y < S - 1; y++) for (let x = 1; x < S - 1; x++) {
    const p = y * S + x;
    if (level[p] !== level[p + 1] || level[p] !== level[p + S]) {
      const i = p * 4;
      d[i] = 24; d[i + 1] = 18; d[i + 2] = 30;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}
