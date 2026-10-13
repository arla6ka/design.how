import {mergeProps} from '@base-ui/react/merge-props';
import {useRender} from '@base-ui/react/use-render';
import {cva, type VariantProps} from 'class-variance-authority';
import {Icon, CollapseAll, StopOutline} from '../icon';
import {Avatar} from '../ui/avatar';
import {Button} from '../ui/button';
import {Badge} from '../ui/badge';
import {InkSlot, Status, statusLabels} from '../ui/status';
import type {Kind} from '../lib/kind';
import {cn, withDefaults} from '../lib/utils';

const messageVariants = cva('group/message relative flex w-full min-w-0', {
  variants: {
    size: {
      default: 'type-body',
      sm: 'type-body-sm',
    },
  },
  defaultVariants: {size: 'default'},
});

const agentTurn = 'px-4 py-2 *:data-[slot=message-avatar]:hidden';

const personRow = [
  'justify-end px-4 py-2 *:data-[slot=message-avatar]:hidden',
  'has-[[data-slot=message-send-state][data-state=failed]]:[--accent-wash:var(--fail-wash)] has-[[data-slot=message-send-state][data-state=failed]]:bg-accent-wash',
  'has-[[data-slot=message-bubble][data-variant=destructive]]:[--accent-wash:var(--fail-wash)] has-[[data-slot=message-bubble][data-variant=destructive]]:bg-accent-wash',
];

function MessageGroup({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="message-group" className={cn('flex min-w-0 flex-col gap-4', className)} {...props}/>;
}

type MessageProps = React.ComponentProps<'div'> & VariantProps<typeof messageVariants> & {
  from?: 'agent' | 'user' | 'person';
  align?: 'start' | 'end';
  kind?: Kind;
};

function Message({className, from = 'agent', align = 'start', size = 'default', kind, ...props}: MessageProps) {
  const who = from === 'person' ? 'user' : from;
  return <div
    data-slot="message"
    data-from={who}
    data-align={align}
    data-size={size}
    data-kind={who === 'agent' ? (kind ?? 'agent') : kind}
    className={cn(messageVariants({size}), who === 'agent' ? agentTurn : personRow, className)}
    {...props}
  />;
}

/** @deprecated An avatar slot kept for older call sites. Neither turn has an avatar, so nothing draws it. */
function MessageAvatar({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="message-avatar" aria-hidden className={cn('flex h-(--control-xs) shrink-0 items-center self-start', className)} {...props}/>;
}

/** @deprecated The agent's avatar slot, kept for older call sites. An agent turn has no avatar. */
function MessageAgentAvatar({name, className, ...props}: Omit<React.ComponentProps<typeof MessageAvatar>, 'children'> & {name: string}) {
  return <MessageAvatar className={className} {...props}><Avatar size="sm" type="agent" name={name} decorative/></MessageAvatar>;
}

function AgentTurn({name, time, state = 'done', children, ...props}: Omit<React.ComponentProps<typeof Message>, 'from' | 'children'> & {name: string; time?: React.ReactNode; state?: MessageStatusProps['state']; children?: React.ReactNode}) {
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
    className={cn(
      'flex min-w-0 items-center gap-2 type-label text-text-1 *:data-[slot=message-meta]:type-body-sm *:data-[slot=message-meta]:text-text-3',
      'min-h-(--control-xs) group-data-[from=agent]/message:shrink-0 group-data-[from=agent]/message:type-body-sm group-data-[from=agent]/message:text-text-2',
      'group-data-[from=agent]/message:*:data-[slot=badge]:hidden group-data-[from=agent]/message:*:data-[slot=message-model]:hidden',
      className,
    )}
    {...props}
  />;
}

function MessageMeta({className, ...props}: React.ComponentProps<'span'>) {
  return <span data-slot="message-meta" className={cn('min-w-0 truncate data', className)} {...props}/>;
}

function MessageTime({className, ...props}: React.ComponentProps<'time'>) {
  return <time
    data-slot="message-time"
    className={cn('ms-auto w-(--time-column) shrink-0 truncate text-end type-body-sm text-text-3 data [[data-slot=message-status]~&]:ms-0', className)}
    {...props}
  />;
}

function MessageModel({model, requested, forModel = name => `for ${name}`, className, ...props}: Omit<React.ComponentProps<'span'>, 'children'> & {
  model: string;
  requested?: string;
  forModel?: (requested: string) => string;
}) {
  const switched = requested !== undefined && requested !== model;
  return <span data-slot="message-model" data-switched={switched || undefined} className={cn('inline-flex min-w-0 items-baseline gap-1.5 text-text-3', className)} title={switched ? `${model} ${forModel(requested)}` : model} {...props}>
    <span className="min-w-0 truncate type-tag">{model}</span>
    {switched && <span className="min-w-0 truncate type-body-sm">{forModel(requested)}</span>}
  </span>;
}

type MessageStatusLabels = {working?: string; paused?: string; failed?: string; stopped?: string};
const statusWords: Required<MessageStatusLabels> = {working: statusLabels.running, paused: statusLabels.waiting, failed: statusLabels.fail, stopped: 'Stopped'};

type MessageStatusProps = Omit<React.ComponentProps<'span'>, 'children'> & {
  state: 'live' | 'waiting' | 'fail' | 'stopped' | 'done';
  label?: string;
  labels?: MessageStatusLabels;
};

function MessageStatus({state, label, labels, className, ...props}: MessageStatusProps) {
  const words = withDefaults(statusWords, labels);
  const content = state === 'fail' ? <Status status="fail">{label ?? words.failed}</Status>
    : state === 'stopped' ? <span>{label ?? words.stopped}</span>
      : state === 'live' ? <span className="sr-only">{label ?? words.working}</span>
        : state === 'waiting' ? <span className="sr-only">{label ?? words.paused}</span>
          : label ? <span className="sr-only">{label}</span> : null;
  return <span
    data-slot="message-status"
    data-state={state}
    className={cn('ms-auto inline-flex shrink-0 items-center justify-end type-body-sm whitespace-nowrap text-text-3', className)}
    {...props}
  >{content}</span>;
}

function MessageFooter({className, ...props}: React.ComponentProps<'div'>) {
  return <div
    data-slot="message-footer"
    className={cn(
      'flex min-h-(--row-sm) max-w-full min-w-0 shrink-0 items-center gap-0.5 type-body-sm text-text-2',
      'group-data-[from=agent]/message:-ms-2 *:data-[slot=message-model]:ms-auto *:data-[slot=message-meta]:ms-auto *:data-[slot=message-meta]:text-text-2 [&>[data-slot=message-model]+[data-slot=message-meta]]:ms-3',
      'pointer-fine:group-data-[from=agent]/message:*:data-[slot=button]:opacity-0 pointer-fine:group-data-[from=agent]/message:group-hover/message:*:data-[slot=button]:opacity-100 pointer-fine:group-data-[from=agent]/message:*:data-[slot=button]:focus-visible:opacity-100 pointer-fine:group-data-[from=agent]/message:*:data-[slot=button]:transition-opacity pointer-fine:group-data-[from=agent]/message:*:data-[slot=button]:duration-(--dur-fast)',
      'group-has-[[data-slot=message-status]:is([data-state=live],[data-state=waiting])]/message:hidden',
      'group-data-[from=user]/message:-ms-2 group-data-[from=user]/message:min-h-(--control-sm)',
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
  const words = withDefaults(workedLabels, labels);
  return <span data-slot="message-worked" className={cn('me-1 ms-2 inline-flex min-w-0 items-baseline gap-1.5 truncate type-body-sm text-text-3 data', className)} {...props}>
    {duration && <span className="min-w-0 truncate">{words.worked(duration)}{time && ','}</span>}
    {time && <span className="shrink-0">{time}</span>}
  </span>;
}

const paperBubble = 'group-data-[from=user]/message:*:data-[slot=message-bubble-content]:bg-page group-data-[from=user]/message:*:data-[slot=message-bubble-content]:frame group-data-[from=user]/message:*:data-[slot=message-bubble-content]:px-3.5 group-data-[from=user]/message:*:data-[slot=message-bubble-content]:py-2';

const bubbleVariants = cva(
  ['group/bubble relative flex w-full max-w-(--measure) min-w-0 flex-col gap-1', 'data-[align=end]:self-end', 'group-data-[from=user]/message:w-auto'],
  {
    variants: {
      variant: {
        default: paperBubble,
        ghost: paperBubble,
        destructive: paperBubble,
        inverse: '*:data-[slot=message-bubble-content]:rounded-frame *:data-[slot=message-bubble-content]:bg-inverse *:data-[slot=message-bubble-content]:px-3 *:data-[slot=message-bubble-content]:py-2 *:data-[slot=message-bubble-content]:text-text-inverse',
        outline: '*:data-[slot=message-bubble-content]:frame *:data-[slot=message-bubble-content]:px-3 *:data-[slot=message-bubble-content]:py-2 *:data-[slot=message-bubble-content]:[--frame-color:var(--line-control)] group-data-[from=user]/message:*:data-[slot=message-bubble-content]:bg-page',
        tinted: '*:data-[slot=message-bubble-content]:frame *:data-[slot=message-bubble-content]:px-3 *:data-[slot=message-bubble-content]:py-2 *:data-[slot=message-bubble-content]:[--frame-color:var(--accent-line)] group-data-[from=user]/message:*:data-[slot=message-bubble-content]:bg-page',
      },
    },
    defaultVariants: {variant: 'default'},
  },
);

type MessageBubbleProps = React.ComponentProps<'div'> & VariantProps<typeof bubbleVariants> & {
  align?: 'start' | 'end';
  kind?: Kind;
  status?: 'fail';
};

function MessageBubble({variant: asked = 'default', status, align = 'start', kind, className, ...props}: MessageBubbleProps) {
  const variant = status === 'fail' ? 'destructive' : asked;
  return <div
    data-slot="message-bubble"
    data-variant={variant}
    data-align={align}
    data-kind={kind}
    className={cn(bubbleVariants({variant}), className)}
    {...props}
  />;
}

function MessageBubbleContent({className, render, ...props}: useRender.ComponentProps<'div'>) {
  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(
      {
        className: cn(
          'w-fit max-w-full min-w-0 type-body break-words whitespace-pre-wrap text-text-1 [overflow-wrap:anywhere]',
          'group-data-[align=end]/bubble:self-end [button]:text-start [button,a]:rounded-soft [button,a]:transition-colors [button,a]:duration-(--dur-fast) [button,a]:ease-(--ease-step)',
          '[&:is(button,a)]:hover:bg-hover [&:is(button,a)]:hover:group-data-[variant=inverse]/bubble:bg-button-primary-hover',
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
    className={cn('flex min-h-5 w-fit flex-wrap items-center gap-1 type-label-sm text-text-1 data *:inline-flex *:h-5 *:items-center *:gap-1 *:rounded-inner *:px-1.5 *:control-edge', className)}
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
  const words = withDefaults(sendStateLabels, labels);
  if (state === 'sent') return null;
  return <div
    data-slot="message-send-state"
    data-state={state}
    data-status={state === 'failed' ? 'fail' : undefined}
    className={cn('relative flex min-h-(--control-sm) items-center gap-2 type-body-sm text-text-3', className)}
    {...props}
  >
    <span role="status">{state === 'sending' ? words.sending : <Status status="fail">{words.notSent}</Status>}</span>
    {state === 'failed' && onRetry && <Button variant="ghost" size="sm" onClick={onRetry}>{words.retry}</Button>}
  </div>;
}

const dividerVariants = cva(
  [
    'group/divider relative flex min-h-(--control-xs) w-full items-center gap-2 text-start type-label-sm text-text-3',
    "[&_svg:not([class*='size-'])]:size-4 [&_a]:text-text-1 [&_a]:underline [&_a]:decoration-1 [&_a]:underline-offset-4",
  ],
  {
    variants: {
      variant: {
        default: '',
        separator: 'after:h-px after:min-w-4 after:flex-1 after:bg-line-row',
        border: 'pb-2 rule-row',
        ink: 'before:h-px before:min-w-4 before:flex-1 before:bg-frame after:h-px after:min-w-4 after:flex-1 after:bg-frame forced-colors:before:bg-[CanvasText] forced-colors:after:bg-[CanvasText]',
      },
    },
    defaultVariants: {variant: 'default'},
  },
);

type DividerReason = 'compaction' | 'interrupted' | 'handoff' | 'day';
const reasonLabel: Partial<Record<DividerReason, string>> = {compaction: 'Context compacted', interrupted: 'Interrupted'};
const reasonIcon = {compaction: CollapseAll, interrupted: StopOutline} as const;

type MessageDividerProps = useRender.ComponentProps<'div'> & VariantProps<typeof dividerVariants> & {
  reason?: DividerReason;
  kind?: Kind;
  labels?: Partial<Record<DividerReason, string>>;
};

function MessageDivider({className, variant, reason, kind, labels, render, children, ...props}: MessageDividerProps) {
  const reasonText = reason ? (labels?.[reason] ?? reasonLabel[reason]) : undefined;
  const toPerson = reason === 'handoff' && !kind;
  const v = variant ?? (toPerson ? 'ink' : reason ? 'separator' : 'default');
  const glyph = reason === 'compaction' || reason === 'interrupted' ? reasonIcon[reason] : undefined;
  const text = children ?? reasonText ?? null;
  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(
      {
        role: 'separator',
        className: cn(dividerVariants({variant: v}), className),
        children: v === 'ink'
          ? <InkSlot data-slot="message-divider-content" className="min-w-0 truncate">{text}</InkSlot>
          : <>
              {kind && <Badge kind={kind} data-slot="message-divider-kind"/>}
              {glyph && <span data-slot="message-divider-icon" aria-hidden className="inline-flex size-4 shrink-0 items-center justify-center text-text-3"><Icon icon={glyph} size={16}/></span>}
              <span data-slot="message-divider-content" className="min-w-0 shrink break-words">{text}</span>
            </>,
      },
      {'data-kind': kind, 'data-reason': reason, 'data-variant': v, 'aria-label': typeof children === 'string' ? children : reasonText} as React.ComponentProps<'div'>,
      props,
    ),
    render,
    state: {slot: 'message-divider', variant: v},
  });
}

function MessageDividerIcon({className, ...props}: React.ComponentProps<'span'>) {
  return <span data-slot="message-divider-icon" aria-hidden className={cn('inline-flex size-4 shrink-0 items-center justify-center text-text-3', className)} {...props}/>;
}

export {
  MessageGroup, Message, AgentTurn, MessageAvatar, MessageAgentAvatar, MessageContent, MessageHeader, MessageMeta, MessageTime, MessageModel, MessageStatus, MessageFooter, MessageWorked,
  MessageBubble, MessageBubbleContent, MessageReactions, MessageSendState, MessageDivider, MessageDividerIcon,
  messageVariants, bubbleVariants, dividerVariants,
  type MessageProps, type MessageStatusProps, type MessageStatusLabels, type MessageWorkedLabels, type MessageSendStateLabels, type MessageBubbleProps, type MessageDividerProps, type DividerReason,
};
