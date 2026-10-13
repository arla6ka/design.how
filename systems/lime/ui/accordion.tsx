'use client';

import {Accordion as AccordionPrimitive} from '@base-ui/react/accordion';
import {ChevronDown, Icon} from '../icon';
import {mergeClass} from '../lib/utils';

function Accordion({className, ...props}: AccordionPrimitive.Root.Props) {
  return <AccordionPrimitive.Root data-slot="accordion" className={mergeClass('flex w-full flex-col', className)} {...props}/>;
}

function AccordionItem({className, ...props}: AccordionPrimitive.Item.Props) {
  return <AccordionPrimitive.Item data-slot="accordion-item" className={mergeClass('border-b border-line last:border-b-0', className)} {...props}/>;
}

function AccordionTrigger({className, children, ...props}: AccordionPrimitive.Trigger.Props) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={mergeClass('group/accordion-trigger flex flex-1 items-center justify-between gap-3 rounded-md py-4 text-start text-base font-medium underline-offset-4 hover:not-data-disabled:underline data-disabled:cursor-not-allowed data-disabled:text-fg-disabled', className)}
        {...props}
      >
        {children}
        <Icon icon={ChevronDown} size={20} className="text-fg-3 transition-transform duration-(--dur-fast) group-data-panel-open/accordion-trigger:rotate-180 group-data-disabled/accordion-trigger:text-fg-disabled"/>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({className, children, ...props}: AccordionPrimitive.Panel.Props) {
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      className={mergeClass('h-(--accordion-panel-height) overflow-hidden text-sm text-fg-2 transition-[height] duration-(--dur-base) ease-(--ease-out) data-ending-style:h-0 data-starting-style:h-0', className)}
      {...props}
    >
      <div className="pb-4">{children}</div>
    </AccordionPrimitive.Panel>
  );
}

export {Accordion, AccordionItem, AccordionTrigger, AccordionContent};
