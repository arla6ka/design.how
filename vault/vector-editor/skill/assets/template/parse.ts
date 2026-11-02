// Vector editor (https://design.how/vault/vector-editor), parse.ts.
// FIXED. Change the VARIABLE values in params instead (SHAPE, VIEW_BOX, SHAPE_W, PAD, FRAME, GROUND).
import type { Anchor, Vec, VectorPath } from "./types";
import { v, subRange } from "./types";

function tokenize(d: string): { cmd: string; args: number[] }[] {
  const out: { cmd: string; args: number[] }[] = [];
  const re = /([MmLlHhVvCcSsQqTtAaZz])|(-?\d*\.?\d+(?:e[-+]?\d+)?)/gi;
  let m: RegExpExecArray | null;
  let cur: { cmd: string; args: number[] } | null = null;
  while ((m = re.exec(d))) {
    if (m[1]) {
      cur = { cmd: m[1], args: [] };
      out.push(cur);
    } else if (cur) {
      cur.args.push(parseFloat(m[2]));
    }
  }
  return out;
}

export function parsePath(d: string): VectorPath {
  const tokens = tokenize(d);
  const anchors: Anchor[] = [];
  const starts: number[] = [];
  const closed: boolean[] = [];

  let cur: Vec = v(0, 0);
  let start: Vec = v(0, 0);
  let prevCtrl: Vec | null = null;
  let prevCmd = "";

  const push = (p: Vec) => anchors.push({ p, out: null, in: null });
  const last = () => anchors[anchors.length - 1];

  const dedupClose = () => {
    if (!starts.length) return;
    const si = starts[starts.length - 1];
    if (anchors.length - si > 1) {
      const a = anchors[si].p;
      const z = anchors[anchors.length - 1].p;
      if (Math.abs(a.x - z.x) < 0.01 && Math.abs(a.y - z.y) < 0.01) {
        anchors[si].in = anchors[anchors.length - 1].in;
        anchors.pop();
      }
    }
  };

  for (const { cmd, args } of tokens) {
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    let i = 0;
    const num = () => args[i++];
    const pt = (): Vec => {
      const x = num();
      const y = num();
      return rel ? { x: cur.x + x, y: cur.y + y } : { x, y };
    };

    switch (C) {
      case "M": {
        if (starts.length && closed[closed.length - 1]) dedupClose();
        cur = pt();
        start = cur;
        starts.push(anchors.length);
        closed.push(false);
        push(cur);
        while (i < args.length) {
          cur = pt();
          push(cur);
        }
        prevCtrl = null;
        break;
      }
      case "L": {
        while (i < args.length) { cur = pt(); push(cur); }
        prevCtrl = null;
        break;
      }
      case "H": {
        while (i < args.length) {
          const x = num();
          cur = { x: rel ? cur.x + x : x, y: cur.y };
          push(cur);
        }
        prevCtrl = null;
        break;
      }
      case "V": {
        while (i < args.length) {
          const y = num();
          cur = { x: cur.x, y: rel ? cur.y + y : y };
          push(cur);
        }
        prevCtrl = null;
        break;
      }
      case "C": {
        while (i < args.length) {
          const c1 = pt();
          const c2 = pt();
          const end = pt();
          last().out = c1;
          push(end);
          last().in = c2;
          cur = end;
          prevCtrl = c2;
        }
        break;
      }
      case "S": {
        while (i < args.length) {
          const c1: Vec =
            prevCmd === "C" || prevCmd === "S"
              ? { x: 2 * cur.x - (prevCtrl?.x ?? cur.x), y: 2 * cur.y - (prevCtrl?.y ?? cur.y) }
              : cur;
          const c2 = pt();
          const end = pt();
          last().out = c1;
          push(end);
          last().in = c2;
          cur = end;
          prevCtrl = c2;
        }
        break;
      }
      case "Q": {
        while (i < args.length) {
          const qc = pt();
          const end = pt();
          const c1 = { x: cur.x + (2 / 3) * (qc.x - cur.x), y: cur.y + (2 / 3) * (qc.y - cur.y) };
          const c2 = { x: end.x + (2 / 3) * (qc.x - end.x), y: end.y + (2 / 3) * (qc.y - end.y) };
          last().out = c1;
          push(end);
          last().in = c2;
          cur = end;
          prevCtrl = qc;
        }
        break;
      }
      case "T": {
        while (i < args.length) {
          const qc: Vec =
            prevCmd === "Q" || prevCmd === "T"
              ? { x: 2 * cur.x - (prevCtrl?.x ?? cur.x), y: 2 * cur.y - (prevCtrl?.y ?? cur.y) }
              : cur;
          const end = pt();
          const c1 = { x: cur.x + (2 / 3) * (qc.x - cur.x), y: cur.y + (2 / 3) * (qc.y - cur.y) };
          const c2 = { x: end.x + (2 / 3) * (qc.x - end.x), y: end.y + (2 / 3) * (qc.y - end.y) };
          last().out = c1;
          push(end);
          last().in = c2;
          cur = end;
          prevCtrl = qc;
        }
        break;
      }
      case "Z": {
        if (closed.length) closed[closed.length - 1] = true;
        cur = start;
        prevCtrl = null;
        break;
      }
      case "A":
        throw new Error("Arc commands (A) aren't supported by the point editor.");
      default:
        throw new Error(`Unsupported path command: ${cmd}`);
    }
    prevCmd = C;
  }

  if (starts.length && closed[closed.length - 1]) dedupClose();

  return { anchors, starts, closed };
}

const n = (x: number) => {
  const r = Math.round(x * 100) / 100;
  return String(r);
};

export function serializePath(path: VectorPath): string {
  const { anchors, starts, closed } = path;
  if (!anchors.length || !starts.length) return "";
  const parts: string[] = [];

  for (let s = 0; s < starts.length; s++) {
    const [begin, end] = subRange(path, s);
    const count = end - begin;
    if (count === 0) continue;
    const isClosed = closed[s];

    parts.push(`M ${n(anchors[begin].p.x)} ${n(anchors[begin].p.y)}`);
    const segCount = isClosed ? count : count - 1;
    for (let k = 0; k < segCount; k++) {
      const a = anchors[begin + k];
      const b = anchors[begin + ((k + 1) % count)];
      if (a.out || b.in) {
        const c1 = a.out ?? a.p;
        const c2 = b.in ?? b.p;
        parts.push(`C ${n(c1.x)} ${n(c1.y)} ${n(c2.x)} ${n(c2.y)} ${n(b.p.x)} ${n(b.p.y)}`);
      } else {
        parts.push(`L ${n(b.p.x)} ${n(b.p.y)}`);
      }
    }
    if (isClosed) parts.push("Z");
  }
  return parts.join(" ");
}

export function bounds(path: VectorPath): { x: number; y: number; w: number; h: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const eat = (p: Vec) => {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  };
  for (const a of path.anchors) {
    eat(a.p);
    if (a.in) eat(a.in);
    if (a.out) eat(a.out);
  }
  if (!isFinite(minX)) return { x: 0, y: 0, w: 0, h: 0 };
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}
