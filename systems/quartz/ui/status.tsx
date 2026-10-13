import {cva, type VariantProps} from 'class-variance-authority';
import {cn} from '../lib/utils';

type Status = 'idle' | 'queued' | 'running' | 'ok' | 'warn' | 'fail' | 'waiting';

const statuses = ['idle', 'queued', 'running', 'ok', 'warn', 'fail', 'waiting'] as const satisfies readonly Status[];

const statusLabels: Record<Status, string> = {
  idle: 'Idle',
  queued: 'Queued',
  running: 'Running',
  ok: 'OK',
  warn: 'Warning',
  fail: 'Failed',
  waiting: 'Waiting on you',
};

const statusRank: Record<Status, number> = {fail: 6, waiting: 5, warn: 4, running: 3, queued: 2, ok: 1, idle: 0};

const settled = (status: Status) => status === 'ok' || status === 'warn' || status === 'fail' || status === 'waiting';

const wordVariants = cva('relative inline-flex items-start gap-1.5 type-state-word text-text-1 data', {
  variants: {
    variant: {
      plain: 'data-[status=ok]:text-text-2 data-[status=idle]:text-text-3 data-[status=warn]:text-warn-text data-[status=fail]:text-fail-text',
      /** @deprecated Renders as plain. */
      field: 'data-[status=ok]:text-text-2 data-[status=idle]:text-text-3 data-[status=warn]:text-warn-text data-[status=fail]:text-fail-text',
    },
  },
  defaultVariants: {variant: 'plain'},
});

type StatusProps = Omit<React.ComponentProps<'span'>, 'children'> & VariantProps<typeof wordVariants> & {
  status?: Status;
  /** @deprecated A no-op kept so older call sites compile: a Status is always the word. */
  display?: 'word';
  label?: string | true;
  live?: boolean;
  children?: React.ReactNode;
};

function Status({status = 'idle', variant = 'plain', label, live, display: _display, className, children, ...props}: StatusProps) {
  if (process.env.NODE_ENV !== 'production' && variant === 'field') console.warn('Status: variant="field" renders as plain. Put data-status on the frame and the word in its header.');
  const word = children ?? (typeof label === 'string' ? label : statusLabels[status]);
  const region = live ? <span role="status" className="sr-only">{settled(status) ? (typeof word === 'string' ? word : statusLabels[status]) : ''}</span> : null;
  if (status === 'waiting') return <span data-slot="status" data-status={status} className={cn('inline-flex', className)} {...props}>
    <InkSlot aria-hidden={live ? true : undefined} className={inRow}>{word}</InkSlot>
    {region}
  </span>;
  return <span
    data-slot="status"
    data-status={status}
    data-variant={variant}
    className={cn(wordVariants({variant}), className)}
    {...props}
  >
    {status === 'running' && <FirstLine><StatusArc/></FirstLine>}
    <span data-slot="status-word" aria-hidden={live && settled(status) ? true : undefined} className="min-w-0 [overflow-wrap:anywhere]">{word}</span>
    {region}
  </span>;
}

const inRow = [
  'in-data-[slot=data-table]:h-auto in-data-[slot=data-table]:rounded-none in-data-[slot=data-table]:bg-transparent in-data-[slot=data-table]:px-0 in-data-[slot=data-table]:shadow-none',
  'in-data-[slot=data-grid-row]:h-auto in-data-[slot=data-grid-row]:rounded-none in-data-[slot=data-grid-row]:bg-transparent in-data-[slot=data-grid-row]:px-0 in-data-[slot=data-grid-row]:shadow-none',
].join(' ');

function FirstLine({children}: {children: React.ReactNode}) {
  return <span data-slot="status-arc-line" className="flex h-(--line-box) shrink-0 items-center">{children}</span>;
}

function StatusArc({name, className, ...props}: Omit<React.ComponentProps<'span'>, 'children'> & {name?: string}) {
  return <span
    data-slot="status-arc"
    data-status="running"
    role={name ? 'img' : undefined}
    aria-label={name || undefined}
    aria-hidden={name ? undefined : true}
    className={cn('relative box-border inline-block size-2.5 shrink-0 rounded-full border border-current border-t-transparent motion-safe:animate-run in-data-offscreen:[animation-play-state:paused] forced-colors:[forced-color-adjust:none] forced-colors:border-[CanvasText] forced-colors:border-t-transparent', className)}
    {...props}
  />;
}

const inkSlotVariants = cva('inline-flex shrink-0 items-center rounded-inner bg-page whitespace-nowrap text-text-1 shadow-[inset_0_0_0_1px_var(--line-control)] data forced-colors:border forced-colors:border-transparent', {
  variants: {
    size: {
      default: 'h-(--control-xs) px-2 type-label',
      sm: 'h-(--tag) px-1.5 type-label-sm',
    },
  },
  defaultVariants: {size: 'default'},
});

type InkSlotProps = React.ComponentProps<'span'> & VariantProps<typeof inkSlotVariants>;

function InkSlot({size = 'default', className, ...props}: InkSlotProps) {
  return <span data-slot="ink-slot" data-size={size} className={cn(inkSlotVariants({size}), className)} {...props}/>;
}

export {Status, StatusArc, InkSlot, inkSlotVariants, type InkSlotProps, statuses, statusLabels, statusRank, wordVariants as statusWordVariants, type Status as StatusValue, type StatusProps};
