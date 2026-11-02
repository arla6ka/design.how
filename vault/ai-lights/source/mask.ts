import {capDpr} from './runtime/dispose';
import type {MaskStop} from './params';

export type MaskOptions = {
  width: number;
  height: number;
  radius: number;
  strokeWidth: number;
  blur: number;
  alpha?: number;
  stops: MaskStop[];
  ring?: number;
};

let scratch: HTMLCanvasElement | null = null;
const cache = new Map<string, string>();
const CACHE_MAX = 24;

export function padOf(strokeWidth: number, blur: number): number {
  return Math.ceil(strokeWidth + blur * 3);
}

export function buildMask(o: MaskOptions): string {
  if (typeof document === 'undefined') return '';
  const key = [Math.round(o.width), Math.round(o.height), Math.round(o.radius), o.strokeWidth, o.blur, o.alpha ?? 1, o.ring ?? 0, o.stops.map(s => `${s.color}@${s.stop}`).join(',')].join('|');
  const hit = cache.get(key);
  if (hit !== undefined) return hit;

  const k = capDpr(1);
  const pad = padOf(o.strokeWidth, o.blur);
  const w = Math.max(1, Math.ceil(o.width) + pad * 2);
  const h = Math.max(1, Math.ceil(o.height) + pad * 2);
  if (!scratch) scratch = document.createElement('canvas');
  const c = scratch;
  c.width = Math.ceil(w * k);
  c.height = Math.ceil(h * k);
  const ctx = c.getContext('2d');
  if (!ctx) return '';
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.clearRect(0, 0, w, h);
  if (o.blur) ctx.filter = `blur(${'GestureEvent' in window ? o.blur * 0.25 : o.blur}px)`;
  const g = ctx.createConicGradient(0, w / 2, h / 2);
  for (const s of o.stops) g.addColorStop(s.stop / 360, s.color);
  ctx.strokeStyle = g;
  ctx.fillStyle = g;
  if (o.alpha != null) ctx.globalAlpha = o.alpha;

  const x = (w - o.width) / 2;
  const y = (h - o.height) / 2;
  ctx.beginPath();
  ctx.roundRect(x, y, o.width, o.height, Math.max(0, Math.min(o.radius, o.width / 2, o.height / 2)));
  if (o.strokeWidth) {
    ctx.lineWidth = o.strokeWidth;
    ctx.stroke();
  } else {
    ctx.fill();
    if (o.ring) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = 1;
      ctx.filter = 'none';
      const r2 = Math.max(0, Math.min(o.radius - o.ring, (o.width - o.ring * 2) / 2, (o.height - o.ring * 2) / 2));
      ctx.beginPath();
      ctx.roundRect(x + o.ring, y + o.ring, Math.max(0, o.width - o.ring * 2), Math.max(0, o.height - o.ring * 2), r2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
  }
  const url = c.toDataURL('image/png');
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, url);
  return url;
}
