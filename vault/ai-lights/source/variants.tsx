'use client';

import type {CSSProperties, ReactElement, ReactNode} from 'react';

const STAGGER_MS = 20;

function RisingText({text, style, delay = 0}: {text: string; style?: CSSProperties; delay?: number}) {
  return <span className="ail-rise" style={style}>
    {Array.from(text).map((ch, i) => <span key={i} className="ail-char" style={{animationDelay: `${delay + i * STAGGER_MS}ms`, width: ch === ' ' ? '0.28em' : undefined}}>{ch === ' ' ? ' ' : ch}</span>)}
  </span>;
}

function Trail({children, delay = 140}: {children: ReactNode; delay?: number}) {
  return <span className="ail-trail ail-fade" style={{animationDelay: `${delay}ms`}}>{children}</span>;
}

function Row({children, trail}: {children: ReactNode; trail?: ReactNode}) {
  return <span className="ail-row"><span className="ail-grow">{children}</span>{trail}</span>;
}

type StepState = 'done' | 'live' | 'next';
const DOT: Record<StepState, CSSProperties> = {
  done: {background: 'var(--s-text-subtle)'},
  live: {background: 'var(--s-text-primary)'},
  next: {background: 'var(--s-surface-2)', border: '1px solid var(--s-border-1)', boxSizing: 'border-box'},
};

function Step({label, state, delay}: {label: string; state: StepState; delay: number}) {
  return <span className="ail-step">
    <span className="ail-dot ail-fade" style={{animationDelay: `${delay}ms`}}>
      <i style={DOT[state]}/>
      {state === 'live' && <span className="ail-pulse-ring"/>}
    </span>
    <span className="ail-label ail-fade" style={{animationDelay: `${delay + 60}ms`, color: state === 'next' ? 'var(--s-text-subtle)' : 'var(--s-text-body)'}}>{label}</span>
  </span>;
}

function Chain() {
  const steps: {label: string; state: StepState}[] = [{label: 'Fetch', state: 'done'}, {label: 'Parse', state: 'live'}, {label: 'Write', state: 'next'}];
  return <span style={{display: 'block', width: 268}}>
    <span className="ail-track">
      <span className="ail-line ail-fade" style={{animationDelay: '60ms'}}/>
      {steps.map((s, i) => <Step key={s.label} {...s} delay={100 + i * 70}/>)}
    </span>
  </span>;
}

function Progress() {
  return <span style={{display: 'block', width: 246}}>
    <Row trail={<span className="ail-row" style={{gap: 6}}>
      <Trail delay={120}>45%</Trail>
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" style={{flexShrink: 0}}>
        <circle cx="8" cy="8" r="6" fill="none" stroke="var(--s-border-1)" strokeWidth="2"/>
        <path className="ail-spin" d="M8 2A6 6 0 0 1 14 8" fill="none" stroke="var(--s-text-body)" strokeWidth="2" strokeLinecap="round" style={{transformOrigin: '8px 8px', animation: 'ail-spin 900ms linear infinite'}}/>
      </svg>
    </span>}>
      <RisingText text="Indexing" style={{fontSize: 16, color: 'var(--s-text-body)'}}/>
    </Row>
  </span>;
}

function Terminal() {
  return <span className="ail-mono" style={{display: 'flex', flexDirection: 'column', gap: 8, width: 242}}>
    <span style={{display: 'block', fontSize: 14, lineHeight: 1, color: '#8c8c8c'}}><span style={{color: '#5f5f5f'}}>$</span> deploy</span>
    <RisingText text="published" style={{fontSize: 14, color: '#d6d6d6'}} delay={60}/>
  </span>;
}

function Prompt() {
  return <span style={{display: 'block', width: 282}}>
    <Row trail={<span className="ail-send">
      <svg viewBox="0 0 12 12" width="16" height="16" fill="none" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9.5V2.5M6 2.5 3 5.5M6 2.5 9 5.5"/></svg>
    </span>}>
      <RisingText text="build me a scraper" style={{fontSize: 16, color: 'var(--s-text-muted)'}}/>
    </Row>
  </span>;
}

export type Variant = {key: string; radius: number; pad: string; dark?: boolean; Content: () => ReactElement};

export const VARIANTS: Variant[] = [
  {key: 'chain', radius: 16, pad: 'ail-pad', Content: Chain},
  {key: 'progress', radius: 15, pad: 'ail-pad', Content: Progress},
  {key: 'terminal', radius: 16, pad: 'ail-pad', dark: true, Content: Terminal},
  {key: 'prompt', radius: 18, pad: 'ail-pad-control', Content: Prompt},
];
