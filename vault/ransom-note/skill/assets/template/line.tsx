// Ransom note (https://design.how/vault/ransom-note), line.tsx.
// FIXED. Change the VARIABLE values in params instead (PHRASES, JITTER, PAPERS, FACES, REVEAL_HOLD, GROUND).
'use client';

import type {CSSProperties} from 'react';
import type {Placed} from './compose';

const RISE_EASE = 'cubic-bezier(.16,1,.3,1)';
const IN_MS = 460;
const OUT_MS = 240;
const STAGGER_MS = 26;
const SHADOW = 'drop-shadow(0 2px 3px rgba(20,20,25,0.16)) drop-shadow(0 6px 10px rgba(20,20,30,0.10))';

export function RansomLine({placed, lineH, revealed, direction}: {placed: Placed[]; lineH: number; revealed: boolean; direction: 'in' | 'out'}) {
  let index = 0;
  return <div style={{display: 'flex', flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'center', gap: lineH * 0.04}}>
    {placed.map((p, i) => {
      if (p.kind === 'space') return <span key={i} aria-hidden style={{width: lineH * 0.32, flex: 'none'}}/>;
      const idx = index++;
      const s = p.scrap;
      const rise = Math.max(10, lineH * 0.18);
      const hidden = direction === 'in'
        ? `translateY(${rise.toFixed(1)}px) rotate(${(p.rot * 1.25).toFixed(2)}deg) scale(0.96)`
        : `translateY(${(-rise * 0.8).toFixed(1)}px) rotate(${(p.rot * 0.8).toFixed(2)}deg) scale(0.98)`;
      const delay = direction === 'in' ? idx * STAGGER_MS : 0;
      const wrap: CSSProperties = {
        display: 'inline-flex', flex: 'none',
        transform: revealed ? `rotate(${p.rot}deg)` : hidden,
        opacity: revealed ? 1 : 0,
        filter: `${SHADOW} blur(${revealed ? 0 : direction === 'in' ? 3.5 : 5}px)`,
        transition: direction === 'in'
          ? `transform ${IN_MS}ms ${RISE_EASE} ${delay}ms, opacity ${Math.round(IN_MS * 0.7)}ms ease ${delay}ms, filter ${IN_MS}ms ease ${delay}ms`
          : `transform ${OUT_MS}ms cubic-bezier(.4,0,.7,1), opacity ${OUT_MS}ms ease, filter ${OUT_MS}ms ease`,
        willChange: 'transform, opacity, filter',
      };
      const scrap: CSSProperties = {
        display: 'inline-block',
        fontSize: lineH * p.scale * 0.82,
        lineHeight: 1,
        padding: `${s.padY}em ${s.padX}em`,
        background: s.paper,
        color: s.outline ? 'transparent' : s.ink,
        WebkitTextStroke: s.outline ? `0.04em ${s.ink}` : undefined,
        fontFamily: s.family,
        fontWeight: s.weight,
        fontStyle: s.italic ? 'italic' : 'normal',
        clipPath: s.cut,
      };
      return <span key={i} style={{display: 'inline-flex', transform: `translateY(${(p.dy * lineH).toFixed(2)}px)`, marginRight: p.mx * lineH, flex: 'none'}}>
        <span style={wrap}><span style={scrap}>{s.upper ? p.ch.toUpperCase() : p.ch.toLowerCase()}</span></span>
      </span>;
    })}
  </div>;
}
