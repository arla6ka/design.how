// Typer (https://design.how/vault/typer), presets.ts.
// FIXED. Change the VARIABLE values in params instead (LINES, PRESETS, REPLAY_MS, STAGGER, SIZE_CQW, SIZE_MIN, FONT_VAR).
import { ALL_VARIATIONS } from "./typer";

export interface TyperPreset {
  name: string;
  fg: string;
  bg: string;
  accent: string;
  accentInk: string;
  pool: string[];
  fps: number;
  cycles: number;
}

export const PRESETS: TyperPreset[] = [
  {
    name: "Vapor",
    fg: "#6d5ac2",
    bg: "#e8fff6",
    accent: "#ff6ad5",
    accentInk: "#3a1052",
    pool: ["charAccentInverse", "charAccent", "charAccentFill", "charBorder"],
    fps: 23,
    cycles: 4,
  },
  {
    name: "Signal",
    fg: "#0b160f",
    bg: "#f4faf5",
    accent: "#00d466",
    accentInk: "#04180c",
    pool: [...ALL_VARIATIONS],
    fps: 20,
    cycles: 3,
  },
  {
    name: "Marker",
    fg: "#3a2412",
    bg: "#fdf3df",
    accent: "#ff7a1a",
    accentInk: "#fff8ee",
    pool: ["charAccent", "charAccentInverse", "charBorder", "charFill"],
    fps: 22,
    cycles: 3,
  },
  {
    name: "Punch",
    fg: "#3a0a2e",
    bg: "#ffe9f7",
    accent: "#ff1e8e",
    accentInk: "#fff6c2",
    pool: ["charAccent", "charAccentInverse", "charAccentFill", "charBorder"],
    fps: 24,
    cycles: 4,
  },
  {
    name: "Wire",
    fg: "#8fd4ff",
    bg: "#0a1230",
    accent: "#2f7bff",
    accentInk: "#eaf4ff",
    pool: ["charBorder", "charAccent", "charAccentInverse"],
    fps: 18,
    cycles: 3,
  },
  {
    name: "Glitch",
    fg: "#eef2ff",
    bg: "#070708",
    accent: "#ff2e5e",
    accentInk: "#070708",
    pool: [...ALL_VARIATIONS],
    fps: 34,
    cycles: 6,
  },
  {
    name: "Acid",
    fg: "#e4ffd1",
    bg: "#06120a",
    accent: "#b6ff1a",
    accentInk: "#06120a",
    pool: ["charAccent", "charAccentInverse", "charFill", "charBorder"],
    fps: 26,
    cycles: 4,
  },
  {
    name: "Sunset",
    fg: "#7a2b4e",
    bg: "#fff1e8",
    accent: "#7c3aed",
    accentInk: "#fff1e8",
    pool: ["charAccent", "charAccentInverse", "charBorder", "charFill"],
    fps: 21,
    cycles: 3,
  },
  {
    name: "Gold",
    fg: "#f3e6c4",
    bg: "#0d0b07",
    accent: "#e6b325",
    accentInk: "#0d0b07",
    pool: ["charAccent", "charBorder", "charFill", "charInverse"],
    fps: 18,
    cycles: 3,
  },
  {
    name: "Ocean",
    fg: "#9bebe0",
    bg: "#04262b",
    accent: "#ff7a59",
    accentInk: "#04262b",
    pool: ["charAccent", "charAccentInverse", "charBorder"],
    fps: 22,
    cycles: 4,
  },
  {
    name: "Blueprint",
    fg: "#bfe9ff",
    bg: "#0a1a33",
    accent: "#39c7ff",
    accentInk: "#06254a",
    pool: ["charBorder", "charAccent"],
    fps: 16,
    cycles: 2,
  },
  {
    name: "Ember",
    fg: "#ffd9b3",
    bg: "#140a08",
    accent: "#ff5722",
    accentInk: "#140a08",
    pool: [...ALL_VARIATIONS],
    fps: 30,
    cycles: 5,
  },
  {
    name: "Mono",
    fg: "#111111",
    bg: "#ffffff",
    accent: "#111111",
    accentInk: "#ffffff",
    pool: ["charFill", "charInverse", "charBorder"],
    fps: 20,
    cycles: 2,
  },
];
