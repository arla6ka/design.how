'use client';

import {useEffect, useRef, useState} from 'react';
import {CodeTag} from '../ui/badge';
import {StatusArc} from '../ui/status';
import {formatCount, formatDurations} from '../lib/format';
import {cn, withDefaults} from '../lib/utils';

type TickerRequest = {
  id: string;
  method?: string;
  target: string;
  code?: number | string;
  duration?: number;
};

type RequestTickerLabels = {
  showMore?: (count: number) => string;
  showLess?: string;
  requests?: string;
};

const tickerLabels: Required<RequestTickerLabels> = {
  showMore: n => `Show ${formatCount(n)} more`,
  showLess: 'Show less',
  requests: 'Requests',
};

type RequestTickerProps = Omit<React.ComponentProps<'div'>, 'children'> & {
  items: readonly TickerRequest[];
  live?: boolean;
  max?: number;
  cap?: number;
  hold?: number;
  labels?: RequestTickerLabels;
};

function codeClass(code: number | string | undefined): 'ok' | 'warn' | 'fail' | undefined {
  if (code === undefined || code === '') return undefined;
  const n = Number(code);
  if (!Number.isFinite(n)) return 'fail';
  return n >= 500 ? 'fail' : n >= 400 ? 'warn' : 'ok';
}

function countRequests(items: readonly TickerRequest[]) {
  const failed = items.filter(r => codeClass(r.code) === 'warn' || codeClass(r.code) === 'fail').length;
  return {head: `${formatCount(items.length)} ${items.length === 1 ? 'request' : 'requests'}`, failed};
}

function summarizeRequests(items: readonly TickerRequest[]) {
  const {head, failed} = countRequests(items);
  return failed ? `${head}, ${failed} failed` : head;
}

function RequestSummary({items}: {items: readonly TickerRequest[]}) {
  const {head, failed} = countRequests(items);
  return failed ? <>{head}, <span data-slot="request-ticker-failed" className="text-fail-text">{failed} failed</span></> : head;
}

function useHeldWindow<T>(items: readonly T[], max: number, live: boolean, hold: number) {
  const [shown, setShown] = useState(() => items.slice(-max));
  const at = useRef(0);
  const latest = useRef(items);
  latest.current = items;
  useEffect(() => {
    const next = () => { at.current = Date.now(); setShown(latest.current.slice(-max)); };
    if (!live) { next(); return; }
    const wait = Math.max(0, hold - (Date.now() - at.current));
    if (!wait) { next(); return; }
    const timer = setTimeout(next, wait);
    return () => clearTimeout(timer);
  }, [items, max, live, hold]);
  return shown;
}

function Row({request, live, as: As = 'div'}: {request: TickerRequest; live: boolean; as?: 'div' | 'li'}) {
  const status = codeClass(request.code);
  return <As
    data-slot="request-ticker-row"
    data-status={status === 'warn' || status === 'fail' ? status : undefined}
    className="flex h-(--row-sm) min-w-0 items-center gap-3"
  >
    <span className="flex w-16 shrink-0">{request.method && <CodeTag>{request.method}</CodeTag>}</span>
    <span dir="ltr" className="min-w-0 flex-1 truncate text-start type-tag text-text-1">{request.target}</span>
    <span className="flex w-10 shrink-0 justify-end">{status ? <CodeTag code={request.code} status={status === 'ok' ? 'neutral' : status}/> : live && <StatusArc/>}</span>
    <span className="w-14 shrink-0 text-end type-body-sm text-text-3 data">{request.duration !== undefined && formatMs(request.duration)}</span>
  </As>;
}

const formatMs = (ms: number) => formatDurations([Number.isFinite(ms) ? Math.max(0, ms) : 0]).values[0];

function ShowMoreRow({className, ...props}: Omit<React.ComponentProps<'button'>, 'type'>) {
  return <button
    type="button"
    className={cn('-mx-3 -mb-2 mt-1 flex h-(--row-sm) items-center self-stretch px-3 text-start type-label-sm text-text-2 rule-top transition-colors duration-(--dur-fast) ease-(--ease-step) hover:bg-hover hover:text-text-1 focus-visible:focus-ring-inset', className)}
    {...props}
  />;
}

function RequestTicker({items, live = false, max = 3, cap = 10, hold = 300, labels, className, ...props}: RequestTickerProps) {
  const words = withDefaults(tickerLabels, labels);
  const recent = useHeldWindow(items, max, live, hold);
  const [all, setAll] = useState(false);
  if (live) {
    return <div data-slot="request-ticker" data-live="" aria-hidden className={cn('flex min-w-0 flex-col', className)} {...props}>
      {recent.map(r => <Row key={r.id} request={r} live/>)}
    </div>;
  }
  const hidden = all ? 0 : Math.max(0, items.length - cap);
  const shown = hidden ? items.slice(0, cap) : items;
  return <div data-slot="request-ticker" className={cn('flex min-w-0 flex-col', className)} {...props}>
    <ol aria-label={words.requests} className="flex min-w-0 flex-col">
      {shown.map(r => <Row key={r.id} as="li" request={r} live={false}/>)}
    </ol>
    {items.length > cap && <ShowMoreRow data-slot="request-ticker-more" onClick={() => setAll(v => !v)}>{all ? words.showLess : words.showMore(hidden)}</ShowMoreRow>}
  </div>;
}

export {RequestTicker, RequestSummary, ShowMoreRow, summarizeRequests, codeClass, type RequestTickerProps, type RequestTickerLabels, type TickerRequest};
