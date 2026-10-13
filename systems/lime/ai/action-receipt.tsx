'use client';

import {CheckmarkFilled, Icon, Undo, WarningFilled} from '../icon';
import {cn} from '../lib/utils';
import {Button} from '../ui/button';
import {Status} from '../ui/status';
import {Message} from './message';

type ActionReceiptLine = {
  label: string;
  detail?: string;
  failed?: boolean;
};

type ActionReceiptLabels = {
  undo?: string;
  undone?: string;
  done?: string;
  failed?: string;
};

const defaultLabels: Required<ActionReceiptLabels> = {undo: 'Undo', undone: 'Undone', done: 'Done', failed: 'Failed'};

type ActionReceiptProps = Omit<React.ComponentProps<'div'>, 'children'> & {
  lines: ActionReceiptLine[];
  summary?: string;
  undone?: boolean;
  onUndo?: () => void;
  name?: string;
  labels?: ActionReceiptLabels;
};

function ActionReceipt({lines, summary, undone, onUndo, name, labels, className, ...props}: ActionReceiptProps) {
  const words = {...defaultLabels, ...labels};
  const state = undone ? 'undone' : lines.some(l => l.failed) ? 'partial' : 'complete';
  return (
    <Message
      data-slot="action-receipt"
      data-state={state}
      name={name}
      className={className}
      actions={(undone || onUndo) && <div aria-live="polite" className={cn('flex min-h-(--control-sm) items-center', undone ? 'ms-2' : '-ms-1')}>
        {undone
          ? <Status status="canceled" label={words.undone}/>
          : <Button variant="ghost" size="sm" icon={<Icon icon={Undo} size={16}/>} onClick={onUndo}>{words.undo}</Button>}
      </div>}
      {...props}
    >
      {summary && <p>{summary}</p>}
      <ul className={cn('flex flex-col gap-2 text-sm', summary && 'mt-2')}>
        {lines.map(line => (
          <li key={line.label} className="flex min-w-0 items-center gap-2.5">
            <Icon
              icon={line.failed ? WarningFilled : CheckmarkFilled}
              size={16}
              className={undone ? 'text-fg-3' : line.failed ? 'text-danger-text' : 'text-success-text'}
            />
            <span className="sr-only">{line.failed ? words.failed : undone ? words.undone : words.done}: </span>
            <span className={cn('min-w-0 truncate', undone ? 'text-fg-3' : line.failed ? 'text-danger-text' : 'text-fg')}>{line.label}</span>
            {line.detail && <span className="min-w-0 flex-1 truncate text-end text-fg-3">{line.detail}</span>}
          </li>
        ))}
      </ul>
    </Message>
  );
}

export {ActionReceipt, type ActionReceiptProps, type ActionReceiptLine, type ActionReceiptLabels};
