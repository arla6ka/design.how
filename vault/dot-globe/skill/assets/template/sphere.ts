// Dot globe (https://design.how/vault/dot-globe), sphere.ts.
// FIXED. Change the VARIABLE values in params instead (DUOS, GROUND, EXPS, WOBBLE, HOLD_S, SWAP_S, HANDOFF, TURN_EVERY_S, GAP, ROUND).
export interface Tile {
  quad: number[];
  z: number;
  ux: number;
  uy: number;
  uz: number;
  col: number;
  row: number;
}

export interface Projection {
  n: number;
  span: number;
  r: number;
  cx: number;
  cy: number;
  spin: number;
  tilt: number;
  gap: number;
  exp: number;
}

export function project(p: Projection): Tile[] {
  const out: Tile[] = [];
  const step = (p.span * 2) / p.n;
  const inset = step * p.gap * 0.5;

  const st = Math.sin(p.tilt);
  const ct = Math.cos(p.tilt);

  for (let row = 0; row < p.n; row++) {
    for (let col = 0; col < p.n; col++) {
      const lon0 = -p.span + col * step + inset + p.spin;
      const lon1 = lon0 + step - inset * 2;
      const lat0 = -p.span + row * step + inset;
      const lat1 = lat0 + step - inset * 2;

      const clat = (lat0 + lat1) * 0.5;
      const clon = (lon0 + lon1) * 0.5;
      const z = depth(clon, clat, st, ct, p.exp);
      if (z <= 0.02) continue;

      const quad = [
        ...toScreen(lon0, lat0, p, st, ct),
        ...toScreen(lon1, lat0, p, st, ct),
        ...toScreen(lon1, lat1, p, st, ct),
        ...toScreen(lon0, lat1, p, st, ct),
      ];

      const [ux0, uy0, uz0] = surface(clon, clat, p.exp);

      out.push({
        quad,
        z,
        ux: ux0,
        uy: uy0 * ct + uz0 * st,
        uz: z,
        col,
        row,
      });
    }
  }

  out.sort((a, b) => a.z - b.z);
  return out;
}

function sp(v: number, e: number): number {
  const a = Math.abs(v);
  const r = Math.pow(a, e);
  return v < 0 ? -r : r;
}

function surface(lon: number, lat: number, e: number): [number, number, number] {
  const cl = sp(Math.cos(lat), e);
  return [cl * sp(Math.sin(lon), e), sp(Math.sin(lat), e), cl * sp(Math.cos(lon), e)];
}

function depth(
  lon: number,
  lat: number,
  st: number,
  ct: number,
  e: number,
): number {
  const [, y, z] = surface(lon, lat, e);
  return z * ct - y * st;
}

function toScreen(
  lon: number,
  lat: number,
  p: Projection,
  st: number,
  ct: number,
): [number, number] {
  const [x, y, z] = surface(lon, lat, p.exp);

  const yt = y * ct + z * st;

  return [p.cx + x * p.r, p.cy + yt * p.r];
}
