import { MEASURED } from "./measured";
import { AUTHORED, GRAPHITE, SULPHUR, TIDE } from "./authored";
import type { Scene } from "../scene";

export { MEASURED, GRAPHITE, SULPHUR, TIDE };

export const VAULT_SCENE: Scene = {
  ...GRAPHITE,
  spine: MEASURED.spine,
  tip: MEASURED.tip,
  tipAt: MEASURED.tipAt,
  flood: MEASURED.flood,
  sparks: MEASURED.sparks,
};

export const DEFAULT_SCENE = VAULT_SCENE;

export const SCENES: Scene[] = [MEASURED, ...AUTHORED];

export function sceneById(id: string): Scene | undefined {
  return SCENES.find((s) => s.id === id);
}
