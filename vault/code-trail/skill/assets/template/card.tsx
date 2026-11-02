// Code trail (https://design.how/vault/code-trail), card.tsx.
// FIXED. Change the VARIABLE values in params instead (GROUND, FONT_VAR, ROWS, CHASE, MIN_TRAVEL_RATIO, FRAGMENTS, PAIRS).
'use client';

import './fonts.css';
import {useEffect, useLayoutEffect, useRef, useState, type CSSProperties} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {CodeTrail, ROWS, badgeCount, type Badge, type Metrics, type Row} from './engine';
import {FONT_VAR, GROUND} from './params';

export default function CodeTrailCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const elements = useRef(new Map<number, HTMLElement>());
  const engine = useRef<CodeTrail | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({font: 14, line: 18, pad: 2});
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const host = box.current;
    if (!host) return;
    const next = new CodeTrail(host, elements.current, setRows, setMetrics);
    engine.current = next;
    if (prefersReducedMotion()) next.renderStill();
    else {
      next.seed();
      if (running.current) next.start();
    }
    const ro = new ResizeObserver(() => next.resize());
    ro.observe(host);
    return () => {
      ro.disconnect();
      next.destroy();
      engine.current = null;
    };
  }, [running]);

  useLayoutEffect(() => engine.current?.paint(), [rows]);

  const badgeStyle = (b: Badge, first: boolean): CSSProperties => ({
    background: b.bg,
    color: b.fg,
    height: metrics.line,
    lineHeight: `${metrics.line}px`,
    fontSize: metrics.font,
    padding: `0 ${metrics.pad}px`,
    opacity: b.comment ? 0.72 : 1,
    fontStyle: b.comment ? 'italic' : undefined,
    textDecoration: b.underline ? 'underline' : undefined,
    textDecorationThickness: b.underline ? '2px' : undefined,
    fontFamily: `var(${FONT_VAR})`,
    whiteSpace: 'pre',
    flex: '0 0 auto',
    boxShadow: first ? '0 1px 2px rgba(16, 22, 40, 0.16)' : undefined,
  });

  return <div
    ref={box}
    role="img"
    aria-label="A trail of code fragments on brightly coloured bars, stacked into a staircase that follows the pointer across the card."
    className={className}
    style={{position: 'relative', width: '100%', height: '100%', overflow: 'hidden', userSelect: 'none', background: GROUND, touchAction: 'pan-y'}}
  >
    {rows.map(r => {
      const visible = r.badges.slice(0, Math.max(1, badgeCount(r.slot, ROWS)));
      const before = visible.slice(0, r.anchorIndex);
      const after = visible.slice(r.anchorIndex);
      return <div
        key={r.id}
        ref={el => { if (el) elements.current.set(r.id, el); else elements.current.delete(r.id); }}
        style={{position: 'absolute', top: 0, left: 0, display: 'flex', transform: `translate3d(${r.pos.x.toFixed(2)}px, ${r.pos.y.toFixed(2)}px, 0)`, zIndex: ROWS - r.slot, willChange: 'transform, opacity'}}
      >
        <div style={{display: 'flex', position: 'absolute', right: 0, top: 0}}>
          {before.map((b, j) => <span key={`b${j}`} style={badgeStyle(b, j === 0)}>{b.text}</span>)}
        </div>
        <div style={{display: 'flex'}}>
          {after.map((b, j) => <span key={`a${j}`} style={badgeStyle(b, j === 0 && before.length === 0)}>{b.text}</span>)}
        </div>
      </div>;
    })}
  </div>;
}
