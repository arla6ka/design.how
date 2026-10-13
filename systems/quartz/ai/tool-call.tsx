'use client';

import {Collapsible as CollapsiblePrimitive} from '@base-ui/react/collapsible';
import {useCallback, useEffect, useId, useMemo, useReducer, useState} from 'react';
import {Button} from '../ui/button';
import {Panel, PanelBody, PanelFooter, PanelHeader} from '../ui/panel';
import {statusLabels} from '../ui/status';
import {ActivityGroup, Disclosure, StepGlyph, joinSummary, pastTense, pickActivity, rowVariants, type ActivityEnd, type StepState} from './activity';
import {useFocusWhenReplaced} from '../lib/use-focus-when-replaced';
import {RequestSummary, RequestTicker, ShowMoreRow, summarizeRequests, type TickerRequest} from './request-ticker';
import {formatCount, formatElapsed} from '../lib/format';
import {cn, mergeRefs, withDefaults} from '../lib/utils';

type ToolStatus = 'pending' | 'running' | 'completed' | 'error' | 'awaiting-permission' | 'denied' | 'cancelled';

const terminal: ReadonlySet<ToolStatus> = new Set(['completed', 'error', 'denied', 'cancelled']);
const isTerminal = (status: ToolStatus) => terminal.has(status);

type ToolReply = 'once' | 'reject';

type ToolCallData = {
  id: string;
  tool: string;
  status: ToolStatus;
  input?: Record<string, unknown>;
  raw?: string;
  title?: string;
  metadata?: Record<string, unknown>;
  output?: string;
  error?: string;
  permission?: {patterns: string[]; message?: string};
  reason?: string;
  startedAt?: number;
  endedAt?: number;
  seq: number;
  orphan?: boolean;
  receivedAt?: number;
};

type Seq = {seq: number; id: string; gen?: number; at?: number};
type ToolEvent =
  | (Seq & {type: 'call'; tool: string; input?: Record<string, unknown>; raw?: string})
  | (Seq & {type: 'input'; raw: string; input?: Record<string, unknown>})
  | (Seq & {type: 'start'; tool?: string; input?: Record<string, unknown>; title?: string})
  | (Seq & {type: 'progress'; metadata?: Record<string, unknown>; title?: string})
  | (Seq & {type: 'ask'; patterns: string[]; message?: string})
  | (Seq & {type: 'reply'; reply: ToolReply; feedback?: string})
  | (Seq & {type: 'result'; tool?: string; status?: 'completed' | 'error'; output?: string; error?: string; title?: string; metadata?: Record<string, unknown>})
  | {type: 'stop'; gen: number; at?: number}
  | {type: 'turn'; gen?: number}
  | {type: 'reset'};

type ToolCallsState = {
  calls: ToolCallData[];
  gen: number;
  stopped?: boolean;
  dropped: number;
};

const emptyState: ToolCallsState = {calls: [], gen: 0, stopped: false, dropped: 0};
const NO_STATUS = 'The tool ended without reporting a result.';
const CHARS_PER_LINE = 120;

const timeOf = (at: number | undefined) => typeof at === 'number' && Number.isFinite(at) ? at : Date.now();

function transition(call: ToolCallData, e: Exclude<ToolEvent, {type: 'stop' | 'reset' | 'turn'}>): ToolCallData {
  const at = timeOf(e.at);
  switch (e.type) {
    case 'call': return {...call, tool: e.tool, input: e.input ?? call.input, raw: e.raw ?? call.raw, status: 'pending'};
    case 'input': return {...call, raw: e.raw, input: e.input ?? call.input};
    case 'start': return {...call, tool: e.tool ?? call.tool, input: e.input ?? call.input, title: e.title ?? call.title, status: 'running', startedAt: call.startedAt ?? at};
    case 'progress': return {...call, metadata: {...call.metadata, ...e.metadata}, title: e.title ?? call.title, status: call.status === 'pending' ? 'running' : call.status, startedAt: call.startedAt ?? at};
    case 'ask': return {...call, status: 'awaiting-permission', permission: {patterns: e.patterns, message: e.message}};
    case 'reply': return e.reply === 'reject'
      ? {...call, status: 'denied', reason: e.feedback, endedAt: at}
      : {...call, status: 'running', startedAt: call.startedAt ?? at};
    case 'result': {
      const status = e.status ?? 'error';
      return {
        ...call, status, output: e.output ?? call.output, title: e.title ?? call.title,
        metadata: e.metadata ? {...call.metadata, ...e.metadata} : call.metadata,
        error: status === 'error' ? (e.error ?? (e.status ? 'The tool failed.' : NO_STATUS)) : undefined,
        endedAt: at,
      };
    }
  }
}

function toolCallsReducer(state: ToolCallsState, e: ToolEvent): ToolCallsState {
  if (e.type === 'reset') return emptyState;
  const drop = {...state, dropped: state.dropped + 1};
  if (e.type === 'turn') return {...state, gen: e.gen ?? state.gen + 1, stopped: false};
  if (e.type === 'stop') {
    if (e.gen < state.gen || (e.gen === state.gen && state.stopped)) return drop;
    const at = timeOf(e.at);
    return {...state, gen: e.gen, stopped: true, calls: state.calls.map(c => isTerminal(c.status) ? c : {...c, status: 'cancelled', endedAt: at})};
  }
  const gen = e.gen ?? state.gen;
  if (gen < state.gen || (gen === state.gen && state.stopped)) return drop;
  if (gen > state.gen) state = {...state, gen, stopped: false};
  const i = state.calls.findIndex(c => c.id === e.id);

  if (i === -1) {
    const orphan = e.type === 'result' || e.type === 'ask' || e.type === 'reply' || e.type === 'progress';
    const seed: ToolCallData = {id: e.id, tool: ('tool' in e && e.tool) || 'unknown', status: 'pending', seq: e.seq, orphan, receivedAt: timeOf(e.at)};
    return {...state, calls: [...state.calls, {...transition(seed, e), seq: e.seq}]};
  }

  const call = state.calls[i];
  const replace = (next: ToolCallData) => ({...state, calls: state.calls.map((c, j) => (j === i ? next : c))});

  if (call.orphan && (e.type === 'call' || e.type === 'start')) {
    const filled = {...call, tool: call.tool === 'unknown' ? (e.tool ?? call.tool) : call.tool, input: call.input ?? e.input, orphan: false};
    return replace(isTerminal(call.status) || e.seq <= call.seq ? filled : {...transition(filled, e), seq: e.seq});
  }
  if (e.seq <= call.seq) return drop;
  if (isTerminal(call.status)) return drop;
  return replace({...transition(call, e), seq: e.seq});
}

function useToolCalls(initial: ToolCallData[] = []) {
  return useReducer(toolCallsReducer, {...emptyState, calls: initial});
}

type BodyContext = {size: 'default' | 'sm'; labels?: ToolCallLabels};

type ToolRenderer = {
  active: string;
  done: string;
  ask: string;
  noun: string;
  confirm?: string | ((input: Record<string, unknown>, call: ToolCallData) => string);
  detail?: (input: Record<string, unknown>, call: ToolCallData) => string | undefined;
  detailNode?: (input: Record<string, unknown>, call: ToolCallData) => React.ReactNode | undefined;
  detailMono?: boolean;
  body?: (call: ToolCallData, ctx: BodyContext) => React.ReactNode | null;
  lines: number;
  summary: {key: string; one: string; many: (n: number) => string};
};

const registry = new Map<string, ToolRenderer>();
const aliases = new Map<string, string>();

function registerTool(name: string, renderer: ToolRenderer, alias: string[] = []) {
  registry.set(name, renderer);
  for (const a of alias) aliases.set(a, name);
}

const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v : undefined);
const firstOf = (input: Record<string, unknown>, keys: string[]) => keys.map(k => str(input[k])).find(Boolean);
const useful = ['filePath', 'path', 'file', 'url', 'query', 'pattern', 'command', 'description', 'name', 'id'];
const basename = (p?: string) => p?.split('/').filter(Boolean).at(-1) ?? p;

function genericRenderer(name: string): ToolRenderer {
  return {
    active: `Calling ${name}`, done: `Called ${name}`, ask: `Call ${name}`, noun: name, confirm: `Allow ${name}?`, lines: 8, detailMono: false,
    summary: {key: `tool:${name}`, one: `called ${name}`, many: n => `called ${name} ${n} times`},
    detail: input => firstOf(input, useful),
    body: (call, ctx) => {
      const said = firstOf(call.input ?? {}, useful);
      const scalars = Object.entries(call.input ?? {}).filter(([, v]) => ['string', 'number', 'boolean'].includes(typeof v) && String(v) !== said).slice(0, 3);
      const out = call.output ?? str(call.metadata?.output);
      if (!scalars.length && !out) return null;
      return <div className="flex min-w-0 flex-col gap-2">
        {scalars.length > 0 && <dl className="grid min-w-0 grid-cols-[max-content_minmax(0,1fr)] gap-x-3 gap-y-0.5 type-code-sm">
          {scalars.map(([k, v]) => <div key={k} className="contents"><dt className="text-text-3">{k}</dt><dd className="truncate text-text-1">{String(v)}</dd></div>)}
        </dl>}
        {out && <CappedOutput text={out} lines={8} size={ctx.size} labels={ctx.labels}/>}
      </div>;
    },
  };
}

function resolveTool(name: string): ToolRenderer {
  const key = aliases.get(name) ?? name;
  return registry.get(key) ?? genericRenderer(name);
}

// eslint-disable-next-line no-control-regex
const ansi = /\u001b\[[0-9;?]*[ -/]*[@-~]|\u001b\][^\u0007]*\u0007/g;
const cleanOutput = (text: string) => text.replace(ansi, '').replace(/\r\n/g, '\n').split('\n')
  .map(line => line.split('\r').reduce((shown, part) => part + shown.slice(part.length), ''))
  .join('\n');

const contextRenderer = (active: string, done: string, ask: string, noun: string, key: string, one: string, many: (n: number) => string, keys: string[]): ToolRenderer => ({
  active, done, ask, noun, confirm: `Allow ${noun}?`, lines: 8, detailMono: true,
  summary: {key, one, many},
  detail: input => {
    const v = firstOf(input, keys);
    return keys[0] === 'filePath' ? basename(v) : v;
  },
  body: (call, ctx) => {
    const out = call.output ?? str(call.metadata?.output);
    return out ? <CappedOutput text={out} lines={8} size={ctx.size} labels={ctx.labels}/> : null;
  },
});

registerTool('read', contextRenderer('Reading', 'Read', 'Read', 'read', 'read', 'read a file', n => `read ${n} files`, ['filePath', 'path', 'file']));
registerTool('glob', contextRenderer('Finding files', 'Found files', 'Find files', 'search', 'search', 'searched once', n => `searched ${n} times`, ['pattern']));
registerTool('grep', contextRenderer('Searching', 'Searched', 'Search', 'search', 'search', 'searched once', n => `searched ${n} times`, ['pattern', 'query']));
registerTool('list', contextRenderer('Listing', 'Listed', 'List', 'list', 'list', 'listed a folder', n => `listed ${n} folders`, ['path']), ['ls']);

registerTool('shell', {
  active: 'Running', done: 'Ran', ask: 'Run', noun: 'command', confirm: 'Run this command?', lines: 24, detailMono: true,
  summary: {key: 'shell', one: 'ran a command', many: n => `ran ${n} commands`},
  detail: input => str(input.command) ?? str(input.description),
  body: (call, ctx) => {
    const command = str(call.input?.command);
    const out = call.output ?? str(call.metadata?.output);
    if (!out) return null;
    const whole = !!command && (command.includes('\n') || command.length > 80);
    return <div className="flex min-w-0 flex-col gap-1">
      {whole && <pre dir="ltr" className="overflow-x-auto text-start type-code-sm text-text-1"><code><span aria-hidden className="text-(--code-prompt) select-none">$ </span>{command}</code></pre>}
      <CappedOutput text={cleanOutput(out)} lines={24} size={ctx.size} labels={ctx.labels}/>
    </div>;
  },
}, ['bash', 'sh', 'zsh', 'run_command', 'terminal']);

registerTool('edit', {
  active: 'Editing', done: 'Edited', ask: 'Edit', noun: 'edit', confirm: 'Apply this edit?', lines: 8, detailMono: true,
  summary: {key: 'edit', one: 'edited a file', many: n => `edited ${n} files`},
  detail: input => basename(firstOf(input, ['filePath', 'path', 'file'])),
  body: (call, ctx) => {
    const patch = str(call.metadata?.diff) ?? str(call.metadata?.patch);
    if (!patch) return null;
    return <PatchPreview patch={patch} lines={8} size={ctx.size} labels={ctx.labels}/>;
  },
}, ['write', 'apply_patch', 'patch', 'multiedit', 'str_replace']);

registerTool('webfetch', {
  active: 'Fetching', done: 'Fetched', ask: 'Fetch', noun: 'fetch', confirm: 'Fetch this page?', lines: 8, detailMono: true,
  summary: {key: 'web', one: 'fetched a page', many: n => `fetched ${n} pages`},
  detail: input => {
    const url = str(input.url);
    try { return url ? new URL(url).host + new URL(url).pathname.replace(/\/$/, '') : undefined; } catch { return url; }
  },
  body: (call, ctx) => {
    const out = call.output;
    return out ? <CappedOutput text={out} lines={8} size={ctx.size} labels={ctx.labels}/> : null;
  },
}, ['fetch', 'web_fetch']);

const requestsOf = (call: ToolCallData) => (Array.isArray(call.metadata?.requests) ? call.metadata.requests as TickerRequest[] : []);

registerTool('http', {
  active: 'Calling', done: 'Called', ask: 'Call', noun: 'request', confirm: 'Send this request?', lines: 10, detailMono: false,
  summary: {key: 'http', one: 'made a request', many: n => `made ${n} requests`},
  detail: (input, call) => {
    const requests = requestsOf(call);
    if (requests.length && isTerminal(call.status)) return summarizeRequests(requests);
    return requests.at(-1)?.target ?? str(input.url) ?? str(input.server) ?? str(input.name);
  },
  detailNode: (_, call) => {
    const requests = requestsOf(call);
    return requests.length && isTerminal(call.status) ? <RequestSummary items={requests}/> : undefined;
  },
  body: call => {
    const requests = requestsOf(call);
    return requests.length ? <RequestTicker items={requests} live={call.status === 'running'}/> : null;
  },
}, ['http_request', 'api', 'mcp', 'mcp_call']);

registerTool('websearch', {
  active: 'Searching the web for', done: 'Searched the web for', ask: 'Search the web for', noun: 'search', confirm: 'Search the web?', lines: 8,
  summary: {key: 'websearch', one: 'searched the web', many: n => `searched the web ${n} times`},
  detail: input => str(input.query),
  body: (call, ctx) => (call.output ? <CappedOutput text={call.output} lines={8} size={ctx.size} labels={ctx.labels}/> : null),
}, ['web_search', 'search_web']);

registerTool('task', {
  active: 'Delegating', done: 'Delegated', ask: 'Delegate', noun: 'task', confirm: 'Delegate this task?', lines: 8,
  summary: {key: 'task', one: 'ran a subagent', many: n => `ran ${n} subagents`},
  detail: (input, call) => {
    const current = str(call.metadata?.current);
    return call.status === 'running' && current ? `↳ ${current}` : str(input.description);
  },
  body: (call, ctx) => (call.output ? <CappedOutput text={call.output} lines={8} size={ctx.size} labels={ctx.labels}/> : null),
}, ['subagent', 'agent']);

type ToolCallLabels = {
  status?: Partial<Record<ToolStatus, string>>;
  orphaned?: string;
  result?: string;
  forCall?: (id: string) => string;
  showMore?: (count: number, unit: 'lines' | 'characters') => string;
  showLess?: string;
  trimmed?: (characters: number) => string;
  added?: string;
  removed?: string;
  worked?: (time: string) => string;
  ranTools?: (count: number) => string;
  failedCount?: (count: number) => string;
  allow?: string;
  deny?: string;
};

const n = formatCount;

const toolLabels: Required<ToolCallLabels> = {
  status: {pending: 'Preparing', running: 'Running', completed: statusLabels.ok, error: statusLabels.fail, 'awaiting-permission': statusLabels.waiting, denied: 'Denied', cancelled: 'Stopped'},
  orphaned: 'Orphaned result',
  result: 'Result',
  forCall: id => `for call ${id}`,
  showMore: (count, unit) => `Show ${n(count)} more ${unit === 'lines' ? (count === 1 ? 'line' : 'lines') : 'characters'}`,
  showLess: 'Show less',
  trimmed: characters => `Trimmed at ${n(characters)} characters`,
  added: 'added',
  removed: 'removed',
  worked: time => `Worked for ${time}`,
  ranTools: count => (count === 1 ? 'Ran 1 tool' : `Ran ${count} tools`),
  failedCount: count => (count === 1 ? 'Failed' : `${count} failed`),
  allow: 'Allow',
  deny: 'Deny',
};

const wordsFor = (labels?: ToolCallLabels) => ({...withDefaults(toolLabels, labels), status: withDefaults(toolLabels.status as Record<ToolStatus, string>, labels?.status)});

function CappedOutput({text, lines, chars = 20_000, size = 'default', labels}: {text: string; lines: number; chars?: number; size?: 'default' | 'sm'; labels?: ToolCallLabels}) {
  const words = wordsFor(labels);
  const [all, setAll] = useState(false);
  const trimmed = text.length > chars;
  const body = (trimmed ? text.slice(0, chars) : text).replace(/\n+$/, '');
  const rows = body.split('\n');
  const hiddenLines = Math.max(0, rows.length - lines);
  const byLines = hiddenLines ? rows.slice(0, lines).join('\n') : body;
  const limit = lines * CHARS_PER_LINE;
  const hiddenChars = Math.max(0, byLines.length - limit);
  const shown = all ? body : hiddenChars ? `${byLines.slice(0, limit)}…` : byLines;
  const more = hiddenLines > 0 || hiddenChars > 0;
  return <div data-slot="tool-call-output" data-size={size} className="flex min-w-0 flex-col gap-1">
    <pre dir="ltr" data-all={all || undefined} className="min-w-0 overflow-x-auto text-start type-code-sm whitespace-pre-wrap text-text-2 [overflow-wrap:anywhere] data-all:max-h-[calc(var(--line-box)*40)] data-all:overflow-y-auto"><code>{shown}</code></pre>
    {trimmed && <p className="type-label-sm text-text-3 data">{words.trimmed(chars)}</p>}
    {more && <ShowMoreRow data-slot="tool-call-more" onClick={() => setAll(v => !v)}>{all ? words.showLess : hiddenLines > 0 ? words.showMore(hiddenLines, 'lines') : words.showMore(hiddenChars, 'characters')}</ShowMoreRow>}
  </div>;
}

function DiffCount({added, removed, addedLabel, removedLabel, className}: {added: number; removed: number; addedLabel: string; removedLabel: string; className?: string}) {
  return <span data-slot="diff-count" dir="ltr" className={cn('data', className)}><span aria-hidden>+</span>{added}<span className="sr-only"> {addedLabel}</span> <span aria-hidden>−</span>{removed}<span className="sr-only"> {removedLabel}</span></span>;
}

function PatchPreview({patch, lines, size, labels}: {patch: string; lines: number; size: 'default' | 'sm'; labels?: ToolCallLabels}) {
  const words = wordsFor(labels);
  const changed = patch.split('\n').filter(l => /^[+-]/.test(l) && !/^(\+\+\+|---)/.test(l));
  const added = changed.filter(l => l.startsWith('+')).length;
  const removed = changed.length - added;
  return <div className="flex min-w-0 flex-col gap-1">
    <p className="text-start type-body-sm text-text-2"><DiffCount added={added} removed={removed} addedLabel={words.added} removedLabel={words.removed}/></p>
    <CappedOutput text={changed.map(l => (l[0] === '-' ? '−' : '+') + ' ' + l.slice(1)).join('\n')} lines={lines} size={size} labels={labels}/>
  </div>;
}

function toolLabel(call: ToolCallData, labels?: Pick<ToolCallLabels, 'result' | 'forCall'>) {
  const r = resolveTool(call.tool);
  const detail = (call.input && r.detail?.(call.input, call)) ?? call.title;
  if (call.orphan && call.tool === 'unknown') return {text: labels?.result ?? toolLabels.result, detail: call.title ?? (labels?.forCall ?? toolLabels.forCall)(call.id)};
  switch (call.status) {
    case 'pending': return {text: `Preparing ${r.noun}`, detail: call.input ? detail : undefined};
    case 'running': return {text: r.active, detail};
    case 'completed': return {text: r.done, detail};
    case 'awaiting-permission':
    default: return {text: r.ask, detail};
  }
}

const formatDuration = formatElapsed;

type ToolCallProps = Omit<React.ComponentProps<'div'>, 'children'> & {
  call: ToolCallData;
  size?: 'default' | 'sm';
  onReply?: (reply: ToolReply) => void;
  actions?: React.ReactNode;
  label?: string;
  doneLabel?: string;
  detail?: string;
  detailMono?: boolean;
  duration?: number;
  children?: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  labels?: ToolCallLabels;
};

function splitForce(props: Record<string, unknown>) {
  const force: Record<string, unknown> = {};
  const rest: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) (k.startsWith('data-force-') ? force : rest)[k] = v;
  return {force, rest};
}

function ToolCall({call, size = 'default', onReply, actions, label, doneLabel, detail: detailProp, detailMono, duration, children, open, defaultOpen, onOpenChange, labels, className, ref, ...allProps}: ToolCallProps) {
  const words = wordsFor(labels);
  const {force, rest: props} = splitForce(allProps);
  const sz = size ?? 'default';
  const r = resolveTool(call.tool);
  const running = call.status === 'running';
  const pending = call.status === 'pending';
  const asking = call.status === 'awaiting-permission';
  const denied = call.status === 'denied';
  const failed = call.status === 'error';
  const ms = running || pending ? undefined : duration ?? (call.startedAt !== undefined && call.endedAt !== undefined ? Math.max(0, call.endedAt - call.startedAt) : undefined);
  const base = toolLabel(call, words);
  const text = label === undefined ? base.text : call.status === 'completed' ? (doneLabel ?? pastTense(label)) : label;
  const detail = detailProp ?? base.detail;
  const detailShown = detailProp ?? (!call.orphan && call.input ? r.detailNode?.(call.input, call) : undefined) ?? detail;
  const mono = detailMono ?? (call.orphan && call.tool === 'unknown' ? false : !!r.detailMono);
  const orphaned = !!call.orphan && isTerminal(call.status);
  const word = orphaned ? words.orphaned : words.status[call.status];
  const {region, target} = useFocusWhenReplaced<HTMLElement, HTMLDivElement>(!asking);
  const rootRef = useMemo(() => mergeRefs(region, ref), [region, ref]);
  const rowRef = useCallback((el: HTMLElement | null) => { target.current = el; }, [target]);
  const titleId = useId();

  const [openState, setOpenState] = useState(defaultOpen ?? failed);
  useEffect(() => { if (failed) setOpenState(true); }, [failed]);

  const shared = {
    'data-slot': 'tool-call',
    'data-status': call.status,
    'data-tool': call.tool,
    'data-size': sz,
    'data-orphan': call.orphan || undefined,
    'data-waiting': asking || undefined,
    'aria-busy': running || pending || undefined,
  };
  const rootClass = cn('group/tool-call relative flex w-full min-w-0 flex-col text-text-1', className);

  if (asking) {
    const command = str(call.input?.command);
    const patterns = call.permission?.patterns.join('\n');
    const full = command ?? patterns ?? (call.input && firstOf(call.input, useful)) ?? detail;
    const question = typeof r.confirm === 'function' ? r.confirm(call.input ?? {}, call) : r.confirm ?? `${r.ask} this ${r.noun}?`;
    return <div {...shared} {...props} ref={rootRef} className={rootClass}>
      <Panel data-slot="tool-call-approval" role="group" aria-labelledby={titleId} className="my-1">
        <PanelHeader><p id={titleId} data-slot="tool-call-title" className="min-w-0 py-2 type-label text-text-1">{question}</p></PanelHeader>
        <PanelBody>
          <div className="flex min-w-0 flex-col gap-2 p-3">
            {call.permission?.message && <p data-slot="tool-call-request" className="type-body-sm text-text-2">{call.permission.message}</p>}
            {full && (command
              ? <pre dir="ltr" data-slot="tool-call-command" className="well min-w-0 rounded-soft px-3 py-2 text-start type-code-sm whitespace-pre-wrap text-text-1 [overflow-wrap:anywhere]"><code><span aria-hidden className="text-(--code-prompt) select-none">$ </span>{full}</code></pre>
              : <p data-slot="tool-call-command" className="well min-w-0 rounded-soft px-3 py-2 type-body-sm whitespace-pre-wrap text-text-1 [overflow-wrap:anywhere]">{full}</p>)}
          </div>
        </PanelBody>
        {onReply
          ? <PanelFooter data-slot="tool-call-actions" className="flex-wrap">
            <Button size="sm" variant="secondary" onClick={() => onReply('reject')}>{words.deny}</Button>
            <Button size="sm" onClick={() => onReply('once')}>{words.allow}</Button>
          </PanelFooter>
          : actions && <PanelFooter data-slot="tool-call-actions" className="flex-wrap">{actions}</PanelFooter>}
      </Panel>
    </div>;
  }

  const renderered = children ?? r.body?.(call, {size: sz, labels}) ?? null;
  const note = failed && call.error ? <p data-slot="tool-call-error" className="type-body-sm text-text-1 [overflow-wrap:anywhere]">{call.error}</p>
    : denied && call.reason ? <p data-slot="tool-call-reason" className="type-body-sm text-text-2 [overflow-wrap:anywhere]">{call.reason}</p>
      : null;
  const expands = renderered !== null || note !== null;

  const glyph: StepState = orphaned || call.status === 'cancelled' || denied ? 'stopped' : running || pending ? 'running' : failed ? 'fail' : 'done';
  const end = orphaned ? <span>{word}</span>
    : running || pending ? <span className="sr-only">{word}</span>
      : failed ? <><span className="text-fail-text">{word}</span>{ms !== undefined && formatDuration(ms)}</>
        : call.status === 'cancelled' ? <span>{word}</span>
          : denied ? null
            : <><span className="sr-only">{word}</span>{ms !== undefined && formatDuration(ms)}</>;

  const row = <>
    <StepGlyph state={glyph}/>
    <span data-slot="tool-call-label" className="shrink-0 text-text-2">{denied ? word : text}</span>
    <span
      data-slot="tool-call-detail"
      dir={mono ? 'ltr' : undefined}
      title={typeof detail === 'string' ? detail : undefined}
      className={cn('min-w-(--tool-detail-min) truncate text-start text-text-1 max-sm:overflow-visible max-sm:whitespace-normal max-sm:[overflow-wrap:anywhere]', mono && 'type-tag', !detail && 'min-w-0')}
    >{detailShown}</span>
    <span data-slot="tool-call-end" className="flex shrink-0 items-center gap-2 whitespace-nowrap text-text-3 data empty:hidden">{end}</span>
    <Disclosure open={expands} end/>
  </>;

  if (!expands) {
    return <div {...shared} {...props} ref={rootRef} className={rootClass}>
      <div ref={rowRef} tabIndex={-1} data-slot="tool-call-row" className={rowVariants({size: sz, opens: false})} {...force}>
        {row}
      </div>
    </div>;
  }

  return <CollapsiblePrimitive.Root
    {...shared}
    open={open ?? openState}
    onOpenChange={next => { setOpenState(next); onOpenChange?.(next); }}
    {...props}
    ref={rootRef}
    className={rootClass}
  >
    <CollapsiblePrimitive.Trigger ref={rowRef} data-slot="tool-call-row" {...force} className={rowVariants({size: sz})}>
      {row}
    </CollapsiblePrimitive.Trigger>
    <CollapsiblePrimitive.Panel data-slot="tool-call-content" className="flex min-w-0 flex-col gap-2 pt-0.5 pb-2">
      {note}
      {renderered !== null && <div data-slot="tool-call-well" className="flex min-w-0 flex-col gap-3 well rounded-soft px-3 py-2">{renderered}</div>}
    </CollapsiblePrimitive.Panel>
  </CollapsiblePrimitive.Root>;
}

type ToolItem =
  | {type: 'call'; key: string; call: ToolCallData}
  | {type: 'group'; key: string; calls: ToolCallData[]; done: boolean};

function groupToolCalls(calls: readonly ToolCallData[], live = false): ToolItem[] {
  const rows = (list: readonly ToolCallData[]): ToolItem[] => list.map(call => ({type: 'call', key: call.id, call}));
  if (!live) return calls.length > 1 ? [{type: 'group', key: 'group:done', calls: [...calls], done: true}] : rows(calls);
  const lead = calls.findIndex(c => c.status !== 'completed');
  const n = Math.min(lead === -1 ? calls.length : lead, calls.length - 1);
  return n > 1 ? [{type: 'group', key: 'group:earlier', calls: calls.slice(0, n), done: false}, ...rows(calls.slice(n))] : rows(calls);
}

function spanOf(calls: readonly ToolCallData[]) {
  const starts = calls.flatMap(c => c.startedAt ?? []);
  const ends = calls.flatMap(c => c.endedAt ?? []);
  return starts.length && ends.length ? Math.max(0, Math.max(...ends) - Math.min(...starts)) : undefined;
}

function ToolCallGroup({calls, done = false, size = 'default', labels, ...props}: Omit<React.ComponentProps<typeof ActivityGroup>, 'summary' | 'meta' | 'live' | 'children'> & {calls: readonly ToolCallData[]; done?: boolean; size?: 'default' | 'sm'; labels?: ToolCallLabels}) {
  const words = wordsFor(labels);
  const span = spanOf(calls);
  const failures = calls.filter(c => c.status === 'error').length;
  const took = calls.reduce((sum, c) => sum + (c.startedAt !== undefined && c.endedAt !== undefined ? Math.max(0, c.endedAt - c.startedAt) : 0), 0);
  const summary = done ? (span ? words.worked(formatDuration(span)) : words.ranTools(calls.length)) : summarizeToolCalls(calls);
  const meta = failures ? <span className="text-fail-text">{words.failedCount(failures)}</span> : !done && took > 0 ? formatDuration(took) : null;
  return <ActivityGroup summary={summary} meta={meta} size={size} {...props}>
    {calls.map(c => <ToolCall key={c.id} call={c} size={size} labels={labels}/>)}
  </ActivityGroup>;
}

function useOrphanGate(calls: readonly ToolCallData[], ttl: number) {
  const [, force] = useState(0);
  const young = calls.filter(c => c.orphan && c.receivedAt !== undefined && Date.now() - c.receivedAt < ttl);
  useEffect(() => {
    if (!young.length) return;
    const next = Math.min(...young.map(c => ttl - (Date.now() - c.receivedAt!)));
    const t = setTimeout(() => force(n => n + 1), Math.max(0, next) + 10);
    return () => clearTimeout(t);
  });
  return calls.filter(c => !young.includes(c));
}

type ToolCallListProps = Omit<React.ComponentProps<'div'>, 'children'> & {
  calls: readonly ToolCallData[];
  live?: boolean;
  hideCompleted?: boolean;
  orphanTtl?: number;
  size?: 'default' | 'sm';
  onReply?: (call: ToolCallData, reply: ToolReply) => void;
  actions?: (call: ToolCallData) => React.ReactNode;
  labels?: ToolCallLabels;
};

function ToolCallList({calls, live, hideCompleted = false, orphanTtl = 2000, size = 'default', onReply, actions, labels, className, ...props}: ToolCallListProps) {
  const ready = useOrphanGate(calls, orphanTtl);
  const visible = hideCompleted ? ready.filter(c => c.status !== 'completed') : ready;
  const active = live ?? visible.some(c => !isTerminal(c.status));
  const items = groupToolCalls(visible, active);
  return <div data-slot="tool-call-list" className={cn('flex min-w-0 flex-col', className)} {...props}>
    {items.map(item => item.type === 'group'
      ? <ToolCallGroup key={item.key} calls={item.calls} done={item.done} size={size} labels={labels}/>
      : <ToolCall key={item.key} call={item.call} size={size} labels={labels} onReply={onReply && (reply => onReply(item.call, reply))} actions={actions?.(item.call)}/>)}
  </div>;
}

const endOf = (s: ToolStatus) => (s === 'completed' ? 'ok' : s === 'error' ? 'fail' : s === 'cancelled' ? 'stopped' : s === 'denied' ? 'denied' : s === 'awaiting-permission' ? 'waiting' : s) as 'pending' | 'running' | 'ok' | 'fail' | 'stopped' | 'denied' | 'waiting';

function summarizeToolCalls(calls: readonly ToolCallData[]) {
  const done = new Map<string, {n: number; r: ToolRenderer}>();
  let failed = 0, stopped = 0, denied = 0;
  for (const c of calls) {
    if (c.status === 'completed') {
      const r = resolveTool(c.tool);
      const hit = done.get(r.summary.key);
      done.set(r.summary.key, {n: (hit?.n ?? 0) + 1, r});
    } else if (c.status === 'error') failed++;
    else if (c.status === 'cancelled') stopped++;
    else if (c.status === 'denied') denied++;
  }
  return joinSummary(
    [...done.values()].map(({n, r}) => (n === 1 ? r.summary.one : r.summary.many(n))),
    [failed && `${failed} failed`, denied && `${denied} denied`, stopped && `${stopped} stopped`].filter(Boolean) as string[],
  );
}

function toolActivity(calls: readonly ToolCallData[], labels: {waiting?: string} = {}): {label: string; active: boolean; doneLabel: string; status: ActivityEnd} {
  const items = calls.map(c => ({c, status: endOf(c.status)}));
  const head = pickActivity(items)?.c;
  const active = calls.some(c => c.status === 'pending' || c.status === 'running' || c.status === 'awaiting-permission');
  const live = head && toolLabel({...head, status: 'running'});
  const label = head ? (head.status === 'awaiting-permission' ? (labels.waiting ?? statusLabels.waiting) : [live!.text, live!.detail].filter(Boolean).join(' ')) : '';
  const status: ActivityEnd = calls.some(c => c.status === 'error') ? 'fail' : calls.some(c => c.status === 'cancelled') ? 'stopped' : 'ok';
  return {label, active, doneLabel: summarizeToolCalls(calls) || pastTense(label), status};
}

export {
  splitForce,
  ToolCall, ToolCallGroup, ToolCallList, CappedOutput, DiffCount,
  toolCallsReducer, useToolCalls, groupToolCalls, registerTool, resolveTool, summarizeToolCalls, toolActivity, toolLabel,
  formatDuration, cleanOutput, isTerminal,
  type ToolCallProps, type ToolCallLabels, type ToolReply, type ToolCallData, type ToolStatus, type ToolEvent, type ToolCallsState, type ToolRenderer, type ToolItem, type ToolCallListProps,
};
