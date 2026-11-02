'use client';

import './fonts.css';
import {useEffect, useRef, useState} from 'react';
import {GhostButton, Panel, Slider} from './runtime/controls';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {DEFAULTS, FadeMotion, pixelFontSpec} from './engine';

export default function FadeMotionPlayground() {
  const host = useRef<HTMLDivElement>(null);
  const engine = useRef<FadeMotion | null>(null);
  const running = usePause(host, run => (run ? engine.current?.start() : engine.current?.stop()));

  const [echoes, setEchoes] = useState(DEFAULTS.echoes);
  const [step, setStep] = useState(DEFAULTS.step);
  const [alpha, setAlpha] = useState(DEFAULTS.alpha);
  const [angle, setAngle] = useState(DEFAULTS.angle);
  const [hueShift, setHueShift] = useState(DEFAULTS.hueShift);
  const [turbulence, setTurbulence] = useState(DEFAULTS.turbulence);
  const [spread, setSpread] = useState(DEFAULTS.spread);
  const [edge, setEdge] = useState(DEFAULTS.edge);
  const [fringe, setFringe] = useState(DEFAULTS.fringe);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let cancelled = false;
    const reduced = prefersReducedMotion();
    const raf = requestAnimationFrame(() => {
      const next = new FadeMotion(element);
      engine.current = next;
      if (!next.ok) return;
      next.onBg = css => { element.style.backgroundColor = css; };
      document.fonts?.load?.(pixelFontSpec()).catch(() => {}).then(() => { if (!cancelled) engine.current?.refreshFonts(); });
      if (reduced) next.renderStill();
      else if (running.current) next.start();
    });

    const fine = window.matchMedia('(pointer: fine)').matches;
    const onMove = (event: PointerEvent) => {
      if (reduced) return;
      const r = element.getBoundingClientRect();
      engine.current?.setPointer({x: (event.clientX - r.left) / r.width, y: (event.clientY - r.top) / r.height});
    };
    const onLeave = () => engine.current?.setPointer(null);
    if (fine) {
      element.addEventListener('pointermove', onMove);
      element.addEventListener('pointerleave', onLeave);
      element.addEventListener('pointercancel', onLeave);
    }
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      element.removeEventListener('pointermove', onMove);
      element.removeEventListener('pointerleave', onLeave);
      element.removeEventListener('pointercancel', onLeave);
      engine.current?.destroy();
      engine.current = null;
    };
  }, [running]);

  useEffect(() => {
    engine.current?.setParams({echoes, step, alpha, angle, hueShift, turbulence, spread, edge, fringe});
  }, [echoes, step, alpha, angle, hueShift, turbulence, spread, edge, fringe]);

  return <div style={{display: 'grid', gap: '12px', minWidth: 0}}>
    <div
      ref={host}
      role="img"
      aria-label="The word motion trailing into light, its fade built from overlapping copies. Move the pointer to turn it."
      style={{position: 'relative', aspectRatio: '1344 / 620', overflow: 'hidden', borderRadius: '6px', backgroundColor: '#0b0b0d'}}
    />
    <Panel>
      <div style={{display: 'flex', justifyContent: 'flex-end'}}><GhostButton onClick={() => engine.current?.next()}>Next colours</GhostButton></div>
      <Slider label="Copies" value={echoes} min={30} max={340} step={2} format={v => `${v}`} onChange={setEchoes}/>
      <Slider label="Step" value={step} min={0.4} max={4} step={0.1} format={v => `${v.toFixed(1)}px`} onChange={setStep}/>
      <Slider label="Density" value={alpha} min={0.006} max={0.08} step={0.002} format={v => v.toFixed(3)} onChange={setAlpha}/>
      <Slider label="Angle" value={angle} min={0} max={Math.PI * 2} step={0.02} format={v => `${Math.round((v * 180) / Math.PI)}°`} onChange={setAngle}/>
      <Slider label="Hue drift" value={hueShift} min={0} max={90} step={1} format={v => `${v}°`} onChange={setHueShift}/>
      <Slider label="Turbulence" value={turbulence} min={0} max={40} step={0.5} format={v => v.toFixed(1)} onChange={setTurbulence}/>
      <Slider label="Dissipation" value={spread} min={0} max={0.9} step={0.02} format={v => v.toFixed(2)} onChange={setSpread}/>
      <Slider label="Leading edge" value={edge} min={0} max={2} step={0.05} format={v => v.toFixed(2)} onChange={setEdge}/>
      <Slider label="Dispersion" value={fringe} min={0} max={0.14} step={0.005} format={v => v.toFixed(3)} onChange={setFringe}/>
    </Panel>
  </div>;
}
