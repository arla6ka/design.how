'use client';

import {createContext, memo, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {Icon, ArrowDown, ArrowUp} from '../icon';
import {Button} from '../ui/button';
import {InkSlot, Status, statusLabels} from '../ui/status';
import {DiffCount} from './tool-call';
import {AgentTurn, Message, MessageBubble, MessageBubbleContent, MessageContent, MessageDivider, MessageHeader, MessageTime} from './message';
import {cn, mergeClass, mergeRefs, withDefaults} from '../lib/utils';

const STICK = 30;
const REATTACH = 5;
const DOWN_GESTURE_MS = 800;

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function nestedCanScrollUp(target: EventTarget | null, root: HTMLElement) {
  let el = target instanceof Element ? target : null;
  while (el && el !== root) {
    if (el instanceof HTMLElement && el.scrollHeight > el.clientHeight + 1) {
      const oy = getComputedStyle(el).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && el.scrollTop > 0) return true;
    }
    el = el.parentElement;
  }
  return false;
}

type StickOptions = {
  enabled?: boolean;
  content?: React.RefObject<HTMLElement | null>;
};

function useStickToBottom(ref: React.RefObject<HTMLElement | null>, {enabled = true, content}: StickOptions = {}) {
  const attached = useRef(true);
  const paused = useRef(false);
  const follows = useRef(enabled);
  follows.current = enabled;
  const lastTop = useRef(0);
  const downAt = useRef(-Infinity);
  const dragging = useRef(false);
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [distance, setDistance] = useState(0);
  const [isAttached, setAttached] = useState(true);

  const setAttach = useCallback((value: boolean) => { attached.current = value; setAttached(value); }, []);

  const callbackRef = useCallback((el: HTMLElement | null) => { ref.current = el; setNode(el); }, [ref]);
  useLayoutEffect(() => { if (ref.current !== node) setNode(ref.current); });

  const measure = useCallback((fromScroll = false) => {
    const el = ref.current;
    if (!el) return;
    const d = Math.max(0, el.scrollHeight - el.scrollTop - el.clientHeight);
    const movedDown = el.scrollTop > lastTop.current;
    if (fromScroll) lastTop.current = el.scrollTop;
    if (!attached.current && fromScroll && movedDown && d <= REATTACH && (dragging.current || performance.now() - downAt.current < DOWN_GESTURE_MS)) setAttach(true);
    setDistance(d);
  }, [ref, setAttach]);

  const scrollToEnd = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = ref.current;
    if (!el) return;
    setAttach(true);
    el.scrollTo({top: el.scrollHeight, behavior: behavior === 'smooth' && !reducedMotion() ? 'smooth' : 'auto'});
  }, [ref, setAttach]);

  useEffect(() => {
    const el = node;
    if (!el) return;
    lastTop.current = el.scrollTop;
    const follow = () => {
      if (follows.current && attached.current && !paused.current) el.scrollTop = el.scrollHeight;
      measure();
    };
    const resize = new ResizeObserver(follow);
    resize.observe(el);
    const inner = content?.current ?? (el.firstElementChild as HTMLElement | null);
    if (inner) resize.observe(inner);
    const mutations = new MutationObserver(follow);
    mutations.observe(el, {childList: true, subtree: true, characterData: true});

    const detach = () => { if (attached.current) setAttach(false); };
    const down = () => { downAt.current = performance.now(); };
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY < 0 && !nestedCanScrollUp(e.target, el)) detach();
      else if (e.deltaY > 0) down();
    };
    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => { touchY = e.touches[0]?.clientY ?? 0; };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? 0;
      if (y > touchY + 2 && !nestedCanScrollUp(e.target, el)) detach();
      else if (y < touchY - 2) down();
      touchY = y;
    };
    const onTouchEnd = () => down();
    const onPointerDown = (e: PointerEvent) => {
      if (e.target !== el) return;
      const box = el.getBoundingClientRect();
      const inBar = document.dir === 'rtl' || getComputedStyle(el).direction === 'rtl' ? e.clientX < box.left + (el.offsetWidth - el.clientWidth) : e.clientX > box.left + el.clientWidth;
      if (inBar) { detach(); dragging.current = true; }
    };
    const onPointerUp = () => { if (dragging.current) { dragging.current = false; down(); } };
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, [contenteditable="true"], select')) return;
      if (e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'Home' || (e.key === ' ' && e.shiftKey)) detach();
      else if (e.key === 'End') { e.preventDefault(); scrollToEnd(); }
      else if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') down();
    };
    const onScroll = () => measure(true);
    const onSelection = () => {
      const sel = document.getSelection();
      paused.current = !!sel && !sel.isCollapsed && !!sel.anchorNode && el.contains(sel.anchorNode);
      if (!paused.current) follow();
    };
    const onVisible = () => { if (!document.hidden) follow(); };

    el.addEventListener('wheel', onWheel, {passive: true});
    el.addEventListener('touchstart', onTouchStart, {passive: true});
    el.addEventListener('touchmove', onTouchMove, {passive: true});
    el.addEventListener('touchend', onTouchEnd, {passive: true});
    el.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    el.addEventListener('keydown', onKey);
    el.addEventListener('scroll', onScroll, {passive: true});
    document.addEventListener('selectionchange', onSelection);
    document.addEventListener('visibilitychange', onVisible);
    follow();
    return () => {
      resize.disconnect();
      mutations.disconnect();
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('keydown', onKey);
      el.removeEventListener('scroll', onScroll);
      document.removeEventListener('selectionchange', onSelection);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [node, content, measure, setAttach, scrollToEnd]);

  useEffect(() => {
    if (!enabled || !node || !attached.current) return;
    node.scrollTop = node.scrollHeight;
  }, [node, enabled]);

  const detachView = useCallback(() => setAttach(false), [setAttach]);
  return {ref: callbackRef, attached: isAttached, distance, atEnd: distance <= STICK, scrollToEnd, detach: detachView};
}

type ConversationStatus = 'idle' | 'streaming' | 'stopped' | 'error';

type ConversationContextValue = {
  viewportRef: React.RefObject<HTMLDivElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  status: ConversationStatus;
  attached: boolean;
  distance: number;
  atEnd: boolean;
  scrollToEnd: (behavior?: ScrollBehavior) => void;
  snap: () => void;
  detach: () => void;
};

const Ctx = createContext<ConversationContextValue | null>(null);

function useConversation() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useConversation must be used inside Conversation or ConversationProvider');
  return ctx;
}

function State({children, status}: {children: React.ReactNode; status: ConversationStatus}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const stick = useStickToBottom(viewportRef, {content: contentRef});
  const {scrollToEnd, attached, distance, atEnd, detach} = stick;
  const snap = useCallback(() => scrollToEnd('auto'), [scrollToEnd]);
  const value = useMemo(() => ({viewportRef, contentRef, status, attached, distance, atEnd, scrollToEnd, snap, detach}), [status, attached, distance, atEnd, scrollToEnd, snap, detach]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function ConversationProvider({children, status = 'idle'}: {children: React.ReactNode; status?: ConversationStatus}) {
  return <State status={status}>{children}</State>;
}

type ConversationProps = React.ComponentProps<'div'> & {
  status?: ConversationStatus;
};

function Conversation({className, status = 'idle', ...props}: ConversationProps) {
  const outer = useContext(Ctx);
  const root = <div
    data-slot="conversation"
    data-status={outer ? outer.status : status}
    className={cn('group/conversation relative flex size-full min-h-0 flex-col overflow-hidden', className)}
    {...props}
  />;
  return outer ? root : <State status={status}>{root}</State>;
}

type ConversationViewportLabels = {
  complete?: string;
  stopped?: string;
  failed?: string;
};

const viewportLabels: Required<ConversationViewportLabels> = {complete: 'Response complete', stopped: 'Stopped', failed: 'Response failed'};

function ConversationViewport({className, 'aria-label': ariaLabel = 'Conversation', labels, children, ref, ...props}: React.ComponentProps<'div'> & {labels?: ConversationViewportLabels}) {
  const {viewportRef, status, attached} = useConversation();
  const words = withDefaults(viewportLabels, labels);
  const announcements: Partial<Record<ConversationStatus, string>> = {idle: words.complete, stopped: words.stopped, error: words.failed};
  const viewportRefs = useMemo(() => mergeRefs(viewportRef, ref), [viewportRef, ref]);
  const [said, setSaid] = useState('');
  const prev = useRef(status);
  useEffect(() => {
    if (prev.current === 'streaming' && status !== 'streaming') setSaid(announcements[status] ?? '');
    if (status === 'streaming') setSaid('');
    prev.current = status;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);
  return <>
    <div
      ref={viewportRefs}
      data-slot="conversation-viewport"
      data-attached={attached}
      role="log"
      aria-live="off"
      aria-label={ariaLabel}
      aria-busy={status === 'streaming' || undefined}
      tabIndex={0}
      className={cn(
        'size-full min-h-0 min-w-0 overflow-y-auto overscroll-contain [overflow-anchor:none] [scrollbar-gutter:stable] [scrollbar-width:thin] focus-visible:focus-ring-inset',
        className,
      )}
      {...props}
    >{children}</div>
    <span role="status" className="sr-only">{said}</span>
  </>;
}

function ConversationContent({className, style, children, ref, ...props}: React.ComponentProps<'div'>) {
  const {contentRef, viewportRef, status, attached} = useConversation();
  const contentRefs = useMemo(() => mergeRefs(contentRef, ref), [contentRef, ref]);
  const [floor, setFloor] = useState(0);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    if (status !== 'streaming') { setFloor(0); return; }
    const ro = new ResizeObserver(() => setFloor(f => Math.max(f, el.scrollHeight)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [contentRef, status]);

  const anchor = useRef<{key: string; top: number} | null>(null);
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const el = contentRef.current;
    if (!viewport || !el) return;
    const prevAnchor = anchor.current;
    if (prevAnchor && !attached) {
      const row = el.querySelector<HTMLElement>(`[data-row-key="${CSS.escape(prevAnchor.key)}"]`);
      if (row) {
        const delta = row.offsetTop - prevAnchor.top;
        if (delta) viewport.scrollTop += delta;
      }
    }
    const rows = el.querySelectorAll<HTMLElement>('[data-row-key]');
    const first = [...rows].find(r => r.offsetTop + r.offsetHeight > viewport.scrollTop);
    anchor.current = first ? {key: first.dataset.rowKey!, top: first.offsetTop} : null;
  });

  return <div
    ref={contentRefs}
    data-slot="conversation-content"
    className={cn('flex h-max min-h-full flex-col justify-end gap-4', className)}
    style={{...style, ...(floor ? {minHeight: floor} : null)}}
    {...props}
  >{children}</div>;
}

type ItemProps = React.ComponentProps<'div'> & {
  rowKey?: string;
  pinned?: boolean;
};

function ConversationItem({className, rowKey, pinned, ...props}: ItemProps) {
  return <div
    data-slot="conversation-item"
    data-row-key={rowKey}
    data-pinned={pinned || undefined}
    className={cn('min-w-0 shrink-0', !pinned && '[contain-intrinsic-size:auto_160px] [content-visibility:auto]' , className)}
    {...props}
  />;
}

function ConversationTail({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="conversation-tail" className={cn('flex min-h-(--control) min-w-0 shrink-0 items-center', className)} {...props}/>;
}

function scrollToItem(viewport: HTMLElement, el: HTMLElement, detach: () => void) {
  detach();
  const top = el.getBoundingClientRect().top - viewport.getBoundingClientRect().top + viewport.scrollTop - viewport.clientHeight / 4;
  viewport.scrollTo({top: Math.max(0, top), behavior: reducedMotion() ? 'auto' : 'smooth'});
}

const marked = (content: HTMLElement) => [...content.querySelectorAll<HTMLElement>('[data-waiting]')];

type ConversationJumpLabels = {
  latest?: string;
  waitingOnYou?: string;
};

const jumpLabels: Required<ConversationJumpLabels> = {latest: 'Latest', waitingOnYou: statusLabels.waiting};

function ConversationJump({className, children, onClick, waiting: watchWaiting = true, labels, ref, ...props}: Omit<React.ComponentProps<typeof Button>, 'onClick'> & {
  onClick?: () => void;
  waiting?: boolean;
  labels?: ConversationJumpLabels;
}) {
  const {distance, viewportRef, contentRef, scrollToEnd, detach} = useConversation();
  const words = withDefaults(jumpLabels, labels);
  const [waiting, setWaiting] = useState<{count: number; away: boolean}>({count: 0, away: false});
  useEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!watchWaiting || !viewport || !content) return;
    const read = () => {
      const calls = marked(content);
      const box = viewport.getBoundingClientRect();
      const away = calls.some(el => { const r = el.getBoundingClientRect(); return r.bottom < box.top || r.top > box.bottom; });
      setWaiting(prev => (prev.count === calls.length && prev.away === away ? prev : {count: calls.length, away}));
    };
    const frame = requestAnimationFrame(read);
    const mo = new MutationObserver(read);
    mo.observe(content, {childList: true, subtree: true, attributes: true, attributeFilter: ['data-waiting']});
    viewport.addEventListener('scroll', read, {passive: true});
    return () => { cancelAnimationFrame(frame); mo.disconnect(); viewport.removeEventListener('scroll', read); };
  }, [watchWaiting, viewportRef, contentRef]);
  const toWaiting = watchWaiting && waiting.away;
  const far = distance > Math.max(400, viewportRef.current?.clientHeight ?? 0);
  const active = far || toWaiting;
  const button = useRef<HTMLButtonElement>(null);
  const buttonRefs = useMemo(() => mergeRefs(button, ref), [ref]);
  useLayoutEffect(() => {
    if (!active && button.current && button.current === document.activeElement) viewportRef.current?.focus({preventScroll: true});
  }, [active, viewportRef]);
  const jump = () => {
    const viewport = viewportRef.current;
    const first = contentRef.current && marked(contentRef.current).at(0);
    if (toWaiting && viewport && first) {
      scrollToItem(viewport, first, detach);
      (first.querySelector<HTMLElement>('[data-slot=tool-call-actions] button') ?? first.querySelector<HTMLElement>('button'))?.focus({preventScroll: true});
    } else scrollToEnd();
    onClick?.();
  };
  return <Button
    ref={buttonRefs}
    data-slot="conversation-jump"
    data-active={active}
    data-waiting={toWaiting || undefined}
    variant="secondary"
    size="sm"
    inert={!active || undefined}
    onClick={jump}
    className={mergeClass([
      'absolute end-5 bottom-4 z-(--z-raised) before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:shadow-overlay',
      'transition-opacity duration-(--dur-base) motion-reduce:transition-none',
      'data-[active=false]:pointer-events-none data-[active=false]:opacity-0',
    ], className)}
    {...props}
  >{children ?? (toWaiting
    ? <><Icon icon={waitingAbove(viewportRef.current, contentRef.current) ? ArrowUp : ArrowDown} size={16}/>{words.waitingOnYou}<InkSlot size="sm" aria-hidden>{waiting.count}</InkSlot><span className="sr-only">, {waiting.count}</span></>
    : <><Icon icon={ArrowDown} size={16}/>{words.latest}</>)}</Button>;
}

function waitingAbove(viewport: HTMLElement | null, content: HTMLElement | null) {
  const first = content && marked(content).at(0);
  return !!viewport && !!first && first.getBoundingClientRect().bottom < viewport.getBoundingClientRect().top;
}

type ErrorKind = 'auth' | 'rate-limit' | 'quota' | 'server' | 'network' | 'gone';

type ConversationRow =
  | {type: 'user'; id: string; text: string; meta?: string; name?: string; /** @deprecated Not drawn. */ avatar?: React.ReactNode}
  | {type: 'assistant'; id: string; content: React.ReactNode}
  | {type: 'thinking'; id: string; label?: string; author?: string}
  | {type: 'retry'; id: string; attempt: number; next: number; message?: string}
  | {type: 'diff'; id: string; files: number; additions: number; deletions: number}
  | {type: 'error'; id: string; kind: ErrorKind; message?: string}
  | {type: 'divider'; id: string; reason: 'compaction' | 'interrupted'; label?: string};

type ConversationLabels = {
  retryingIn?: (seconds: number) => string;
  retryingNow?: string;
  attempt?: (attempt: number) => string;
  retryNow?: string;
  errors?: Partial<Record<ErrorKind, string>>;
  retry?: string;
  thinking?: string;
  you?: string;
  agent?: string;
  filesChanged?: (files: number) => string;
  added?: string;
  removed?: string;
};

const conversationLabels = {
  retryingIn: (seconds: number) => `Retrying in ${seconds}s`,
  retryingNow: 'Retrying now',
  attempt: (attempt: number) => `attempt ${attempt}`,
  retryNow: 'Retry now',
  errors: {
    auth: 'Sign in again to continue',
    'rate-limit': 'Rate limited by the model provider',
    quota: 'Out of credits for this workspace',
    server: 'The model provider failed',
    network: 'Lost the connection',
    gone: 'This run no longer exists',
  } as Record<ErrorKind, string>,
  retry: 'Retry',
  thinking: 'Thinking',
  you: 'You',
  agent: 'Agent',
  filesChanged: (files: number) => `${files} ${files === 1 ? 'file' : 'files'} changed`,
  added: 'added',
  removed: 'removed',
};

const conversationWords = (labels?: ConversationLabels) => ({...withDefaults(conversationLabels, labels), errors: withDefaults(conversationLabels.errors, labels?.errors)});

function useCountdown(next: number) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [next]);
  return now === null ? null : Math.max(0, Math.ceil((next - now) / 1000));
}

function ConversationRetry({attempt, next, message, onRetry, labels, className, ...props}: Omit<React.ComponentProps<'div'>, 'children'> & {attempt: number; next: number; message?: string; onRetry?: () => void; labels?: ConversationLabels}) {
  const words = conversationWords(labels);
  const left = useCountdown(next);
  const short = message && message.length > 80 ? `${message.slice(0, 79)}…` : message;
  return <div data-slot="conversation-retry" className={cn('flex min-h-(--row-sm) min-w-0 flex-wrap items-center gap-x-3 ps-4 pe-1.5 rule-row', className)} {...props}>
    <Status status="running">{left ? words.retryingIn(left) : words.retryingNow}</Status>
    <span className="type-body-sm text-text-3 data">{words.attempt(attempt)}</span>
    {short && <span title={message} className="min-w-0 grow basis-48 truncate [contain:inline-size] type-body-sm text-text-2">{short}</span>}
    {onRetry && <Button variant="ghost" size="sm" onClick={onRetry} className="ms-auto">{words.retryNow}</Button>}
  </div>;
}

function ConversationError({kind, message, onRetry, labels, className, ...props}: Omit<React.ComponentProps<'div'>, 'children'> & {kind: ErrorKind; message?: string; onRetry?: () => void; labels?: ConversationLabels}) {
  const words = conversationWords(labels);
  return <div data-slot="conversation-error" data-status="fail" data-error={kind} className={cn('relative flex min-h-(--row) min-w-0 flex-wrap items-center gap-x-3 gap-y-1 bg-accent-wash py-1.5 ps-4 pe-1.5', className)} {...props}>
    <Status status="fail">{words.errors[kind]}</Status>
    {message && <span className="min-w-0 grow basis-48 type-body-sm text-text-2 [overflow-wrap:anywhere] [contain:inline-size]">{message}</span>}
    {onRetry && kind !== 'gone' && <Button variant="secondary" size="sm" onClick={onRetry} className="ms-auto">{words.retry}</Button>}
  </div>;
}

function rowEqual(a: ConversationRow, b: ConversationRow) {
  if (a === b) return true;
  if (a.type !== b.type || a.id !== b.id) return false;
  const ka = Object.keys(a) as (keyof ConversationRow)[];
  return ka.length === Object.keys(b).length && ka.every(k => a[k] === b[k]);
}

function useStableRows(rows: readonly ConversationRow[]) {
  const prev = useRef<readonly ConversationRow[]>(rows);
  const byId = new Map(prev.current.map(r => [r.id, r]));
  let same = rows.length === prev.current.length;
  const next = rows.map((row, i) => {
    const old = byId.get(row.id);
    const keep = old && rowEqual(old, row) ? old : row;
    if (keep !== prev.current[i]) same = false;
    return keep;
  });
  const out = same ? prev.current : next;
  useEffect(() => { prev.current = out; });
  return out;
}

const Row = memo(function Row({row, onRetry, labels}: {row: ConversationRow; onRetry?: (row: ConversationRow) => void; labels?: ConversationLabels}) {
  const words = conversationWords(labels);
  switch (row.type) {
    case 'user': {
      const name = row.name ?? words.you;
      return <Message from="user">
        <MessageContent>
          <MessageHeader>{name}{row.meta && <MessageTime>{row.meta}</MessageTime>}</MessageHeader>
          <MessageBubble><MessageBubbleContent>{row.text}</MessageBubbleContent></MessageBubble>
        </MessageContent>
      </Message>;
    }
    case 'assistant': return <>{row.content}</>;
    case 'thinking': return <AgentTurn name={row.author ?? words.agent} state="live">
      <Status status="running" className="text-text-2">{row.label ?? words.thinking}</Status>
    </AgentTurn>;
    case 'retry': return <ConversationRetry attempt={row.attempt} next={row.next} message={row.message} labels={labels}/>;
    case 'diff': return <p data-slot="conversation-diff" className="relative flex min-h-(--row-sm) items-center gap-2 px-4 type-body-sm text-text-2 data">
      <span className="text-text-1">{words.filesChanged(row.files)}</span>
      <DiffCount added={row.additions} removed={row.deletions} addedLabel={words.added} removedLabel={words.removed}/>
    </p>;
    case 'error': return <ConversationError kind={row.kind} message={row.message} onRetry={onRetry ? () => onRetry(row) : undefined} labels={labels}/>;
    case 'divider': return <MessageDivider reason={row.reason}>{row.label}</MessageDivider>;
  }
});

type ConversationTimelineProps = {
  rows: readonly ConversationRow[];
  renderRow?: (row: ConversationRow) => React.ReactNode | undefined;
  onRetry?: (row: ConversationRow) => void;
  labels?: ConversationLabels;
};

function ConversationTimeline({rows, renderRow, onRetry, labels}: ConversationTimelineProps) {
  const {status} = useConversation();
  const stable = useStableRows(rows);
  const lastUser = stable.findLastIndex(r => r.type === 'user');
  const visible = stable.filter((r, i) => (r.type === 'thinking' ? status === 'streaming' && i === stable.length - 1 : r.type === 'diff' ? status !== 'streaming' : true));
  return <>{visible.map((row, i) => <ConversationItem key={row.id} rowKey={row.id} pinned={i === visible.length - 1 || row === stable[lastUser]} data-row-type={row.type}>
    {renderRow?.(row) ?? <Row row={row} onRetry={onRetry} labels={labels}/>}
  </ConversationItem>)}</>;
}

export {
  Conversation, ConversationProvider, ConversationViewport, ConversationContent, ConversationItem, ConversationTail,
  ConversationJump, ConversationTimeline, ConversationRetry, ConversationError,
  useConversation, useStickToBottom, useStableRows, useCountdown, STICK, REATTACH,
  type ConversationProps, type ConversationLabels, type ConversationJumpLabels, type ConversationViewportLabels, type ConversationRow, type ConversationStatus, type ErrorKind,
};
