// Dot globe (https://design.how/vault/dot-globe), glyphs.ts.
// FIXED. Change the VARIABLE values in params instead (DUOS, GROUND, EXPS, WOBBLE, HOLD_S, SWAP_S, HANDOFF, TURN_EVERY_S, GAP, ROUND).
const N = 11;

const RAW: Record<string, string[]> = {
  arrow: [
    "...##......",
    "....##.....",
    ".....##....",
    "......##...",
    "###########",
    "......##...",
    ".....##....",
    "....##.....",
    "...##......",
    "...........",
    "...........",
  ],
  plus: [
    ".....#.....",
    "....#.#....",
    "...#...#...",
    "..#.....#..",
    ".#.......#.",
    "#.........#",
    ".#.......#.",
    "..#.....#..",
    "...#...#...",
    "....#.#....",
    ".....#.....",
  ],
  cross: [
    "#.........#",
    ".#.......#.",
    "..#.....#..",
    "...#...#...",
    "....#.#....",
    ".....#.....",
    "....#.#....",
    "...#...#...",
    "..#.....#..",
    ".#.......#.",
    "#.........#",
  ],
  chevron: [
    "..#....#...",
    "...#....#..",
    "....#....#.",
    ".....#....#",
    "......#....",
    ".....#....#",
    "....#....#.",
    "...#....#..",
    "..#....#...",
    "...........",
    "...........",
  ],
  slash: [
    ".......###.",
    "......###..",
    ".....###...",
    "....###....",
    "...###.....",
    "..###......",
    ".###.......",
    "###........",
    "##.........",
    "...........",
    "...........",
  ],
  square: [
    "..#######..",
    "..#.....#..",
    "..#.....#..",
    "..#.....#..",
    "..#.....#..",
    "..#.....#..",
    "..#.....#..",
    "..#.....#..",
    "..#######..",
    "...........",
    "...........",
  ],
};

export const NAMES = Object.keys(RAW);

const MASKS: Record<string, boolean[]> = {};
for (const [k, rows] of Object.entries(RAW)) {
  const m = new Array<boolean>(N * N).fill(false);
  rows.forEach((line, row) => {
    for (let col = 0; col < Math.min(N, line.length); col++) {
      m[row * N + col] = line[col] === "#";
    }
  });
  MASKS[k] = m;
}

export const GRID = N;

export function lit(name: string, col: number, row: number): boolean {
  const m = MASKS[name];
  if (!m) return false;
  return m[row * N + col] === true;
}
