'use client';

import {createContext, useContext, useEffect, useMemo, useRef} from 'react';
import {Tabs as TabsPrimitive} from '@base-ui/react/tabs';
import {cva, type VariantProps} from 'class-variance-authority';
import {cn, controlHeight, mergeClass, mergeRefs} from '../lib/utils';

type Size = 'sm' | 'default';
const ListContext = createContext<{size: Size}>({size: 'default'});

function Tabs({className, ...props}: Omit<TabsPrimitive.Root.Props, 'orientation'>) {
  return <TabsPrimitive.Root data-slot="tabs" className={mergeClass('flex max-w-full min-w-0 flex-col gap-4', className)} {...props}/>;
}

const tabsListVariants = cva(
  'relative flex w-full max-w-full min-w-0 items-stretch overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden after:min-w-0 after:flex-1 after:border-b after:border-line',
  {
    variants: {size: {sm: '', default: ''}},
    defaultVariants: {size: 'default'},
  },
);

type TabsListProps = TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>;

function useActiveInView(list: React.RefObject<HTMLElement | null>, slot: string) {
  useEffect(() => {
    const el = list.current;
    if (!el) return;
    const show = () => {
      const tab = el.querySelector<HTMLElement>(`[data-slot=${slot}][data-active]`);
      if (!tab) return;
      const box = el.getBoundingClientRect(), t = tab.getBoundingClientRect();
      if (t.left < box.left) el.scrollBy({left: t.left - box.left});
      else if (t.right > box.right) el.scrollBy({left: t.right - box.right});
    };
    show();
    const mo = new MutationObserver(records => { if (records.some(r => (r.target as HTMLElement).hasAttribute('data-active'))) show(); });
    mo.observe(el, {subtree: true, attributes: true, attributeFilter: ['data-active']});
    return () => mo.disconnect();
  }, [list, slot]);
}

function TabsList({className, size = 'default', ref, ...props}: TabsListProps) {
  const list = useRef<HTMLDivElement>(null);
  const refs = useMemo(() => mergeRefs(list, ref), [ref]);
  const s = size ?? 'default';
  useActiveInView(list, 'tabs-trigger');
  const ctx = useMemo(() => ({size: s}), [s]);
  return <ListContext.Provider value={ctx}>
    <TabsPrimitive.List ref={refs} data-slot="tabs-list" data-size={s} className={mergeClass(tabsListVariants({size: s}), className)} {...props}/>
  </ListContext.Provider>;
}

const tabBase = cn(
  'relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 border-b border-line whitespace-nowrap select-none [-webkit-tap-highlight-color:transparent]',
  'text-text-2 hover:not-data-disabled:text-text-1 focus-visible:focus-ring-inset',
  '[&_svg]:pointer-events-none [&_svg]:size-(--icon) [&_svg]:shrink-0',
  'data-disabled:cursor-not-allowed data-disabled:text-text-disabled forced-colors:data-disabled:text-[GrayText]',
  'after:pointer-events-none after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-transparent',
  'data-active:text-text-1 forced-colors:data-active:after:bg-[Highlight]',
);

const tabSize: Record<Size, string> = {
  sm: `${controlHeight.sm} px-2.5 type-label-sm`,
  default: `${controlHeight.default} px-3 type-label`,
};

function TabsTrigger({className, ...props}: TabsPrimitive.Tab.Props) {
  const {size} = useContext(ListContext);
  return <TabsPrimitive.Tab
    data-slot="tabs-trigger"
    className={mergeClass([tabBase, tabSize[size], 'data-active:after:bg-text-1'], className)}
    {...props}
  />;
}

function TabsContent({className, ...props}: TabsPrimitive.Panel.Props) {
  return <TabsPrimitive.Panel
    data-slot="tabs-content"
    className={mergeClass('min-w-0 flex-1 type-body-sm text-text-1 focus-visible:focus-ring-inset', className)}
    {...props}
  />;
}

function TabsCount({className, ...props}: React.ComponentProps<'span'>) {
  return <span data-slot="tabs-count" className={cn('data text-text-3', className)} {...props}/>;
}

export {Tabs, TabsList, TabsTrigger, TabsContent, TabsCount, tabsListVariants, tabBase, useActiveInView, type TabsListProps};
