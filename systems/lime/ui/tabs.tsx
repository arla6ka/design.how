'use client';

import {Tabs as TabsPrimitive} from '@base-ui/react/tabs';
import {mergeClass} from '../lib/utils';

function Tabs({className, ...props}: TabsPrimitive.Root.Props) {
  return <TabsPrimitive.Root data-slot="tabs" className={mergeClass('flex flex-col gap-4', className)} {...props}/>;
}

function TabsList({className, children, ...props}: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List data-slot="tabs-list" className={mergeClass('relative flex w-full items-center gap-1 border-b border-line', className)} {...props}>
      {children}
      <TabsPrimitive.Indicator data-slot="tabs-indicator" className="absolute left-(--active-tab-left) -bottom-px h-0.5 w-(--active-tab-width) rounded-full bg-ink transition-[left,width] duration-(--dur-base) ease-(--ease-out)"/>
    </TabsPrimitive.List>
  );
}

function TabsTrigger({className, children, ...props}: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={mergeClass([
        'relative inline-flex h-(--control-md) max-w-48 min-w-0 items-center justify-center gap-1.5 rounded-t-md px-3 text-sm font-medium whitespace-nowrap text-fg-3 select-none',
        'transition-colors duration-(--dur-instant) hover:not-data-disabled:text-fg data-active:text-fg data-disabled:cursor-not-allowed data-disabled:text-fg-disabled focus-visible:-outline-offset-2',
      ], className)}
      {...props}
    >
      {typeof children === 'string' ? <span className="truncate">{children}</span> : children}
    </TabsPrimitive.Tab>
  );
}

function TabsContent({className, ...props}: TabsPrimitive.Panel.Props) {
  return <TabsPrimitive.Panel data-slot="tabs-content" className={className} {...props}/>;
}

export {Tabs, TabsList, TabsTrigger, TabsContent};
