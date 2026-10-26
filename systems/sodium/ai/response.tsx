'use client';

import {Fragment, memo, useEffect, useMemo, useRef, useState, type ReactNode} from 'react';
import {CodeBlock, type Language} from '../ui/code-block';
import {cn, reducedMotion} from '../lib/utils';

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

function usePacedText(text: string, live: boolean, el?: React.RefObject<Element | null>) {
  const [shown, setShown] = useState(text);
  const shownRef = useRef(text);
  const latest = useRef(text);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  latest.current = text;

  useEffect(() => {
    const sync = (value: string) => { shownRef.current = value; setShown(value); };
    const clear = () => { if (timer.current) clearTimeout(timer.current); timer.current = undefined; };
    const instant = !live || reducedMotion(el?.current) || document.hidden;
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
  }, [text, live, el]);

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

  return live ? shown : text;
}

const fenceLine = /^(\s{0,3})(`{3,}|~{3,})\s*([\w+-]*)/;

function splitChunks(source: string): string[] {
  const chunks: string[] = [];
  let current: string[] = [];
  let fence: string | undefined;
  for (const line of source.split('\n')) {
    const m = line.match(fenceLine);
    if (m) fence = fence === undefined ? m[2][0].repeat(m[2].length) : line.trim().startsWith(fence) ? undefined : fence;
    if (fence === undefined && !line.trim() && !m) {
      if (current.length) chunks.push(current.join('\n'));
      current = [];
      continue;
    }
    current.push(line);
  }
  if (current.length) chunks.push(current.join('\n'));
  return chunks;
}

type Block =
  | {type: 'heading'; level: number; text: string}
  | {type: 'paragraph'; text: string}
  | {type: 'list'; ordered: boolean; start: number; items: string[]}
  | {type: 'quote'; text: string}
  | {type: 'code'; lang: string; code: string; open: boolean}
  | {type: 'table'; head: string[]; rows: string[][]}
  | {type: 'rule'};

const cells = (line: string) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());

function parseMarkdown(chunk: string): Block[] {
  const lines = chunk.split('\n');
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const fence = line.match(fenceLine);
    if (fence) {
      const mark = fence[2];
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(mark[0].repeat(mark.length))) body.push(lines[i++]);
      const open = i >= lines.length;
      i++;
      blocks.push({type: 'code', lang: fence[3] ?? '', code: body.join('\n'), open});
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) { blocks.push({type: 'heading', level: heading[1].length, text: heading[2].replace(/\s+#+\s*$/, '')}); i++; continue; }
    if (/^\s{0,3}([-*_])(\s*\1){2,}\s*$/.test(line)) { blocks.push({type: 'rule'}); i++; continue; }
    if (/^\s*\|/.test(line) && lines[i + 1] !== undefined && /^\s*\|?\s*:?-+:?\s*(\||$)/.test(lines[i + 1])) {
      const head = cells(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) rows.push(cells(lines[i++]));
      blocks.push({type: 'table', head, rows});
      continue;
    }
    const item = line.match(/^\s{0,3}([-*+]|(\d+)[.)])\s+(.*)$/);
    if (item) {
      const ordered = item[2] !== undefined;
      const items: string[] = [];
      const start = ordered ? Number(item[2]) : 1;
      while (i < lines.length) {
        const m = lines[i].match(/^\s{0,3}([-*+]|(\d+)[.)])\s+(.*)$/);
        if (m && (m[2] !== undefined) === ordered) { items.push(m[3]); i++; continue; }
        if (!m && /^\s{2,}\S/.test(lines[i]) && items.length) { items[items.length - 1] += ` ${lines[i].trim()}`; i++; continue; }
        break;
      }
      blocks.push({type: 'list', ordered, start, items});
      continue;
    }
    if (/^\s{0,3}>/.test(line)) {
      const body: string[] = [];
      while (i < lines.length && /^\s{0,3}>/.test(lines[i])) body.push(lines[i++].replace(/^\s{0,3}>\s?/, ''));
      blocks.push({type: 'quote', text: body.join(' ')});
      continue;
    }
    const body: string[] = [];
    while (i < lines.length && lines[i].trim() && !fenceLine.test(lines[i]) && !/^(#{1,6})\s/.test(lines[i]) && !/^\s{0,3}([-*+]|\d+[.)])\s/.test(lines[i])) body.push(lines[i++]);
    if (!body.length) { i++; continue; }
    blocks.push({type: 'paragraph', text: body.join('\n')});
  }
  return blocks;
}

function closeDangling(text: string): string {
  if (text.split('\n').some(line => fenceLine.test(line))) return text;
  let out = text.replace(/\[[^\]\n]*(\]\([^)\s]*)?$/, '');
  if ((out.match(/`/g)?.length ?? 0) % 2) out += '`';
  const code = out.replace(/`[^`]*`/g, '');
  if ((code.match(/\*\*/g)?.length ?? 0) % 2) out += '**';
  return out;
}

const safeHref = (href: string) => /^(https?:\/\/|mailto:|\/(?!\/)|#)/i.test(href) ? href : undefined;

const inline = /(`[^`]+`)|\[([^\]\n]+)\]\(((?:[^()\s]|\([^()\s]*\))+)\)|\*\*([^*\n]+)\*\*|(?<![\w*])\*([^*\n]+)\*(?![\w*])|(?<![\w_])_([^_\n]+)_(?![\w_])/g;

function renderInline(text: string, key = ''): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(inline)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${key}${m.index}`;
    if (m[1]) out.push(<code key={k} className="mono bg-well text-text-1">{m[1].slice(1, -1)}</code>);
    else if (m[2]) {
      const href = safeHref(m[3]);
      out.push(href
        ? <a key={k} href={href} className="text-accent-text underline decoration-accent-edge underline-offset-4 hover:decoration-current" {...(/^https?:/i.test(href) ? {target: '_blank', rel: 'noreferrer'} : {})}>{renderInline(m[2], k)}</a>
        : <Fragment key={k}>{renderInline(m[2], k)}</Fragment>);
    }
    else if (m[4]) out.push(<strong key={k} className="selected font-normal">{renderInline(m[4], k)}</strong>);
    else out.push(<em key={k} className="not-italic">{renderInline(m[5] ?? m[6], k)}</em>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

type Size = 'default' | 'sm';
const caret = <span aria-hidden data-slot="response-caret" className="caret"/>;

const fenceLanguages: Record<string, Language> = {
  ts: 'ts', typescript: 'ts', tsx: 'tsx', js: 'js', javascript: 'js', jsx: 'js', json: 'json', sql: 'sql', python: 'python', py: 'python',
  bash: 'bash', sh: 'bash', shell: 'bash', zsh: 'bash', console: 'bash', yaml: 'yaml', yml: 'yaml',
};

function BlockView({block, size, tail}: {block: Block; size: Size; tail: boolean}) {
  const body = size === 'sm' ? 'type-body-sm' : 'type-body';
  const end = tail ? caret : null;
  switch (block.type) {
    case 'heading': {
      const Tag = (`h${Math.min(6, block.level + 2)}`) as 'h3';
      return <Tag className={cn('text-text-1', block.level === 1 ? 'type-label-lg' : 'type-label', 'pt-2')}>{renderInline(block.text)}{end}</Tag>;
    }
    case 'paragraph': return <p className={cn(body, 'max-w-measure text-text-1')}>{renderInline(block.text)}{end}</p>;
    case 'quote': return <blockquote className="flex min-w-0 gap-3">
      <span aria-hidden className="rail w-(--rail) shrink-0"/>
      <p className={cn(body, 'max-w-measure text-text-2')}>{renderInline(block.text)}{end}</p>
    </blockquote>;
    case 'rule': return <hr className="border-line"/>;
    case 'list': {
      const List = block.ordered ? 'ol' : 'ul';
      return <List start={block.ordered && block.start !== 1 ? block.start : undefined} className={cn(body, 'flex max-w-measure flex-col gap-1 ps-6 text-text-1', block.ordered ? 'list-decimal marker:type-code-sm marker:text-text-3' : 'list-[square] marker:text-mark')}>
        {block.items.map((text, i) => <li key={i} className="ps-1">{renderInline(text, `${i}-`)}{i === block.items.length - 1 && end}</li>)}
      </List>;
    }
    case 'table': return <div className="min-w-0 overflow-x-auto border border-line">
      <table className="w-full border-collapse text-start">
        <thead><tr className="border-b border-line bg-panel">{block.head.map((h, i) => <th key={i} scope="col" className="h-(--row-sm) px-inset text-start type-label-sm text-text-3">{renderInline(h)}</th>)}</tr></thead>
        <tbody>{block.rows.map((row, r) => <tr key={r} className="rule-row">{block.head.map((_, c) => <td key={c} className="h-(--row-sm) px-inset type-body-sm text-text-1">{renderInline(row[c] ?? '')}{r === block.rows.length - 1 && c === block.head.length - 1 && end}</td>)}</tr>)}</tbody>
      </table>
    </div>;
    case 'code': return <CodeBlock code={block.code} language={fenceLanguages[block.lang.toLowerCase()] ?? 'text'} copyLabel={block.lang || 'code'}/>;
  }
}

const Chunk = memo(function Chunk({text, size, tail}: {text: string; size: Size; tail: boolean}) {
  const blocks = parseMarkdown(text);
  return <>{blocks.map((block, i) => <BlockView key={i} block={block} size={size} tail={tail && i === blocks.length - 1}/>)}</>;
});

type ResponseProps = Omit<React.ComponentProps<'div'>, 'children'> & {
  children: string;
  live?: boolean;
  size?: Size;
};

function Response({children: source, live = false, size = 'default', className, ...props}: ResponseProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shown = usePacedText(source, live, ref);
  const chunks = useMemo(() => splitChunks(shown), [shown]);
  return <div
    ref={ref}
    data-slot="response"
    data-live={live || undefined}
    aria-busy={live || undefined}
    className={cn('flex min-w-0 flex-col', size === 'sm' ? 'gap-3' : 'gap-4', className)}
    {...props}
  >
    {chunks.map((chunk, i) => {
      const tail = i === chunks.length - 1;
      return <Chunk key={i} text={tail && live ? closeDangling(chunk) : chunk} size={size} tail={tail && live}/>;
    })}
    {live && !chunks.length && <p className={size === 'sm' ? 'type-body-sm' : 'type-body'}>{caret}</p>}
  </div>;
}

export {Response, usePacedText, splitChunks, parseMarkdown, closeDangling, nextCut, paceStep, safeHref, type ResponseProps};
