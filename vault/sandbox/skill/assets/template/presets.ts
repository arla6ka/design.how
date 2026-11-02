// Symbols effect (https://design.how/vault/sandbox), presets.ts.
// FIXED. Change the VARIABLE values in params instead (PRESETS, GLYPHS, CELL, CYCLE_MS, bandStops).
export interface SandboxPreset {
  name: string;
  video: string;
  colors: [string, string, string, string];
  glyphs: [number, number, number, number];
  zoom?: number;
}

export const isImagePreset = (p: SandboxPreset) =>
  /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(p.video);

export const PRESETS: SandboxPreset[] = [
  {
    name: "Cobalt",
    video: "/videos-glyph/Confident Life Notes for Busy Days.mp4",
    colors: ["#241452", "#6d3bf5", "#a9c2ff", "#ffffff"],
    glyphs: [4, 2, 1, 0],
  },
  {
    name: "Ember",
    video: "/videos-glyph/Trending Meal Prep Recipes.mp4",
    colors: ["#fff7ed", "#ffc24b", "#f0531f", "#5c160a"],
    glyphs: [0, 1, 9, 3],
    zoom: 0.66,
  },
  {
    name: "Reef",
    video: "/videos-glyph/Dreamy Wellness Habit Ideas.mp4",
    colors: ["#06302f", "#0fb5ad", "#7fe8d6", "#ffffff"],
    glyphs: [6, 10, 2, 0],
  },
  {
    name: "Bloom",
    video: "/videos-glyph/Creative Sewing Room Tips.mp4",
    colors: ["#127a4a", "#ff2e63", "#ffd23f", "#fdeef5"],
    glyphs: [12, 1, 9, 0],
  },
  {
    name: "Forest",
    video: "/videos-glyph/Nature Escape Ideas for Fall.mp4",
    colors: ["#ffffff", "#cdeaa0", "#5fa83a", "#16401f"],
    glyphs: [0, 16, 9, 12],
    zoom: 0.8,
  },
  {
    name: "Coral",
    video: "/videos-glyph/Cat Enrichment Roundup.mp4",
    colors: ["#fff4ef", "#ffc4a3", "#ff6b4a", "#7a2415"],
    glyphs: [0, 1, 14, 2],
  },
  {
    name: "Basil",
    video: "/videos-glyph/Fresh Meal Prep Recipes Inspiration.mp4",
    colors: ["#ffffff", "#dff06a", "#84b521", "#26350c"],
    glyphs: [0, 2, 10, 3],
    zoom: 0.67,
  },
];
