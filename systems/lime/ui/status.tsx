import {cn} from '../lib/utils';
import {Spinner} from './button';

type StatusName = 'queued' | 'running' | 'done' | 'failed' | 'canceled';

const STATUS_META: Record<StatusName, {label: string; dot: string}> = {
  queued: {label: 'Scheduled', dot: 'bg-control'},
  running: {label: 'Processing', dot: 'bg-accent-line'},
  done: {label: 'Paid', dot: 'bg-success'},
  failed: {label: 'Declined', dot: 'bg-danger'},
  canceled: {label: 'Canceled', dot: 'bg-fg-disabled'},
};

type StatusProps = Omit<React.ComponentProps<'span'>, 'children'> & {
  status: StatusName;
  label?: string;
  focusable?: boolean;
};

function Status({status, label, focusable, className, ...props}: StatusProps) {
  const meta = STATUS_META[status];
  return (
    <span data-slot="status" data-status={status} tabIndex={focusable ? -1 : undefined} className={cn('inline-flex items-center gap-2 text-sm text-fg-2', focusable && 'rounded-sm', className)} {...props}>
      {status === 'running'
        ? <Spinner size={14} className="text-accent-line"/>
        : <span aria-hidden="true" className={cn('size-2 shrink-0 rounded-full', meta.dot)}/>}
      {label ?? meta.label}
    </span>
  );
}

export {Status, STATUS_META, type StatusName, type StatusProps};
