// Ransom note (https://design.how/vault/ransom-note), compose.ts.
// FIXED. Change the VARIABLE values in params instead (PHRASES, JITTER, PAPERS, FACES, REVEAL_HOLD, GROUND).
import {FACES, JITTER, PAPERS} from './params';

export type Jitter = {rot: number; dy: number; scale: number; gap: number};

export type Scrap = {
  paper: string;
  ink: string;
  family: string;
  weight: number;
  italic: boolean;
  upper: boolean;
  outline: boolean;
  cut: string;
  padX: number;
  padY: number;
};

export type Placed =
  | {kind: 'space'; ch: string}
  | {kind: 'glyph'; ch: string; scrap: Scrap; rot: number; dy: number; scale: number; mx: number};

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function cutFor(rnd: () => number): string {
  const j = (max: number) => (rnd() * max).toFixed(1);
  const points = [
    `${j(10)}% ${j(12)}%`, `${(100 - +j(10)).toFixed(1)}% ${j(8)}%`,
    `${(100 - +j(6)).toFixed(1)}% ${(100 - +j(12)).toFixed(1)}%`, `${j(8)}% ${(100 - +j(8)).toFixed(1)}%`,
  ];
  if (rnd() < 0.4) points.splice(1, 0, `${(40 + rnd() * 20).toFixed(1)}% ${j(6)}%`);
  if (rnd() < 0.3) points.splice(-1, 0, `${(30 + rnd() * 40).toFixed(1)}% ${(100 - +j(5)).toFixed(1)}%`);
  return `polygon(${points.join(', ')})`;
}

function scrapFor(rnd: () => number): Scrap {
  const pick = <T,>(list: readonly T[]) => list[Math.floor(rnd() * list.length)];
  const paper = pick(PAPERS);
  const face = pick(FACES);
  return {
    paper: paper.paper,
    ink: pick(paper.inks),
    family: face.family,
    weight: pick(face.weights),
    italic: !!face.italic && rnd() < 0.6,
    upper: rnd() < 0.7,
    outline: rnd() < 0.08,
    cut: cutFor(rnd),
    padX: 0.06 + rnd() * 0.12,
    padY: 0.02 + rnd() * 0.08,
  };
}

export function composeLine(text: string, seed: number, jitter: Jitter = JITTER): Placed[] {
  const rnd = mulberry32(seed);
  return [...text].map(ch => {
    if (/\s/.test(ch)) return {kind: 'space', ch};
    return {
      kind: 'glyph', ch, scrap: scrapFor(rnd),
      rot: (rnd() * 2 - 1) * jitter.rot,
      dy: (rnd() * 2 - 1) * jitter.dy,
      scale: 1 + (rnd() * 2 - 1) * jitter.scale,
      mx: rnd() * jitter.gap,
    };
  });
}
