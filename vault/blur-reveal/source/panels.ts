export interface Panel {
  line: string;
  bg: string;
  fg: string;
}

export const PANELS: Panel[] = [
  { line: "make it obvious", bg: "#0b3d3a", fg: "#f7c948" },
  { line: "then make it fast", bg: "#ff4d4d", fg: "#fff0e6" },
  { line: "sweat the details", bg: "#1b1440", fg: "#a78bfa" },
  { line: "ship it anyway", bg: "#f2e9d8", fg: "#c2410c" },
  { line: "keep it honest", bg: "#0891b2", fg: "#fef9c3" },
  { line: "cut what is dull", bg: "#18181b", fg: "#f472b6" },
];
