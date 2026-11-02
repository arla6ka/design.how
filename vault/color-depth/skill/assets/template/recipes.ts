// Colour depth (https://design.how/vault/color-depth), recipes.ts.
// FIXED. Change the VARIABLE values in params instead (SHOWCASE, RECIPES, LABEL, GROUND, DESIGN_WIDTH).
export interface Recipe {
  id: string;
  name: string;
  className: string;
  note: string;
  backdrop: "light" | "dark" | "color";
}

export const RECIPES: Recipe[] = [
  {
    id: "glossy",
    name: "Glossy",
    className: "depth-glossy",
    note: "A specular highlight bar over a gradient body, the classic glassy pill.",
    backdrop: "light",
  },
  {
    id: "glow",
    name: "Glow",
    className: "depth-glow",
    note: "A solid body lit from inside; hover turns the inner glow up, no specular.",
    backdrop: "dark",
  },
  {
    id: "metal",
    name: "Metal",
    className: "depth-metal",
    note: "A brushed surface with a bevel and a glint that follows the cursor.",
    backdrop: "light",
  },
  {
    id: "foil",
    name: "Foil",
    className: "depth-foil",
    note: "Iridescent holographic metal: stacked light layers that shift and glare under the cursor.",
    backdrop: "dark",
  },
  {
    id: "layered",
    name: "Layered",
    className: "depth-layered",
    note: "Soft translucent overlays over any fill: a gentle dome, a top sheen, a clean hairline rim.",
    backdrop: "light",
  },
  {
    id: "inset",
    name: "Inset",
    className: "depth-inset",
    note: "Recessed into the surface: the bevel is flipped and there's no drop shadow.",
    backdrop: "light",
  },
  {
    id: "glass",
    name: "Glass",
    className: "depth-glass",
    note: "Real refraction: an SVG displacement filter gently bends the background at its edges.",
    backdrop: "color",
  },
  {
    id: "tube",
    name: "Tube",
    className: "depth-tube",
    note: "A crisp lit outline: one clean bright ring with just a whisper of glow, firming on hover.",
    backdrop: "dark",
  },
  {
    id: "duotone",
    name: "Duotone",
    className: "depth-duotone",
    note: "A hard-bevel extruded key built from stacked 1px shadows; it slams down on press.",
    backdrop: "light",
  },
  {
    id: "satin",
    name: "Satin",
    className: "depth-satin",
    note: "A single flat pastel with the softest possible dome. No gradient, no specular, pure matte.",
    backdrop: "light",
  },
];

export const LABEL = "Get Started";
