'use client';

import {useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode, type Ref} from 'react';
import {Icon, Add} from '../icon';
import {Button} from '../ui/button';
import {cn, mergeRefs} from '../lib/utils';

type PromptStatus = 'ready' | 'submitted' | 'streaming' | 'error';

type PromptInputLabels = {send?: string; stop?: string; attach?: string; hint?: string; label?: string};
const defaultLabels: Required<PromptInputLabels> = {send: 'Send', stop: 'Stop', attach: 'Add a file', hint: 'Enter to send', label: 'Message the agent'};

type PromptInputProps = Omit<React.ComponentProps<'div'>, 'onSubmit' | 'defaultValue' | 'ref'> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onSubmit?: (text: string) => void;
  status?: PromptStatus;
  onStop?: () => void;
  onAttach?: () => void;
  layout?: 'stacked' | 'inline';
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  tools?: ReactNode;
  minRows?: number;
  maxRows?: number;
  labels?: PromptInputLabels;
  ref?: Ref<HTMLTextAreaElement>;
  forceFocus?: boolean;
};

const supportsFieldSizing = () => typeof CSS !== 'undefined' && CSS.supports('field-sizing', 'content');
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

function PromptInput({
  value: valueProp, defaultValue = '', onValueChange, onSubmit, status = 'ready', onStop, onAttach, layout = 'stacked',
  placeholder, error, disabled = false, tools, minRows, maxRows, labels: labelsProp, ref, forceFocus, className, ...props
}: PromptInputProps) {
  const labels = {...defaultLabels, ...labelsProp};
  const area = useRef<HTMLTextAreaElement>(null);
  const setRef = useMemo(() => mergeRefs(area, ref), [ref]);
  const errorId = useId();
  const [own, setOwn] = useState(defaultValue);
  const value = valueProp ?? own;
  const [fallback, setFallback] = useState(false);
  const inline = layout === 'inline';
  const rows = {min: minRows ?? (inline ? 1 : 2), max: maxRows ?? (inline ? 6 : 10)};
  const working = status === 'submitted' || status === 'streaming';
  const failed = status === 'error' || !!error;
  const canSend = !disabled && value.trim().length > 0;

  useEffect(() => { setFallback(!supportsFieldSizing()); }, []);
  useIsoLayoutEffect(() => {
    const el = area.current;
    if (!fallback || !el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  });

  const setValue = (next: string) => { if (valueProp === undefined) setOwn(next); onValueChange?.(next); };
  const send = () => {
    if (!canSend) return;
    onSubmit?.(value.trim());
    if (valueProp === undefined) setOwn('');
  };
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); return; }
    if (e.key === 'Escape' && working && onStop) { e.preventDefault(); onStop(); }
  };

  const attach = onAttach && <Button size="icon-sm" variant="ghost" aria-label={labels.attach} disabled={disabled} onClick={onAttach}><Icon icon={Add}/></Button>;
  const action = working && onStop
    ? <Button data-slot="prompt-input-stop" size="sm" variant="secondary" className="shrink-0" onClick={onStop}>{labels.stop}</Button>
    : <Button data-slot="prompt-input-send" size="sm" type="submit" className="shrink-0" disabled={!canSend} focusableWhenDisabled>{labels.send}</Button>;

  const textarea = <textarea
    ref={setRef}
    data-slot="prompt-input-text"
    data-control=""
    rows={rows.min}
    value={value}
    placeholder={placeholder}
    disabled={disabled}
    aria-label={labels.label}
    aria-invalid={failed || undefined}
    aria-describedby={error ? errorId : undefined}
    onChange={e => setValue(e.target.value)}
    onKeyDown={onKeyDown}
    style={{'--min-rows': rows.min, '--max-rows': rows.max} as CSSProperties}
    className={cn(
      'block w-full min-w-0 resize-none bg-transparent type-body-sm text-text-1 placeholder:text-text-3 disabled:cursor-not-allowed disabled:text-text-disabled',
      'field-sizing-content min-h-[calc(var(--min-rows)*1lh)] max-h-[calc(var(--max-rows)*1lh)] [contain:inline-size]',
      inline ? 'py-0.5' : 'px-(--prompt-text-x) pt-2',
    )}
  />;

  return <form
    data-slot="prompt-input"
    data-layout={layout}
    data-status={status}
    data-force-focus={forceFocus || undefined}
    aria-busy={status === 'submitted' || undefined}
    onSubmit={e => { e.preventDefault(); send(); }}
    className={cn(
      'field-surface flex min-w-0 cursor-text',
      '[--prompt-text-x:calc(var(--space-1-5)+(var(--control-sm)-var(--icon))/2+var(--space-0-5))]',
      inline ? 'items-end gap-2 p-1.5' : 'flex-col',
      className,
    )}
    {...(props as React.ComponentProps<'form'>)}
  >
    {inline
      ? <>
          {attach ?? <span className="w-[calc(var(--prompt-text-x)-var(--space-1-5)-var(--space-2))] shrink-0"/>}
          <div className="flex min-h-(--control-sm) min-w-0 grow items-center">{textarea}</div>
          {action}
        </>
      : <>
          {textarea}
          <div data-slot="prompt-input-footer" className="flex min-w-0 items-center gap-2 p-1.5">
            {attach}
            {tools && <div data-slot="prompt-input-tools" className="flex min-w-0 items-center gap-2">{tools}</div>}
            <span className="me-auto"/>
            {error
              ? <p id={errorId} className="min-w-0 truncate type-caption text-fail-text">{error}</p>
              : <span aria-hidden className="hidden truncate type-micro text-text-3 sm:block">{labels.hint}</span>}
            {action}
          </div>
        </>}
    {inline && error && <p id={errorId} className="sr-only">{error}</p>}
  </form>;
}

export {PromptInput, type PromptInputLabels, type PromptInputProps, type PromptStatus};
