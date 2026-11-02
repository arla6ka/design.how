// Colour depth (https://design.how/vault/color-depth), card.tsx.
// FIXED. Change the VARIABLE values in params instead (SHOWCASE, RECIPES, LABEL, GROUND, DESIGN_WIDTH).
'use client';

import {useEffect, useRef, useState} from 'react';
import {usePause} from './runtime/use-pause';
import {DepthButton} from './depth-button';
import {GlassFilter} from './glass-filter';
import {DESIGN_WIDTH, GROUND, SHOWCASE} from './params';
import {RECIPES} from './recipes';
import {COLOR_DEPTH_CSS} from './styles';

class Fit {
  private readonly ro: ResizeObserver;
  constructor(private readonly host: HTMLElement, private readonly onScale: (s: number) => void) {
    this.ro = new ResizeObserver(() => this.measure());
  }
  start() { this.ro.observe(this.host); }
  stop() { this.ro.disconnect(); }
  measure() { this.onScale(Math.max(0.82, this.host.clientWidth / DESIGN_WIDTH)); }
  destroy() { this.ro.disconnect(); }
}

export default function ColorDepthCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const fit = useRef<Fit | null>(null);
  const [scale, setScale] = useState(1);
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

  return <div ref={box} className={className} style={{position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', overflow: 'hidden', background: GROUND}}>
    <style href="color-depth" precedence="default">{COLOR_DEPTH_CSS}</style>
    <GlassFilter/>
    <div style={{display: 'flex', alignItems: 'center', gap: 12, transform: `scale(${scale})`}}>
      {SHOWCASE.map(id => RECIPES.find(r => r.id === id)).filter(r => r !== undefined).map(r => <DepthButton key={r.id} className={r.className}/>)}
    </div>
  </div>;
}
