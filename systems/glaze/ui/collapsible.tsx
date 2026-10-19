'use client';

import {createContext, useContext, type ReactNode} from 'react';
import {Collapsible as CollapsiblePrimitive} from '@base-ui/react/collapsible';
import {Accordion as AccordionPrimitive} from '@base-ui/react/accordion';
import {cn} from '../lib/utils';
import {Icon, ChevronRight} from '../icon';

type GroupContextValue = {variant: 'framed' | 'plain'};
const GroupContext = createContext<GroupContextValue | null>(null);

type CollapsibleProps = CollapsiblePrimitive.Root.Props & {
  value?: AccordionPrimitive.Item.Props['value'];
};

function Collapsible({className, value, ...props}: CollapsibleProps) {
  const group = useContext(GroupContext);
  if (group) return <AccordionPrimitive.Item
    data-slot="collapsible"
    value={value}
    className={cn('rule-row', className as string)}
    {...(props as AccordionPrimitive.Item.Props)}
  />;
  return <CollapsiblePrimitive.Root data-slot="collapsible" className={cn('flex flex-col', className as string)} {...props}/>;
}

type GroupProps = Omit<AccordionPrimitive.Root.Props, 'multiple'> & {
  variant?: 'framed' | 'plain';
  multiple?: boolean;
};

function CollapsibleGroup({className, variant = 'framed', multiple = false, ...props}: GroupProps) {
  return <GroupContext.Provider value={{variant}}>
    <AccordionPrimitive.Root
      data-slot="collapsible-group"
      data-variant={variant}
      multiple={multiple}
      className={cn('group/collapsible-group flex w-full flex-col', variant === 'framed' && 'overflow-hidden rounded-overlay border border-line-faint bg-paper', className as string)}
      {...props}
    />
  </GroupContext.Provider>;
}

type TriggerProps = CollapsiblePrimitive.Trigger.Props & {
  caret?: boolean;
  size?: 'sm' | 'default';
  summary?: ReactNode;
  summaryStatus?: 'warn' | 'fail';
};

function Summary({children, status}: {children: ReactNode; status?: 'warn' | 'fail'}) {
  return <span
    data-slot="collapsible-summary"
    data-status={status}
    className={cn('min-w-0 truncate type-caption group-data-panel-open/collapsible-trigger:hidden', status === 'fail' ? 'text-fail-text' : status === 'warn' ? 'text-warn-text' : 'text-text-2')}
  >{children}</span>;
}

function CollapsibleTrigger({className, children, caret = true, size = 'default', summary, summaryStatus, ...props}: TriggerProps) {
  const group = useContext(GroupContext);
  if (group) return <AccordionPrimitive.Header data-slot="collapsible-header" className="flex">
    <AccordionPrimitive.Trigger
      data-slot="collapsible-trigger"
      className={cn(
        'group/collapsible-trigger flex min-h-(--row) flex-1 items-center gap-2 px-3 py-2 text-start type-label text-text-1',
        'hover:not-data-disabled:bg-hover data-disabled:cursor-not-allowed data-disabled:text-text-disabled',
        'focus-visible:focus-ring-inset',
        'group-data-[variant=plain]/collapsible-group:px-0 group-data-[variant=plain]/collapsible-group:hover:not-data-disabled:bg-transparent',
        className as string,
      )}
      {...(props as AccordionPrimitive.Trigger.Props)}
    >
      {caret && <CollapsibleCaret/>}
      <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="min-w-0">{children}</span>
        {summary && <Summary status={summaryStatus}>{summary}</Summary>}
      </span>
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>;
  return <CollapsiblePrimitive.Trigger
    data-slot="collapsible-trigger"
    data-size={size}
    className={cn(
      'group/collapsible-trigger inline-flex w-max max-w-full items-center gap-2 self-start rounded-pill text-start text-text-1',
      'hover:not-data-disabled:bg-hover active:not-data-disabled:bg-pressed data-disabled:cursor-not-allowed data-disabled:text-text-disabled',
      size === 'sm' ? 'min-h-(--control-sm) ps-2 pe-2.5 type-label-sm' : 'min-h-(--control) ps-2.5 pe-3 type-label',
      className as string,
    )}
    {...props}
  >
    {caret && <CollapsibleCaret/>}
    <span className="min-w-0 truncate">{children}</span>
    {summary && <Summary status={summaryStatus}>{summary}</Summary>}
  </CollapsiblePrimitive.Trigger>;
}

function CollapsibleCaret({className}: {className?: string}) {
  return <Icon
    icon={ChevronRight}
    size={12}
    data-slot="collapsible-caret"
    className={cn('shrink-0 text-text-3 transition-[rotate] duration-(--dur-state) ease-out rtl:-scale-x-100 group-data-panel-open/collapsible-trigger:rotate-90 rtl:group-data-panel-open/collapsible-trigger:-rotate-90', className)}
  />;
}

const panelMotion = 'overflow-hidden transition-opacity duration-(--dur-state) ease-out data-starting-style:opacity-0';

function CollapsibleContent({className, children, ...props}: CollapsiblePrimitive.Panel.Props) {
  const group = useContext(GroupContext);
  if (group) return <AccordionPrimitive.Panel
    hiddenUntilFound
    data-slot="collapsible-content"
    className={panelMotion}
    {...(props as AccordionPrimitive.Panel.Props)}
  >
    <div className={cn(
      'max-w-(--measure) ps-8 pe-3 pb-3 type-body-sm text-text-2 group-data-[variant=plain]/collapsible-group:ps-5',
      '[&_a]:text-text-1 [&_a]:underline [&_a]:decoration-1 [&_a]:underline-offset-4 [&_p:not(:last-child)]:mb-2',
      className as string,
    )}>{children}</div>
  </AccordionPrimitive.Panel>;
  return <CollapsiblePrimitive.Panel
    data-slot="collapsible-content"
    className={cn(panelMotion, className as string)}
    {...props}
  >{children}</CollapsiblePrimitive.Panel>;
}

export {Collapsible, CollapsibleGroup, CollapsibleTrigger, CollapsibleCaret, CollapsibleContent, type CollapsibleProps, type TriggerProps as CollapsibleTriggerProps};
