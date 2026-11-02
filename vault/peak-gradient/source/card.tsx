'use client';

import {useEffect, useRef, useState} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {PeakGradient} from './gradient';
import {GROUND} from './params';

class Rise {
  private frame = 0;
  constructor(private readonly set: (shown: boolean) => void) {}
  to(shown: boolean) {
    cancelAnimationFrame(this.frame);
    if (!shown) return this.set(false);
    this.frame = requestAnimationFrame(() => { this.frame = requestAnimationFrame(() => this.set(true)); });
  }
  destroy() {
    cancelAnimationFrame(this.frame);
  }
}

export default function PeakGradientCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const [still] = useState(() => prefersReducedMotion());
  const [shown, setShown] = useState(still);
  const rise = useRef<Rise | null>(null);
  usePause(box, run => { if (!still) rise.current?.to(run); });

  useEffect(() => {
    const next = new Rise(setShown);
    rise.current = next;
    return () => {
      next.destroy();
      rise.current = null;
    };
  }, []);

  return <div ref={box} role="img" aria-label="A soft rainbow glow of blurred columns rising from the bottom of a white card, tallest in the middle." className={className} style={{position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: GROUND}}>
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: '78%'}}>
      <PeakGradient shown={shown}/>
    </div>
  </div>;
}
