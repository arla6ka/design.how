'use client';

import {Collapsible as CollapsiblePrimitive} from '@base-ui/react/collapsible';
import {mergeProps} from '@base-ui/react/merge-props';
import {useRender} from '@base-ui/react/use-render';
import {cva, type VariantProps} from 'class-variance-authority';
import {useEffect, useRef, useState} from 'react';
import {Icon, Check, ChevronRight, Close, Pending, Subtract} from '../icon';
import {Status} from '../ui/status';
import {cn} from '../lib/utils';

function formatElapsed(ms: number) {
  const v = Number.isFinite(ms) ? Math.max(0, ms) : 0;
  if (Math.round(v) < 1000) return `${Math.round(v)}ms`;
  const tenths = Math.round(v / 100);
  if (tenths < 600) return `${(tenths / 10).toFixed(1)}s`;
  const pad = (n: number) => String(n).padStart(2, '0');
  const secs = Math.round(v / 1000);
  if (secs < 3600) return `${Math.floor(secs / 60)}m ${pad(secs % 60)}s`;
  const mins = Math.round(v / 60_000);
  if (mins < 24 * 60) return `${Math.floor(mins / 60)}h ${pad(mins % 60)}m`;
  const hours = Math.round(v / 3_600_000);
  return `${Math.floor(hours / 24)}d ${pad(hours % 24)}h`;
}

function formatCount(n: number) {
  return Number.isFinite(n) ? n.toLocaleString('en-US') : '0';
}

type ActivityTextProps = useRender.ComponentProps<'span'> & {
  active?: boolean;
};

function ActivityText({active = true, className, render, children, ...props}: ActivityTextProps) {
  return useRender({
    defaultTagName: 'span',
    props: mergeProps<'span'>(
      {className: cn(className), children},
      {'data-slot': 'activity-text', 'data-active': active || undefined} as React.ComponentProps<'span'>,
      props,
    ),
    render,
    state: {slot: 'activity-text', active},
  });
}

function ActivityArc({className}: {className?: string}) {
  return <span aria-hidden data-slot="activity-arc" className={cn('flex size-4 shrink-0 items-center justify-center', className)}>
    <Icon icon={Pending} size={12} className="animate-spin motion-reduce:animate-none"/>
  </span>;
}

const irregular: Record<string, string> = {
  running: 'ran', reading: 'read', writing: 'wrote', finding: 'found', building: 'built', sending: 'sent',
  getting: 'got', making: 'made', thinking: 'thought', setting: 'set', putting: 'put', cutting: 'cut',
  taking: 'took', giving: 'gave', seeing: 'saw', choosing: 'chose', bringing: 'brought', keeping: 'kept',
  leaving: 'left', holding: 'held', drawing: 'drew', spending: 'spent', splitting: 'split', telling: 'told',
  understanding: 'understood', rewriting: 'rewrote', rerunning: 'reran', rebuilding: 'rebuilt', resetting: 'reset',
  doing: 'did', going: 'went', paying: 'paid', saying: 'said', meeting: 'met', feeding: 'fed', winning: 'won',
  gathering: 'gathered',
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

function joinSummary(done: string[], trouble: string[] = []) {
  const head = done.filter(Boolean).join(', ');
  const cased = head ? head[0].toUpperCase() + head.slice(1) : '';
  return [cased, ...trouble.filter(Boolean)].filter(Boolean).join(', ');
}

const MIN_DISPLAY = 1000;

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
  thinking?: string;
  stopped?: string;
  warnEnd?: string;
  failEnd?: string;
  stoppedEnd?: string;
};

const activityLabels: Required<ActivityLabels> = {
  thinking: 'Thinking', stopped: 'Stopped', warnEnd: 'with a warning', failEnd: 'failed', stoppedEnd: 'stopped',
};

const activityVariants = cva('relative flex w-fit max-w-full min-w-0 items-center text-start text-text-1', {
  variants: {
    size: {
      default: 'gap-1.5 type-label',
      sm: 'gap-1 type-body-sm',
    },
  },
  defaultVariants: {size: 'default'},
});

type ActivityProps = Omit<React.ComponentProps<'span'>, 'children'> & VariantProps<typeof activityVariants> & {
  label?: string;
  active?: boolean;
  waiting?: boolean;
  doneLabel?: string;
  status?: ActivityEnd;
  minDisplay?: number;
  settle?: number;
  delay?: number;
  minLoader?: number;
  announce?: boolean;
  labels?: ActivityLabels;
};

function Activity({
  label, active = false, waiting = false, doneLabel, status = 'ok', size = 'default',
  minDisplay = MIN_DISPLAY, settle = 400, delay = 150, minLoader = 400, announce = true, labels, className, ...props
}: ActivityProps) {
  const words = {...activityLabels, ...labels};
  const loader = useAntiFlicker(waiting, delay, minLoader);
  const live = useSettled(active, settle);
  const phrase = useHeldPhrase(label ?? '', live, minDisplay);
  const state = loader ? 'waiting' : live ? 'active' : waiting || (!label && !doneLabel) ? 'idle' : 'done';
  const text = state === 'waiting' ? (label ?? words.thinking)
    : state === 'active' ? phrase
      : state === 'idle' ? ''
        : (doneLabel ?? (status === 'stopped' ? words.stopped : pastTense(phrase)));

  const end = {ok: '', warn: words.warnEnd, fail: words.failEnd, stopped: words.stoppedEnd}[status];
  const said = end && !text.toLowerCase().includes(end.toLowerCase().replace(/^with a /, '')) ? `, ${end}` : '';
  const announced = state === 'done' ? `${text}${said}` : state === 'waiting' ? text : '';
  const moving = state === 'active' || state === 'waiting';
  const trouble = state === 'done' && (status === 'warn' || status === 'fail');

  return <span
    data-slot="activity"
    data-state={state}
    data-size={size}
    aria-busy={moving || undefined}
    className={cn(activityVariants({size}), className)}
    {...props}
  >
    {moving && <ActivityArc className="text-text-2"/>}
    <ActivityText active={moving} className={cn('min-w-0 truncate', state === 'done' && 'text-text-2')}>{text}</ActivityText>
    {trouble && <Status status={status} size={size === 'sm' ? 'sm' : 'default'} className="shrink-0" aria-hidden/>}
    {announce && <span role="status" className="sr-only">{announced}</span>}
  </span>;
}

type ActivityItem = {id: string; label: string; status: 'pending' | 'running' | 'ok' | 'fail' | 'stopped' | 'denied' | 'waiting'};

function pickActivity<T extends Pick<ActivityItem, 'status'>>(items: readonly T[]): T | undefined {
  for (let i = items.length - 1; i >= 0; i--) if (items[i].status === 'running' || items[i].status === 'pending' || items[i].status === 'waiting') return items[i];
  for (let i = items.length - 1; i >= 0; i--) if (items[i].status !== 'fail') return items[i];
  return items.at(-1);
}

type StepState = 'running' | 'done' | 'fail' | 'stopped';

function StepGlyph({state, className}: {state: StepState; className?: string}) {
  if (state === 'running') return <ActivityArc className={cn('text-text-2', className)}/>;
  return <span aria-hidden data-slot="step-glyph" data-state={state} className={cn('flex size-4 shrink-0 items-center justify-center', className)}>
    {state === 'done' ? <Icon icon={Check} size={12} className="text-text-3"/>
      : state === 'fail' ? <Icon icon={Close} size={12} className="text-fail-text"/>
        : <Icon icon={Subtract} size={12} className="text-text-3"/>}
  </span>;
}

function Disclosure({open, end = false}: {open: boolean; end?: boolean}) {
  if (end && !open) return null;
  return <span aria-hidden data-slot="disclosure" data-end={end || undefined} className="flex size-4 shrink-0 items-center justify-center text-text-3">
    {open && <Icon icon={ChevronRight} size={12} className="transition-[rotate] duration-(--dur-state) ease-out group-data-panel-open/row:rotate-90 motion-reduce:transition-none rtl:-scale-x-100 rtl:group-data-panel-open/row:-rotate-90"/>}
  </span>;
}

const rowVariants = cva('group/row -mx-2 flex max-w-[calc(100%+var(--space-4))] min-w-0 items-center gap-2 self-start rounded-tag px-2 text-start type-body-sm focus-visible:focus-ring-inset pointer-coarse:min-h-11', {
  variants: {
    size: {default: 'min-h-(--control)', sm: 'min-h-(--menu-row-sm)'},
    opens: {true: 'transition-colors duration-(--dur-state) ease-out hover:bg-hover active:bg-pressed', false: ''},
  },
  defaultVariants: {size: 'default', opens: true},
});

type ActivityGroupProps = Omit<React.ComponentProps<'div'>, 'children'> & {
  summary: React.ReactNode;
  meta?: React.ReactNode;
  live?: boolean;
  children?: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  size?: 'default' | 'sm';
};

function ActivityGroup({summary, meta, live = false, open, defaultOpen = false, onOpenChange, size = 'default', className, children, ...props}: ActivityGroupProps) {
  const {force, rest} = splitForce(props);
  return <CollapsiblePrimitive.Root
    data-slot="activity-group"
    data-live={live || undefined}
    open={open}
    defaultOpen={defaultOpen}
    onOpenChange={onOpenChange}
    className={cn('flex min-w-0 flex-col', className)}
    {...rest}
  >
    <CollapsiblePrimitive.Trigger data-slot="activity-group-trigger" className={rowVariants({size})} {...force}>
      <Disclosure open/>
      <span data-slot="activity-group-summary" className="min-w-0 truncate text-text-2">{summary}</span>
      <span data-slot="activity-group-meta" className="flex shrink-0 items-center gap-2 text-text-2 data empty:hidden">
        {meta ?? (live ? <ActivityArc/> : null)}
      </span>
    </CollapsiblePrimitive.Trigger>
    <CollapsiblePrimitive.Panel data-slot="activity-group-content" className="flex min-w-0 flex-col ps-6">
      {children}
    </CollapsiblePrimitive.Panel>
  </CollapsiblePrimitive.Root>;
}

function splitForce<T extends Record<string, unknown>>(props: T) {
  const force: Record<string, unknown> = {};
  const rest: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) (k.startsWith('data-force-') ? force : rest)[k] = v;
  return {force, rest: rest as T};
}

export {
  Activity, ActivityText, ActivityArc, ActivityGroup, Disclosure, StepGlyph, pastTense, joinSummary, pickActivity, useAntiFlicker,
  useHeldPhrase, splitForce, formatElapsed, formatCount, MIN_DISPLAY, activityVariants, rowVariants,
  type ActivityProps, type ActivityLabels, type ActivityTextProps, type ActivityEnd, type ActivityItem, type ActivityGroupProps, type StepState,
};
