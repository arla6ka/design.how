'use client';

import {cva, type VariantProps} from 'class-variance-authority';
import {Fragment, memo, useEffect, useMemo, useRef, useState} from 'react';
import {formatCount} from '../lib/format';
import {cn} from '../lib/utils';
import {CopyButton} from '../ui/copy-button';
import {Status} from '../ui/status';

const PACE_MS = 24;
const IMMEDIATE = 512;
const SNAP = /[\s.,!?;:)\]]/;

function paceStep(backlog: number) {
  if (backlog <= 12) return 2;
  if (backlog <= 48) return 4;
  if (backlog <= 96) return 8;
  return Math.min(256, Math.ceil(backlog / 4));
}

function nextCut(text: string, start: number) {
  const end = Math.min(text.length, start + paceStep(text.length - start));
  const max = Math.min(text.length, end + 8);
  for (let i = end; i < max; i++) if (SNAP.test(text[i] ?? '')) return i + 1;
  return end;
}

const prefersReduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function usePacedText(text: string, live: boolean, enabled = true) {
  const [shown, setShown] = useState(text);
  const shownRef = useRef(text);
  const latest = useRef(text);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  latest.current = text;

  useEffect(() => {
    const sync = (value: string) => { shownRef.current = value; setShown(value); };
    const clear = () => { if (timer.current) clearTimeout(timer.current); timer.current = undefined; };
    const instant = !live || !enabled || prefersReduced() || (typeof document !== 'undefined' && document.hidden);
    const run = () => {
      timer.current = undefined;
      const full = latest.current;
      const now = shownRef.current;
      if (!full.startsWith(now) || full.length - now.length <= IMMEDIATE) { sync(full); return; }
      const end = nextCut(full, now.length);
      sync(full.slice(0, end));
      if (end < full.length) timer.current = setTimeout(run, PACE_MS);
    };
    if (instant || !text.startsWith(shownRef.current)) { clear(); sync(text); return; }
    if (text.length - shownRef.current.length <= IMMEDIATE && !timer.current) { sync(text); return; }
    if (!timer.current) run();
  }, [text, live, enabled]);

  useEffect(() => {
    const resync = () => { if (timer.current) clearTimeout(timer.current); timer.current = undefined; shownRef.current = latest.current; setShown(latest.current); };
    const onVisible = () => { if (!document.hidden) resync(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pageshow', resync);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pageshow', resync);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return live && enabled ? shown : text;
}

function completeJsonEnd(s: string) {
  let depth = 0, inStr = false, esc = false, started = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; continue; }
    if (ch === '"') inStr = true;
    else if (ch === '{' || ch === '[') { depth++; started = true; }
    else if (ch === '}' || ch === ']') { depth--; if (started && depth === 0) return i + 1; if (depth < 0) return -1; }
  }
  return -1;
}

function closeJson(prefix: string) {
  const stack: string[] = [];
  let inStr = false, esc = false, strStart = -1;
  for (let i = 0; i < prefix.length; i++) {
    const ch = prefix[i];
    if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; continue; }
    if (ch === '"') { inStr = true; strStart = i; }
    else if (ch === '{' || ch === '[') stack.push(ch);
    else if (ch === '}' || ch === ']') stack.pop();
  }
  let out = prefix;
  if (inStr) out = (esc ? out.slice(0, -1) : out) + '"';
  out = out.replace(/\s+$/, '');
  const lastStr = inStr ? strStart : -1;
  if (/[,]$/.test(out)) out = out.slice(0, -1);
  else if (/:$/.test(out)) out += 'null';
  else if (/(?:^|[^\w"])(t|tr|tru)$/.test(out)) out = out.replace(/(t|tr|tru)$/, 'true');
  else if (/(?:^|[^\w"])(f|fa|fal|fals)$/.test(out)) out = out.replace(/(f|fa|fal|fals)$/, 'false');
  else if (/(?:^|[^\w"])(n|nu|nul)$/.test(out)) out = out.replace(/(n|nu|nul)$/, 'null');
  else if (/[-+.eE]$/.test(out)) out += '0';
  if (stack.at(-1) === '{' && out.endsWith('"')) {
    const start = lastStr !== -1 ? lastStr : out.lastIndexOf('"', out.length - 2);
    const before = out.slice(0, start).replace(/\s+$/, '').at(-1);
    if (before === '{' || before === ',') out += ':null';
  }
  for (let i = stack.length - 1; i >= 0; i--) out += stack[i] === '{' ? '}' : ']';
  return out;
}

function viable(prefix: string) {
  if (!prefix.trim()) return true;
  try { JSON.parse(closeJson(prefix)); return true; } catch { return false; }
}

function viableLength(s: string) {
  const lead = s.length - s.trimStart().length;
  if (!/^[[{]/.test(s.trimStart())) return s.trim() ? 0 : s.length;
  if (viable(s)) return s.length;
  let lo = lead + 1, hi = s.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (viable(s.slice(0, mid))) lo = mid; else hi = mid - 1;
  }
  return lo;
}

type TagRenderer = {
  pending: string;
  render: (data: unknown, attrs: Record<string, string>) => React.ReactNode;
  json?: boolean;
};

type TagOutcome = 'segment' | 'discard' | 'literal' | 'pending';

type InlineTag = {
  pattern: RegExp;
  render: (match: RegExpMatchArray, context: {streaming: boolean; key: number}) => React.ReactNode;
  partial?: RegExp;
};

const attrPattern = /([\w-]+)="([^"]*)"/g;
const parseAttrs = (raw: string) => Object.fromEntries([...raw.matchAll(attrPattern)].map(m => [m[1], m[2]]));
const tagOpen = /^<([a-z][\w-]*)((?:\s+[\w-]+="[^"]*")*)\s*>/;

type Chunk = {text: string; kind: 'md' | 'fence' | 'tag'; start: number};

function splitChunks(source: string, isTag: (name: string) => boolean = () => true): Chunk[] {
  const lines = source.split('\n');
  const chunks: Chunk[] = [];
  let buf: string[] = [];
  let bufStart = 0;
  let offset = 0;
  const flush = () => { if (buf.length && buf.some(l => l.trim())) chunks.push({text: buf.join('\n'), kind: 'md', start: bufStart}); buf = []; };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fence = line.match(/^(\s{0,3})(`{3,}|~{3,})/);
    const opened = line.match(tagOpen);
    const tag = opened && isTag(opened[1]) ? opened : null;
    if (fence || tag) {
      flush();
      const start = offset;
      const body = [line];
      offset += line.length + 1;
      if (fence) {
        const close = new RegExp(`^\\s{0,3}${fence[2][0]}{${fence[2].length},}\\s*$`);
        while (++i < lines.length) { body.push(lines[i]); offset += lines[i].length + 1; if (close.test(lines[i])) break; }
        chunks.push({text: body.join('\n'), kind: 'fence', start});
      } else {
        const close = `</${tag![1]}>`;
        let closed = line.includes(close);
        while (!closed && ++i < lines.length) { body.push(lines[i]); offset += lines[i].length + 1; closed = lines[i].includes(close); }
        chunks.push({text: body.join('\n'), kind: 'tag', start});
      }
      bufStart = offset;
      continue;
    }
    if (!line.trim()) { flush(); offset += line.length + 1; bufStart = offset; continue; }
    if (!buf.length) bufStart = offset;
    buf.push(line);
    offset += line.length + 1;
  }
  flush();
  return chunks;
}

type Block =
  | {type: 'p' | 'quote'; text: string}
  | {type: 'h'; level: 1 | 2 | 3; text: string}
  | {type: 'ul' | 'ol'; items: string[]}
  | {type: 'hr'}
  | {type: 'table'; head: string[]; rows: string[][]};

const cells = (row: string) => row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());

function parseMarkdown(source: string, tail: boolean): Block[] {
  const lines = source.split('\n');
  const blocks: Block[] = [];
  let para: string[] = [];
  const flush = () => { if (para.length) blocks.push({type: 'p', text: para.join(' ')}); para = []; };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) { flush(); continue; }
    if (/^\s*\|/.test(line)) {
      flush();
      const rows: string[] = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) rows.push(lines[i++]);
      i--;
      const sep = rows[1] && /^\s*\|?\s*:?-{2,}/.test(rows[1]);
      if (!sep) { if (!tail) rows.forEach(r => para.push(r)); continue; }
      const body = rows.slice(2);
      if (tail && body.length && !/\|\s*$/.test(body.at(-1)!)) body.pop();
      blocks.push({type: 'table', head: cells(rows[0]), rows: body.map(cells)});
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) { flush(); blocks.push({type: 'h', level: heading[1].length as 1 | 2 | 3, text: heading[2]}); continue; }
    if (/^(-{3,}|\*{3,})\s*$/.test(line)) { flush(); blocks.push({type: 'hr'}); continue; }
    const quote = line.match(/^>\s?(.*)$/);
    if (quote) {
      flush();
      const prev = blocks.at(-1);
      if (prev?.type === 'quote') prev.text += ` ${quote[1]}`; else blocks.push({type: 'quote', text: quote[1]});
      continue;
    }
    const item = line.match(/^\s*(?:([-*+])|(\d+)[.)])\s+(.*)$/);
    if (item) {
      flush();
      const type = item[1] ? 'ul' : 'ol';
      const prev = blocks.at(-1);
      if (prev && prev.type === type) prev.items.push(item[3]); else blocks.push({type, items: [item[3]]});
      continue;
    }
    const prev = blocks.at(-1);
    if (!para.length && prev && (prev.type === 'ul' || prev.type === 'ol') && /^\s+\S/.test(line)) {
      prev.items[prev.items.length - 1] += ` ${line.trim()}`;
      continue;
    }
    para.push(line.trim());
  }
  flush();
  return blocks;
}

function heal(text: string, inlineTags: InlineTag[]) {
  let out = text;
  for (const tag of inlineTags) if (tag.partial) out = out.replace(tag.partial, '');
  out = out.replace(/\[([^\]]*)\]\([^)]*$/, '$1').replace(/\[([^\]]*)$/, '$1');
  if ((out.match(/`/g)?.length ?? 0) % 2) out += '`';
  if ((out.replace(/`[^`]*`/g, '').match(/\*\*/g)?.length ?? 0) % 2) out = /\*\*\s*$/.test(out) ? out.replace(/\*\*\s*$/, '') : out + '**';
  return out.replace(/(^|\s)[*_]$/, '$1');
}

const safeHref = (href: string) => /^(https?:\/\/|mailto:|\/(?!\/)|#)/i.test(href) ? href : undefined;

const builtins = [
  '`[^`]+`',
  '\\*\\*[^*]+\\*\\*',
  '\\*[^*\\s][^*]*\\*|(?<![\\w])_[^_\\s][^_]*_(?![\\w])',
  '\\[[^\\]]+\\]\\((?:[^()\\s]|\\([^()\\s]*\\))+\\)',
];
const tagFlags = (re: RegExp) => re.flags.replace(/[^ius]/g, '');
const noTags: InlineTag[] = [];
const patternCache = new WeakMap<InlineTag[], {all: RegExp; whole: RegExp[]}>();
function inlinePatterns(tags: InlineTag[]) {
  let hit = patternCache.get(tags);
  if (!hit) {
    const flags = [...new Set(tags.flatMap(t => [...tagFlags(t.pattern)]))].join('');
    hit = {
      all: new RegExp([...builtins, ...tags.map(t => t.pattern.source)].map(src => `(${src})`).join('|'), `g${flags}`),
      whole: tags.map(t => new RegExp(`^(?:${t.pattern.source})$`, tagFlags(t.pattern))),
    };
    patternCache.set(tags, hit);
  }
  return hit;
}

function Inline({text, tags = noTags, streaming = false}: {text: string; tags?: InlineTag[]; streaming?: boolean}) {
  const {all, whole} = inlinePatterns(tags);
  const parts: React.ReactNode[] = [];
  let at = 0;
  let key = 0;
  for (const m of text.matchAll(all)) {
    if (m.index > at) parts.push(text.slice(at, m.index));
    const token = m[0];
    if (m[1]) parts.push(<code key={key++} className="rounded-inner well px-1 py-0.5 type-code-sm text-text-1 [overflow-wrap:anywhere]">{token.slice(1, -1)}</code>);
    else if (m[2]) parts.push(<strong key={key++} className="font-semibold text-text-1"><Inline text={token.slice(2, -2)} tags={tags} streaming={streaming}/></strong>);
    else if (m[3]) parts.push(<em key={key++}><Inline text={token.slice(1, -1)} tags={tags} streaming={streaming}/></em>);
    else if (m[4]) {
      const [, label, href] = token.match(/^\[([^\]]+)\]\((.+)\)$/) ?? [];
      const safe = safeHref(href ?? '');
      parts.push(safe
        ? <a key={key++} href={safe} className="text-text-1 underline decoration-1 underline-offset-4 transition-[text-decoration-color,outline-color] duration-(--dur-fast) hover:decoration-2 [overflow-wrap:anywhere]" {...(/^https?:/i.test(safe) ? {target: '_blank', rel: 'noreferrer noopener'} : {})}>{label}</a>
        : <Fragment key={key++}>{label}</Fragment>);
    } else {
      const i = whole.findIndex(re => re.test(token));
      const match = i === -1 ? null : token.match(whole[i]);
      parts.push(match ? <Fragment key={key++}>{tags[i].render(match, {streaming, key})}</Fragment> : token);
    }
    at = m.index + token.length;
  }
  if (at < text.length) parts.push(text.slice(at));
  return <>{parts.map((part, i) => <Fragment key={i}>{part}</Fragment>)}</>;
}

function renderBlocks(blocks: Block[], ctx: {tail: boolean; tags: InlineTag[]; streaming: boolean}) {
  const last = ctx.tail ? blocks.findLastIndex(b => b.type !== 'hr' && b.type !== 'table') : -1;
  return blocks.map((block, i) => {
    const live = i === last;
    const text = (value: string, heals = live) => <Inline text={heals ? heal(value, ctx.tags) : value} tags={ctx.tags} streaming={ctx.streaming}/>;
    switch (block.type) {
      case 'p': return <p key={i}>{text(block.text)}</p>;
      case 'quote': return <blockquote key={i} className="ps-3 text-text-2">{text(block.text)}</blockquote>;
      case 'h': {
        const H = (`h${block.level + 2}`) as 'h3' | 'h4' | 'h5';
        return <H key={i} className={cn('pt-1', block.level === 1 ? 'type-heading-xs' : 'type-label')}>{text(block.text)}</H>;
      }
      case 'ul':
      case 'ol': {
        const List = block.type;
        return <List key={i} className="flex flex-col gap-1">
          {block.items.map((item, j) => <li key={j} className="flex gap-2">
            {block.type === 'ul'
              ? <span aria-hidden className="flex w-4 shrink-0"><span className="mt-[0.5lh] size-1.5 -translate-y-1/2 bg-ink"/></span>
              : <span aria-hidden className="min-w-4 shrink-0 text-text-3 data">{j + 1}.</span>}
            <span className="min-w-0">{text(item, live && j === block.items.length - 1)}</span>
          </li>)}
        </List>;
      }
      case 'hr': return <hr key={i} className="h-px border-0 bg-line-row"/>;
      case 'table': return <div key={i} data-slot="response-table" className="min-w-0 overflow-x-auto">
        <table className="w-full text-start type-body-sm">
          <thead><tr className="rule-row">{block.head.map((h, j) => <th key={j} scope="col" className="h-(--row-sm) px-3 text-start type-label-sm font-normal text-text-3 first:ps-0">{text(h, false)}</th>)}</tr></thead>
          <tbody>{block.rows.map((row, r) => <tr key={r} className="rule-row">{row.map((c, j) => <td key={j} className="h-(--row-sm) px-3 py-1.5 align-top first:ps-0">{text(c, false)}</td>)}</tr>)}</tbody>
        </table>
      </div>;
    }
  });
}

const MarkdownChunk = memo(function MarkdownChunk({text, tags, live}: {text: string; tags: InlineTag[]; live: boolean}) {
  return <>{renderBlocks(parseMarkdown(text, live), {tail: live, tags, streaming: live})}</>;
});

function CodeChunk({text, open, maxLines, showMore}: {text: string; open: boolean; maxLines: number; showMore: (lines: number) => string}) {
  const [all, setAll] = useState(false);
  const lines = text.split('\n');
  const lang = lines[0].replace(/^\s*(`{3,}|~{3,})\s*/, '').trim();
  const body = lines.slice(1, open ? undefined : -1);
  const hidden = all ? 0 : Math.max(0, body.length - maxLines);
  return <div data-slot="response-code" data-open={open || undefined} className="relative flex min-w-0 flex-col overflow-hidden rounded-frame well">
    <div className="frame-head">
      <span className="min-w-0 flex-1 truncate type-tag text-text-3">{lang}</span>
      {!open && <CopyButton value={body.join('\n')} label="code" size="icon-xs"/>}
    </div>
    <pre className="overflow-x-auto px-4 pb-3 type-code text-text-1"><code>{(hidden ? body.slice(0, maxLines) : body).join('\n')}</code></pre>
    {hidden > 0 && <button type="button" onClick={() => setAll(true)} className="flex h-(--row-sm) items-center px-4 text-start type-label-sm text-text-2 rule-top transition-colors duration-(--dur-fast) ease-(--ease-step) hover:bg-hover hover:text-text-1 focus-visible:focus-ring-inset">{showMore(hidden)}</button>}
  </div>;
}

function Pending({label}: {label: string}) {
  return <div data-slot="response-pending" className="flex h-(--row) items-center gap-2 rounded-frame px-4 control-edge">
    <Status status="running" className="type-label">{label}</Status>
  </div>;
}

type TagResult = {outcome: TagOutcome; node: React.ReactNode; rest?: string};

function resolveTag(chunk: string, tags: Record<string, TagRenderer>, open: boolean, expired: boolean): TagResult {
  const m = chunk.match(tagOpen)!;
  const [whole, name, rawAttrs] = m;
  const renderer = tags[name];
  if (!renderer) return {outcome: 'literal', node: <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{chunk}</p>};
  const attrs = parseAttrs(rawAttrs);
  const close = `</${name}>`;
  const after = chunk.slice(whole.length);
  const at = after.indexOf(close);
  const body = at === -1 ? after : after.slice(0, at);
  const trailing = at === -1 ? '' : after.slice(at + close.length);

  if (renderer.json === false) {
    if (at !== -1) return {outcome: 'segment', node: renderer.render(body.trim(), attrs), rest: trailing};
    if (open && !expired) return {outcome: 'pending', node: <Pending label={renderer.pending}/>};
    const [first, ...more] = chunk.split('\n');
    return {outcome: 'literal', node: <p className="[overflow-wrap:anywhere]">{first}</p>, rest: more.join('\n')};
  }

  const end = completeJsonEnd(body);
  if (end !== -1) {
    try {
      const data = JSON.parse(body.slice(0, end));
      return {outcome: 'segment', node: renderer.render(data, attrs), rest: (at === -1 ? body.slice(end) : body.slice(end) + trailing).replace(new RegExp(`^\\s*${close.replace('/', '\\/')}`), '')};
    } catch {
      return {outcome: 'discard', node: null, rest: at === -1 ? body.slice(end) : trailing};
    }
  }
  const v = viableLength(body);
  if (v === 0 && body.trim()) return {outcome: 'literal', node: <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{body.trim()}</p>, rest: trailing};
  if (v >= body.length && at === -1) return open ? {outcome: 'pending', node: <Pending label={renderer.pending}/>} : {outcome: 'discard', node: null};
  return {outcome: 'discard', node: null, rest: (at === -1 ? body.slice(v) : trailing)};
}

const responseVariants = cva('flex min-w-0 flex-col text-text-1 break-words', {
  variants: {
    size: {
      default: 'gap-3 type-body',
      sm: 'gap-2 type-body-sm',
    },
  },
  defaultVariants: {size: 'default'},
});

type ResponseProps = Omit<React.ComponentProps<'div'>, 'children'> & VariantProps<typeof responseVariants> & {
  children: string;
  streaming?: boolean;
  pace?: boolean;
  tags?: Record<string, TagRenderer>;
  inlineTags?: InlineTag[];
  tagTimeout?: number;
  maxCodeLines?: number;
  showMoreLines?: (lines: number) => string;
};

const showMoreLinesDefault = (lines: number) => `Show ${formatCount(lines)} more ${lines === 1 ? 'line' : 'lines'}`;

function Response({children, streaming = false, pace = true, tags, inlineTags = noTags, tagTimeout = 8000, maxCodeLines = 40, showMoreLines = showMoreLinesDefault, size = 'default', className, ...props}: ResponseProps) {
  const text = usePacedText(children, streaming, pace);
  const streamed = useRef(streaming);
  if (streaming) streamed.current = true;
  const tagMap = tags ?? noTagMap;
  const isTag = useMemo(() => (name: string) => Object.hasOwn(tagMap, name), [tagMap]);
  const [expiredAt, setExpiredAt] = useState<number | null>(null);

  let tailKey = '';
  const render = (source: string, base: number, depth: number): React.ReactNode[] => {
    const chunks = splitChunks(source, isTag);
    return chunks.map((chunk, i) => {
      const start = base + chunk.start;
      const live = i === chunks.length - 1 && streaming;
      if (chunk.kind === 'fence') {
        const open = !/^\s{0,3}(`{3,}|~{3,})\s*$/.test(chunk.text.split('\n').at(-1) ?? '') || chunk.text.split('\n').length === 1;
        return <CodeChunk key={start} text={chunk.text} open={open} maxLines={maxCodeLines} showMore={showMoreLines}/>;
      }
      if (chunk.kind === 'tag') {
        const r = resolveTag(chunk.text, tagMap, live, expiredAt === start);
        if (live && (r.outcome === 'pending' || expiredAt === start)) tailKey = `${start}:${chunk.text.length}`;
        const rest = r.rest?.trim() && depth < 8 ? r.rest : '';
        return <Fragment key={start}>
          <div data-slot="response-tag" data-outcome={r.outcome} className="min-w-0">{r.node}</div>
          {rest && render(rest, start + chunk.text.length - rest.length, depth + 1)}
        </Fragment>;
      }
      return <MarkdownChunk key={start} text={chunk.text} tags={inlineTags} live={live}/>;
    });
  };
  const nodes = render(text, 0, 0);

  useEffect(() => {
    setExpiredAt(null);
    if (!tailKey || !streaming) return;
    const t = setTimeout(() => setExpiredAt(Number(tailKey.split(':')[0])), tagTimeout);
    return () => clearTimeout(t);
  }, [tailKey, streaming, tagTimeout]);

  return <div
    data-slot="response"
    data-streaming={streaming || undefined}
    data-streamed={streamed.current || undefined}
    aria-busy={streaming || undefined}
    className={cn(responseVariants({size}), className)}
    {...props}
  >{nodes}</div>;
}

const noTagMap: Record<string, TagRenderer> = {};

export {
  Response, usePacedText, splitChunks, parseMarkdown, resolveTag, viableLength, completeJsonEnd, closeJson, nextCut, paceStep, safeHref, responseVariants,
  type ResponseProps, type TagRenderer, type TagOutcome, type InlineTag,
};
