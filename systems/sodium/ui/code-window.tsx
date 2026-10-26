'use client';

import {useRef, useState} from 'react';
import {useScrollTabStop} from '../lib/scroll';
import {cn} from '../lib/utils';
import {CopyButton} from './copy-button';
import {TokenLine, WrapToggle, gutterStyle, languageLabels, maxLinesStyle, parseLines, tokenize, type Language} from './code-block';

type CodeWindowProps = Omit<React.ComponentProps<'figure'>, 'children' | 'onCopy'> & {
  code: string;
  language?: Language;
  filename?: string;
  startLine?: number;
  fail?: number[] | string;
  failLabel?: string;
  highlight?: number[] | string;
  defaultWrap?: boolean;
  maxLines?: number;
  copy?: boolean;
  copyLabel?: string;
  onCopy?: (text: string) => void;
};

function CodeWindow({code, language = 'text', filename, startLine = 1, fail, failLabel = 'Fail', highlight, defaultWrap = false, maxLines, copy = true, copyLabel = 'code', onCopy, className, ...props}: CodeWindowProps) {
  const [wrap, setWrap] = useState(defaultWrap);
  const body = useRef<HTMLDivElement>(null);
  const tab = useScrollTabStop(body);
  const source = code.replace(/\n$/, '');
  const lines = tokenize(source, language);
  const failed = parseLines(fail);
  const marked = parseLines(highlight);
  const name = filename ?? languageLabels[language];

  return <figure
    data-slot="code-window"
    data-status={failed.size ? 'fail' : undefined}
    className={cn('frame flex flex-col overflow-hidden text-text-1', className)}
    {...props}
  >
    <figcaption data-slot="code-window-header" className="panel-head shrink-0">
      <span data-slot="code-window-title" className="me-auto min-w-0 truncate text-text-1">{name}</span>
      <span data-slot="code-window-actions" className="panel-head-actions">
        <WrapToggle wrap={wrap} onWrap={setWrap}/>
        {copy && <CopyButton value={source} label={copyLabel} onCopy={onCopy}/>}
      </span>
    </figcaption>
    <div
      ref={body}
      data-slot="code-window-body"
      tabIndex={tab}
      role={tab === 0 ? 'region' : undefined}
      aria-label={tab === 0 ? name : undefined}
      dir="ltr"
      className={cn('min-h-0 overflow-auto overscroll-contain bg-page py-inset type-code focus-visible:focus-ring-inset', maxLines && 'max-h-(--code-max)')}
      style={maxLinesStyle(maxLines)}
    >
      <pre className={wrap ? 'w-full' : 'w-max min-w-full'}>
        <code className="block">
          {lines.map((tokens, i) => {
            const n = startLine + i;
            const bad = failed.has(n);
            const on = !bad && marked.has(n);
            return <span
              key={i}
              data-slot="code-window-line"
              data-fail={bad || undefined}
              data-highlighted={on || undefined}
              className={cn('flex pe-inset', bad && 'bg-fail-tint', on && 'bg-selected', (bad || on) && 'forced-colors:outline forced-colors:outline-1 forced-colors:-outline-offset-1')}
            >
              <span aria-hidden data-slot="code-window-number" className={cn('sticky start-0 w-(--gutter) shrink-0 px-inset text-end select-none', bad ? 'bg-fail-tint text-fail-text' : on ? 'bg-selected text-text-3' : 'bg-page text-text-3')} style={gutterStyle(startLine + lines.length - 1)}>{n}</span>
              <span className={cn('min-w-0 flex-1', wrap ? 'whitespace-pre-wrap [overflow-wrap:anywhere]' : 'whitespace-pre', bad && "before:sr-only before:content-['Failed:_']", on && "before:sr-only before:content-['Highlighted:_']")}><TokenLine tokens={tokens}/></span>
              {bad && <span aria-hidden data-slot="code-window-fail" className="sticky end-inset ms-6 shrink-0 self-center bg-fail-tint ps-2 type-label-sm text-fail-text select-none">{failLabel}</span>}
            </span>;
          })}
        </code>
      </pre>
    </div>
  </figure>;
}

export {CodeWindow, type CodeWindowProps};
