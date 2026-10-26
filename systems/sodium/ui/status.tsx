import {cva, type VariantProps} from 'class-variance-authority';
import {cn} from '../lib/utils';
import {RunningMark} from './running-mark';

type StatusValue = 'idle' | 'queued' | 'running' | 'paused' | 'ok' | 'warn' | 'fail';

const statuses = ['idle', 'queued', 'running', 'paused', 'ok', 'warn', 'fail'] as const satisfies readonly StatusValue[];

const statusLabels: Record<StatusValue, string> = {
  idle: 'Idle',
  queued: 'Queued',
  running: 'Running',
  paused: 'Paused',
  ok: 'Succeeded',
  warn: 'Warning',
  fail: 'Failed',
};

const statusRank: Record<StatusValue, number> = {fail: 6, warn: 5, paused: 4, running: 3, queued: 2, ok: 1, idle: 0};

const settled = (status: StatusValue) => status === 'ok' || status === 'warn' || status === 'fail' || status === 'paused';

const statusVariants = cva('inline-flex max-w-full min-w-0 items-start gap-2', {
  variants: {
    size: {
      default: 'type-label',
      sm: 'type-label-sm',
    },
    status: {
      idle: 'text-text-2',
      queued: 'text-text-2',
      running: 'text-text-1',
      paused: 'text-text-1',
      ok: 'text-ok-text',
      warn: 'text-warn-text',
      fail: 'text-fail-text',
    },
  },
  defaultVariants: {size: 'default', status: 'idle'},
});

const markColor: Record<StatusValue, string> = {
  idle: 'text-text-3', queued: 'text-text-2', running: 'text-text-1', paused: 'text-text-1', ok: 'text-ok', warn: 'text-warn', fail: 'text-fail',
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
  return <span
    data-slot="status-mark"
    data-status={status}
    role={label ? 'img' : undefined}
    aria-label={label}
    aria-hidden={label ? undefined : true}
    className={cn('flex h-lh shrink-0 items-center forced-colors:text-[CanvasText]', markColor[status], className)}
    {...props}
  >
    <MarkShape status={status}/>
  </span>;
}

function MarkShape({status}: {status: StatusValue}) {
  const box = 'relative flex size-(--marker) shrink-0';
  switch (status) {
    case 'idle': return <span className={cn(box, 'border border-current')}/>;
    case 'queued': return <span className={cn(box, 'items-center justify-center border border-current')}><span className="size-0.5 bg-current"/></span>;
    case 'running': return <RunningMark/>;
    case 'paused': return <span className={cn(box, 'justify-between px-px')}><span className="w-0.5 bg-current"/><span className="w-0.5 bg-current"/></span>;
    case 'ok': return <span className={cn(box, 'bg-current')}/>;
    case 'warn': return <span className={cn(box, 'items-end border border-current')}><span className="h-1/2 w-full bg-current"/></span>;
    case 'fail': return <span className={cn(box, 'items-center justify-center')}><span className="size-1.5 rotate-45 bg-current"/></span>;
  }
}

export {Status, StatusMark, statusVariants, statuses, statusLabels, statusRank, type StatusProps, type StatusValue};
