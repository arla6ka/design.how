'use client';

import {useEffect, useMemo, useRef, type ChangeEvent, type KeyboardEvent} from 'react';
import {Icon, CircleDash, Search, Close} from '../../icon';
import {cn, mergeRefs} from '../../lib/utils';
import {Kbd} from '../kbd';
import {InputAction, InputControl, InputPrefix, InputRoot, InputSuffix, splitBox, useControllable, useOff, type BoxProps, type NativeProps, type StringValue} from './parts';

type SearchModeProps = BoxProps & NativeProps & StringValue & {
  mode: 'search';
  shortcut?: string;
  shortcutOwner?: boolean;
  clearLabel?: string;
  pending?: boolean;
};

const isEditable = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));

type ShortcutEntry = {el: () => HTMLInputElement | null; key: string; disabled: boolean};
const shortcuts = new Set<ShortcutEntry>();
function onShortcutKey(e: globalThis.KeyboardEvent) {
  if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.isComposing || isEditable(e.target)) return;
  if (e.target instanceof Element && e.target.closest('[role=listbox], [role=option], [role=combobox], [role=tree], [role=grid]')) return;
  const layer = e.target instanceof Element ? e.target.closest('[role=dialog], [role=alertdialog], [role=menu]') : null;
  const owners = [...shortcuts]
    .filter(entry => entry.key === e.key && !entry.disabled && entry.el()?.isConnected && (!layer || layer.contains(entry.el())))
    .map(entry => entry.el()!)
    .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  if (!owners.length) return;
  e.preventDefault();
  owners[0].focus();
}
function claimShortcut(entry: ShortcutEntry) {
  if (!shortcuts.size) window.addEventListener('keydown', onShortcutKey);
  shortcuts.add(entry);
  return () => {
    shortcuts.delete(entry);
    if (!shortcuts.size) window.removeEventListener('keydown', onShortcutKey);
  };
}

function SearchMode({mode: _mode, size = 'default', prefix: _prefix, suffix: _suffix, className, controlClassName, value, defaultValue = '', onValueChange, onChange, shortcut, shortcutOwner = true, clearLabel = 'Clear search', pending, disabled: disabledProp, onKeyDown, ref, ...all}: SearchModeProps) {
  const disabled = useOff(disabledProp);
  const {box, rest} = splitBox(all);
  const [current, set] = useControllable(value, defaultValue, onValueChange);
  const inner = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!shortcut || !shortcutOwner || disabled) return;
    return claimShortcut({el: () => inner.current, key: shortcut, disabled: false});
  }, [shortcut, shortcutOwner, disabled]);

  const setRef = useMemo(() => mergeRefs<HTMLInputElement>(inner, ref), [ref]);

  return <InputRoot size={size} disabled={disabled} invalid={rest['aria-invalid'] === true || rest['aria-invalid'] === 'true'} className={className} data-mode="search" data-pending={pending || undefined} {...box}>
    <InputPrefix>{pending
      ? <Icon icon={CircleDash} size={16} className="animate-spin motion-reduce:animate-none"/>
      : <Icon icon={Search} size={16}/>}</InputPrefix>
    <InputControl
      ref={setRef}
      type="search"
      value={current}
      disabled={disabled}
      onChange={(e: ChangeEvent<HTMLInputElement>) => { set(e.target.value); onChange?.(e as never); }}
      onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
        onKeyDown?.(e as never);
        if (e.key !== 'Escape' || e.nativeEvent.isComposing) return;
        if (current) { e.preventDefault(); e.stopPropagation(); set(''); }
        else inner.current?.blur();
      }}
      autoComplete="off"
      spellCheck={false}
      enterKeyHint="search"
      className={cn('[&::-webkit-search-cancel-button]:appearance-none', controlClassName)}
      {...rest}
    />
    {current && !disabled
      ? <InputSuffix>
          <InputAction aria-label={clearLabel} onClick={() => { set(''); inner.current?.focus(); }}><Icon icon={Close} size={16}/></InputAction>
        </InputSuffix>
      : shortcut && <InputSuffix aria-hidden className="touch:hidden">
          <Kbd>{shortcut}</Kbd>
        </InputSuffix>}
  </InputRoot>;
}

export {SearchMode, type SearchModeProps};
