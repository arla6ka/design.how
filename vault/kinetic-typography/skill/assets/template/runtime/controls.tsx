// Kinetic typography: a runtime helper the template imports. FIXED.
'use client';

import {useId, type ReactNode} from 'react';
import styles from './controls.module.css';

type Option = {id: string; label: string};

export function Panel({children}: {children: ReactNode}) {
  return <div className={styles.panel}>{children}</div>;
}

export function Slider({label, value, min, max, step = 0.01, format, onChange}: {label: string; value: number; min: number; max: number; step?: number; format?: (v: number) => string; onChange: (v: number) => void}) {
  const id = useId();
  return <div className={styles.row}>
    <label htmlFor={id} className={styles.label}>{label}</label>
    <input id={id} className={styles.range} type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}/>
    <output htmlFor={id} className={styles.value}>{format ? format(value) : String(Math.round(value * 100) / 100)}</output>
  </div>;
}

export function SegmentedControl({options, activeId, onPick}: {options: Option[]; activeId: string; onPick: (id: string) => void; fill?: boolean}) {
  return <div className={styles.segments} role="radiogroup">
    {options.map(option => <button key={option.id} type="button" role="radio" aria-checked={option.id === activeId} className={styles.segment} onClick={() => onPick(option.id)}>{option.label}</button>)}
  </div>;
}

export function Select({options, activeId, onPick, ariaLabel}: {options: Option[]; activeId: string; onPick: (id: string) => void; ariaLabel?: string}) {
  return <select className={styles.select} aria-label={ariaLabel} value={activeId} onChange={e => onPick(e.target.value)}>
    {options.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
  </select>;
}

export function ColorControl({label, value, onChange}: {label: string; value: string; onChange: (v: string) => void}) {
  const id = useId();
  return <div className={styles.row}>
    <label htmlFor={id} className={styles.label}>{label}</label>
    <input id={id} className={styles.color} type="color" value={value} onChange={e => onChange(e.target.value)}/>
    <output htmlFor={id} className={styles.value}>{value}</output>
  </div>;
}

export function PromptInput({label, value, onChange}: {label: string; value: string; onChange: (v: string) => void}) {
  const id = useId();
  return <div className={styles.row}>
    <label htmlFor={id} className={styles.label}>{label}</label>
    <input id={id} className={styles.text} type="text" value={value} onChange={e => onChange(e.target.value)}/>
  </div>;
}

export function GhostButton({onClick, children}: {onClick: () => void; children: ReactNode}) {
  return <button type="button" className={styles.button} onClick={onClick}>{children}</button>;
}
