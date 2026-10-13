'use client';

import {useEffect, useId, useState, type ReactNode} from 'react';
import {Icon, Undo} from '../icon';
import {useFocusWhenReplaced} from '../lib/use-focus-when-replaced';
import {cn} from '../lib/utils';
import {formatAmount, spokenAmount} from './amount';
import {Button} from './button';
import {Card} from './card';
import {Status} from './status';

type PaymentDoneState = 'sending' | 'sent' | 'undone';

type PaymentDoneLabels = {
  sending?: string;
  sent?: string;
  undone?: string;
  undo?: string;
};

const defaultLabels: Required<PaymentDoneLabels> = {sending: 'Sending', sent: 'Sent', undone: 'Undone', undo: 'Undo'};

type PaymentDoneProps = Omit<React.ComponentProps<'div'>, 'children'> & {
  to: string;
  amount: number;
  currency?: string;
  leading?: ReactNode;
  detail?: string;
  state?: PaymentDoneState;
  undoFor?: number;
  undoPending?: boolean;
  onUndo?: () => void;
  labels?: PaymentDoneLabels;
};

function PaymentDone({to, amount, currency, leading, detail, state = 'sent', undoFor = 30, undoPending, onUndo, labels, className, ...props}: PaymentDoneProps) {
  const words = {...defaultLabels, ...labels};
  const [left, setLeft] = useState(undoFor);
  const canUndo = state === 'sent' && undoFor > 0 && (left > 0 || !!undoPending);

  useEffect(() => {
    if (state !== 'sent') return;
    setLeft(undoFor);
  }, [state, undoFor]);
  useEffect(() => {
    if (state !== 'sent' || undoPending || left <= 0) return;
    const tick = setTimeout(() => setLeft(s => s - 1), 1000);
    return () => clearTimeout(tick);
  }, [state, undoPending, left]);

  const limitId = useId();
  const {region: footer, target: outcome} = useFocusWhenReplaced(!canUndo);

  const minutes = Math.floor(Math.max(left, 0) / 60);
  const seconds = String(Math.max(left, 0) % 60).padStart(2, '0');

  return (
    <Card data-slot="payment-done" data-state={state} role="group" aria-label={`Payment to ${to}`} className={cn('w-full min-w-0 gap-3 p-4', className)} {...props}>
      <div className="flex min-w-0 items-center gap-3">
        {leading && <span data-slot="payment-done-leading" className="flex shrink-0">{leading}</span>}
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="label truncate text-base">{to}</p>
          {detail && <p className="truncate text-sm text-fg-2">{detail}</p>}
        </div>
        <p data-slot="payment-done-amount" className={cn('shrink-0 text-xl font-semibold tracking-tight whitespace-nowrap tabular-nums', state === 'undone' && 'text-fg-3 line-through')}>
          <span dir="ltr" aria-hidden="true">{formatAmount(amount, {currency})}</span>
          <span className="sr-only">{spokenAmount(amount, {currency})}</span>
        </p>
      </div>
      <div ref={footer} aria-live="polite" className="flex min-h-(--control-md) items-center justify-between gap-3">
        <Status
          ref={outcome}
          focusable
          status={state === 'sending' ? 'running' : state === 'undone' ? 'canceled' : 'done'}
          label={words[state]}
        />
        {canUndo && (
          <Button
            variant="secondary"
            size="sm"
            pending={!!undoPending}
            icon={<Icon icon={Undo} size={16}/>}
            onClick={onUndo}
            aria-describedby={limitId}
          >
            <span className="inline-flex items-center gap-1.5">
              {words.undo}
              <span aria-hidden="true" className="text-fg-3 tabular-nums">{minutes}:{seconds}</span>
            </span>
          </Button>
        )}
        {canUndo && <span id={limitId} hidden>{`For ${undoFor} seconds after sending`}</span>}
      </div>
    </Card>
  );
}

export {PaymentDone, type PaymentDoneProps, type PaymentDoneState, type PaymentDoneLabels};
