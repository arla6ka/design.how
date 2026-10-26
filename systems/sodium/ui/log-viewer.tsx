'use client';

import {memo, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {useVirtualizer} from '@tanstack/react-virtual';
import {Icon, Misuse} from '../icon';
import {findAll} from '../lib/scroll';
import {cn} from '../lib/utils';
import {Button} from './button';
import {CopyButton} from './copy-button';
import {TokenLine, WrapToggle, tokenize} from './code-block';
import {Input} from './input';
import {SegmentedControl, SegmentedControlItem} from './segmented-control';

type LogLevel = 'debug' | 'info' | 'warn' | 'fail';
type LogLine = {
  id: string | number;
  time?: Date | number | string;
  level?: LogLevel;
  source?: string;
  message: string;
};

const levels: LogLevel[] = ['debug', 'info', 'warn', 'fail'];
const levelNames: Record<LogLevel, string> = {debug: 'Debug', info: 'Info', warn: 'Warn', fail: 'Fail'};
const pad = (n: number) => String(n).padStart(2, '0');
const formatTime = (t: LogLine['time']) => {
  if (t === undefined) return '';
  if (typeof t === 'string') return t;
  const d = typeof t === 'number' ? new Date(t) : t;
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
};

const levelWord = (level: LogLevel) => level.toUpperCase();
const lineText = (l: LogLine) => [formatTime(l.time), levelWord(l.level ?? 'info'), l.source, l.message].filter(Boolean).join(' ');

const levelText: Record<LogLevel, string> = {debug: 'text-text-3', info: 'text-text-3', warn: 'text-warn-text', fail: 'text-fail-text'};
const fmt = (n: number) => n.toLocaleString('en-US');

const LogRow = memo(function LogRow({line, index, start, q, hit, timestamps, wrap, measure}: {
  line: LogLine; index: number; start: number; q: string; hit: boolean; timestamps: boolean; wrap: boolean; measure: (el: Element | null) => void;
}) {
  const level = line.level ?? 'info';
  return <div
    data-index={index}
    ref={measure}
    data-slot="log-line"
    data-level={level}
    data-hit={hit || undefined}
    className={cn(
      'absolute start-0 top-0 flex min-w-full items-start gap-3 px-inset type-code [contain:layout_style]',
      level === 'debug' ? 'text-text-2' : 'text-text-1',
      level === 'fail' && 'bg-fail-tint',
      'data-hit:bg-selected forced-colors:data-hit:outline forced-colors:data-hit:outline-1',
    )}
    style={{transform: `translateY(${start}px)`}}
  >
    {timestamps && <span className="shrink-0 text-text-3 max-sm:hidden">{formatTime(line.time)}</span>}
    <span className={cn('w-10 shrink-0', levelText[level])}>{levelWord(level)}</span>
    <span className={cn('min-w-0 flex-1', wrap ? 'whitespace-pre-wrap [overflow-wrap:anywhere]' : 'whitespace-pre')}>
      {line.source && <span className="text-text-2">{line.source} </span>}
      <TokenLine tokens={tokenize(line.message, 'text')[0] ?? []} marks={findAll(line.message, q)}/>
    </span>
  </div>;
});

type LogViewerProps = Omit<React.ComponentProps<'div'>, 'children'> & {
  lines: LogLine[];
  follow?: boolean;
  streaming?: boolean;
  toolbar?: boolean;
  header?: boolean;
  timestamps?: boolean;
  wrap?: boolean;
  height?: number;
  label?: string;
  name?: string;
};

function LogViewer({lines, follow = true, streaming = false, toolbar = false, header = true, timestamps = true, wrap: defaultWrap = true, height = 320, label = 'Logs', name, className, ...props}: LogViewerProps) {
  const title = name ? `${label} ${name}` : label;
  const [query, setQuery] = useState('');
  const [shown, setShown] = useState<string[]>([]);
  const [wrap, setWrap] = useState(defaultWrap);
  const [following, setFollowing] = useState(follow);
  const [seenAt, setSeenAt] = useState(lines.length);
  const [hit, setHit] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const q = query.trim().toLowerCase();

  const counts = useMemo(() => {
    const c: Record<LogLevel, number> = {debug: 0, info: 0, warn: 0, fail: 0};
    for (const line of lines) c[line.level ?? 'info'] += 1;
    return c;
  }, [lines]);
  const filtered = useMemo(
    () => lines.filter(l => (!shown.length || shown.includes(l.level ?? 'info')) && (!q || l.message.toLowerCase().includes(q) || l.source?.toLowerCase().includes(q))),
    [lines, shown, q],
  );

  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 20,
    overscan: 12,
    getItemKey: i => filtered[i].id,
    useFlushSync: false,
  });

  const total = virtualizer.getTotalSize();
  useLayoutEffect(() => {
    if (!following || !filtered.length) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [filtered.length, following, total]);
  useEffect(() => { if (following) setSeenAt(lines.length); }, [following, lines.length]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el || !follow) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 8;
    if (atBottom !== following) setFollowing(atBottom);
  };
  const jump = () => { scrollRef.current?.focus({preventScroll: true}); setFollowing(true); virtualizer.scrollToIndex(filtered.length - 1, {align: 'end'}); };
  const unseen = Math.max(0, lines.length - seenAt);
  const failures = counts.fail;
  const failIndexes = useMemo(() => filtered.flatMap((l, i) => (l.level === 'fail' ? [i] : [])), [filtered]);
  const nextFailure = () => {
    if (!failIndexes.length) return;
    const to = failIndexes.find(i => i > hit) ?? failIndexes[0];
    if (follow) setFollowing(false);
    setHit(to);
    virtualizer.scrollToIndex(to, {align: 'center'});
  };

  const empty = <p data-slot="log-viewer-empty" className="px-inset py-1 type-body-sm text-text-2">
    {lines.length === 0 ? (streaming ? 'Waiting for the first line.' : 'No output.') : q ? <>No lines match <code className="mono text-text-1">{query.trim()}</code>.</> : 'No lines at these levels.'}
  </p>;

  return <div
    data-slot="log-viewer"
    data-status={failures ? 'fail' : undefined}
    className={cn('@container/log frame flex flex-col overflow-hidden text-text-1', className)}
    {...props}
  >
    {header && <div data-slot="log-viewer-header" className="panel-head shrink-0">
      <span data-slot="log-viewer-title" className="me-auto min-w-20 truncate text-text-1">{name ?? label}</span>
      <span className="shrink-0 type-code-sm text-text-2 max-sm:hidden">{fmt(lines.length)} {lines.length === 1 ? 'line' : 'lines'}</span>
      {streaming
        ? <span data-slot="log-viewer-streaming" className="flex shrink-0 items-center gap-2 type-code-sm text-text-2"><span aria-hidden className="pending"/>Streaming</span>
        : failures > 0 && <span data-slot="log-viewer-failed" className={cn('shrink-0 type-code-sm text-fail-text', failIndexes.length > 0 && 'hidden @xs/log:block')}>{fmt(failures)} failed</span>}
      <span data-slot="log-viewer-actions" className="panel-head-actions">
        <WrapToggle wrap={wrap} onWrap={setWrap}/>
        {failIndexes.length > 0 && <Button data-slot="log-viewer-next-fail" variant="ghost" size="icon-sm" onClick={nextFailure} aria-label={`Next failure, ${failIndexes.length} in this log`}>
          <Icon icon={Misuse}/>
        </Button>}
        <CopyButton value={() => filtered.map(lineText).join('\n')} label="lines"/>
      </span>
    </div>}
    {toolbar && <div data-slot="log-viewer-toolbar" className="flex min-h-(--row) min-w-0 shrink-0 flex-wrap items-center gap-2 border-b border-line bg-page px-inset py-1.5">
      <Input mode="search" size="sm" aria-label={`Filter ${title}`} placeholder="Filter lines" value={query} onValueChange={setQuery} clearLabel="Clear filter" className="min-w-32 flex-1"/>
      <SegmentedControl multiple size="sm" aria-label="Levels" value={shown} onValueChange={setShown}>
        {levels.map(level => <SegmentedControlItem key={level} value={level} count={counts[level]}>{levelNames[level]}</SegmentedControlItem>)}
      </SegmentedControl>
    </div>}
    <div className="relative flex min-h-0 flex-col">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        dir="ltr"
        data-slot="log-viewer-body"
        role="log"
        aria-live="off"
        aria-label={title}
        tabIndex={0}
        onCopy={event => {
          const selection = window.getSelection();
          if (!selection || selection.isCollapsed || !selection.rangeCount) return;
          const rows = [...selection.getRangeAt(0).cloneContents().querySelectorAll('[data-slot=log-line]')];
          if (!rows.length) return;
          event.clipboardData.setData('text/plain', rows.map(row => [...row.children].map(cell => cell.textContent?.trim()).filter(Boolean).join(' ')).join('\n'));
          event.preventDefault();
        }}
        className="min-h-0 overflow-auto overscroll-contain bg-code-surface py-inset focus-visible:focus-ring-inset"
        style={{height: lines.length === 0 ? undefined : height}}
      >
        {filtered.length === 0
          ? empty
          : <div className={cn('relative', !wrap && 'w-max min-w-full')} style={{height: virtualizer.getTotalSize()}}>
              {virtualizer.getVirtualItems().map(item => <LogRow
                key={item.key}
                line={filtered[item.index]}
                index={item.index}
                start={item.start}
                q={q}
                hit={item.index === hit}
                timestamps={timestamps}
                wrap={wrap}
                measure={virtualizer.measureElement}
              />)}
            </div>}
      </div>
      {!following && follow && filtered.length > 0 && <Button size="sm" variant="secondary" onClick={jump} data-slot="log-viewer-jump" className="absolute end-inset bottom-inset bg-page">
        {unseen ? `${fmt(unseen)} new` : 'Latest'}
      </Button>}
    </div>
    <span role="status" className="sr-only">{failures ? `${failures} failed ${failures === 1 ? 'line' : 'lines'}` : ''}</span>
  </div>;
}

export {LogViewer, type LogLevel, type LogLine, type LogViewerProps};
