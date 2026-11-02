'use client';

import './fonts.css';
import {useEffect, useRef, useState, type CSSProperties} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {COLORS} from './badges';
import {BadgeTrail, badgeMotion, type Badge} from './engine';
import {DESIGN_WIDTH, FONT_PX, FONT_VAR, GROUND, PAD_X, PAD_Y, RADIUS} from './params';

const STILL = [
  {text: 'kerning', color: COLORS[0]},
  {text: 'baseline', color: COLORS[2]},
  {text: 'bezier', color: COLORS[4]},
  {text: 'gamut', color: COLORS[6]},
];

const BADGE: CSSProperties = {
  fontFamily: `var(${FONT_VAR})`, fontSize: FONT_PX, lineHeight: 1, whiteSpace: 'nowrap', padding: `${PAD_Y}px ${PAD_X}px`,
  borderRadius: RADIUS, color: '#000', textTransform: 'uppercase',
};

export default function BadgeTrailCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const engine = useRef<BadgeTrail | null>(null);
  const [frame, setFrame] = useState<{badges: Badge[]; clock: number}>({badges: [], clock: 0});
  const [scale, setScale] = useState(1);
  const [still, setStill] = useState(false);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const host = box.current;
    if (!host) return;
    const fit = () => {
      const s = Math.max(1, host.clientWidth / DESIGN_WIDTH);
      setScale(s);
      if (engine.current) engine.current.scale = s;
    };
    const ro = new ResizeObserver(fit);
    ro.observe(host);
    if (prefersReducedMotion()) {
      setStill(true);
      fit();
      return () => ro.disconnect();
    }
    const probe = document.createElement('span');
    probe.style.cssText = `position:absolute;visibility:hidden;white-space:pre;font-family:var(${FONT_VAR});font-size:${FONT_PX}px`;
    probe.textContent = 'M'.repeat(20);
    host.appendChild(probe);
    const charW = probe.getBoundingClientRect().width / 20 || FONT_PX * 0.6;
    probe.remove();
    const next = new BadgeTrail(host, charW, (badges, clock) => setFrame({badges, clock}));
    engine.current = next;
    fit();
    if (running.current) next.start();
    return () => {
      ro.disconnect();
      next.destroy();
      engine.current = null;
    };
  }, [running]);

  return <div
    ref={box}
    role="img"
    aria-label="A white card that drops a trail of small coloured monospace badges of design terms behind the pointer."
    className={className}
    style={{position: 'relative', width: '100%', height: '100%', overflow: 'hidden', userSelect: 'none', cursor: 'crosshair', background: GROUND, touchAction: 'pan-y'}}
  >
    <div style={{position: 'absolute', left: 0, top: 0, width: `${100 / scale}%`, height: `${100 / scale}%`, transform: `scale(${scale})`, transformOrigin: '0 0'}}>
      {still || (!frame.clock && !frame.badges.length)
        ? <div style={{position: 'absolute', inset: 0, display: 'flex', flexWrap: 'wrap', alignContent: 'center', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '0 32px'}}>
          {STILL.map(b => <span key={b.text} style={{...BADGE, background: b.color}}>{b.text}</span>)}
        </div>
        : frame.badges.map(b => {
          const m = badgeMotion(b, frame.clock);
          return <span key={b.id} style={{
            ...BADGE,
            position: 'absolute', left: b.x, top: b.y,
            background: b.special ? 'transparent' : b.color,
            boxShadow: b.special ? `inset 0 0 0 1px ${b.color}` : '0 1px 2px -1px rgba(20,20,30,0.35)',
            color: b.special ? b.color : '#000',
            opacity: m.opacity * (1 - b.depth * 0.12),
            transform: `translate(${m.dx + b.offX}px, ${m.dy + b.offY}px) scale(${m.scale * (1 - b.depth * 0.06)}) rotate(${m.rot}deg)`,
            pointerEvents: 'none', willChange: 'opacity, transform',
          }}>{b.scram}</span>;
        })}
    </div>
  </div>;
}
