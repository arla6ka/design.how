'use client';

import {createContext, useContext, type ReactNode} from 'react';
import {Collapsible as CollapsiblePrimitive} from '@base-ui/react/collapsible';
import {Accordion as AccordionPrimitive} from '@base-ui/react/accordion';
import {cn} from '../lib/utils';
import {Icon, ChevronRight} from '../icon';

type GroupContextValue = {variant: 'framed' | 'plain'; size: 'default' | 'lg'};
const GroupContext = createContext<GroupContextValue | null>(null);

type CollapsibleProps = CollapsiblePrimitive.Root.Props & {
  value?: AccordionPrimitive.Item.Props['value'];
};

function Collapsible({className, value, ...props}: CollapsibleProps) {
  const group = useContext(GroupContext);
  if (group) return <AccordionPrimitive.Item
    data-slot="collapsible"
    value={value}
    className={cn(
      'group-data-[variant=framed]/collapsible-group:shadow-[inset_0_-1px_0_var(--line-row)] group-data-[variant=framed]/collapsible-group:last:shadow-none',
      'group-data-[variant=plain]/collapsible-group:not-first:rule-top',
      className as string,
    )}
    {...(props as AccordionPrimitive.Item.Props)}
  />;
  return <CollapsiblePrimitive.Root data-slot="collapsible" className={cn('flex flex-col', className as string)} {...props}/>;
}

type GroupProps = Omit<AccordionPrimitive.Root.Props, 'multiple'> & {
  /** framed: one frame with a row per section (an inspector, settings, FAQ). plain: row rules only, for a group inside a frame. `fields` is a @deprecated alias of framed. */
  variant?: 'framed' | 'plain' | 'fields';
  size?: 'default' | 'lg';
  multiple?: boolean;
};

function CollapsibleGroup({className, variant: asked = 'framed', size = 'default', multiple = false, ...props}: GroupProps) {
  const variant = asked === 'fields' ? 'framed' : asked;
  return <GroupContext.Provider value={{variant, size}}>
    <AccordionPrimitive.Root
      data-slot="collapsible-group"
      data-variant={variant}
      data-size={size}
      multiple={multiple}
      className={cn('group/collapsible-group flex w-full flex-col', variant === 'framed' && 'relative overflow-hidden bg-page frame', className as string)}
      {...props}
    />
  </GroupContext.Provider>;
}

type TriggerProps = CollapsiblePrimitive.Trigger.Props & {
  caret?: boolean;
  size?: 'sm' | 'default' | 'row';
  summary?: ReactNode;
  summaryStatus?: 'warn' | 'fail';
};

function Summary({children, status, wrap}: {children: ReactNode; status?: 'warn' | 'fail'; wrap?: boolean}) {
  return <span
    data-slot="collapsible-summary"
    data-status={status}
    className={cn('flex min-w-0 items-center gap-1.5 type-label-sm data group-data-panel-open/collapsible-trigger:hidden', status === 'fail' ? 'text-fail-text' : status === 'warn' ? 'text-warn-text' : 'text-text-3')}
  >
    <span className={cn('min-w-0', wrap ? '[overflow-wrap:anywhere]' : 'truncate')}>{children}</span>
  </span>;
}

function CollapsibleTrigger({className, children, caret = true, size = 'default', summary, summaryStatus, ...props}: TriggerProps) {
  const group = useContext(GroupContext);
  if (group) return <AccordionPrimitive.Header data-slot="collapsible-header" className="flex">
    <AccordionPrimitive.Trigger
      data-slot="collapsible-trigger"
      className={cn(
        'group/collapsible-trigger flex flex-1 items-center gap-3 rounded-none px-4 py-2 text-start text-text-1',
        'min-h-(--row) type-label hover:not-data-disabled:bg-hover data-disabled:cursor-not-allowed data-disabled:text-text-disabled',
        'transition-colors duration-(--dur-fast) ease-(--ease-step)',
        'group-data-[size=lg]/collapsible-group:px-6 group-data-[size=lg]/collapsible-group:py-5 group-data-[size=lg]/collapsible-group:type-heading-sm',
        'group-data-[variant=plain]/collapsible-group:px-0 group-data-[variant=plain]/collapsible-group:hover:not-data-disabled:bg-transparent',
        'focus-visible:focus-ring-inset',
        className as string,
      )}
      {...(props as AccordionPrimitive.Trigger.Props)}
    >
      {caret && <CollapsibleCaret/>}
      <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <span className="min-w-0">{children}</span>
        {summary && <Summary status={summaryStatus} wrap>{summary}</Summary>}
      </span>
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>;
  return <CollapsiblePrimitive.Trigger
    data-slot="collapsible-trigger"
    data-size={size}
    className={cn(
      'group/collapsible-trigger inline-flex max-w-full items-center gap-3 self-start rounded-soft px-2 text-start text-text-1',
      'hover:not-data-disabled:bg-hover data-disabled:cursor-not-allowed data-disabled:text-text-disabled',
      size === 'sm' ? 'min-h-(--control-sm) type-label-sm' : size === 'row' ? 'min-h-(--row) w-full max-w-none self-stretch px-3 type-label text-text-3' : 'min-h-(--control) type-label',
      className as string,
    )}
    {...props}
  >
    {caret && <CollapsibleCaret/>}
    {children}
    {summary && <Summary status={summaryStatus}>{summary}</Summary>}
  </CollapsiblePrimitive.Trigger>;
}

function CollapsibleCaret({className}: {className?: string}) {
  return <Icon
    icon={ChevronRight}
    size={12}
    data-slot="collapsible-caret"
    className={cn('shrink-0 text-text-3 transition-none rtl:-scale-x-100 group-data-panel-open/collapsible-trigger:rotate-90 rtl:group-data-panel-open/collapsible-trigger:-rotate-90', className)}
  />;
}

function CollapsibleContent({className, children, ...props}: CollapsiblePrimitive.Panel.Props) {
  const group = useContext(GroupContext);
  if (group) return <AccordionPrimitive.Panel
    hiddenUntilFound
    data-slot="collapsible-content"
    className="overflow-hidden"
    {...(props as AccordionPrimitive.Panel.Props)}
  >
    <div className={cn(
      'max-w-(--measure) ps-10 pe-4 pb-4 type-body-sm text-text-2 group-data-[size=lg]/collapsible-group:ps-12 group-data-[size=lg]/collapsible-group:pe-6 group-data-[size=lg]/collapsible-group:pb-6 group-data-[size=lg]/collapsible-group:type-body-lg',
      'group-data-[variant=plain]/collapsible-group:ps-6',
      '[&_a]:text-text-1 [&_a]:underline [&_a]:decoration-1 [&_a]:underline-offset-4 [&_p:not(:last-child)]:mb-3',
      className as string,
    )}>{children}</div>
  </AccordionPrimitive.Panel>;
  return <CollapsiblePrimitive.Panel
    data-slot="collapsible-content"
    className={cn(
      'overflow-hidden',
      className as string,
    )}
    {...props}
  >{children}</CollapsiblePrimitive.Panel>;
}

export {Collapsible, CollapsibleGroup, CollapsibleTrigger, CollapsibleCaret, CollapsibleContent, type CollapsibleProps, type TriggerProps as CollapsibleTriggerProps};
