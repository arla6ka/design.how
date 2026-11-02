export type SpineSample = readonly [x: number, y: number, r: number, frame: number];

export type TipSample = readonly [x: number, y: number, r: number];

export type EaseName =
  | "linear"
  | "measured"
  | "expoOut"
  | "expoIn"
  | "quintInOut"
  | "sineInOut"
  | "drift"
  | "surge";

export interface Palette {
  fields: readonly [string, string];
  dot: string;
  accent?: string;
}

export interface FloodSpec {
  at: number;
  end: number;
  scale: readonly number[];
  swell: readonly number[];
  ease: EaseName;
}

export interface SparkSpec {
  offset: readonly [number, number];
  popAt: number;
  pop: readonly number[];
  radius: number;
  diverge: readonly number[];
  shrinkAt: number;
  shrink: readonly number[];
  ease: EaseName;
}

export interface Scene {
  id: string;
  name: string;
  ref: number;
  fps: number;
  half: number;
  palette: Palette;
  spine: readonly SpineSample[];
  tip?: readonly TipSample[];
  tipAt: number;
  flood: FloodSpec;
  sparks?: SparkSpec;
  restAt: number;
}
