'use client';

import type {ReactNode} from 'react';
import {Button} from '../ui/button';
import {cn} from '../lib/utils';

type MessageState = 'done' | 'running' | 'waiting' | 'failed' | 'stopped' | 'sending' | 'not-sent';

type MessageLabels = {running?: string; waiting?: string; failed?: string; stopped?: string; sending?: string; notSent?: string; retry?: string};
const defaultLabels: Required<MessageLabels> = {running: 'Working', waiting: 'Waiting on you', failed: 'Failed', stopped: 'Stopped', sending: 'Sending', notSent: 'Not sent', retry: 'Retry'};

const stateTone: Record<MessageState, string> = {
  done: '', running: 'text-text-1', waiting: 'text-warn-text', failed: 'text-fail-text', stopped: 'text-text-3', sending: 'text-text-2', 'not-sent': 'text-fail-text',
};
const stateWord = (state: MessageState, labels: Required<MessageLabels>) => state === 'done' ? '' : state === 'not-sent' ? labels.notSent : labels[state];

function MessageGroup({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="message-group" className={cn('flex min-w-0 flex-col', className)} {...props}/>;
}

type MessageProps = Omit<React.ComponentProps<'article'>, 'title'> & {
  from?: 'agent' | 'person';
  name: string;
  time?: ReactNode;
  state?: MessageState;
  footer?: ReactNode;
  onRetry?: () => void;
  labels?: MessageLabels;
};

function Message({from = 'agent', name, time, state = 'done', footer, onRetry, labels: labelsProp, className, children, ...props}: MessageProps) {
  const labels = {...defaultLabels, ...labelsProp};
  const word = stateWord(state, labels);
  const person = from === 'person';
  return <article
    data-slot="message"
    data-from={from}
    data-state={state}
    aria-busy={state === 'running' || state === 'sending' || undefined}
    className={cn('@container min-w-0 py-4 rule-row', className)}
    {...props}
  >
    <div className="grid min-w-0 gap-x-6 gap-y-2 @lg:grid-cols-[var(--label-col)_minmax(0,1fr)]">
    <header data-slot="message-header" className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 @lg:flex-col @lg:items-start @lg:pt-1">
      <h3 className="min-w-0 truncate type-label-sm text-text-2">{name}</h3>
      {time !== undefined && <span data-slot="message-time" className="type-code-sm text-text-3">{time}</span>}
      {word && <span data-slot="message-state" className={cn('flex items-center gap-2 type-label-sm', stateTone[state])}>
        {(state === 'running' || state === 'sending') && <span aria-hidden className="pending"/>}
        {word}
      </span>}
    </header>
    <div data-slot="message-content" className={cn('flex min-w-0 flex-col gap-3', person && 'flex-row gap-2')}>
      {person && <span aria-hidden className="type-code leading-6 text-text-3">&gt;</span>}
      {person
        ? <div className="min-w-0 type-body break-words whitespace-pre-wrap text-text-1">{children}</div>
        : children}
    </div>
    {(footer || (state === 'not-sent' && onRetry)) && <footer data-slot="message-footer" className="flex min-w-0 flex-wrap items-center gap-1 @lg:col-start-2">
      {state === 'not-sent' && onRetry && <Button size="sm" variant="ghost" onClick={onRetry}>{labels.retry}</Button>}
      {footer}
    </footer>}
    </div>
  </article>;
}

type MessageDividerProps = React.ComponentProps<'div'> & {
  children: ReactNode;
};

function MessageDivider({className, children, ...props}: MessageDividerProps) {
  return <div data-slot="message-divider" className={cn('flex min-w-0 items-center gap-3 py-3', className)} {...props}>
    <span className="min-w-0 shrink truncate type-micro text-text-3">{children}</span>
    <span aria-hidden className="h-0 grow border-t border-line"/>
  </div>;
}

export {Message, MessageGroup, MessageDivider, type MessageLabels, type MessageProps, type MessageState};
