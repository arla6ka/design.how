'use client';

import {useId, useLayoutEffect, useRef, useState} from 'react';
import {ArrowUp, Icon} from '../icon';
import {cn} from '../lib/utils';
import {Button} from '../ui/button';
import {Amount, amountAffordability} from '../ui/amount';

type ChatInputProps = Omit<React.ComponentProps<'form'>, 'onSubmit' | 'onChange'> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onSubmit: (text: string) => void;
  placeholder?: string;
  amount?: number;
  available?: number;
  currency?: string;
  running?: boolean;
  onStop?: () => void;
  disabled?: boolean;
  actions?: React.ReactNode;
  labels?: ChatInputLabels;
};

type ChatInputLabels = {
  message?: string;
  send?: string;
  stop?: string;
};

const defaultLabels: Required<ChatInputLabels> = {message: 'Message', send: 'Send', stop: 'Stop'};

function ChatInput({value, defaultValue = '', onValueChange, onSubmit, placeholder = 'Ask about your money', amount, available, currency, running, onStop, disabled, actions, labels, className, ...props}: ChatInputProps) {
  const words = {...defaultLabels, ...labels};
  const [inner, setInner] = useState(defaultValue);
  const text = value ?? inner;
  const field = useRef<HTMLTextAreaElement>(null);
  const id = useId();
  const canSend = !disabled && !running && text.trim().length > 0 && (amount === undefined || available === undefined || amountAffordability(amount, available) !== 'insufficient');

  useLayoutEffect(() => {
    const el = field.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [text]);

  function set(next: string) {
    if (value === undefined) setInner(next);
    onValueChange?.(next);
  }

  function send() {
    if (!canSend) return;
    onSubmit(text.trim());
    set('');
  }

  return (
    <form
      data-slot="chat-input"
      data-disabled={disabled || undefined}
      onSubmit={e => { e.preventDefault(); send(); }}
      onPointerDown={e => { if (e.target === e.currentTarget) { e.preventDefault(); field.current?.focus(); } }}
      className={cn(
        'flex w-full cursor-text items-end gap-1 rounded-sheet border border-line-strong bg-field p-1.5 transition-[border-color] duration-(--dur-instant)',
        'focus-within:border-accent-line data-disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    >
      {actions && <div data-slot="chat-input-actions" className="flex shrink-0 items-center">{actions}</div>}
      <label htmlFor={id} className="sr-only">{words.message}</label>
      <textarea
        ref={field}
        id={id}
        data-slot="chat-input-field"
        rows={1}
        value={text}
        disabled={disabled}
        placeholder={placeholder}
        onChange={e => set(e.currentTarget.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); }
        }}
        className={cn(
          'block h-8 max-h-50 min-w-0 flex-1 resize-none bg-transparent py-1 text-base leading-6 text-fg focus-visible:outline-none placeholder:text-fg-3 disabled:cursor-not-allowed disabled:text-fg-disabled',
          !actions && 'ps-2.5',
        )}
      />
      {amount !== undefined && <Amount value={amount} currency={currency} available={available} className="mb-1 shrink-0"/>}
      {running ? (
        <Button type="button" variant="solid" size="icon-sm" aria-label={words.stop} onClick={onStop}>
          <span aria-hidden="true" className="size-2.5 bg-current"/>
        </Button>
      ) : (
        <Button type="submit" size="icon-sm" aria-label={words.send} disabled={!canSend}>
          <Icon icon={ArrowUp} size={16}/>
        </Button>
      )}
    </form>
  );
}

export {ChatInput, type ChatInputProps, type ChatInputLabels};
