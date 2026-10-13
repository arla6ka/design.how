'use client';

import {Add, CheckmarkFilled, Icon, WarningFilled} from '../icon';
import {cn} from '../lib/utils';
import {Amount} from '../ui/amount';

type ReceiptMatchState = 'matched' | 'review' | 'missing';

type ReceiptMatchProps = Omit<React.ComponentProps<'div'>, 'children'> & {
  merchant: string;
  date: string;
  amount: number;
  state: ReceiptMatchState;
  note?: string;
  src?: string;
  onAdd?: () => void;
};

const NOTE: Record<ReceiptMatchState, string> = {matched: 'Receipt matched', review: 'Check the receipt', missing: 'No receipt yet'};

function Paper({src, state}: {src?: string; state: ReceiptMatchState}) {
  if (src) return <img src={src} alt="" className="size-full rounded-field object-cover"/>;
  return (
    <span aria-hidden="true" className="flex size-full flex-col gap-1 rounded-field border border-line bg-raised px-2 pt-2.5">
      <span className="h-1 w-3/4 rounded-full bg-surface-3"/>
      <span className="h-1 w-1/2 rounded-full bg-surface-3"/>
      <span className="h-1 w-2/3 rounded-full bg-surface-3"/>
      <span className={cn('mt-auto mb-2 h-1 w-1/3 self-end rounded-full', state === 'review' ? 'bg-warn' : 'bg-fg-3')}/>
    </span>
  );
}

function ReceiptMatch({merchant, date, amount, state, note, src, onAdd, className, ...props}: ReceiptMatchProps) {
  return (
    <div data-slot="receipt-match" data-state={state} className={cn('flex w-full min-w-0 items-center gap-3', className)} {...props}>
      {state === 'missing'
        ? <button type="button" onClick={onAdd} aria-label={`Add a receipt for ${merchant}`} className="flex h-12 w-10 shrink-0 items-center justify-center rounded-field border border-dashed border-control text-fg-3 hover:border-fg-3 hover:text-fg">
            <Icon icon={Add} size={16}/>
          </button>
        : <span className="relative h-12 w-10 shrink-0">
            <Paper src={src} state={state}/>
            <span className="absolute -end-1.5 -bottom-1.5 flex rounded-full bg-page">
              <Icon icon={state === 'matched' ? CheckmarkFilled : WarningFilled} size={16} className={state === 'matched' ? 'text-success-text' : 'text-warn-text'}/>
            </span>
          </span>}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-sm font-medium">{merchant}</p>
        <p className={cn('truncate text-xs', state === 'review' ? 'text-warn-text' : 'text-fg-3')}>{date}, {note ?? NOTE[state]}</p>
      </div>
      <Amount value={amount}/>
    </div>
  );
}

export {ReceiptMatch, type ReceiptMatchProps, type ReceiptMatchState};
