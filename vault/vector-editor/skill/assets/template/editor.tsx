// Vector editor (https://design.how/vault/vector-editor), editor.tsx.
// FIXED. Change the VARIABLE values in params instead (SHAPE, VIEW_BOX, SHAPE_W, PAD, FRAME, GROUND).
"use client";

import { useMemo, useRef, type PointerEvent as RPointerEvent } from "react";
import type { Anchor, Vec, VectorPath } from "./types";
import { serializePath } from "./parse";
import { sub, add, subRange } from "./types";

function significantAnchors(path: VectorPath, max?: number): Set<number> | null {
  const n = path.anchors.length;
  if (!max || n <= max) return null;

  const keep = new Set<number>();
  const scored: { i: number; score: number }[] = [];

  for (let s = 0; s < path.starts.length; s++) {
    const [begin, end] = subRange(path, s);
    const count = end - begin;
    if (count <= 0) continue;
    const closed = path.closed[s];

    for (let k = 0; k < count; k++) {
      const i = begin + k;
      const a = path.anchors[i];
      if (!closed && (k === 0 || k === count - 1)) {
        keep.add(i);
        continue;
      }
      const prev = path.anchors[begin + ((k - 1 + count) % count)];
      const next = path.anchors[begin + ((k + 1) % count)];
      const inDir = sub(a.p, a.in ?? prev.p);
      const outDir = sub(a.out ?? next.p, a.p);
      const li = Math.hypot(inDir.x, inDir.y) || 1;
      const lo = Math.hypot(outDir.x, outDir.y) || 1;
      const cos = (inDir.x * outDir.x + inDir.y * outDir.y) / (li * lo);
      const turn = Math.acos(Math.max(-1, Math.min(1, cos)));
      scored.push({ i, score: turn });
    }
  }

  scored.sort((p, q) => q.score - p.score);
  for (const { i } of scored) {
    if (keep.size >= max) break;
    keep.add(i);
  }
  return keep;
}

export type Mirror = "none" | "angle" | "angle-length";

export interface EditorStyle {
  accent: string;
  arm: string;
  anchorR: number;
  handleR: number;
  pointFill: string;
  fill: string;
  fillOpacity: number;
  stroke: string;
  strokeWidth: number;
  showRig: boolean;
  fillRule: "nonzero" | "evenodd";
}

export const DEFAULT_EDITOR: EditorStyle = {
  accent: "#0d99ff",
  arm: "#9bb7d4",
  anchorR: 4,
  handleR: 3.2,
  pointFill: "#ffffff",
  fill: "#0d99ff",
  fillOpacity: 0.08,
  stroke: "#0d99ff",
  strokeWidth: 1.5,
  showRig: true,
  fillRule: "evenodd",
};

type Drag =
  | { kind: "anchor"; i: number; grab: Vec }
  | { kind: "handle"; i: number; side: "in" | "out"; mirror: Mirror; grab: Vec };

export function VectorEditor({
  path,
  onChange,
  style = DEFAULT_EDITOR,
  mirror = "angle-length",
  morphing = false,
  presence,
  rig,
  maxRigPoints,
  rigScale = 1,
  viewBox,
  width,
  height,
  className,
}: {
  path: VectorPath;
  onChange: (next: VectorPath) => void;
  style?: EditorStyle;
  mirror?: Mirror;
  morphing?: boolean;
  presence?: number[];
  rig?: (Anchor | null)[];
  maxRigPoints?: number;
  rigScale?: number;
  viewBox: [number, number, number, number];
  width?: number;
  height?: number;
  className?: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<Drag | null>(null);
  const pathRef = useRef(path);
  pathRef.current = path;
  const pending = useRef<Vec | null>(null);
  const rafMove = useRef(0);

  function toUser(e: { clientX: number; clientY: number }): Vec {
    const svg = svgRef.current!;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const u = pt.matrixTransform(ctm.inverse());
    return { x: u.x, y: u.y };
  }

  function startAnchor(e: RPointerEvent, i: number) {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    const grab = sub(toUser(e), pathRef.current.anchors[i].p);
    drag.current = { kind: "anchor", i, grab };
  }
  function startHandle(e: RPointerEvent, i: number, side: "in" | "out") {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    const h = side === "out" ? pathRef.current.anchors[i].out : pathRef.current.anchors[i].in;
    const grab = h ? sub(toUser(e), h) : { x: 0, y: 0 };
    drag.current = { kind: "handle", i, side, mirror: e.altKey ? "none" : mirror, grab };
  }

  function applyDrag(d: Drag, uRaw: Vec): VectorPath {
    const u = sub(uRaw, d.grab);
    const anchors = pathRef.current.anchors.map((a) => ({
      p: { ...a.p },
      in: a.in ? { ...a.in } : null,
      out: a.out ? { ...a.out } : null,
    })) as Anchor[];

    if (d.kind === "anchor") {
      const a = anchors[d.i];
      const delta = sub(u, a.p);
      a.p = u;
      if (a.in) a.in = add(a.in, delta);
      if (a.out) a.out = add(a.out, delta);
    } else {
      const a = anchors[d.i];
      if (d.side === "out") a.out = u;
      else a.in = u;
      const other = d.side === "out" ? a.in : a.out;
      if (d.mirror !== "none" && other) {
        const rel = sub(u, a.p);
        let opp: Vec;
        if (d.mirror === "angle-length") {
          opp = { x: a.p.x - rel.x, y: a.p.y - rel.y };
        } else {
          const relLen = Math.hypot(rel.x, rel.y);
          const len = Math.hypot(other.x - a.p.x, other.y - a.p.y);
          if (relLen < 1e-6) opp = { ...other };
          else opp = { x: a.p.x - (rel.x / relLen) * len, y: a.p.y - (rel.y / relLen) * len };
        }
        if (d.side === "out") a.in = opp;
        else a.out = opp;
      }
    }
    return { anchors, starts: pathRef.current.starts, closed: pathRef.current.closed };
  }

  function onMove(e: RPointerEvent) {
    if (!drag.current) return;
    pending.current = toUser(e);
    if (rafMove.current) return;
    rafMove.current = requestAnimationFrame(() => {
      rafMove.current = 0;
      const d = drag.current;
      const u = pending.current;
      if (!d || !u) return;
      onChange(applyDrag(d, u));
    });
  }

  function endDrag(e: RPointerEvent) {
    if (drag.current) {
      if (rafMove.current) {
        cancelAnimationFrame(rafMove.current);
        rafMove.current = 0;
        const u = pending.current;
        if (u) onChange(applyDrag(drag.current, u));
      }
      try {
        (e.target as Element).releasePointerCapture(e.pointerId);
      } catch {
      }
      drag.current = null;
      pending.current = null;
    }
  }

  const vbUnit = Math.max(viewBox[2], viewBox[3], 1);
  const renderedPx = Math.max(width ?? viewBox[2], height ?? viewBox[3], 1);
  const unitsPerPx = vbUnit / renderedPx;
  const TARGET_ANCHOR_PX = 4.5;
  const TARGET_HANDLE_PX = 3.6;
  const s = {
    ...style,
    anchorR: TARGET_ANCHOR_PX * unitsPerPx * rigScale,
    handleR: TARGET_HANDLE_PX * unitsPerPx * rigScale,
    rigStrokeW: Math.max(0.75 * unitsPerPx, unitsPerPx),
  };
  const d = serializePath(path);

  const keep = useMemo(
    () => significantAnchors(path, maxRigPoints),
    [path, maxRigPoints],
  );
  const showAnchor = (i: number): boolean => !keep || keep.has(i);

  const arms: { ax: number; ay: number; hx: number; hy: number }[] = [];
  if (s.showRig) {
    for (let ai = 0; ai < path.anchors.length; ai++) {
      if (!showAnchor(ai)) continue;
      const a = path.anchors[ai];
      if (a.out) arms.push({ ax: a.p.x, ay: a.p.y, hx: a.out.x, hy: a.out.y });
      if (a.in) arms.push({ ax: a.p.x, ay: a.p.y, hx: a.in.x, hy: a.in.y });
    }
  }

  return (
    <svg
      ref={svgRef}
      viewBox={viewBox.join(" ")}
      width={width ?? viewBox[2]}
      height={height ?? viewBox[3]}
      className={className}
      style={{ display: "block", touchAction: "none", userSelect: "none", overflow: "visible" }}
      onPointerMove={onMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <path d={d} fill={s.fill} fillRule={s.fillRule} fillOpacity={s.fillOpacity} stroke={s.stroke} strokeWidth={style.strokeWidth} />

      {s.showRig && morphing && (
        <g pointerEvents="none">
          {path.anchors.map((a, i) => {
            const op = presence ? presence[i] ?? 1 : 1;
            if (op <= 0.01) return null;
            const r = rig?.[i] ?? a;
            return (
              <g key={i} opacity={op}>
                <g stroke={s.arm} strokeWidth={s.rigStrokeW}>
                  {r.out && <line x1={r.p.x} y1={r.p.y} x2={r.out.x} y2={r.out.y} />}
                  {r.in && <line x1={r.p.x} y1={r.p.y} x2={r.in.x} y2={r.in.y} />}
                </g>
                {r.out && <MorphDiamond cx={r.out.x} cy={r.out.y} r={s.handleR} fill={s.pointFill} stroke={s.accent} />}
                {r.in && <MorphDiamond cx={r.in.x} cy={r.in.y} r={s.handleR} fill={s.pointFill} stroke={s.accent} />}
                <circle cx={r.p.x} cy={r.p.y} r={s.anchorR} fill={s.pointFill} stroke={s.accent} strokeWidth={1.25} />
              </g>
            );
          })}
        </g>
      )}

      {s.showRig && !morphing && (
        <g>
          <g stroke={s.arm} strokeWidth={s.rigStrokeW}>
            {arms.map((a, k) => (
              <line key={k} x1={a.ax} y1={a.ay} x2={a.hx} y2={a.hy} />
            ))}
          </g>

          {path.anchors.map((a, i) =>
            !showAnchor(i) ? null : (
            <g key={`h-${i}`}>
              {a.out && (
                <Diamond
                  cx={a.out.x}
                  cy={a.out.y}
                  r={s.handleR}
                  fill={s.pointFill}
                  stroke={s.accent}
                  onPointerDown={(e) => startHandle(e, i, "out")}
                />
              )}
              {a.in && (
                <Diamond
                  cx={a.in.x}
                  cy={a.in.y}
                  r={s.handleR}
                  fill={s.pointFill}
                  stroke={s.accent}
                  onPointerDown={(e) => startHandle(e, i, "in")}
                />
              )}
            </g>
          ))}

          {path.anchors.map((a, i) =>
            !showAnchor(i) ? null : (
            <g key={`a-${i}`} style={{ cursor: "grab" }} onPointerDown={(e) => startAnchor(e, i)}>
              <circle cx={a.p.x} cy={a.p.y} r={s.anchorR * 3} fill="transparent" />
              <circle cx={a.p.x} cy={a.p.y} r={s.anchorR} fill={s.pointFill} stroke={s.accent} strokeWidth={1.25} />
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}

function MorphDiamond({ cx, cy, r, fill, stroke }: { cx: number; cy: number; r: number; fill: string; stroke: string }) {
  const d = r * Math.SQRT2;
  return (
    <polygon
      points={`${cx},${cy - d} ${cx + d},${cy} ${cx},${cy + d} ${cx - d},${cy}`}
      fill={fill}
      stroke={stroke}
      strokeWidth={1.1}
    />
  );
}

function Diamond({
  cx,
  cy,
  r,
  fill,
  stroke,
  onPointerDown,
}: {
  cx: number;
  cy: number;
  r: number;
  fill: string;
  stroke: string;
  onPointerDown: (e: RPointerEvent) => void;
}) {
  return (
    <g style={{ cursor: "grab" }} onPointerDown={onPointerDown}>
      <circle cx={cx} cy={cy} r={r * 3.5} fill="transparent" />
      <rect
        x={cx - r}
        y={cy - r}
        width={r * 2}
        height={r * 2}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.1}
        style={{ transform: "rotate(45deg)", transformOrigin: "50% 50%", transformBox: "fill-box" }}
      />
    </g>
  );
}
