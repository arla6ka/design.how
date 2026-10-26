'use client';

import {useEffect, useRef, useState} from 'react';
import {useScramble} from '../hooks/use-scramble';
import {cn} from '../lib/utils';
import {formatElapsed} from './tool-call-row';

const MIN_DISPLAY = 1000;

const irregular: Record<string, string> = {
  running: 'ran', reading: 'read', writing: 'wrote', finding: 'found', building: 'built', sending: 'sent',
  getting: 'got', making: 'made', setting: 'set', putting: 'put', splitting: 'split', rebuilding: 'rebuilt',
  rerunning: 'reran', resetting: 'reset', rewriting: 'rewrote', holding: 'held', drawing: 'drew', choosing: 'chose',
};
const vowel = (ch: string | undefined) => !!ch && 'aeiou'.includes(ch);

function pastTense(phrase: string): string {
  const [first, ...rest] = phrase.split(' ');
  const word = first.toLowerCase();
  if (!word.endsWith('ing') || word.length < 5) return phrase;
  const stem = word.slice(0, -3);
  const past = irregular[word] ?? (stem.endsWith('y') && !vowel(stem.at(-2)) ? `${stem.slice(0, -1)}ied` : `${stem}ed`);
  const cased = first[0] === first[0].toUpperCase() ? past[0].toUpperCase() + past.slice(1) : past;
  return [cased, ...rest].join(' ');
}

function useHeldPhrase(label: string, active: boolean, hold: number) {
  const [shown, setShown] = useState(label);
  const shownAt = useRef(0);
  useEffect(() => {
    if (label === shown) return;
    if (!active) { setShown(label); shownAt.current = Date.now(); return; }
    const wait = Math.max(0, hold - (Date.now() - shownAt.current));
    const timer = setTimeout(() => { setShown(label); shownAt.current = Date.now(); }, wait);
    return () => clearTimeout(timer);
  }, [label, shown, active, hold]);
  return shown;
}

function useSettled(active: boolean, settle: number) {
  const [live, setLive] = useState(active);
  useEffect(() => {
    if (active) { setLive(true); return; }
    const timer = setTimeout(() => setLive(false), settle);
    return () => clearTimeout(timer);
  }, [active, settle]);
  return active || live;
}

function useAntiFlicker(show: boolean, delay = 150, min = 400) {
  const [visible, setVisible] = useState(false);
  const since = useRef(0);
  useEffect(() => {
    if (show && !visible) {
      const t = setTimeout(() => { since.current = Date.now(); setVisible(true); }, delay);
      return () => clearTimeout(t);
    }
    if (!show && visible) {
      const t = setTimeout(() => setVisible(false), Math.max(0, min - (Date.now() - since.current)));
      return () => clearTimeout(t);
    }
  }, [show, visible, delay, min]);
  return visible;
}

type ActivityEnd = 'ok' | 'warn' | 'fail' | 'stopped';

type ActivityLabels = {
  starting?: string;
  ok?: string;
  warn?: string;
  fail?: string;
  stopped?: string;
};
const activityLabels: Required<ActivityLabels> = {starting: 'Starting', ok: 'Done', warn: 'Warnings', fail: 'Failed', stopped: 'Stopped'};
const endTone: Record<ActivityEnd, string> = {ok: 'text-ok-text', warn: 'text-warn-text', fail: 'text-fail-text', stopped: 'text-text-3'};

type ActivityProps = Omit<React.ComponentProps<'div'>, 'children'> & {
  label?: string;
  active?: boolean;
  waiting?: boolean;
  elapsed?: number;
  summary?: string;
  status?: ActivityEnd;
  size?: 'default' | 'sm';
  minDisplay?: number;
  settle?: number;
  delay?: number;
  minLoader?: number;
  clock?: number;
  announce?: boolean;
  labels?: ActivityLabels;
};

function Activity({
  label, active = false, waiting = false, elapsed, summary, status = 'ok', size = 'default',
  minDisplay = MIN_DISPLAY, settle = 400, delay = 150, minLoader = 400, clock, announce = true, labels, className, ...props
}: ActivityProps) {
  const words = {...activityLabels, ...labels};
  const ref = useRef<HTMLDivElement>(null);
  const loader = useAntiFlicker(waiting, delay, minLoader);
  const live = useSettled(active, settle);
  const phrase = useHeldPhrase(label ?? '', live, minDisplay);
  const state = loader ? 'waiting' : live ? 'active' : waiting || (!label && !summary) ? 'idle' : 'done';
  const moving = state === 'active' || state === 'waiting';
  const liveText = state === 'waiting' ? (label ?? words.starting) : phrase;
  const {text: scrambled} = useScramble(liveText, {ref, clock, play: moving});
  const done = summary ?? (phrase ? `${pastTense(phrase)}.` : '');
  const announced = state === 'done' ? `${done} ${words[status]}` : state === 'waiting' ? liveText : '';
  const label_ = size === 'sm' ? 'type-label-sm' : 'type-label';

  return <div
    ref={ref}
    data-slot="activity"
    data-state={state}
    data-size={size}
    aria-busy={moving || undefined}
    className={cn('flex max-w-full min-w-0 items-center gap-3', size === 'sm' ? 'min-h-(--control-sm)' : 'min-h-(--control)', className)}
    {...props}
  >
    {moving && <>
      <span aria-hidden className="pending shrink-0 text-text-1"/>
      <span className={cn('min-w-0 truncate text-text-1', label_)}>
        <span aria-hidden>{scrambled}</span>
        <span className="sr-only">{liveText}</span>
      </span>
      {state === 'active' && elapsed !== undefined && <span className="shrink-0 type-code-sm text-text-3">{formatElapsed(elapsed)}</span>}
    </>}
    {state === 'done' && <>
      <span className={cn('min-w-0 text-text-2', size === 'sm' ? 'type-caption' : 'type-body-sm')}>{done}</span>
      <span aria-hidden className={cn('shrink-0', size === 'sm' ? 'type-micro' : 'type-label-sm', endTone[status])}>{words[status]}</span>
    </>}
    {announce && <span role="status" className="sr-only">{announced}</span>}
  </div>;
}

export {Activity, pastTense, type ActivityEnd, type ActivityLabels, type ActivityProps};
