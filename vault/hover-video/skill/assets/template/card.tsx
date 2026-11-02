// Hover video button (https://design.how/vault/hover-video), card.tsx.
// FIXED. Change the VARIABLE values in params instead (BUTTONS, PROMPTS, DESIGN_WIDTH).
'use client';

import './fonts.css';
import {useEffect, useRef, useState} from 'react';
import {usePause} from './runtime/use-pause';
import {HoverVideoButton} from './hover-button';
import {BUTTONS, DESIGN_WIDTH} from './params';

export default function HoverVideoCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [scale, setScale] = useState(1);
  usePause(box, setActive);

  useEffect(() => {
    const host = box.current;
    if (!host) return;
    const ro = new ResizeObserver(() => setScale(Math.max(1, host.clientWidth / DESIGN_WIDTH)));
    ro.observe(host);
    return () => ro.disconnect();
  }, []);

  return <div ref={box} className={className} role="group" aria-label="Three pill buttons, each playing a short clip of its label turning into puffy, glossy letters on hover." style={{position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#f7f7f7'}}>
    <div style={{position: 'absolute', left: 0, top: 0, width: `${100 / scale}%`, height: `${100 / scale}%`, transform: `scale(${scale})`, transformOrigin: '0 0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)'}}>
      {BUTTONS.map(b => <div key={b.label} style={{display: 'flex', alignItems: 'center', justifyContent: 'center', background: b.boxBg}}>
        <HoverVideoButton config={b} active={active}/>
      </div>)}
    </div>
  </div>;
}
