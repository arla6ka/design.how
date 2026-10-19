import {mergeProps} from '@base-ui/react/merge-props';
import {useRender} from '@base-ui/react/use-render';
import {cva, type VariantProps} from 'class-variance-authority';
import {Icon, CollapseAll, Stop} from '../icon';
import {Button} from '../ui/button';
import {Status, statusLabels} from '../ui/status';
import {cn} from '../lib/utils';

const messageVariants = cva('group/message relative flex w-full min-w-0 px-4 py-2', {
  variants: {
    size: {
      default: 'type-body',
      sm: 'type-body-sm',
    },
  },
  defaultVariants: {size: 'default'},
});

function MessageGroup({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="message-group" className={cn('flex min-w-0 flex-col gap-4', className)} {...props}/>;
}

type MessageProps = React.ComponentProps<'div'> & VariantProps<typeof messageVariants> & {
  from?: 'agent' | 'user';
};

function Message({className, from = 'agent', size = 'default', ...props}: MessageProps) {
  return <div
    data-slot="message"
    data-from={from}
    data-size={size}
    className={cn(messageVariants({size}), from === 'user' && 'justify-end', className)}
    {...props}
  />;
}

type MessageState = 'live' | 'waiting' | 'fail' | 'stopped' | 'done';

function AgentTurn({name, time, state = 'done', children, ...props}: Omit<React.ComponentProps<typeof Message>, 'from' | 'children'> & {name: string; time?: React.ReactNode; state?: MessageState; children?: React.ReactNode}) {
  return <Message from="agent" {...props}>
    <MessageContent>
      <MessageHeader className={state === 'fail' || state === 'stopped' ? undefined : 'sr-only'}>{name}<MessageStatus state={state}/>{time && <MessageTime>{time}</MessageTime>}</MessageHeader>
      {children}
    </MessageContent>
  </Message>;
}

function MessageContent({className, ...props}: React.ComponentProps<'div'>) {
  return <div
    data-slot="message-content"
    className={cn(
      'flex min-w-0 flex-1 flex-col break-words text-text-1',
      'group-data-[from=user]/message:max-w-[85%] group-data-[from=user]/message:flex-none group-data-[from=user]/message:items-end group-data-[from=user]/message:gap-1',
      'group-data-[from=user]/message:*:data-[slot=message-header]:sr-only',
      'group-data-[from=agent]/message:gap-2',
      className,
    )}
    {...props}
  />;
}

function MessageHeader({className, ...props}: React.ComponentProps<'div'>) {
  return <div
    data-slot="message-header"
    className={cn('flex min-h-(--control-sm) min-w-0 shrink-0 items-center gap-2 type-label-sm text-text-1', className)}
    {...props}
  />;
}

function MessageMeta({className, ...props}: React.ComponentProps<'span'>) {
  return <span data-slot="message-meta" className={cn('min-w-0 truncate type-caption text-text-2 data', className)} {...props}/>;
}

function MessageTime({className, ...props}: React.ComponentProps<'time'>) {
  return <time
    data-slot="message-time"
    className={cn('ms-auto w-12 shrink-0 truncate text-end type-caption text-text-2 data [[data-slot=message-status]~&]:ms-0', className)}
    {...props}
  />;
}

function MessageModel({model, requested, forModel = name => `for ${name}`, className, ...props}: Omit<React.ComponentProps<'span'>, 'children'> & {
  model: string;
  requested?: string;
  forModel?: (requested: string) => string;
}) {
  const switched = requested !== undefined && requested !== model;
  return <span data-slot="message-model" data-switched={switched || undefined} className={cn('inline-flex min-w-0 items-baseline gap-1.5 type-caption text-text-2', className)} title={switched ? `${model} ${forModel(requested)}` : model} {...props}>
    <span className="mono min-w-0 truncate">{model}</span>
    {switched && <span className="min-w-0 truncate">{forModel(requested)}</span>}
  </span>;
}

type MessageStatusLabels = {working?: string; paused?: string; failed?: string; stopped?: string};
const statusWords: Required<MessageStatusLabels> = {working: statusLabels.running, paused: statusLabels.waiting, failed: statusLabels.fail, stopped: 'Stopped'};

type MessageStatusProps = Omit<React.ComponentProps<'span'>, 'children'> & {
  state: MessageState;
  label?: string;
  labels?: MessageStatusLabels;
};

function MessageStatus({state, label, labels, className, ...props}: MessageStatusProps) {
  const words = {...statusWords, ...labels};
  const content = state === 'fail' ? <Status status="fail" size="sm">{label ?? words.failed}</Status>
    : state === 'stopped' ? <span>{label ?? words.stopped}</span>
      : state === 'live' ? <span className="sr-only">{label ?? words.working}</span>
        : state === 'waiting' ? <span className="sr-only">{label ?? words.paused}</span>
          : label ? <span className="sr-only">{label}</span> : null;
  return <span
    data-slot="message-status"
    data-state={state}
    className={cn('ms-auto inline-flex shrink-0 items-center justify-end type-caption whitespace-nowrap text-text-2', className)}
    {...props}
  >{content}</span>;
}

function MessageFooter({className, ...props}: React.ComponentProps<'div'>) {
  return <div
    data-slot="message-footer"
    className={cn(
      'flex min-h-(--control) max-w-full min-w-0 shrink-0 items-center gap-0.5 type-caption text-text-2',
      '-ms-2 *:data-[slot=message-model]:ms-auto *:data-[slot=message-meta]:ms-auto [&>[data-slot=message-model]+[data-slot=message-meta]]:ms-3',
      '[&>[data-slot$=button]]:transition-opacity [&>[data-slot$=button]]:duration-(--dur-state)',
      'pointer-fine:group-data-[from=agent]/message:[&>[data-slot$=button]]:opacity-0',
      'pointer-fine:group-data-[from=agent]/message:group-hover/message:[&>[data-slot$=button]]:opacity-100',
      'pointer-fine:group-data-[from=agent]/message:has-[:focus-visible,[data-force-focus-visible]]:[&>[data-slot$=button]]:opacity-100',
      'group-has-[[data-slot=message-status]:is([data-state=live],[data-state=waiting])]/message:hidden',
      className,
    )}
    {...props}
  />;
}

type MessageWorkedLabels = {worked?: (duration: string) => string};
const workedLabels: Required<MessageWorkedLabels> = {worked: duration => `Worked for ${duration}`};

function MessageWorked({duration, time, labels, className, ...props}: Omit<React.ComponentProps<'span'>, 'children'> & {
  duration?: string;
  time?: React.ReactNode;
  labels?: MessageWorkedLabels;
}) {
  const words = {...workedLabels, ...labels};
  return <span data-slot="message-worked" className={cn('ms-2 me-1 inline-flex min-w-0 items-baseline gap-1.5 truncate type-caption text-text-2 data', className)} {...props}>
    {duration && <span className="min-w-0 truncate">{words.worked(duration)}{time && ','}</span>}
    {time && <span className="shrink-0">{time}</span>}
  </span>;
}

const bubbleVariants = cva(
  ['group/bubble relative flex w-auto max-w-(--measure) min-w-0 flex-col gap-1 self-end'],
  {
    variants: {
      variant: {
        default: '*:data-[slot=message-bubble-content]:border-line-faint *:data-[slot=message-bubble-content]:bg-shell',
        outline: '*:data-[slot=message-bubble-content]:border-line-control *:data-[slot=message-bubble-content]:bg-paper',
      },
    },
    defaultVariants: {variant: 'default'},
  },
);

type MessageBubbleProps = React.ComponentProps<'div'> & VariantProps<typeof bubbleVariants> & {
  status?: 'fail';
};

function MessageBubble({variant = 'default', status, className, ...props}: MessageBubbleProps) {
  return <div
    data-slot="message-bubble"
    data-variant={variant}
    data-status={status}
    className={cn(bubbleVariants({variant}), status === 'fail' && '*:data-[slot=message-bubble-content]:border-fail', className)}
    {...props}
  />;
}

function MessageBubbleContent({className, render, ...props}: useRender.ComponentProps<'div'>) {
  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(
      {
        className: cn(
          'w-fit max-w-full min-w-0 self-end rounded-overlay border px-3 py-2 type-body break-words whitespace-pre-wrap text-text-1 [overflow-wrap:anywhere]',
          'forced-colors:border-[CanvasText]',
          '[&:is(button,a)]:text-start [&:is(button,a)]:transition-colors [&:is(button,a)]:duration-(--dur-state) [&:is(button,a)]:hover:bg-hover',
          className,
        ),
      },
      props,
    ),
    render,
    state: {slot: 'message-bubble-content'},
  });
}

function MessageReactions({className, ...props}: React.ComponentProps<'div'>) {
  return <div
    data-slot="message-reactions"
    dir="auto"
    className={cn('flex min-h-5 w-fit flex-wrap items-center gap-1 type-label-sm text-text-1 data *:inline-flex *:h-5 *:items-center *:gap-1 *:rounded-tag *:border *:border-line-control *:px-1.5', className)}
    {...props}
  />;
}

type MessageSendStateLabels = {sending?: string; notSent?: string; retry?: string};
const sendStateLabels: Required<MessageSendStateLabels> = {sending: 'Sending', notSent: 'Not sent', retry: 'Retry'};

function MessageSendState({state, onRetry, labels, className, ...props}: Omit<React.ComponentProps<'div'>, 'children'> & {
  state: 'sending' | 'sent' | 'failed';
  onRetry?: () => void;
  labels?: MessageSendStateLabels;
}) {
  const words = {...sendStateLabels, ...labels};
  if (state === 'sent') return null;
  return <div
    data-slot="message-send-state"
    data-state={state}
    className={cn('flex min-h-(--control-sm) items-center gap-2 type-caption text-text-2', className)}
    {...props}
  >
    <span role="status">{state === 'sending' ? words.sending : <Status status="fail" size="sm">{words.notSent}</Status>}</span>
    {state === 'failed' && onRetry && <Button variant="ghost" size="sm" onClick={onRetry}>{words.retry}</Button>}
  </div>;
}

const dividerVariants = cva(
  'group/divider relative flex min-h-(--control-sm) w-full items-center gap-2 px-4 text-start type-caption text-text-2 [&_a]:text-text-1 [&_a]:underline [&_a]:decoration-1 [&_a]:underline-offset-4',
  {
    variants: {
      variant: {
        default: '',
        separator: 'after:h-px after:min-w-4 after:flex-1 after:bg-line-faint',
        handoff: 'justify-center before:h-px before:min-w-4 before:flex-1 before:bg-line after:h-px after:min-w-4 after:flex-1 after:bg-line forced-colors:before:bg-[CanvasText] forced-colors:after:bg-[CanvasText]',
      },
    },
    defaultVariants: {variant: 'default'},
  },
);

type DividerReason = 'compaction' | 'interrupted' | 'handoff' | 'day';
const reasonLabel: Partial<Record<DividerReason, string>> = {compaction: 'Context compacted', interrupted: 'Interrupted', handoff: statusLabels.waiting};
const reasonIcon = {compaction: CollapseAll, interrupted: Stop} as const;

type MessageDividerProps = useRender.ComponentProps<'div'> & VariantProps<typeof dividerVariants> & {
  reason?: DividerReason;
  to?: 'person' | 'agent';
  labels?: Partial<Record<DividerReason, string>>;
};

function MessageDivider({className, variant, reason, to = 'person', labels, render, children, ...props}: MessageDividerProps) {
  const reasonText = reason ? (labels?.[reason] ?? (reason === 'handoff' && to === 'agent' ? undefined : reasonLabel[reason])) : undefined;
  const toPerson = reason === 'handoff' && to === 'person';
  const v = variant ?? (toPerson ? 'handoff' : reason ? 'separator' : 'default');
  const glyph = reason === 'compaction' || reason === 'interrupted' ? reasonIcon[reason] : undefined;
  const text = children ?? reasonText ?? null;
  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(
      {
        role: 'separator',
        className: cn(dividerVariants({variant: v}), className),
        children: v === 'handoff'
          ? <Status data-slot="message-divider-content" status="waiting" size="sm" className="min-w-0 shrink">{text}</Status>
          : <>
              {glyph && <span data-slot="message-divider-icon" aria-hidden className="flex size-4 shrink-0 items-center justify-center text-text-3"><Icon icon={glyph} size={12}/></span>}
              <span data-slot="message-divider-content" className="min-w-0 shrink break-words">{text}</span>
            </>,
      },
      {'data-reason': reason, 'data-variant': v, 'aria-label': typeof children === 'string' ? children : reasonText} as React.ComponentProps<'div'>,
      props,
    ),
    render,
    state: {slot: 'message-divider', variant: v},
  });
}

export {
  MessageGroup, Message, AgentTurn, MessageContent, MessageHeader, MessageMeta, MessageTime, MessageModel, MessageStatus, MessageFooter, MessageWorked,
  MessageBubble, MessageBubbleContent, MessageReactions, MessageSendState, MessageDivider,
  messageVariants, bubbleVariants, dividerVariants,
  type MessageProps, type MessageState, type MessageStatusProps, type MessageStatusLabels, type MessageWorkedLabels, type MessageSendStateLabels, type MessageBubbleProps, type MessageDividerProps, type DividerReason,
};
