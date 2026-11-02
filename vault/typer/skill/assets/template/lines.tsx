// Typer (https://design.how/vault/typer), lines.tsx.
// FIXED. Change the VARIABLE values in params instead (LINES, PRESETS, REPLAY_MS, STAGGER, SIZE_CQW, SIZE_MIN, FONT_VAR).
'use client';

import {useEffect, useRef, type CSSProperties} from 'react';
import {prefersReducedMotion} from './runtime/use-pause';
import {TYPER_CSS} from './styles';
import {TyperGroup} from './typer';

export type TyperLinesProps = {
  lines: string[];
  fps?: number;
  cycles?: number;
  stagger?: number;
  variations?: string[];
  fg?: string;
  bg?: string;
  accent?: string;
  accentInk?: string;
  playKey?: number;
  play?: boolean;
  lineStyle?: CSSProperties;
  style?: CSSProperties;
};

export function TyperLines({lines, fps = 20, cycles = 3, stagger = 0.15, variations, fg, bg, accent, accentInk, playKey = 0, play = true, lineStyle, style}: TyperLinesProps) {
  const lineRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const variationsKey = (variations ?? []).join(',');

  useEffect(() => {
    const els = lineRefs.current.filter(Boolean) as HTMLSpanElement[];
    if (!els.length) return;
    const reduce = prefersReducedMotion();
    const group = new TyperGroup(els, {fps, cycles, variations, initVisible: reduce || !play}, stagger);
    if (!reduce && play) group.in();
    return () => group.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines, fps, cycles, stagger, variationsKey, playKey, play]);

  const theme = {'--typer-fg': fg, '--typer-bg': bg, '--typer-accent': accent, '--typer-accent-ink': accentInk} as CSSProperties;
  return <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textAlign: 'center', ...theme, ...style}}>
    <style href="typer" precedence="default">{TYPER_CSS}</style>
    {lines.map((line, i) => <span key={`${i}:${line}`} ref={el => { lineRefs.current[i] = el; }} data-typer="" data-typer-type="initial" style={lineStyle}>{line}</span>)}
  </div>;
}
