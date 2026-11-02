// Vector editor (https://design.how/vault/vector-editor), types.ts.
// FIXED. Change the VARIABLE values in params instead (SHAPE, VIEW_BOX, SHAPE_W, PAD, FRAME, GROUND).
export interface Vec {
  x: number;
  y: number;
}

export interface Anchor {
  p: Vec;
  out: Vec | null;
  in: Vec | null;
}

export interface VectorPath {
  anchors: Anchor[];
  starts: number[];
  closed: boolean[];
}

export const v = (x: number, y: number): Vec => ({ x, y });
export const add = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: Vec, b: Vec): Vec => ({ x: a.x - b.x, y: a.y - b.y });
export const dist = (a: Vec, b: Vec): number => Math.hypot(a.x - b.x, a.y - b.y);

export function subRange(path: VectorPath, s: number): [number, number] {
  const begin = path.starts[s];
  const end = s + 1 < path.starts.length ? path.starts[s + 1] : path.anchors.length;
  return [begin, end];
}
