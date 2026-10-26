'use client';

import {Children, createContext, isValidElement, use, useId, useRef, useState, type CSSProperties, type ReactNode} from 'react';
import {Icon, ChevronDown, ChevronUp} from '../icon';
import {useDraw} from '../hooks/use-draw';
import {useScramble} from '../hooks/use-scramble';
import {useTyping} from '../hooks/use-typing';
import {cn} from '../lib/utils';

type StepState = 'queued' | 'running' | 'waiting' | 'done' | 'failed' | 'stopped';

type StepWords = Record<StepState, string>;
const stepWords: StepWords = {queued: 'Queued', running: 'Running', waiting: 'Needs approval', done: 'Done', failed: 'Failed', stopped: 'Stopped'};

function formatElapsed(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 10_000) return `${(Math.floor(ms / 100) / 10).toFixed(1)}s`;
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${String(s % 60).padStart(2, '0')}s`;
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
}

type StackState = {progress: number[]; connectors: boolean; typing: boolean; clock?: number; size: 'default' | 'sm'};
const StackContext = createContext<StackState | null>(null);
const SlotContext = createContext(-1);

type ToolCallStackProps = Omit<React.ComponentProps<'ol'>, 'children'> & {
  connectors?: boolean;
  size?: 'default' | 'sm';
  clock?: number;
  typing?: boolean;
  play?: boolean;
  children?: ReactNode;
};

function ToolCallStack({connectors = true, typing = true, size = 'default', clock, play, className, children, ...props}: ToolCallStackProps) {
  const ref = useRef<HTMLOListElement>(null);
  const items = Children.toArray(children).filter(isValidElement);
  const progress = useDraw(connectors ? items.length : 0, {ref, clock, play});
  return <ol ref={ref} data-slot="tool-call-stack" data-size={size} className={cn('flex min-w-0 flex-col gap-5 has-[>li:first-child_[data-slot=tool-call-tab]]:pt-4', connectors && 'ps-4', className)} {...props}>
    <StackContext value={{progress, connectors, typing, clock, size}}>
      {items.map((child, i) => <SlotContext key={child.key ?? i} value={i}>{child}</SlotContext>)}
    </StackContext>
  </ol>;
}

const clamp = (n: number) => Math.min(1, Math.max(0, n));

const boxState: Record<StepState, string> = {
  queued: 'border-line',
  running: 'border-line-control',
  waiting: 'border-warn',
  done: 'border-line',
  failed: 'border-fail bg-fail-tint',
  stopped: 'border-line',
};
const labelState: Record<StepState, string> = {
  queued: 'text-text-2',
  running: 'text-text-1',
  waiting: 'text-text-1',
  done: 'text-text-1',
  failed: 'text-fail-text',
  stopped: 'text-text-3',
};
const tabState: Partial<Record<StepState, string>> = {
  running: 'selected border border-accent-edge',
  waiting: 'border border-warn bg-warn-tint text-warn-text',
  failed: 'border border-fail bg-fail text-text-inverse',
};
const endState: Partial<Record<StepState, string>> = {queued: 'text-text-3', done: 'text-ok-text', stopped: 'text-text-3'};

type ToolCallRowProps = Omit<React.ComponentProps<'li'>, 'children' | 'ref'> & {
  label: string;
  detail?: ReactNode;
  state?: StepState;
  tab?: string;
  word?: string;
  duration?: number;
  words?: Partial<StepWords>;
  children?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  toggleLabel?: string;
  clock?: number;
  size?: 'default' | 'sm';
};

function ToolCallTab({state, words, clock}: {state: StepState; words: string; clock?: number}) {
  const ref = useRef<HTMLSpanElement>(null);
  const {text} = useScramble(words, {ref, clock});
  return <span ref={ref} data-slot="tool-call-tab" data-state={state} className={cn('absolute -start-(--line-width) bottom-full flex h-4 max-w-full min-w-0 items-center gap-1.5 px-1.5 type-micro', tabState[state])}>
    {state === 'running' && <span aria-hidden className="pending"/>}
    <span aria-hidden className="truncate">{text}</span>
  </span>;
}

function ToolCallRow({label, detail, state = 'done', tab, word, duration, words, children, open: openProp, defaultOpen = false, onOpenChange, toggleLabel, clock: clockProp, size: sizeProp, className, ...props}: ToolCallRowProps) {
  const stack = use(StackContext);
  const index = use(SlotContext);
  const bodyId = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const [openState, setOpenState] = useState(defaultOpen);
  const open = openProp ?? openState;
  const setOpen = (next: boolean) => { if (openProp === undefined) setOpenState(next); onOpenChange?.(next); };
  const size = sizeProp ?? stack?.size ?? 'default';
  const clock = clockProp ?? stack?.clock;
  const all = {...stepWords, ...words};
  const tabWords = tabState[state] ? tab ?? all[state] : undefined;
  const endWord = endState[state] ? word ?? all[state] : undefined;
  const time = duration !== undefined ? formatElapsed(duration) : '';
  const hasBody = children !== undefined && children !== null && children !== false;
  const Root = (stack ? 'li' : 'div') as 'li';

  const connected = !!stack?.connectors && index >= 0;
  const hop = connected ? stack.progress[index] ?? 0 : 1;
  const next = connected ? stack.progress[index + 1] : undefined;
  const elbow = index > 0 ? clamp(hop * 2 - 1) : hop;
  const seg = next === undefined ? undefined : clamp(next * 2);

  const status = state === 'running' || state === 'waiting' || state === 'failed' ? tabWords : endWord;
  const name = toggleLabel ?? [label, typeof detail === 'string' ? detail : '', status, time].filter(Boolean).join(', ');

  const typed = useTyping(label, {ref: boxRef, clock, play: elbow >= 1});
  const typingNow = !!stack?.typing && !typed.done;
  const headerInner = <>
    <span data-slot="tool-call-label" className={cn('min-w-0 shrink truncate', !typingNow && 'bracketed', size === 'sm' ? 'type-label-sm' : 'type-label', labelState[state])}>
      {typingNow
        ? <span className="relative">
            <span className="invisible bracketed">{label}</span>
            {typed.shown && <span aria-hidden className="absolute inset-0 bracketed">{typed.shown}{typed.typing && <span className="caret"/>}</span>}
            <span className="sr-only">{label}</span>
          </span>
        : label}
    </span>
    {detail !== undefined && <span data-slot="tool-call-detail" className={cn('min-w-0 grow basis-0 truncate type-code-sm @max-[22rem]/step:order-last @max-[22rem]/step:basis-full', state === 'failed' ? 'text-fail-text' : 'text-text-2')}>{detail}</span>}
    <span className="ms-auto flex shrink-0 items-center gap-3">
      {time && <span data-slot="tool-call-time" className="type-code-sm text-text-3">{time}</span>}
      {endWord && <span data-slot="tool-call-word" className={cn('type-label-sm', endState[state])}>{endWord}</span>}
      {hasBody && <Icon icon={open ? ChevronUp : ChevronDown} className={cn(state === 'failed' ? 'text-fail-text' : 'text-text-2')}/>}
    </span>
    {status && !hasBody && <span className="sr-only">{status}</span>}
  </>;
  const headerClass = cn('flex min-w-0 items-center gap-3 px-inset text-start @max-[22rem]/step:flex-wrap @max-[22rem]/step:gap-y-0.5 @max-[22rem]/step:py-1.5', size === 'sm' ? 'min-h-(--row-sm)' : 'min-h-(--row)');

  return <Root
    data-slot="tool-call-row"
    data-state={state}
    data-size={size}
    aria-busy={state === 'running' || undefined}
    className={cn('relative min-w-0', className)}
    {...props}
  >
    {connected && seg !== undefined && <span
      aria-hidden
      data-slot="tool-call-spine"
      style={{'--draw': seg} as CSSProperties}
      className={cn('absolute -start-3 w-0 origin-top scale-y-(--draw) border-s border-dashed border-mark', size === 'sm' ? 'top-4 h-[calc(100%+var(--space-5)+var(--line-width))]' : 'top-5 h-[calc(100%+var(--space-5)+var(--line-width))]')}
    />}
    <div ref={boxRef} data-slot="tool-call-box" className={cn('relative flex min-w-0 items-stretch border bg-page', boxState[state])}>
      {connected && <span aria-hidden data-slot="tool-call-connector" className={cn('absolute end-full top-0 flex w-3 items-center', size === 'sm' ? 'h-(--row-sm)' : 'h-(--row)')}>
        <span style={{'--draw': elbow} as CSSProperties} className="h-0 grow origin-left scale-x-(--draw) border-t border-dashed border-mark rtl:origin-right"/>
        <span className={cn('size-1 shrink-0 bg-mark', elbow < 1 && 'invisible')}/>
      </span>}
      {tabWords && <ToolCallTab state={state} words={tabWords} clock={clock}/>}
      <div className="@container/step flex min-w-0 grow flex-col">
        {hasBody
          ? <button
              type="button"
              data-slot="tool-call-header"
              aria-expanded={open}
              aria-controls={bodyId}
              aria-label={name}
              onClick={() => setOpen(!open)}
              className={cn(headerClass, 'w-full cursor-pointer transition-[background-color] duration-(--dur-state) ease-out hover:bg-hover focus-visible:focus-ring-inset')}
            >{headerInner}</button>
          : <div data-slot="tool-call-header" className={headerClass}>{headerInner}</div>}
        {hasBody && <div id={bodyId} data-slot="tool-call-body" hidden={!open} className={cn('min-w-0 border-t', state === 'failed' ? 'border-fail' : 'border-line-faint')}>{children}</div>}
      </div>
    </div>
  </Root>;
}

export {ToolCallStack, ToolCallRow, formatElapsed, stepWords, type StepState, type StepWords, type ToolCallRowProps, type ToolCallStackProps};
