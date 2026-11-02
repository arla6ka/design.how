// Liquid UI (https://design.how/vault/liquid-ui), engine.ts.
// FIXED. Change the VARIABLE values in params instead (CARD_SCENES, k, HOLD_MS, MORPH_MS, SKIN, GROUND, SMOOTH).
import { Field, type Shape, type Bridge } from "./sdf";
import { fieldToPath, type MarchOptions } from "./marching-squares";

export interface LiquidBox {
  id: string;
  cx: number;
  cy: number;
  hw: number;
  hh: number;
  r: number;
}

export interface LiquidParams {
  k: number;
  cell: number;
  smooth: number;
}

export interface LiquidPath {
  d: string;
  minX: number;
  minY: number;
  width: number;
  height: number;
}

export const DEFAULT_PARAMS: LiquidParams = { k: 26, cell: 6, smooth: 2 };

export class LiquidEngine {
  private boxes: LiquidBox[] = [];
  private bridges: Bridge[] = [];
  private params: LiquidParams = { ...DEFAULT_PARAMS };
  private cachedPath: LiquidPath | null = null;
  private sig = "";

  setBoxes(boxes: LiquidBox[]) {
    this.boxes = boxes;
  }
  setBridges(bridges: Bridge[]) {
    this.bridges = bridges;
  }
  setParams(p: Partial<LiquidParams>) {
    this.params = { ...this.params, ...p };
  }

  private signature(): string {
    const b = this.boxes
      .map((x) => `${x.cx.toFixed(1)},${x.cy.toFixed(1)},${x.hw},${x.hh},${x.r}`)
      .join("|");
    const br = this.bridges
      .map((x) => `${x.ax.toFixed(1)},${x.ay.toFixed(1)},${x.bx.toFixed(1)},${x.by.toFixed(1)},${x.r}`)
      .join("|");
    const p = this.params;
    return `${b}#${br}#${p.k},${p.cell},${p.smooth}`;
  }

  compute(): LiquidPath {
    const sig = this.signature();
    if (sig === this.sig && this.cachedPath) return this.cachedPath;
    this.sig = sig;

    const shapes: Shape[] = [
      ...this.boxes.map<Shape>((b) => ({
        kind: "box",
        cx: b.cx,
        cy: b.cy,
        hw: b.hw,
        hh: b.hh,
        r: b.r,
      })),
      ...this.bridges,
    ];
    const field = new Field(shapes, this.params.k);
    const opts: MarchOptions = { cell: this.params.cell, smooth: this.params.smooth };
    this.cachedPath = fieldToPath(field, opts);
    return this.cachedPath;
  }

  isDirty(): boolean {
    return this.signature() !== this.sig;
  }
}
