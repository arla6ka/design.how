// AI lights (https://design.how/vault/ai-lights), card.tsx.
// FIXED. Change the VARIABLE values in params instead (VARIANTS, PULSE_MS, MORPH_MS, FADE_OUT_MS, SETTLED_MS, RIM_LAYERS, RIM_STOPS, ARC_MIN, ARC_MAX).
'use client';

import './fonts.css';
import {useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {AiLights} from './engine';
import {buildMask, padOf} from './mask';
import {FACE, FACE_DARK, FADE_OUT_MS, MASK_SETTLE_MS, MORPH_MS, RIM_LAYERS, RIM_STOPS} from './params';
import {CSS} from './styles';
import {VARIANTS} from './variants';

type Layer = {mask: string; pad: number};

function useRimMask(ref: RefObject<HTMLElement | null>, radius: number): Layer[] {
  const [layers, setLayers] = useState<Layer[]>([]);
  const target = useRef(radius);
  useEffect(() => { target.current = radius; }, [radius]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const build = () => {
      const box = el.getBoundingClientRect();
      if (!box.width || !box.height) return;
      const r = Math.min(target.current, box.width / 2, box.height / 2);
      setLayers(RIM_LAYERS.map(l => ({mask: buildMask({width: box.width, height: box.height, radius: r, strokeWidth: l.strokeWidth, blur: l.blur, alpha: l.alpha, ring: l.ring, stops: RIM_STOPS}), pad: padOf(l.strokeWidth, l.blur)})).filter(l => l.mask));
    };
    build();
    let settle = 0;
    const ro = new ResizeObserver(() => { window.clearTimeout(settle); settle = window.setTimeout(build, MASK_SETTLE_MS); });
    ro.observe(el);
    return () => { window.clearTimeout(settle); ro.disconnect(); };
  }, [ref]);
  return layers;
}

function useVariantSizes(probe: RefObject<HTMLDivElement | null>) {
  const [sizes, setSizes] = useState<{w: number; h: number}[] | null>(null);
  useLayoutEffect(() => {
    const host = probe.current;
    if (!host) return;
    let live = true;
    const measure = () => {
      if (!live) return;
      const boxes = Array.from(host.children).map(el => { const r = el.getBoundingClientRect(); return {w: Math.round(r.width), h: Math.round(r.height)}; });
      if (boxes.length === VARIANTS.length && boxes.every(b => b.w && b.h)) setSizes(boxes);
    };
    measure();
    document.fonts?.ready.then(measure, () => {});
    return () => { live = false; };
  }, [probe]);
  return sizes;
}

const LIGHT_FACE: CSSProperties[] = [
  {background: 'linear-gradient(180deg, #ffffff 0%, #fbfbfc 100%)'},
  {background: 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 68%)'},
  {background: 'radial-gradient(130% 120% at 42% -10%, rgba(0,0,0,0) 58%, rgba(28,36,52,0.035) 100%)'},
  {boxShadow: 'inset 0 1px 0 -0.5px rgba(255,255,255,1)'},
  {boxShadow: 'inset 0 0 0 0.5px rgba(28,36,52,0.06)'},
  {boxShadow: 'inset 0 -10px 8px -10px rgba(28,36,52,0.1)'},
];
const DARK_FACE: CSSProperties[] = [
  {background: 'linear-gradient(180deg, #232323 0%, #1b1b1c 100%)'},
  {mixBlendMode: 'screen', background: 'linear-gradient(180deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0) 62%)'},
  {background: 'radial-gradient(130% 120% at 42% -10%, rgba(0,0,0,0) 54%, rgba(0,0,0,0.28) 100%)'},
  {boxShadow: 'inset 0 1px 0 -0.5px rgba(255,255,255,0.1)'},
  {boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.055)'},
  {boxShadow: 'inset 0 -10px 8px -10px rgba(0,0,0,0.3)'},
];

export default function AiLightsCard({className}: {className?: string}) {
  const card = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const probe = useRef<HTMLDivElement>(null);
  const engine = useRef<AiLights | null>(null);
  const sizes = useVariantSizes(probe);
  const [slot, setSlot] = useState(0);
  const [showing, setShowing] = useState(true);
  const [morphing, setMorphing] = useState(false);
  const [gen, setGen] = useState(0);

  const variant = VARIANTS[slot];
  const size = sizes?.[slot];
  const radius = size ? Math.min(variant.radius, (size.h + 2) / 2) : variant.radius;
  const layers = useRimMask(body, radius);

  const settle = useCallback(() => { setShowing(true); setMorphing(false); }, []);
  const running = usePause(card, run => {
    if (run) engine.current?.start();
    else { engine.current?.stop(); settle(); }
  });

  useEffect(() => {
    const c = card.current, b = body.current;
    if (!c || !b) return;
    const next = new AiLights(c, b, {
      fadeOut: () => setShowing(false),
      morph: () => { setMorphing(true); setSlot(s => (s + 1) % VARIANTS.length); },
      arrive: () => { setMorphing(false); setGen(g => g + 1); setShowing(true); },
    });
    engine.current = next;
    if (prefersReducedMotion()) next.renderStill();
    else if (running.current) next.start();
    return () => {
      next.destroy();
      engine.current = null;
    };
  }, [running]);

  return <div ref={card} className={`ail-card${className ? ` ${className}` : ''}`} aria-hidden="true">
    <style>{CSS}</style>
    <div ref={probe} className="ail-probe" aria-hidden="true">
      {VARIANTS.map(v => <div key={v.key} className={v.pad}><v.Content/></div>)}
    </div>
    <div
      ref={body}
      className="ail-body"
      data-morphing={morphing ? 'true' : undefined}
      style={{width: size ? size.w + 2 : undefined, height: size ? size.h + 2 : undefined, '--r': `${radius}px`, '--m': `${MORPH_MS}ms`} as CSSProperties}
    >
      {layers.map((l, i) => [0, 1].map(side => <span key={`${i}-${side}`} className="ail-layer" style={{inset: -l.pad, maskImage: `url(${l.mask})`, transform: side ? 'scaleX(-1)' : undefined}}/>))}
      <div className="ail-face" style={{backgroundColor: variant.dark ? FACE_DARK : FACE}}>
        {(variant.dark ? DARK_FACE : LIGHT_FACE).map((style, i) => <span key={i} style={style}/>)}
        <div
          key={gen}
          className={`ail-content ${variant.pad}`}
          style={{opacity: showing ? 1 : 0, contentVisibility: morphing ? 'hidden' : undefined, '--f': `${FADE_OUT_MS}ms`} as CSSProperties}
        >
          <variant.Content/>
        </div>
      </div>
    </div>
  </div>;
}
