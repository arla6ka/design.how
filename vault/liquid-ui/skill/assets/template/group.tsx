// Liquid UI (https://design.how/vault/liquid-ui), group.tsx.
// FIXED. Change the VARIABLE values in params instead (CARD_SCENES, k, HOLD_MS, MORPH_MS, SKIN, GROUND, SMOOTH).
'use client';

import {Children, isValidElement, useMemo, type CSSProperties, type ReactElement, type ReactNode} from 'react';
import {DEFAULT_PARAMS, LiquidEngine, type LiquidBox} from './engine';

export type LiquidCardProps = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  radius?: number;
  children?: ReactNode;
};

export function LiquidCard({x, y, w, h, children}: LiquidCardProps) {
  return <div style={{position: 'absolute', left: x, top: y, width: w, height: h}}>{children}</div>;
}

const isCard = (node: ReactNode): node is ReactElement<LiquidCardProps> => isValidElement(node) && (node.props as LiquidCardProps).id !== undefined;

export function LiquidGroup({children, k = DEFAULT_PARAMS.k, cardRadius = 26, cell = DEFAULT_PARAMS.cell, smooth = DEFAULT_PARAMS.smooth, fill = '#ffffff', style}: {
  children: ReactNode;
  k?: number;
  cardRadius?: number;
  cell?: number;
  smooth?: number;
  fill?: string;
  style?: CSSProperties;
}) {
  const cards = Children.toArray(children).filter(isCard);
  const key = cards.map(c => `${c.props.id}:${c.props.x}:${c.props.y}:${c.props.w}:${c.props.h}:${c.props.radius ?? ''}`).join('|');
  const skin = useMemo(() => {
    const boxes: LiquidBox[] = cards.map(({props: p}) => ({id: p.id, cx: p.x + p.w / 2, cy: p.y + p.h / 2, hw: p.w / 2, hh: p.h / 2, r: p.radius ?? cardRadius}));
    const engine = new LiquidEngine();
    engine.setBoxes(boxes);
    engine.setParams({k, cell, smooth});
    return engine.compute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, k, cardRadius, cell, smooth]);
  return <div style={{position: 'relative', ...style}}>
    <svg aria-hidden viewBox={`${skin.minX} ${skin.minY} ${skin.width} ${skin.height}`} style={{position: 'absolute', left: skin.minX, top: skin.minY, width: skin.width, height: skin.height, overflow: 'visible', pointerEvents: 'none'}}>
      <path d={skin.d} fill={fill}/>
    </svg>
    {cards}
  </div>;
}
