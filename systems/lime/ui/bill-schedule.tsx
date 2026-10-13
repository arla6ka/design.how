import {cn} from '../lib/utils';
import {Amount, amountAffordability} from './amount';

type Bill = {
  name: string;
  due: Date;
  amount: number;
  pay: 'autopay' | 'manual';
  paid?: boolean;
};

type BillScheduleProps = Omit<React.ComponentProps<'ol'>, 'children'> & {
  bills: Bill[];
  available?: number;
  autopayLabel?: string;
};

const weekday = new Intl.DateTimeFormat('en-US', {weekday: 'short', timeZone: 'UTC'});
const day = new Intl.DateTimeFormat('en-US', {day: 'numeric', timeZone: 'UTC'});
const spoken = new Intl.DateTimeFormat('en-US', {weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC'});

function payer(bill: Bill, autopayLabel: string) {
  if (bill.paid) return 'Paid';
  return bill.pay === 'autopay' ? autopayLabel : bill.pay === 'manual' ? 'You pay' : null;
}

function BillSchedule({bills, available, autopayLabel = 'Paid for you', className, ...props}: BillScheduleProps) {
  return (
    <ol data-slot="bill-schedule" className={cn('flex w-full min-w-0 flex-col gap-3', className)} {...props}>
      {bills.map(bill => {
        const note = payer(bill, autopayLabel);
        return <li key={`${bill.name}-${bill.due.toISOString()}`} data-paid={bill.paid || undefined} className={cn('flex min-w-0 items-center gap-3', bill.paid && 'text-fg-3')}>
          <time dateTime={bill.due.toISOString().slice(0, 10)} className="flex w-10 shrink-0 flex-col items-center rounded-field bg-surface py-1 leading-none">
            <span className="sr-only">{spoken.format(bill.due)}</span>
            <span aria-hidden="true" className="text-xs text-fg-3">{weekday.format(bill.due)}</span>
            <span aria-hidden="true" className="pt-1 text-base font-semibold tabular-nums">{day.format(bill.due)}</span>
          </time>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className={cn('truncate text-sm font-medium', bill.paid && 'text-fg-3')}>{bill.name}</p>
            {!bill.paid && amountAffordability(bill.amount, available) === 'insufficient'
              ? <p className="truncate text-xs text-danger-text">Not enough to cover it</p>
              : note && <p className="truncate text-xs text-fg-3">{note}</p>}
          </div>
          <Amount value={bill.amount} available={bill.paid ? undefined : available} className={cn(bill.paid && 'text-fg-3')}/>
        </li>;
      })}
    </ol>
  );
}

export {BillSchedule, type BillScheduleProps, type Bill};
