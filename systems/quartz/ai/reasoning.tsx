'use client';

import {Collapsible as CollapsiblePrimitive} from '@base-ui/react/collapsible';
import {createContext, useContext, useEffect, useLayoutEffect, useRef, useState} from 'react';
import type {Kind} from '../lib/kind';
import {ActivityText, Disclosure, rowVariants} from './activity';
import {Status, StatusArc} from '../ui/status';
import {useStickToBottom} from './conversation';
import {Response} from './response';
import {cn, mergeClass, withDefaults} from '../lib/utils';
import {useScrollTabStop} from '../lib/scroll-focus';

function reasoningHeading(text: string): string | undefined {
  const html = text.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i)?.[1];
  const atx = text.match(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/m)?.[1];
  const setext = text.match(/^(?!\s*$)([^\n]+)\n\s{0,3}(=+|-+)\s*$/m)?.[1];
  const bold = text.match(/^\s*(?:\*\*|__)([^*_\n]+)(?:\*\*|__)\s*$/m)?.[1];
  const found = [html, atx, setext, bold]
    .filter((h): h is string => !!h)
    .map(h => ({h, at: text.indexOf(h)}))
    .sort((a, b) => a.at - b.at)[0]?.h;
  if (!found) return undefined;
  const clean = found
    .replace(/<[^>]+>/g, '')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|__|\*|_)(.+?)\1/g, '$2')
    .trim();
  return clean || undefined;
}

type ReasoningLabels = {
  thinking?: string;
  stoppedEarly?: string;
  thoughtFor?: (time: string) => string;
  moment?: string;
};

const reasoningLabels: Required<ReasoningLabels> = {thinking: 'Thinking', stoppedEarly: 'Stopped before thinking', thoughtFor: time => `Thought for ${time}`, moment: 'a moment'};

type ReasoningContextValue = {
  streaming: boolean;
  words: Required<ReasoningLabels>;
  open: boolean;
  duration?: number;
  heading?: string;
  text: string;
  parts: boolean;
  fromTop: React.RefObject<boolean>;
};

const ReasoningContext = createContext<ReasoningContextValue | null>(null);

function useReasoning() {
  const ctx = useContext(ReasoningContext);
  if (!ctx) throw new Error('Reasoning parts must be used inside <Reasoning>');
  return ctx;
}

function useAutoOpen(streaming: boolean, defaultOpen: boolean) {
  const [open, setOpen] = useState(streaming || defaultOpen);
  const pinned = useRef(false);
  const fromTop = useRef(false);
  const wasStreaming = useRef(streaming);

  useEffect(() => {
    const was = wasStreaming.current;
    wasStreaming.current = streaming;
    if (streaming && !was) { pinned.current = false; setOpen(true); }
    else if (!streaming && was && !pinned.current) setOpen(false);
  }, [streaming]);

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    pinned.current = next;
    if (!streaming && next) fromTop.current = true;
  };
  return {open, onOpenChange, fromTop};
}

type ReasoningProps = Omit<CollapsiblePrimitive.Root.Props, 'open' | 'defaultOpen' | 'onOpenChange' | 'children'> & {
  streaming?: boolean;
  duration?: number;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  heading?: string;
  kind?: Kind;
  labels?: ReasoningLabels;
  children?: string | string[] | React.ReactNode;
};

function Reasoning({streaming = false, duration, defaultOpen = false, open: openProp, onOpenChange: onOpenChangeProp, heading, kind = 'agent', labels, className, children, ...props}: ReasoningProps) {
  const words = withDefaults(reasoningLabels, labels);
  const auto = useAutoOpen(streaming, defaultOpen);
  const controlled = openProp !== undefined;
  const open = controlled ? openProp : auto.open;
  const parts = typeof children === 'string' ? [children] : Array.isArray(children) && children.every(c => typeof c === 'string') ? children as string[] : null;
  const text = parts ? parts.join('\n\n') : '';
  const label = heading ?? (parts ? reasoningHeading(parts.at(-1) ?? '') : undefined);
  const onOpenChange = (next: boolean) => {
    if (!controlled) auto.onOpenChange(next);
    onOpenChangeProp?.(next);
  };
  return <ReasoningContext.Provider value={{streaming, words, open, duration, heading: label, text, parts: !!parts, fromTop: auto.fromTop}}>
    <CollapsiblePrimitive.Root
      data-slot="reasoning"
      data-streaming={streaming || undefined}
      data-kind={kind}
      open={open}
      onOpenChange={next => onOpenChange(next)}
      className={mergeClass('group/reasoning @container/reasoning flex min-w-0 flex-col', className)}
      render={rootProps => {
        const {'data-open': _open, ...rest} = rootProps as typeof rootProps & {'data-open'?: string};
        return <div {...rest}/>;
      }}
      {...props}
    >
      {parts ? <><ReasoningTrigger/><ReasoningContent/></> : children as React.ReactNode}
    </CollapsiblePrimitive.Root>
  </ReasoningContext.Provider>;
}

function seconds(duration: number, moment: string) {
  if (!Number.isFinite(duration) || duration < 1) return moment;
  const s = Math.round(duration);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`;
}

type TriggerProps = CollapsiblePrimitive.Trigger.Props & {
  label?: (state: {streaming: boolean; duration?: number; heading?: string}) => React.ReactNode;
};

function ReasoningTrigger({className, label, children, ...props}: TriggerProps) {
  const {streaming, words, duration, heading, text: body, parts} = useReasoning();
  const empty = parts && !body.trim();
  const text = label?.({streaming, duration, heading}) ?? (streaming ? (heading ?? words.thinking) : empty ? words.stoppedEarly : words.thoughtFor(duration === undefined ? words.moment : seconds(duration, words.moment)));
  return <CollapsiblePrimitive.Trigger
    data-slot="reasoning-trigger"
    className={mergeClass(rowVariants(), className)}
    {...props}
  >
    <Disclosure open/>
    {children ?? <>
      <ActivityText active={streaming} className={cn('max-w-full min-w-0 shrink-0 truncate text-text-2', empty && !streaming && 'text-text-3')}>{text}</ActivityText>
      <span data-slot="reasoning-heading" className="min-w-0 truncate text-text-3 empty:hidden">{!streaming && !label ? heading : null}</span>
      <span data-slot="reasoning-status" className="flex shrink-0 items-center justify-end whitespace-nowrap text-text-2">
        {streaming && (heading ? <Status status="running">{words.thinking}</Status> : <StatusArc/>)}
      </span>
    </>}
  </CollapsiblePrimitive.Trigger>;
}

function ReasoningContent({className, children, ...props}: React.ComponentProps<'div'>) {
  const {streaming, open, fromTop, text} = useReasoning();
  const pane = useRef<HTMLDivElement>(null);
  const stick = useStickToBottom(pane, {enabled: streaming && open});
  const tabStop = useScrollTabStop(pane, open);

  useLayoutEffect(() => {
    const el = pane.current;
    if (!el || !open) return;
    if (fromTop.current && !streaming) { el.scrollTop = 0; fromTop.current = false; }
  }, [children, text, open, streaming, fromTop]);

  return <CollapsiblePrimitive.Panel data-slot="reasoning-content">
    <div
      ref={stick.ref}
      data-slot="reasoning-content"
      data-attached={stick.attached}
      aria-busy={streaming || undefined}
      tabIndex={tabStop}
      className={cn(
        'max-h-40 min-w-0 overflow-y-auto ps-6 pb-3 type-body-sm text-text-2 [scrollbar-width:thin]',
        'focus-visible:focus-ring-inset',
        className,
      )}
      {...props}
    >{children ?? <Response size="sm" streaming={streaming} className="text-text-2">{text}</Response>}</div>
  </CollapsiblePrimitive.Panel>;
}

export {Reasoning, ReasoningTrigger, ReasoningContent, reasoningHeading, type ReasoningProps, type ReasoningLabels};
