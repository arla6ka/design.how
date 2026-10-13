'use client';

import {Tooltip} from '@base-ui/react/tooltip';
import {useEffect, useLayoutEffect, useRef, useState, useMemo} from 'react';
import {useQuartzPortal} from '../lib/portal';
import {cn, mergeRefs} from '../lib/utils';
import {tooltipMotionClass, tooltipPopupClass} from './tooltip';

type TextHintProps = {
  content: React.ReactNode;
  children: React.ReactElement<Record<string, unknown>>;
  disabled?: boolean;
  side?: 'top' | 'bottom' | 'left' | 'right';
};

const textHintClass = cn(tooltipPopupClass, 'max-w-[min(var(--hint-width),calc(100vw-var(--gutter-sm)*2))]');

function TextHint({content, children, disabled, side = 'top'}: TextHintProps) {
  const container = useQuartzPortal();
  const [open, setOpen] = useState(false);
  const pointer = useRef('');
  const pinned = useRef(false);
  const coarse = () => pointer.current === 'touch' || pointer.current === 'pen';

  const onOpenChange = (next: boolean, details: Tooltip.Root.ChangeEventDetails) => {
    if (coarse() && details.reason !== 'escape-key' && details.reason !== 'outside-press') return;
    if (pinned.current && !next && details.reason !== 'escape-key' && details.reason !== 'outside-press') return;
    if (!next) pinned.current = false;
    setOpen(next);
  };

  return <Tooltip.Root disabled={disabled} open={open && !disabled} onOpenChange={onOpenChange}>
    <Tooltip.Trigger
      delay={400}
      render={children}
      onPointerDown={(event: React.PointerEvent) => { pointer.current = event.pointerType; }}
      onKeyDown={() => { pointer.current = ''; }}
      onClickCapture={(event: React.MouseEvent) => {
        if (!coarse()) return;
        pointer.current = '';
        if (disabled) return;
        event.preventDefault();
        event.stopPropagation();
        pinned.current = !open;
        setOpen(!open);
      }}
    />
    <Tooltip.Portal container={container}>
      <Tooltip.Positioner side={side} sideOffset={8} collisionPadding={16} className="z-(--z-overlay)">
        <Tooltip.Popup
          data-slot="text-hint"
          data-surface="inverse"
          className={cn(textHintClass, tooltipMotionClass, 'origin-(--transform-origin)')}
        ><span className="min-w-0">{content}</span></Tooltip.Popup>
      </Tooltip.Positioner>
    </Tooltip.Portal>
  </Tooltip.Root>;
}

const graphemes = typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter(undefined, {granularity: 'grapheme'}) : null;

function characterStarts(text: string): number[] {
  if (graphemes) return Array.from(graphemes.segment(text), s => s.index);
  const starts: number[] = [];
  let at = 0;
  for (const point of text) { starts.push(at); at += point.length; }
  return starts;
}

function splitTail(text: string, tail: number | 'auto') {
  const starts = characterStarts(text);
  if (tail === 'auto') {
    const slash = text.lastIndexOf('/');
    if (slash > 0 && slash < text.length - 1 && starts.length - starts.indexOf(slash) <= 32) return slash;
    tail = 6;
  }
  tail = Math.floor(tail);
  if (!(tail > 0)) return text.length;
  return starts.length <= tail ? 0 : starts[starts.length - tail];
}

function useClipped(ref: React.RefObject<HTMLElement | null>, text: string) {
  const [clipped, setClipped] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setClipped(el.scrollWidth > el.clientWidth + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, text]);
  return clipped;
}

type TruncateProps = Omit<React.ComponentProps<'span'>, 'children'> & {
  children: string;
  position?: 'end' | 'middle';
  tail?: number | 'auto';
  hint?: boolean;
  focusable?: boolean;
};

const escapeRe = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function MiddleTruncate({children, tail, hint, focusable, className, ...props}: Omit<TruncateProps, 'position'> & {tail: number | 'auto'; hint: boolean; focusable: boolean}) {
  const outer = useRef<HTMLSpanElement>(null);
  const head = useRef<HTMLSpanElement>(null);
  const tailEl = useRef<HTMLSpanElement>(null);
  const dots = useRef<HTMLSpanElement>(null);
  const [clipped, setClipped] = useState(false);
  const at = splitTail(children, tail);
  const headText = children.slice(0, at);
  const tailText = children.slice(at);

  useLayoutEffect(() => {
    const box = outer.current;
    const h = head.current;
    const t = tailEl.current;
    const d = dots.current;
    const node = h?.firstChild;
    if (!box || !h || !t || !d || !node) return;
    const span = (n: number) => {
      const range = document.createRange();
      range.setStart(node, 0);
      range.setEnd(node, n);
      return range.getBoundingClientRect().width;
    };
    const ends = [...characterStarts(headText).slice(1), headText.length];
    const measure = () => {
      h.style.width = '';
      d.style.display = 'none';
      const avail = box.clientWidth;
      const full = span(headText.length) + t.getBoundingClientRect().width;
      if (full <= avail + 0.5 || headText.length === 0) { setClipped(false); return; }
      d.style.display = 'inline';
      const room = avail - d.getBoundingClientRect().width - t.getBoundingClientRect().width;
      let lo = -1;
      let hi = ends.length - 1;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (span(ends[mid]) <= room) lo = mid; else hi = mid - 1;
      }
      h.style.width = `${lo < 0 ? 0 : span(ends[lo])}px`;
      setClipped(true);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    document.fonts?.ready.then(measure);
    return () => observer.disconnect();
  }, [headText, tailText]);

  const onCopy = (event: React.ClipboardEvent<HTMLSpanElement>) => {
    const selected = window.getSelection()?.toString() ?? '';
    if (!selected) return;
    const joined = new RegExp(`${escapeRe(headText)}\\s*${escapeRe(tailText)}`);
    event.clipboardData.setData('text/plain', joined.test(selected) ? selected.replace(joined, children) : children);
    event.preventDefault();
  };

  const tab = clipped && hint && focusable ? 0 : undefined;
  const text = <span ref={outer} className="block min-w-0 max-w-full">
    <span
      data-slot="truncate"
      data-position="middle"
      data-clipped={clipped || undefined}
      dir="auto"
      tabIndex={tab}
      onCopy={onCopy}
      className={cn('inline-flex max-w-full whitespace-nowrap select-all focus-visible:rounded-soft', className)}
      {...props}
    >
      <span ref={head} data-slot="truncate-head" className="overflow-hidden">{headText}</span>
      <span ref={dots} data-slot="truncate-ellipsis" aria-hidden="true" className="hidden shrink-0 select-none">…</span>
      <span ref={tailEl} data-slot="truncate-tail" className="shrink-0">{tailText}</span>
    </span>
  </span>;
  if (!hint) return text;
  return <TextHint content={<span className="[overflow-wrap:anywhere]">{children}</span>} disabled={!clipped}>{text}</TextHint>;
}

function Truncate({children, position = 'end', tail = 'auto', hint = true, focusable = true, className, ref, ...props}: TruncateProps) {
  const cut = useRef<HTMLSpanElement>(null);
  const cutRefs = useMemo(() => mergeRefs(cut, ref), [ref]);
  const clipped = useClipped(cut, children);
  if (position === 'middle') return <MiddleTruncate tail={tail} hint={hint} focusable={focusable} className={className} ref={ref} {...props}>{children}</MiddleTruncate>;
  const tab = clipped && hint && focusable ? 0 : undefined;
  const text = <span
      ref={cutRefs}
      data-slot="truncate"
      data-position="end"
      data-clipped={clipped || undefined}
      tabIndex={tab}
      className={cn(
        'block min-w-0 overflow-hidden whitespace-nowrap',
        'data-clipped:[mask-image:linear-gradient(to_right,black_calc(100%-var(--space-6)),transparent)]',
        'rtl:data-clipped:[mask-image:linear-gradient(to_left,black_calc(100%-var(--space-6)),transparent)]',
        'focus-visible:rounded-soft',
        className,
      )}
      {...props}
    >{children}</span>;

  if (!hint) return text;
  return <TextHint content={<span className="[overflow-wrap:anywhere]">{children}</span>} disabled={!clipped}>{text}</TextHint>;
}

export {Truncate, TextHint, textHintClass, splitTail, type TruncateProps, type TextHintProps};
