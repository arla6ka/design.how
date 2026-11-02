// Smooth corners (https://design.how/vault/squircle), card.tsx.
// FIXED. Change the VARIABLE values in params instead (radiusFor, SMOOTHING, EXPONENT, BUTTON_W, CONTROL_H, LABEL, GROUND, FONT_VAR).
'use client';

import './fonts.css';
import {useEffect, useRef, useState} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {GlossySquircle, InkLabel} from './glossy';
import {BUTTON_W, CONTROL_H, DESIGN_WIDTH, EXPONENT, FONT_VAR, GROUND, LABEL, SMOOTHING, radiusFor} from './params';
import {PRESS_CSS} from './styles';

class Fit {
  private readonly ro: ResizeObserver;
  constructor(private readonly host: HTMLElement, private readonly onScale: (s: number) => void) {
    this.ro = new ResizeObserver(() => this.measure());
  }
  start() { this.ro.observe(this.host); }
  stop() { this.ro.disconnect(); }
  measure() { this.onScale(Math.max(1, this.host.clientWidth / DESIGN_WIDTH)); }
  destroy() { this.ro.disconnect(); }
}

export default function SquircleCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const fit = useRef<Fit | null>(null);
  const [scale, setScale] = useState(1);
  const [interactive] = useState(() => !prefersReducedMotion());
  usePause(box, run => (run ? fit.current?.start() : fit.current?.stop()));

  useEffect(() => {
    const host = box.current;
    if (!host) return;
    const next = new Fit(host, setScale);
    fit.current = next;
    next.measure();
    return () => {
      next.destroy();
      fit.current = null;
    };
  }, []);

  const h = CONTROL_H;
  return <div ref={box} className={className} style={{position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', overflow: 'hidden', background: GROUND, fontFamily: `var(${FONT_VAR})`}}>
    <style href="squircle-press" precedence="default">{PRESS_CSS}</style>
    <div style={{transform: `scale(${scale})`}}>
      <GlossySquircle w={BUTTON_W} h={h} radius={radiusFor(h)} smoothing={SMOOTHING} exponent={EXPONENT} interactive={interactive}>
        <InkLabel>{LABEL}</InkLabel>
      </GlossySquircle>
    </div>
  </div>;
}
