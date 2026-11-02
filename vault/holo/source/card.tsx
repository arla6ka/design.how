'use client';

import './fonts.css';
import {useEffect, useRef, useState, type Ref} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {CARD_LINE, CARD_NAME, DESIGN_WIDTH, GROUND} from './params';
import {HOLO_CSS} from './styles';
import {HoloTilt} from './tilt';

export function HoloBody({ref, height = '76%'}: {ref: Ref<HTMLDivElement>; height?: string}) {
  return <div ref={ref} className="holo-card" style={{height, aspectRatio: '1.55'}}>
    <div className="holo-body"/>
    <div className="holo-pattern"/>
    <div className="holo-pattern--lit"/>
    <div className="holo-foil"/>
    <div className="holo-foil--b"/>
    <div className="holo-foil--c"/>
    <div className="holo-smear"/>
    <div className="holo-spot"/>
    <div className="holo-noise"/>
    <div className="holo-glare"/>
    <div className="holo-sheen"/>
    <div className="holo-content">
      <div className="holo-text">
        <p className="holo-name">{CARD_NAME}</p>
        <p className="holo-since">{CARD_LINE}</p>
      </div>
      <div className="holo-tile">
        <div className="holo-tile__photo"/>
        <div className="holo-tile__photo--neg"/>
        <div className="holo-tile__duo"/>
        <div className="holo-tile__tone"/>
        <div className="holo-tile__foil"/>
        <div className="holo-tile__grain"/>
        <div className="holo-tile__wear"/>
        <div className="holo-tile__vignette"/>
        <div className="holo-tile__gloss"/>
      </div>
    </div>
  </div>;
}

export default function HoloCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const engine = useRef<HoloTilt | null>(null);
  const [scale, setScale] = useState(1);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const host = box.current;
    if (!host) return;
    const ro = new ResizeObserver(() => setScale(Math.max(1, host.clientWidth / DESIGN_WIDTH)));
    ro.observe(host);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const host = box.current;
    const el = card.current;
    if (!host || !el) return;
    const next = new HoloTilt(host, el);
    engine.current = next;
    if (prefersReducedMotion()) next.renderStill();
    else if (running.current) next.start();
    return () => {
      next.destroy();
      engine.current = null;
    };
  }, [running]);

  return <div
    ref={box}
    role="img"
    aria-label={`An identity card reading ${CARD_NAME}, ${CARD_LINE}, with a holographic foil surface that tilts and catches the light as the pointer moves across it.`}
    data-holo-lite=""
    className={className}
    style={{position: 'relative', width: '100%', height: '100%', overflow: 'hidden', userSelect: 'none', background: GROUND}}
  >
    <style href="holo" precedence="default">{HOLO_CSS}</style>
    <div style={{position: 'absolute', left: 0, top: 0, width: `${100 / scale}%`, height: `${100 / scale}%`, transform: `scale(${scale})`, transformOrigin: '0 0', perspective: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <HoloBody ref={card}/>
    </div>
  </div>;
}
