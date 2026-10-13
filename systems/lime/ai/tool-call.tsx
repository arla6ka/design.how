'use client';

import {Checkmark, Icon, WarningFilled} from '../icon';
import {cn} from '../lib/utils';
import {Spinner} from '../ui/button';

type ToolCallStatus = 'running' | 'done' | 'failed';

type ToolCallProps = Omit<React.ComponentProps<'div'>, 'children'> & {
  status: ToolCallStatus;
  label: string;
  detail?: string;
};

const STATE_WORD: Record<ToolCallStatus, string> = {running: 'Running', done: 'Done', failed: 'Failed'};

function ToolCall({status, label, detail, className, ...props}: ToolCallProps) {
  return (
    <div data-slot="tool-call" data-status={status} role="status" className={cn('flex min-h-9 items-center gap-2.5 rounded-field bg-surface px-3 py-1.5 text-sm', className)} {...props}>
      <span className="flex size-4 shrink-0 items-center justify-center">
        {status === 'running' && <Spinner size={14} className="text-fg-2"/>}
        {status === 'done' && <Icon icon={Checkmark} size={16} className="text-success-text"/>}
        {status === 'failed' && <Icon icon={WarningFilled} size={16} className="text-danger-text"/>}
      </span>
      <span className="sr-only">{STATE_WORD[status]}: </span>
      <span className={cn('min-w-0 truncate font-medium', status === 'failed' ? 'text-danger-text' : 'text-fg')}>{label}</span>
      {detail && <span className="min-w-0 flex-1 truncate text-end text-fg-3">{detail}</span>}
    </div>
  );
}

export {ToolCall, type ToolCallProps, type ToolCallStatus};
