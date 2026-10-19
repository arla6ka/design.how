'use client';

import {useEffect, useId, useState, type ReactNode} from 'react';
import {Icon, Undo} from '../icon';
import {cn} from '../lib/utils';
import {Button} from '../ui/button';
import {Card, CardAction, CardContent, CardFooter, CardHeader, CardMeta, CardTitle} from '../ui/card';
import {RelativeTime} from '../ui/relative-time';
import {Status, type StatusValue} from '../ui/status';
import {StepGlyph} from './activity';

type ActionReceiptResult = 'done' | 'partial' | 'failed';

type ActionReceiptStep = {
  label: ReactNode;
  detail?: ReactNode;
  failed?: boolean;
};

type ActionReceiptLabels = {
  done?: string;
  partial?: string;
  failed?: string;
  undone?: string;
  undo?: string;
  undoing?: string;
};

const defaultLabels: Required<ActionReceiptLabels> = {
  done: 'Done', partial: 'Partly done', failed: 'Failed', undone: 'Undone', undo: 'Undo', undoing: 'Undoing',
};

const resultStatus: Record<ActionReceiptResult, StatusValue> = {done: 'ok', partial: 'warn', failed: 'fail'};

type ActionReceiptProps = Omit<React.ComponentProps<'div'>, 'title' | 'children'> & {
  title: ReactNode;
  steps?: ActionReceiptStep[];
  result?: ActionReceiptResult;
  at?: Date | string | number;
  now?: Date | string | number;
  by?: ReactNode;
  onUndo?: () => void;
  undoUntil?: Date | string | number;
  undoing?: boolean;
  undone?: boolean;
  labels?: ActionReceiptLabels;
};

const ms = (value: Date | string | number) => (value instanceof Date ? value.getTime() : typeof value === 'number' ? value : new Date(value).getTime());

function useBefore(until: Date | string | number | undefined, now?: Date | string | number) {
  const end = until === undefined ? undefined : ms(until);
  const frozen = now === undefined ? undefined : ms(now);
  const [open, setOpen] = useState(true);
  useEffect(() => {
    if (end === undefined || frozen !== undefined) return;
    const left = end - Date.now();
    if (left <= 0) { setOpen(false); return; }
    setOpen(true);
    const timer = setTimeout(() => setOpen(false), Math.min(left, 2 ** 31 - 1));
    return () => clearTimeout(timer);
  }, [end, frozen]);
  if (end === undefined) return true;
  if (frozen !== undefined) return frozen < end;
  return open;
}

function ActionReceipt({title, steps, result = 'done', at, now, by, onUndo, undoUntil, undoing = false, undone = false, labels, className, ...props}: ActionReceiptProps) {
  const words = {...defaultLabels, ...labels};
  const titleId = useId();
  const inWindow = useBefore(undoUntil, now);
  const canUndo = !!onUndo && !undone && result !== 'failed' && (inWindow || undoing);
  const status: StatusValue = undone ? 'idle' : resultStatus[result];
  const word = undone ? words.undone : words[result];
  const meta = (by || at !== undefined) && <CardMeta>
    {by}{by && at !== undefined && ', '}{at !== undefined && <RelativeTime date={at} now={now}/>}
  </CardMeta>;

  return <Card
    data-slot="action-receipt"
    data-result={result}
    data-undone={undone || undefined}
    role="group"
    aria-labelledby={titleId}
    className={className}
    {...props}
  >
    <CardHeader>
      <CardTitle id={titleId} data-slot="action-receipt-title" className={cn(undone && 'text-text-2')}>{title}</CardTitle>
      <CardAction className="my-0 block h-lh type-label">
        <Status status={status} size="sm" data-slot="action-receipt-result">{word}</Status>
      </CardAction>
    </CardHeader>
    {steps && steps.length > 0 && <CardContent className="gap-0 pt-0">
      <ul data-slot="action-receipt-steps" className="flex min-w-0 flex-col">
        {steps.map((step, i) => <li key={i} data-slot="action-receipt-step" data-failed={step.failed || undefined} className="flex min-h-(--menu-row-sm) min-w-0 items-center gap-2 type-body-sm">
          <StepGlyph state={undone ? 'stopped' : step.failed ? 'fail' : 'done'}/>
          <span className="sr-only">{step.failed ? `${words.failed}: ` : undone ? `${words.undone}: ` : `${words.done}: `}</span>
          <span className={cn('min-w-0 truncate', undone ? 'text-text-2' : 'text-text-1')}>{step.label}</span>
          {step.detail !== undefined && <span className={cn('ms-auto min-w-0 shrink truncate text-end data', step.failed && !undone ? 'text-fail-text' : 'text-text-2')}>{step.detail}</span>}
        </li>)}
      </ul>
    </CardContent>}
    {(meta || canUndo) && <CardFooter data-slot="action-receipt-footer">
      {meta}
      {canUndo && <Button size="sm" variant="secondary" pending={undoing} pendingLabel={words.undoing} onClick={onUndo} data-slot="action-receipt-undo">
        <Icon icon={Undo}/>{words.undo}
      </Button>}
    </CardFooter>}
    <span role="status" className="sr-only">{undone ? words.undone : ''}</span>
  </Card>;
}

export {ActionReceipt, type ActionReceiptProps, type ActionReceiptStep, type ActionReceiptResult, type ActionReceiptLabels};
