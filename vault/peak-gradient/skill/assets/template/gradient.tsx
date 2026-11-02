// Peak gradient (https://design.how/vault/peak-gradient), gradient.tsx.
// FIXED. Change the VARIABLE values in params instead (STOPS, PALETTES, BARS, BLUR, PEAK, VALLEY, RISE_MS, GROUND).
'use client';

import {useId} from 'react';
import {BARS, BLUR, PEAK, RISE_MS, STOPS, VALLEY, type Stop} from './params';

const VBW = 1271;
const VBH = 599;

function heights(n: number, peak: number, valley: number): number[] {
  const mid = (n - 1) / 2;
  return Array.from({length: n}, (_, i) => {
    const t = mid === 0 ? 0 : Math.abs(i - mid) / mid;
    return peak * VBH * (valley + (1 - valley) * (1 - Math.pow(t, 1.24)));
  });
}

export type PeakGradientProps = {bars?: number; blur?: number; peak?: number; valley?: number; stops?: Stop[]; riseMs?: number; shown: boolean};

export function PeakGradient({bars = BARS, blur = BLUR, peak = PEAK, valley = VALLEY, stops = STOPS, riseMs = RISE_MS, shown}: PeakGradientProps) {
  const id = useId().replace(/:/g, '');
  const colW = VBW / bars;
  return <div aria-hidden style={{width: '100%', height: '100%', transformOrigin: 'bottom', transform: shown ? 'scaleY(1)' : 'scaleY(0)', transition: `transform ${riseMs}ms cubic-bezier(0.16, 1, 0.3, 1)`, willChange: 'transform'}}>
    <svg style={{display: 'block', width: '100%', height: '100%'}} viewBox={`0 0 ${VBW} ${VBH}`} preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="1" x2="0" y2="0">
          {stops.map((s, i) => <stop key={i} offset={s.offset} stopColor={s.color}/>)}
        </linearGradient>
        <filter id={`${id}-b`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={blur}/></filter>
      </defs>
      {heights(bars, peak, valley).map((h, i) => <g key={i} filter={`url(#${id}-b)`}>
        <rect x={i * colW} y={VBH - h} width={colW * 1.23} height={h} fill={`url(#${id}-g)`}/>
      </g>)}
    </svg>
  </div>;
}
