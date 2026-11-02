export const PLAY_RATE = 1.15;
export const FRAME_MS = 100 / 3 / PLAY_RATE;
export const FRAMES = 176;
export const LOOP_MS = FRAMES * FRAME_MS;
export const STILL_FRAME = 0;

export const SCENE_W = 1080;
export const SCENE_H = 810;

export const GROUND = "#171a3a";
export const INK = "#ffd76a";

export const FONT_VAR = "--visual-sans";
export const FONT_WEIGHT = 600;
export const FONT_SIZE = 197.2;
export const CAP = 141;

export const WORDS = ["Letterform", "Alignments", "Hierarchies", "Kerning"] as const;
export const ROW = [203, 470, 735, 469] as const;
export const SLOTS = 11;

export const PENS: readonly (readonly number[])[] = [[64.4, 171.7, 281.3, 345.8, 412.3, 523.7, 596.9, 659.2, 773.9, 847.1, 0], [32.9, 169.8, 215.7, 261.7, 375.6, 487.4, 655.9, 767.3, 878.1, 946.7, 0], [28.6, 168.6, 214.6, 326.0, 396.0, 504.2, 574.1, 681.7, 793.6, 839.5, 950.9], [193.4, 318.4, 429.9, 503.0, 614.8, 660.8, 772.6, 0, 0, 0, 0]];
export const ADV: readonly (readonly number[])[] = [[111.8, 111.4, 68.6, 68.6, 111.4, 73.2, 64.5, 114.8, 73.2, 168.4, 0], [136.9, 46.0, 46.0, 114.0, 111.8, 168.4, 111.4, 111.8, 68.6, 100.4, 0], [142.0, 46.0, 111.4, 73.2, 108.3, 73.2, 107.7, 111.8, 46.0, 111.4, 100.4], [132.7, 111.4, 73.2, 111.8, 46.0, 111.8, 114.0, 0, 0, 0, 0]];

export interface Letter {
  cIn?: number;
  land?: number;
  show?: number;
  flipsIn?: string;
  leave?: number;
  cOut?: number;
  hide?: number;
  flipAt?: number;
  flipsOut?: string;
}

export const LETTERS: readonly (readonly (Letter | null)[])[] = [
  [
    { cIn: 142.5, land: 164, show: 144, leave: 12, cOut: 32, hide: 31 },
    { cIn: 141, land: 160.5, show: 142, leave: 11.5, cOut: 29, hide: 29, flipsIn: "aa" },
    { cIn: 139, land: 161.5, show: 140, leave: 7, cOut: 27, hide: 27 },
    { cIn: 137, land: 159, show: 137, leave: 4, cOut: 24, hide: 22 },
    { cIn: 135, land: 155.5, show: 138, leave: 1.5, cOut: 20, hide: 20, flipsIn: "vvuu" },
    { cIn: 137, land: 159, show: 140, leave: 4, cOut: 24, hide: 22 },
    { cIn: 138, land: 160, show: 142, leave: 5.5, cOut: 25.5, hide: 24 },
    { cIn: 139, land: 161, show: 143, leave: 7, cOut: 27, hide: 27, flipsIn: "ddrr" },
    { cIn: 141, land: 163, show: 144, leave: 9, cOut: 29, hide: 30 },
    { cIn: 142, land: 165.5, show: 146, leave: 11.5, cOut: 32, hide: 33, flipsIn: "ssee" },
    null,
  ],
  [
    { cIn: 32, land: 53, show: 35, leave: 53, cOut: 72, hide: 74 },
    { cIn: 30, land: 47.5, show: 31, leave: 47.5, cOut: 69.5, hide: 70 },
    { cIn: 27.5, land: 44.5, show: 29, leave: 44.5, cOut: 67.5, hide: 67, flipAt: 63, flipsIn: "jjll", flipsOut: "lllj" },
    { cIn: 24, land: 47, show: 24, leave: 47, cOut: 64.5, hide: 65 },
    { cIn: 22, land: 41.5, show: 20, leave: 41.5, cOut: 62.5, hide: 63, flipAt: 59, flipsIn: "ssee", flipsOut: "hhhd" },
    { cIn: 20, land: 42.5, show: 22, leave: 42.5, cOut: 60, hide: 61 },
    { cIn: 24, land: 45.5, show: 25, leave: 45.5, cOut: 63.5, hide: 65, flipsIn: "ffee" },
    { cIn: 27, land: 48, show: 27, leave: 48, cOut: 66, hide: 67, flipAt: 60, flipsIn: "hhrr", flipsOut: "cccnnff" },
    { cIn: 30, land: 52.5, show: 33, leave: 52.5, cOut: 68.5, hide: 70 },
    { cIn: 31.5, land: 53, show: 35, leave: 53, cOut: 70.5, hide: 72, flipAt: 64, flipsOut: "cccbbbbb" },
    null,
  ],
  [
    { cIn: 69, land: 89, show: 74, leave: 89, cOut: 105.5, hide: 106 },
    { cIn: 66, land: 85, show: 70, leave: 85, cOut: 102.5, hide: 99 },
    { cIn: 63.5, land: 81, show: 67, leave: 81, cOut: 100, hide: 101 },
    { cIn: 61, land: 78, show: 65, leave: 78, cOut: 98, hide: 99, flipsIn: "ll" },
    { cIn: 60, land: 74.5, show: 64, leave: 74.5, cOut: 96, hide: 97 },
    { cIn: 57.5, land: 73, show: 63, leave: 73, cOut: 94, hide: 95 },
    { cIn: 56.5, land: 73.5, show: 61, leave: 73.5, cOut: 93, hide: 96, flipsIn: "ss" },
    { cIn: 58, land: 75.5, show: 65, leave: 75.5, cOut: 95, hide: 99 },
    { cIn: 62.5, land: 79, show: 67, leave: 79, cOut: 98.5, hide: 103, flipsIn: "ljjj" },
    { cIn: 65.5, land: 84, show: 71, leave: 84, cOut: 102, hide: 103 },
    { cIn: 69, land: 87.5, show: 72, leave: 87.5, cOut: 105, hide: 104 },
  ],
  [
    { cIn: 99, land: 119, show: 104, leave: 119, cOut: 141, hide: 144 },
    { cIn: 97.5, land: 116, show: 101, leave: 116, cOut: 139.5, hide: 142 },
    { cIn: 95, land: 114, show: 99, leave: 114, cOut: 137.5, hide: 140 },
    { cIn: 93, land: 113, show: 97, leave: 113, cOut: 135, hide: 137 },
    { cIn: 95, land: 115, show: 99, leave: 115, cOut: 136.5, hide: 137 },
    { cIn: 97, land: 120.5, show: 101, leave: 120.5, cOut: 138.5, hide: 140 },
    { cIn: 99, land: 118, show: 103, leave: 118, cOut: 140.5, hide: 141 },
    null,
    null,
    null,
    null,
  ],
];

export const BREATH = { px: 3, frames: 8 } as const;
export const BOUNCE = { px: 5, tau: 3.2, period: 9 } as const;
export function letterScale(slot: number, word: number): number {
  return 0.75 + ((slot * 5 + word * 3) % 7) / 12;
}
export function breath(t: number, scale: number): number {
  if (t <= 0 || t >= BREATH.frames) return 0;
  return -BREATH.px * scale * Math.sin((Math.PI * t) / BREATH.frames);
}
export function bounce(t: number, scale: number): number {
  if (t <= 0) return 0;
  return BOUNCE.px * scale * Math.exp(-t / BOUNCE.tau) * Math.sin((2 * Math.PI * t) / BOUNCE.period);
}

export function bez(s: number): number {
  const c = Math.min(Math.max(s, 0), 1);
  const t = 0.5 + Math.cbrt((c - 0.5) / 4);
  return 3 * t * t - 2 * t * t * t;
}

export interface Glyph {
  slot: number;
  word: number;
  glyph: string;
  x: number;
  y: number;
}

export interface Poke {
  slot: number;
  word: number;
  at: number;
  seq: string;
}
export const POKE = { hold: 2, glyphs: 2, cooldown: 18 } as const;

const LOWER = "abcdefghijklmnopqrstuvwxyz";
function hash(a: number, b: number): number {
  let h = (a * 374761393 + b * 668265263) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}
export function pokeSeq(slot: number, frame: number, own: string): string {
  let s = "";
  for (let k = 0; k < POKE.glyphs; k++) {
    let g = LOWER[hash(slot * 7 + k, frame) % 26];
    if (g === own.toLowerCase()) g = LOWER[(LOWER.indexOf(g) + 1) % 26];
    s += own === own.toUpperCase() ? g.toUpperCase() : g;
  }
  return s;
}

const REST = 100;

export function lettersAt(frame: number, pokes: readonly Poke[] = []): Glyph[] {
  const f = ((Math.floor(frame) % FRAMES) + FRAMES) % FRAMES;
  const out: Glyph[] = [];
  for (let w = 0; w < WORDS.length; w++) {
    const word = WORDS[w];
    const prev = (w + WORDS.length - 1) % WORDS.length;
    const next = (w + 1) % WORDS.length;
    for (let i = 0; i < SLOTS; i++) {
      const own = i < word.length ? word[i] : " ";
      const L = LETTERS[w][i];
      if (own === " " || !L) continue;
      const fin = w === 0 && f < REST ? f + FRAMES : f;
      const fx = w === 0 && f >= REST ? f - FRAMES : f;
      const shown = L.show === undefined || fin >= L.show;
      const gone = L.hide !== undefined && fx >= L.hide;
      const visible = w === 0 ? (L.show !== undefined && f >= L.show) || (L.hide !== undefined && f < L.hide) : shown && !gone;
      if (!visible) continue;
      let y = ROW[w];
      const scale = letterScale(i, w);
      if (L.cIn !== undefined && L.land !== undefined) {
        const half = L.land - L.cIn;
        const travel = ROW[w] - ROW[prev];
        y -= travel * (1 - bez((fin - (L.cIn - half)) / (2 * half)));
        y += Math.sign(travel) * bounce(fin - L.land, scale);
      }
      if (L.leave !== undefined && L.cOut !== undefined) {
        const half = L.cOut - L.leave;
        const travel = ROW[next] - ROW[w];
        y += travel * bez((fx - L.leave) / (2 * half));
        y += Math.sign(travel) * breath(fx - L.leave, scale);
      }
      let glyph = own;
      if (L.flipsIn && L.show !== undefined) {
        const k = fin - L.show;
        if (k >= 0 && k < L.flipsIn.length) glyph = L.flipsIn[k];
      }
      if (L.flipsOut && L.flipAt !== undefined) {
        const k = fx - L.flipAt;
        if (k >= 0) glyph = L.flipsOut[Math.min(k, L.flipsOut.length - 1)];
      }
      for (const p of pokes) {
        if (p.slot !== i || p.word !== w) continue;
        const k = ((f - p.at + FRAMES) % FRAMES);
        if (k < POKE.hold * p.seq.length) glyph = p.seq[Math.floor(k / POKE.hold)];
      }
      if (glyph === ".") continue;
      out.push({ slot: i, word: w, glyph, x: PENS[w][i], y });
    }
  }
  return out;
}

export function resting(g: Glyph): boolean {
  const word = WORDS[g.word];
  return g.glyph === word[g.slot] && Math.abs(g.y - ROW[g.word]) < 1;
}
