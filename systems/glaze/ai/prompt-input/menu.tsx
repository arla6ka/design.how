'use client';

import * as React from 'react';
import {createPortal} from 'react-dom';
import {useGlazePortal} from '../../lib/portal';
import {menuItemClass, menuLabelClass, overlayMotion, overlaySurface} from '../../lib/overlay';
import {cn} from '../../lib/utils';
import {type PromptMention} from './codec';

const CARET_GAP = 6;
const EDGE_ROOM = 16;
const MIN_HEIGHT = 120;
const MENU_WIDTH = 320;
const POPUP_MAX = 320;

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
  const container = useGlazePortal();
  const listRef = React.useRef<HTMLDivElement>(null);
  const [style, setStyle] = React.useState<React.CSSProperties>({visibility: 'hidden'});

  React.useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const width = Math.min(MENU_WIDTH, window.innerWidth - 2 * EDGE_ROOM);
    const left = Math.max(EDGE_ROOM, Math.min(menu.rect.left - 8, window.innerWidth - width - EDGE_ROOM));
    const room = menu.rect.top - EDGE_ROOM;
    const above = room > Math.min(el.scrollHeight, POPUP_MAX) + 8;
    setStyle(above
      ? {position: 'fixed', left, width, bottom: window.innerHeight - menu.rect.top + CARET_GAP, maxHeight: Math.min(POPUP_MAX, room - 8)}
      : {position: 'fixed', left, width, top: menu.rect.bottom + CARET_GAP, maxHeight: Math.max(MIN_HEIGHT, Math.min(POPUP_MAX, window.innerHeight - menu.rect.bottom - EDGE_ROOM))});
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
    className={cn('isolate z-(--z-overlay) flex flex-col overflow-hidden [--menu-item-h:var(--menu-row)]', overlaySurface, overlayMotion, 'starting:opacity-0')}
  >
    {search}
    <div id={id} role="listbox" aria-label={title} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1">
      <p className={menuLabelClass} aria-hidden>{title}</p>
      {options.length === 0 && <p data-slot="prompt-input-menu-empty" role="presentation" className="flex min-h-(--menu-row) items-center px-2 type-body-sm text-text-2">{empty}</p>}
      {options.map((option, i) => <div
        key={option.key}
        id={`${id}-${i}`}
        role="option"
        aria-selected={i === active}
        data-index={i}
        data-highlighted={i === active || undefined}
        onMouseMove={() => onHover(i)}
        onClick={() => onPick(option)}
        className={cn(menuItemClass, option.description && 'py-1')}
      >
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate">{option.mention.type === 'command' ? '/' : ''}{option.mention.label}</span>
          {option.description && <span className="truncate type-caption text-text-2">{option.description}</span>}
        </span>
        {option.detail
          ? <span dir="ltr" className="max-w-1/2 shrink-0 truncate type-code-xs text-text-2">{option.detail}</span>
          : <span className="shrink-0 type-caption text-text-2">{typeLabel(option)}</span>}
      </div>)}
    </div>
  </div>, container ?? document.body);
}

export {TriggerMenu, matchRank, type MenuKind, type MenuState, type MenuOption};
