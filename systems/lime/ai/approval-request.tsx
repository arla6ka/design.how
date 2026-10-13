'use client';

import {useId} from 'react';
import {Edit, Icon} from '../icon';
import {useFocusWhenReplaced} from '../lib/use-focus-when-replaced';
import {cn} from '../lib/utils';
import {Amount, amountAffordability} from '../ui/amount';
import {Button} from '../ui/button';
import {Card} from '../ui/card';
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from '../ui/collapsible';
import {Status} from '../ui/status';

type ApprovalRequestState = 'waiting' | 'approved' | 'declined';

type ApprovalReason = {
  text: string;
  source: string;
  href?: string;
};

type ApprovalRequestLabels = {
  approve?: string;
  decline?: string;
  edit?: string;
  why?: string;
  approved?: string;
  declined?: string;
  insufficient?: string;
};

const defaultLabels: Required<ApprovalRequestLabels> = {approve: 'Approve', decline: 'Decline', edit: 'Edit', why: 'Why?', approved: 'Approved', declined: 'Declined', insufficient: 'More than you have available'};

type ApprovalRequestProps = Omit<React.ComponentProps<'div'>, 'title'> & {
  title: string;
  amount: number;
  available?: number;
  reason: string;
  reasons?: ApprovalReason[];
  state?: ApprovalRequestState;
  pending?: boolean;
  onApprove?: () => void;
  onEdit?: () => void;
  onDecline?: () => void;
  labels?: ApprovalRequestLabels;
};

function ApprovalRequest({title, amount, available, reason, reasons, state = 'waiting', pending, onApprove, onEdit, onDecline, labels, className, children, ...props}: ApprovalRequestProps) {
  const words = {...defaultLabels, ...labels};
  const short = amountAffordability(amount, available) === 'insufficient';
  const shortId = useId();
  const {region: footer, target: outcome} = useFocusWhenReplaced(state !== 'waiting');
  return (
    <Card data-slot="approval-request" data-state={state} role="group" aria-label={title} className={cn('w-full min-w-0 gap-3 p-4', className)} {...props}>
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <p className="min-w-0 truncate font-medium">{title}</p>
          <Amount value={amount} available={available} size="lg"/>
        </div>
        <p className="truncate text-sm text-fg-2">{reason}</p>
        {short && state === 'waiting' && <p id={shortId} data-slot="approval-short" className="text-sm text-danger-text">{words.insufficient}</p>}
        {reasons?.length ? <Reasons reasons={reasons} label={words.why}/> : null}
      </div>
      {children}
      <div ref={footer} aria-live="polite" className="flex min-h-(--control-md) items-center gap-2">
        {state === 'waiting' && <>
          <Button className="min-w-0 flex-1" pending={!!pending} disabled={short} aria-describedby={short ? shortId : undefined} onClick={onApprove}>{words.approve}</Button>
          <Button variant="secondary" size="icon" aria-label={words.edit} disabled={pending} onClick={onEdit}><Icon icon={Edit} size={16}/></Button>
          <Button variant="ghost" disabled={pending} onClick={onDecline}>{words.decline}</Button>
        </>}
        {state === 'approved' && <Status ref={outcome} focusable status="done" label={words.approved}/>}
        {state === 'declined' && <Status ref={outcome} focusable status="canceled" label={words.declined}/>}
      </div>
    </Card>
  );
}

function Reasons({reasons, label}: {reasons: ApprovalReason[]; label: string}) {
  return (
    <Collapsible data-slot="approval-reasons" className="flex min-w-0 flex-col">
      <CollapsibleTrigger className="w-fit justify-start gap-1 py-1 text-sm text-fg-2">{label}</CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="flex flex-col gap-2.5 pt-1.5 pb-1">
          {reasons.map(item => (
            <li key={item.text} className="flex min-w-0 flex-col gap-0.5 text-sm">
              <span className="text-fg">{item.text}</span>
              {item.href
                ? <a href={item.href} className="w-fit max-w-full truncate text-xs text-fg-3 underline underline-offset-2 hover:text-fg-2">{item.source}</a>
                : <span className="truncate text-xs text-fg-3">{item.source}</span>}
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

export {ApprovalRequest, type ApprovalRequestProps, type ApprovalRequestLabels, type ApprovalRequestState, type ApprovalReason};
