'use client';

import {createContext, useContext, useEffect, useMemo, useRef, useState, type ChangeEvent, type ComponentProps, type FocusEvent, type KeyboardEvent, type PointerEvent, type ReactNode, type Ref} from 'react';
import {Input as InputPrimitive} from '@base-ui/react/input';
import {Icon, Close, Hide, Pending, Search, Show} from '../icon';
import {cn, mergeClass, mergeRefs} from '../lib/utils';
import {Button, type ButtonProps} from './button';
import {CopyButton} from './copy-button';
import {useFieldDisabled} from './field';
import {Kbd} from './kbd';

type InputSize = 'sm' | 'default' | 'lg';

const SizeContext = createContext<InputSize>('default');

const boxSize: Record<InputSize, string> = {
  sm: '[--input-h:var(--control-sm)] type-caption',
  default: '[--input-h:var(--control)] type-body-sm',
  lg: '[--input-h:var(--control-lg)] type-body',
};
const textSize: Record<InputSize, string> = {sm: 'type-caption', default: 'type-body-sm', lg: 'type-body'};
const monoSize: Record<InputSize, string> = {sm: 'type-code-xs', default: 'type-code-sm', lg: 'type-code'};
const slotSize: Record<InputSize, string> = {
  sm: 'type-label-sm [&_svg]:size-(--icon-sm)',
  default: 'type-label-sm [&_svg]:size-(--icon)',
  lg: 'type-label [&_svg]:size-(--icon-lg)',
};

function useOff(disabled?: boolean) {
  const inField = useFieldDisabled();
  return !!disabled || inField;
}

type InputRootProps = ComponentProps<'div'> & {
  size?: InputSize;
  disabled?: boolean;
  readOnly?: boolean;
};

function InputRoot({size = 'default', disabled, readOnly, className, onPointerDown, children, ...props}: InputRootProps) {
  const down = (e: PointerEvent<HTMLDivElement>) => {
    onPointerDown?.(e);
    if ((e.target as HTMLElement).closest('button, a, input, textarea, [role=button]')) return;
    const control = e.currentTarget.querySelector<HTMLElement>('[data-control]');
    if (!control || disabled) return;
    e.preventDefault();
    control.focus();
  };
  return <SizeContext.Provider value={size}>
    <div
      data-slot="input"
      data-size={size}
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
      onPointerDown={down}
      className={cn(
        'field group/input w-full cursor-text [--field-h:max(var(--input-h),calc(1lh+var(--space-2)))]',
        '[--action-h:calc(var(--input-h)-2*var(--shell-inset)-2*var(--line-width))]',
        boxSize[size],
        'data-readonly:cursor-default data-readonly:not-focus-within:border-line-faint data-disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    >{children}</div>
  </SizeContext.Provider>;
}

const slotClass = 'flex shrink-0 items-center gap-1 text-text-2 select-none [&_svg]:shrink-0 [&_svg]:text-text-3 group-data-disabled/input:text-text-disabled [unicode-bidi:plaintext]';

function InputLeading({className, ...props}: ComponentProps<'span'>) {
  const size = useContext(SizeContext);
  return <span
    data-slot="input-leading"
    className={cn(slotClass, slotSize[size], 'has-[>[data-slot=input-action]:first-child]:-ms-[calc(var(--space-3)-var(--shell-inset))]', className)}
    {...props}
  />;
}

function InputTrailing({className, ...props}: ComponentProps<'span'>) {
  const size = useContext(SizeContext);
  return <span
    data-slot="input-trailing"
    className={cn(slotClass, slotSize[size], 'has-[>[data-slot=input-action]:last-child]:-me-[calc(var(--space-3)-var(--shell-inset))]', className)}
    {...props}
  />;
}

function InputControl({className, mono, ...props}: InputPrimitive.Props & {
  mono?: boolean;
}) {
  const size = useContext(SizeContext);
  return <InputPrimitive
    data-slot="input-control"
    data-control=""
    className={mergeClass([
      'h-full w-full min-w-0 flex-1 truncate bg-transparent text-inherit',
      mono ? monoSize[size] : textSize[size],
      'disabled:cursor-not-allowed read-only:cursor-default',
      'file:me-2 file:cursor-pointer file:rounded-pill file:bg-field file:px-2 file:type-label-sm file:text-text-1',
      '[&::-webkit-search-cancel-button]:appearance-none',
    ], className)}
    {...props}
  />;
}

type InputActionProps = Omit<ButtonProps, 'size'> & {
  size?: 'icon' | 'text';
};

function InputAction({className, size = 'icon', variant = 'ghost', ...props}: InputActionProps) {
  const box = useContext(SizeContext);
  return <Button
    data-slot="input-action"
    variant={variant}
    size={size === 'icon' ? 'icon-sm' : 'sm'}
    className={mergeClass([
      'h-(--action-h)',
      size === 'icon' ? 'w-(--action-h)' : 'px-2.5',
      box === 'lg' ? 'type-label [&_svg]:size-(--icon)' : 'type-label-sm [&_svg]:size-(--icon-sm)',
    ], className)}
    {...props}
  />;
}

function splitBox<T extends Record<string, unknown>>(props: T) {
  const box: Record<string, unknown> = {};
  const rest: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) (k.startsWith('data-force-') || k === 'style' ? box : rest)[k] = v;
  return {box, rest: rest as T};
}

function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (next: T) => void) {
  const [inner, setInner] = useState(defaultValue);
  const current = value !== undefined ? value : inner;
  const set = (next: T) => { if (value === undefined) setInner(next); onChange?.(next); };
  return [current, set] as const;
}

type BoxProps = {
  size?: InputSize;
  leading?: ReactNode;
  trailing?: ReactNode;
  className?: string;
  controlClassName?: string;
  mono?: boolean;
  ref?: Ref<HTMLInputElement>;
};

type NativeProps = Omit<InputPrimitive.Props, 'size' | 'prefix' | 'className' | 'type' | 'value' | 'defaultValue' | 'onValueChange' | 'ref'>;
type StringValue = {value?: string; defaultValue?: string; onValueChange?: (value: string) => void};

type TextModeProps = BoxProps & NativeProps & StringValue & {
  mode?: 'text';
  type?: string;
};

type PasswordModeProps = BoxProps & NativeProps & StringValue & {
  mode: 'password';
  defaultRevealed?: boolean;
};

type SearchModeProps = BoxProps & NativeProps & StringValue & {
  mode: 'search';
  shortcut?: string;
  shortcutOwner?: boolean;
  clearLabel?: string;
  pending?: boolean;
};

type CopyModeProps = BoxProps & Omit<NativeProps, 'onCopy'> & {
  mode: 'copy';
  value: string;
  noun?: string;
  onCopy?: (value: string) => void;
  forceCopyState?: 'copied' | 'failed';
};

type InputProps = TextModeProps | PasswordModeProps | SearchModeProps | CopyModeProps;
type InputMode = NonNullable<InputProps['mode']>;

const isInvalid = (rest: Record<string, unknown>) => rest['aria-invalid'] === true || rest['aria-invalid'] === 'true';

function Input(props: InputProps) {
  switch (props.mode) {
    case 'password': return <PasswordMode {...props}/>;
    case 'search': return <SearchMode {...props}/>;
    case 'copy': return <CopyMode {...props}/>;
    default: return <TextMode {...props}/>;
  }
}

function TextMode({mode: _mode, size = 'default', leading, trailing, className, controlClassName, mono, disabled: disabledProp, readOnly, type = 'text', ...all}: TextModeProps) {
  const disabled = useOff(disabledProp);
  const {box, rest} = splitBox(all);
  return <InputRoot size={size} disabled={disabled} readOnly={readOnly} className={className} data-mode="text" data-invalid={isInvalid(rest) || undefined} {...box}>
    {leading !== undefined && <InputLeading>{leading}</InputLeading>}
    <InputControl type={type} disabled={disabled} readOnly={readOnly} mono={mono} className={controlClassName} {...rest}/>
    {trailing !== undefined && <InputTrailing>{trailing}</InputTrailing>}
  </InputRoot>;
}

function PasswordMode({mode: _mode, size = 'default', leading, trailing: _trailing, className, controlClassName, mono: _mono, value, defaultValue = '', onValueChange, onChange, defaultRevealed = false, disabled: disabledProp, autoComplete, ...all}: PasswordModeProps) {
  const disabled = useOff(disabledProp);
  const {box, rest} = splitBox(all);
  const [current, set] = useControllable(value, defaultValue, onValueChange);
  const [revealed, setRevealed] = useState(defaultRevealed);
  return <InputRoot size={size} disabled={disabled} className={className} data-mode="password" {...box}>
    {leading !== undefined && <InputLeading>{leading}</InputLeading>}
    <InputControl
      type={revealed ? 'text' : 'password'}
      value={current}
      onChange={(e: ChangeEvent<HTMLInputElement>) => { set(e.target.value); onChange?.(e as never); }}
      disabled={disabled}
      autoComplete={autoComplete ?? 'current-password'}
      autoCapitalize="off"
      spellCheck={false}
      mono={revealed}
      className={controlClassName}
      {...rest}
    />
    <InputTrailing>
      <InputAction
        disabled={disabled}
        aria-pressed={revealed}
        aria-label={revealed ? 'Hide password' : 'Show password'}
        onClick={() => setRevealed(r => !r)}
      ><Icon icon={revealed ? Hide : Show}/></InputAction>
    </InputTrailing>
  </InputRoot>;
}

const isEditable = (el: EventTarget | null) => el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));

type ShortcutEntry = {el: () => HTMLInputElement | null; key: string};
const shortcuts = new Set<ShortcutEntry>();
function onShortcutKey(e: globalThis.KeyboardEvent) {
  if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.isComposing || isEditable(e.target)) return;
  if (e.target instanceof Element && e.target.closest('[role=listbox], [role=option], [role=combobox], [role=tree], [role=grid]')) return;
  const layer = e.target instanceof Element ? e.target.closest('[role=dialog], [role=alertdialog], [role=menu]') : null;
  const owners = [...shortcuts]
    .filter(entry => entry.key === e.key && entry.el()?.isConnected && (!layer || layer.contains(entry.el())))
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

function SearchMode({mode: _mode, size = 'default', leading: _leading, trailing: _trailing, className, controlClassName, mono: _mono, value, defaultValue = '', onValueChange, onChange, shortcut, shortcutOwner = true, clearLabel = 'Clear search', pending, disabled: disabledProp, onKeyDown, ref, ...all}: SearchModeProps) {
  const disabled = useOff(disabledProp);
  const {box, rest} = splitBox(all);
  const [current, set] = useControllable(value, defaultValue, onValueChange);
  const inner = useRef<HTMLInputElement | null>(null);
  const setRef = useMemo(() => mergeRefs<HTMLInputElement>(inner, ref), [ref]);

  useEffect(() => {
    if (!shortcut || !shortcutOwner || disabled) return;
    return claimShortcut({el: () => inner.current, key: shortcut});
  }, [shortcut, shortcutOwner, disabled]);

  return <InputRoot size={size} disabled={disabled} className={className} data-mode="search" data-pending={pending || undefined} {...box}>
    <InputLeading>{pending
      ? <Icon icon={Pending} className="animate-spin motion-reduce:animate-none"/>
      : <Icon icon={Search}/>}</InputLeading>
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
      aria-busy={pending || undefined}
      className={controlClassName}
      {...rest}
    />
    {current && !disabled
      ? <InputTrailing>
          <InputAction aria-label={clearLabel} onClick={() => { set(''); inner.current?.focus(); }}><Icon icon={Close}/></InputAction>
        </InputTrailing>
      : shortcut && <InputTrailing aria-hidden className="pointer-coarse:hidden"><Kbd>{shortcut}</Kbd></InputTrailing>}
  </InputRoot>;
}

function CopyMode({mode: _mode, size = 'default', leading, trailing: _trailing, className, controlClassName, value, noun, onCopy, mono = true, forceCopyState, disabled: disabledProp, ...all}: CopyModeProps) {
  const disabled = useOff(disabledProp);
  const {box, rest} = splitBox(all);
  return <InputRoot size={size} disabled={disabled} readOnly className={className} data-mode="copy" {...box}>
    {leading !== undefined && <InputLeading>{leading}</InputLeading>}
    <InputControl
      readOnly
      value={value}
      disabled={disabled}
      onFocus={(e: FocusEvent<HTMLInputElement>) => e.currentTarget.select()}
      mono={mono}
      className={controlClassName}
      {...rest}
    />
    <InputTrailing>
      <CopyButton
        data-slot="input-action"
        value={value}
        label={noun}
        onCopy={onCopy}
        forceState={forceCopyState}
        disabled={disabled || !value}
        size="icon-sm"
        className={cn('size-(--action-h)', size === 'lg' ? '[&_svg]:size-(--icon)' : '[&_svg]:size-(--icon-sm)')}
      />
    </InputTrailing>
  </InputRoot>;
}

export {
  Input, InputAction, InputControl, InputLeading, InputRoot, InputTrailing,
  type InputMode, type InputProps, type InputRootProps, type InputSize, type SearchModeProps,
};
