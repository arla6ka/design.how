'use client';

import {useRef, useState, type CSSProperties, type ReactNode} from 'react';
import {Icon, ArrowsHorizontal, TextWrap, View, ViewOff} from '../icon';
import {useScrollTabStop} from '../lib/scroll';
import {cn} from '../lib/utils';
import {Button} from './button';
import {CopyButton} from './copy-button';

type Language = 'ts' | 'tsx' | 'js' | 'json' | 'bash' | 'python' | 'sql' | 'yaml' | 'text';
type TokenType = 'plain' | 'keyword' | 'string' | 'number' | 'comment' | 'punct' | 'key';
type Token = {type: TokenType; value: string};

const jsKeywords = 'as async await break case catch class const continue default delete do else enum export extends false finally for from function if import in instanceof interface let new null of return static super switch this throw true try type typeof undefined var void while yield';
const sqlKeywords = 'select from where and or not null is in as on join left right inner outer full cross group by order having limit offset insert into values update set delete create table view index drop alter add column primary key references with union all distinct case when then else end partition over asc desc between like exists true false cast interval';
const config: Record<Language, {line?: string; block?: [string, string]; quotes: string; multi?: string; keywords: Set<string>; word: RegExp; caseless?: boolean}> = {
  ts: {line: '//', block: ['/*', '*/'], quotes: `'"\``, multi: '`', keywords: new Set(jsKeywords.split(' ')), word: /^[A-Za-z_$][\w$]*/},
  tsx: {line: '//', block: ['/*', '*/'], quotes: `'"\``, multi: '`', keywords: new Set(jsKeywords.split(' ')), word: /^[A-Za-z_$][\w$]*/},
  js: {line: '//', block: ['/*', '*/'], quotes: `'"\``, multi: '`', keywords: new Set(jsKeywords.split(' ')), word: /^[A-Za-z_$][\w$]*/},
  json: {quotes: '"', keywords: new Set(['true', 'false', 'null']), word: /^[A-Za-z_]\w*/},
  bash: {line: '#', quotes: `'"`, keywords: new Set('if then else elif fi for while do done case esac in function export local return'.split(' ')), word: /^[A-Za-z_./@~-][\w./@~:=-]*/},
  python: {line: '#', quotes: `'"`, keywords: new Set('and as assert async await break class continue def del elif else except False finally for from global if import in is lambda None nonlocal not or pass raise return True try while with yield'.split(' ')), word: /^[A-Za-z_]\w*/},
  sql: {line: '--', block: ['/*', '*/'], quotes: `'"`, keywords: new Set(sqlKeywords.split(' ')), word: /^[A-Za-z_][\w.]*/, caseless: true},
  yaml: {line: '#', quotes: `'"`, keywords: new Set(['true', 'false', 'null', 'yes', 'no']), word: /^[A-Za-z_][\w.-]*/},
  text: {quotes: '', keywords: new Set(), word: /^\S+/},
};

type State = {block?: boolean; quote?: string};

function tokenizeLine(line: string, lang: Language, state: State): Token[] {
  const c = config[lang];
  const out: Token[] = [];
  const push = (type: TokenType, value: string) => {
    const last = out[out.length - 1];
    if (last && last.type === type) last.value += value; else out.push({type, value});
  };
  let i = 0;
  while (i < line.length) {
    const rest = line.slice(i);
    if (state.block && c.block) {
      const end = rest.indexOf(c.block[1]);
      if (end < 0) { push('comment', rest); break; }
      push('comment', rest.slice(0, end + c.block[1].length));
      i += end + c.block[1].length; state.block = false; continue;
    }
    if (state.quote) {
      let j = 0;
      while (j < rest.length && rest[j] !== state.quote) j += rest[j] === '\\' ? 2 : 1;
      if (j >= rest.length) { push('string', rest); break; }
      push('string', rest.slice(0, j + 1)); i += j + 1; state.quote = undefined; continue;
    }
    if (c.line && rest.startsWith(c.line) && (c.line !== '#' || i === 0 || /\s/.test(line[i - 1]))) { push('comment', rest); break; }
    if (c.block && rest.startsWith(c.block[0])) { state.block = true; push('comment', c.block[0]); i += c.block[0].length; continue; }
    const ch = line[i];
    if (c.quotes.includes(ch)) {
      let j = 1;
      while (j < rest.length && rest[j] !== ch) j += rest[j] === '\\' ? 2 : 1;
      if (j >= rest.length && c.multi?.includes(ch)) { state.quote = ch; push('string', rest); break; }
      const value = rest.slice(0, j + 1);
      i += value.length;
      push((lang === 'json' || lang === 'yaml') && /^\s*:/.test(line.slice(i)) ? 'key' : 'string', value);
      continue;
    }
    if (/\s/.test(ch)) { const m = rest.match(/^\s+/)![0]; push('plain', m); i += m.length; continue; }
    if (lang !== 'text' && /\d/.test(ch) && !/[\w$]/.test(line[i - 1] ?? '')) {
      const m = rest.match(/^\d[\d_.xXa-fA-FeEn]*/)![0]; push('number', m); i += m.length; continue;
    }
    const word = rest.match(c.word);
    if (word) {
      const w = word[0];
      i += w.length;
      if (lang === 'yaml' && /^\s*:/.test(line.slice(i)) && !line.slice(0, i - w.length).trim().replace(/^-\s*/, '')) push('key', w);
      else push(c.keywords.has(c.caseless ? w.toLowerCase() : w) ? 'keyword' : 'plain', w);
      continue;
    }
    push(lang === 'text' ? 'plain' : 'punct', ch);
    i += 1;
  }
  return out;
}

function tokenize(code: string, language: Language = 'text'): Token[][] {
  const state: State = {};
  return code.split('\n').map(line => tokenizeLine(line, language, state));
}

const tokenClass: Record<TokenType, string> = {
  plain: 'text-text-1',
  key: 'text-text-1',
  number: 'text-text-1',
  string: 'text-text-1',
  keyword: 'text-text-2',
  punct: 'text-text-3',
  comment: 'text-text-3',
};

const matchClass = 'bg-selected text-text-1';
const currentMatchClass = 'bg-selected-strong text-text-1 outline-1 -outline-offset-1 outline-accent-edge';

function splitMarks(value: string, start: number, marks: [number, number][], current?: number): ReactNode {
  const end = start + value.length;
  const parts: ReactNode[] = [];
  let at = start;
  marks.forEach(([a, b], m) => {
    if (b <= start || a >= end) return;
    const s = Math.max(a, start), e = Math.min(b, end);
    if (s > at) parts.push(value.slice(at - start, s - start));
    parts.push(<mark key={m} data-current={m === current || undefined} className={m === current ? currentMatchClass : matchClass}>{value.slice(s - start, e - start)}</mark>);
    at = e;
  });
  if (at < end) parts.push(value.slice(at - start));
  return parts;
}

function TokenLine({tokens, marks, current}: {tokens: Token[]; marks?: [number, number][]; current?: number}) {
  if (!tokens.length) return <>{'\n'}</>;
  let offset = 0;
  return <>{tokens.map((token, i) => {
    const start = offset;
    offset += token.value.length;
    return <span key={i} className={tokenClass[token.type]}>{marks?.length ? splitMarks(token.value, start, marks, current) : token.value}</span>;
  })}</>;
}

function parseLines(lines?: number[] | string): Set<number> {
  if (!lines) return new Set();
  if (Array.isArray(lines)) return new Set(lines);
  const out = new Set<number>();
  for (const part of lines.split(',')) {
    const [a, b] = part.trim().split('-').map(Number);
    if (!a) continue;
    for (let n = a; n <= (b || a); n++) out.add(n);
  }
  return out;
}

const languageLabels: Record<Language, string> = {ts: 'TypeScript', tsx: 'TSX', js: 'JavaScript', json: 'JSON', bash: 'Shell', python: 'Python', sql: 'SQL', yaml: 'YAML', text: 'Text'};

const gutterStyle = (last: number, insets = 'calc(2 * var(--inset))') => ({'--gutter': `calc(${String(last).length}ch + ${insets})`} as CSSProperties);
const maxLinesStyle = (maxLines?: number, insets = 'calc(2 * var(--inset))') => (maxLines ? {'--code-max': `calc(${maxLines} * 1lh + ${insets})`} as CSSProperties : undefined);

function WrapToggle({wrap, onWrap, size = 'icon-sm', variant = 'ghost', className}: {wrap: boolean; onWrap: (wrap: boolean) => void; size?: 'icon-sm' | 'icon'; variant?: 'ghost' | 'secondary'; className?: string}) {
  return <Button data-slot="code-wrap" variant={variant} size={size} aria-label="Wrap lines" aria-pressed={wrap} onClick={() => onWrap(!wrap)} className={cn('aria-pressed:text-text-1', className)}>
    <Icon icon={wrap ? TextWrap : ArrowsHorizontal}/>
  </Button>;
}

type CodeBlockProps = Omit<React.ComponentProps<'figure'>, 'children' | 'onCopy'> & {
  code: string;
  variant?: 'block' | 'command';
  language?: Language;
  filename?: string;
  header?: boolean;
  lineNumbers?: boolean;
  highlight?: number[] | string;
  defaultWrap?: boolean;
  startLine?: number;
  prompt?: string;
  secret?: string;
  maxLines?: number;
  copyLabel?: string;
  onCopy?: (text: string) => void;
};

function CodeBlock(props: CodeBlockProps) {
  return props.variant === 'command' ? <CommandBlock {...props}/> : <FileBlock {...props}/>;
}

const scroll = 'overflow-auto overscroll-contain focus-visible:focus-ring-inset';

function FileBlock({code, language = 'text', filename, header = true, lineNumbers = false, highlight, defaultWrap = false, startLine = 1, maxLines, copyLabel = 'code', onCopy, className, variant: _variant, prompt: _prompt, secret: _secret, ...props}: CodeBlockProps) {
  const [wrap, setWrap] = useState(defaultWrap);
  const body = useRef<HTMLDivElement>(null);
  const tab = useScrollTabStop(body);
  const source = code.replace(/\n$/, '');
  const lines = tokenize(source, language);
  const marked = parseLines(highlight);
  const name = filename ?? languageLabels[language];

  return <figure
    data-slot="code-block"
    data-variant="block"
    data-wrap={wrap || undefined}
    className={cn('frame flex flex-col overflow-hidden text-text-1', className)}
    {...props}
  >
    {header && <figcaption data-slot="code-block-header" className="flex min-h-(--row-sm) min-w-0 items-center gap-2 border-b border-line bg-panel ps-inset">
      <span className={cn('min-w-0 flex-1 truncate', filename ? 'type-code-sm text-text-1' : 'type-label-sm text-text-2')}>{name}</span>
      {filename && language !== 'text' && <span className="hidden type-micro text-text-3 sm:block">{languageLabels[language]}</span>}
      <span className="flex shrink-0 items-center">
        <WrapToggle wrap={wrap} onWrap={setWrap} size="icon"/>
        <CopyButton value={source} label={copyLabel} onCopy={onCopy} size="icon"/>
      </span>
    </figcaption>}
    <div className="relative flex min-h-0 flex-col bg-code-surface">
      <div
        ref={body}
        data-slot="code-block-body"
        tabIndex={tab}
        role={tab === 0 ? 'region' : undefined}
        aria-label={tab === 0 ? name : undefined}
        dir="ltr"
        className={cn(scroll, 'min-h-0 py-inset type-code', maxLines && 'max-h-(--code-max)', !header && 'pe-8')}
        style={maxLinesStyle(maxLines)}
      >
        <pre className={wrap ? 'w-full' : 'w-max min-w-full'}>
          <code className="block">
            {lines.map((tokens, i) => {
              const n = startLine + i;
              const on = marked.has(n);
              return <span key={i} data-slot="code-block-line" data-highlighted={on || undefined} className={cn('flex pe-inset', !lineNumbers && 'ps-inset', on && 'bg-selected forced-colors:outline forced-colors:outline-1 forced-colors:-outline-offset-1')}>
                {lineNumbers && <span aria-hidden data-slot="code-block-number" className={cn('sticky start-0 w-(--gutter) shrink-0 px-inset text-end text-text-3 select-none', on ? 'bg-selected' : 'bg-code-surface')} style={gutterStyle(startLine + lines.length - 1)}>{n}</span>}
                <span className={cn('min-w-0 flex-1', wrap ? 'whitespace-pre-wrap [overflow-wrap:anywhere]' : 'whitespace-pre', on && "before:sr-only before:content-['Highlighted:_']")}><TokenLine tokens={tokens}/></span>
              </span>;
            })}
          </code>
        </pre>
      </div>
      {!header && <span className="absolute end-0 top-0"><CopyButton value={source} label={copyLabel} onCopy={onCopy}/></span>}
    </div>
  </figure>;
}

type CommandLine = {kind: 'command' | 'output'; text: string};

function commandLines(code: string, prompt: string): CommandLine[] {
  const lines = code.replace(/\n$/, '').split('\n');
  const marker = prompt ? `${prompt} ` : '';
  const anyPrompt = !!marker && lines.some(l => l.startsWith(marker));
  return lines.map(l => !anyPrompt ? {kind: 'command', text: l} : l.startsWith(marker) ? {kind: 'command', text: l.slice(marker.length)} : {kind: 'output', text: l});
}

function maskSecret(secret: string) {
  if (secret.length <= 12) return '•'.repeat(secret.length);
  return secret.slice(0, 8) + '•'.repeat(secret.length - 12) + secret.slice(-4);
}

function Masked({line, secret, revealed}: {line: string; secret?: string; revealed: boolean}) {
  if (!secret || revealed || !line.includes(secret)) return <TokenLine tokens={tokenize(line, 'bash')[0]}/>;
  const parts = line.split(secret);
  return <>{parts.flatMap((part, i) => {
    const text = <TokenLine key={`t${i}`} tokens={tokenize(part, 'bash')[0]}/>;
    return i === 0 ? [text] : [<span key={`s${i}`} data-slot="code-block-secret" className="text-text-2 select-none before:sr-only before:content-['hidden_secret']"><span aria-hidden>{maskSecret(secret)}</span></span>, text];
  })}</>;
}

function CommandBlock({code, prompt = '$', secret, maxLines, copyLabel = 'command', onCopy, className, variant: _variant, language: _l, filename: _f, header: _h, lineNumbers: _n, highlight: _hl, defaultWrap: _w, startLine: _s, ...props}: CodeBlockProps) {
  const [revealed, setRevealed] = useState(false);
  const body = useRef<HTMLDivElement>(null);
  const tab = useScrollTabStop(body);
  const lines = commandLines(code, prompt);
  const copyText = lines.filter(l => l.kind === 'command').map(l => l.text).join('\n');
  const many = lines.filter(l => l.kind === 'command').length > 1;
  return <figure
    data-slot="code-block"
    data-variant="command"
    className={cn('code-surface relative flex min-w-0 items-start text-text-1', className)}
    {...props}
  >
    <div
      ref={body}
      data-slot="code-block-body"
      tabIndex={tab}
      role={tab === 0 ? 'region' : undefined}
      aria-label={tab === 0 ? (many ? 'Commands' : 'Command') : undefined}
      dir="ltr"
      className={cn(scroll, 'min-w-0 flex-1 py-1.5 ps-3 type-code', maxLines && 'max-h-(--code-max)')}
      style={maxLinesStyle(maxLines)}
    >
      <pre className="w-max min-w-full">
        {lines.map((line, i) => <div key={i} data-slot={line.kind === 'command' ? 'code-block-command' : 'code-block-output'} className={cn('whitespace-pre', line.kind === 'output' && 'text-text-2')}>
          {line.kind === 'command' && prompt && <span aria-hidden data-slot="code-block-prompt" className="text-text-3 select-none">{prompt} </span>}
          <code>{line.kind === 'command' ? <Masked line={line.text} secret={secret} revealed={revealed}/> : line.text || ' '}</code>
        </div>)}
      </pre>
    </div>
    <span className="flex shrink-0 items-center self-start">
      {secret && <Button data-slot="code-block-reveal" variant="ghost" size="icon" aria-label="Show secret" aria-pressed={revealed} onClick={() => setRevealed(r => !r)} className="aria-pressed:text-text-1">
        <Icon icon={revealed ? ViewOff : View}/>
      </Button>}
      <CopyButton value={copyText} label={copyLabel} onCopy={onCopy} size="icon"/>
    </span>
  </figure>;
}

export {
  CodeBlock, TokenLine, WrapToggle, tokenize, parseLines, commandLines, maskSecret, gutterStyle, maxLinesStyle,
  matchClass, currentMatchClass, languageLabels,
  type CodeBlockProps, type Language, type Token, type TokenType,
};
