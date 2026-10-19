import {cva, type VariantProps} from 'class-variance-authority';
import {Icon, FailedMark, Pending, Success, Waiting, Warning, type GlazeIcon} from '../icon';
import {cn} from '../lib/utils';

type StatusValue = 'idle' | 'queued' | 'running' | 'ok' | 'warn' | 'fail' | 'waiting';

const statuses = ['idle', 'queued', 'running', 'ok', 'warn', 'fail', 'waiting'] as const satisfies readonly StatusValue[];

const statusLabels: Record<StatusValue, string> = {
  idle: 'Idle',
  queued: 'Queued',
  running: 'Running',
  ok: 'Passed',
  warn: 'Warning',
  fail: 'Failed',
  waiting: 'Waiting on you',
};

const statusRank: Record<StatusValue, number> = {fail: 6, waiting: 5, warn: 4, running: 3, queued: 2, ok: 1, idle: 0};

const settled = (status: StatusValue) => status === 'ok' || status === 'warn' || status === 'fail' || status === 'waiting';

const statusVariants = cva('inline-flex max-w-full min-w-0 items-baseline gap-1 data', {
  variants: {
    size: {
      default: 'type-label',
      sm: 'type-label-sm',
    },
    status: {
      idle: 'text-text-2',
      queued: 'text-text-2',
      running: 'text-text-1',
      ok: 'text-ok-text',
      warn: 'text-warn-text',
      fail: 'text-fail-text',
      waiting: 'text-text-1',
    },
  },
  defaultVariants: {size: 'default', status: 'idle'},
});

const statusGlyph: Record<StatusValue, GlazeIcon | null> = {
  idle: null,
  queued: null,
  running: Pending,
  ok: Success,
  warn: Warning,
  fail: FailedMark,
  waiting: Waiting,
};

type StatusProps = Omit<React.ComponentProps<'span'>, 'children'> & Omit<VariantProps<typeof statusVariants>, 'status'> & {
  status?: StatusValue;
  live?: boolean;
  children?: React.ReactNode;
};

function Status({status = 'idle', size = 'default', live, className, children, ...props}: StatusProps) {
  const word = children ?? statusLabels[status];
  return <span
    data-slot="status"
    data-status={status}
    data-size={size}
    className={cn(statusVariants({size, status}), className)}
    {...props}
  >
    <StatusMark status={status}/>
    <span data-slot="status-word" aria-hidden={live && settled(status) ? true : undefined} className="min-w-0 [overflow-wrap:anywhere]">{word}</span>
    {live && <span role="status" className="sr-only">{settled(status) ? (typeof word === 'string' ? word : statusLabels[status]) : ''}</span>}
  </span>;
}

function StatusMark({status = 'idle', label, className, ...props}: Omit<React.ComponentProps<'span'>, 'children'> & {status?: StatusValue; label?: string}) {
  const glyph = statusGlyph[status];
  if (!glyph) return label ? <span data-slot="status-mark" data-status={status} className="sr-only">{label}</span> : null;
  return <span
    data-slot="status-mark"
    data-status={status}
    role={label ? 'img' : undefined}
    aria-label={label}
    aria-hidden={label ? undefined : true}
    className={cn('flex h-lh shrink-0 items-center self-start', className)}
    {...props}
  >
    <Icon icon={glyph} size={12} weight={status === 'running' ? 'regular' : 'bold'} className={cn(status === 'running' && 'animate-spin motion-reduce:animate-none')}/>
  </span>;
}

export {Status, StatusMark, statusVariants, statusGlyph, statuses, statusLabels, statusRank, type StatusProps, type StatusValue};
