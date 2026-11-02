export type WordPatch = {
  word: string;
  cx: number;
  cy: number;
  scale: number;
  rotDeg: number;
  fill: [number, number, number];
  ink: [number, number, number];
  border: [number, number, number];
  stitchDeg: number;
};

export const WORDS: WordPatch[] = [
  {
    word: "made",
    cx: 0.44, cy: 0.29, scale: 0.32, rotDeg: -4,
    fill: [0.42, 0.62, 0.92],
    ink: [0.09, 0.09, 0.1],
    border: [0.97, 0.97, 0.98],
    stitchDeg: 70,
  },
  {
    word: "with",
    cx: 0.6, cy: 0.51, scale: 0.28, rotDeg: 3,
    fill: [0.96, 0.82, 0.36],
    ink: [0.09, 0.09, 0.1],
    border: [0.98, 0.98, 0.96],
    stitchDeg: 20,
  },
  {
    word: "love",
    cx: 0.48, cy: 0.72, scale: 0.34, rotDeg: -2,
    fill: [0.9, 0.62, 0.82],
    ink: [0.09, 0.09, 0.1],
    border: [0.98, 0.97, 0.98],
    stitchDeg: 100,
  },
];

export const FABRIC: [number, number, number] = [0.16, 0.13, 0.2];
