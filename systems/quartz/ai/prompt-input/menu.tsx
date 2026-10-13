'use client';

import * as React from 'react';
import {createPortal} from 'react-dom';
import {useQuartzPortal} from '../../lib/portal';
import {cssNumber} from '../../lib/css-var';
import {Badge} from '../../ui/badge';
import {Empty, EmptyHeader, EmptyTitle} from '../../ui/empty-state';
import {cn} from '../../lib/utils';
import {isMentionKind} from '../mention';
import {type PromptMention} from './codec';
import {overlayMotion, overlaySurface} from '../../lib/overlay';

const CARET_GAP = 6;
const EDGE_ROOM = 22;
const MIN_HEIGHT = 120;

type MenuKind = '@' | '/' | 'commands';
type MenuState = {kind: MenuKind; query: string; node: Text | null; start: number; rect: DOMRect};
type MenuOption = {key: string; mention: PromptMention; detail?: string; description?: string};

function matchRank(label: string, query: string) {
  const l = label.toLowerCase();
  if (!query || l === query) return 0;
  if (l.startsWith(query)) return /[a-z0-9]/i.test(l.charAt(query.length)) ? 2 : 1;
  for (let at = l.indexOf(query, 1); at > 0; at = l.indexOf(query, at + 1)) if (!/[a-z0-9]/i.test(l.charAt(at - 1))) return 3;
  return 4;
}

function TriggerMenu({id, menu, title, empty, options, active, onHover, onPick, typeLabel, search}: {
  id: string;
  menu: MenuState;
  title: string;
  empty: string;
  options: MenuOption[];
  active: number;
  onHover: (i: number) => void;
  onPick: (option: MenuOption) => void;
  typeLabel: (option: MenuOption) => string;
  search?: React.ReactNode;
}) {
  const container = useQuartzPortal();
  const listRef = React.useRef<HTMLDivElement>(null);
  const [style, setStyle] = React.useState<React.CSSProperties>({visibility: 'hidden'});

  React.useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const gutter = cssNumber(el, '--gutter-sm', 16);
    const width = Math.min(cssNumber(el, '--menu-width', 320), window.innerWidth - 2 * gutter);
    const left = Math.max(gutter, Math.min(menu.rect.left - 8, window.innerWidth - width - gutter));
    const room = menu.rect.top - gutter;
    const cap = cssNumber(el, '--popup-max', 320);
    const above = room > Math.min(el.scrollHeight, cap) + 8;
    setStyle(above
      ? {position: 'fixed', left, width, bottom: window.innerHeight - menu.rect.top + CARET_GAP, maxHeight: Math.min(cap, room - 8)}
      : {position: 'fixed', left, width, top: menu.rect.bottom + CARET_GAP, maxHeight: Math.max(MIN_HEIGHT, Math.min(cap, window.innerHeight - menu.rect.bottom - EDGE_ROOM))});
  }, [menu.rect, options.length]);

  React.useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({block: 'nearest'});
  }, [active]);

  if (container === null) return null;
  return createPortal(<div
    ref={listRef}
    data-slot="prompt-input-menu"
    data-menu={menu.kind}
    onMouseDown={event => { if (!(event.target as HTMLElement).closest('input')) event.preventDefault(); }}
    style={style}
    className={cn('isolate z-(--z-overlay) flex flex-col overflow-hidden', overlaySurface, overlayMotion, 'starting:opacity-0')}
  >
    {search}
    <div id={id} role="listbox" aria-label={title} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1">
      <p className="menu-label" aria-hidden>{title}</p>
      {options.length === 0 && <Empty data-slot="prompt-input-menu-empty" role="presentation" variant="plain" size="sm"><EmptyHeader><EmptyTitle role="presentation">{empty}</EmptyTitle></EmptyHeader></Empty>}
      {options.map((option, i) => <div
        key={option.key}
        id={`${id}-${i}`}
        role="option"
        aria-selected={i === active}
        data-index={i}
        data-highlighted={i === active || undefined}
        onMouseMove={() => onHover(i)}
        onClick={() => onPick(option)}
        className="menu-item"
      >
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate">{option.mention.type === 'command' ? '/' : ''}{option.mention.label}</span>
          {option.description && <span className="truncate type-body-sm text-text-3">{option.description}</span>}
        </span>
        {option.detail
          ? <span dir="ltr" className="max-w-[50%] shrink-0 truncate type-tag text-text-3">{option.detail}</span>
          : isMentionKind(option.mention.type)
            ? <Badge kind={option.mention.type} className="shrink-0">{typeLabel(option)}</Badge>
            : <span className="shrink-0 type-label-sm text-text-3">{typeLabel(option)}</span>}
      </div>)}
    </div>
  </div>, container ?? document.body);
}

export {TriggerMenu, matchRank, type MenuKind, type MenuState, type MenuOption};
