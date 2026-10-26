'use client';

import {Children, cloneElement, createContext, isValidElement, useContext, useLayoutEffect, useMemo, useRef, useState, type ReactElement, type ReactNode} from 'react';
import {Tabs as TabsPrimitive} from '@base-ui/react/tabs';
import {cn, mergeClass, mergeRefs} from '../lib/utils';
import {tabBase, useActiveInView} from './tabs';

type Size = 'sm' | 'default';
const ListContext = createContext<{size: Size}>({size: 'default'});

function NumberedTabs({className, ...props}: Omit<TabsPrimitive.Root.Props, 'orientation'>) {
  return <TabsPrimitive.Root data-slot="numbered-tabs" className={mergeClass('flex max-w-full min-w-0 flex-col gap-4', className)} {...props}/>;
}

type NumberedTabsListProps = TabsPrimitive.List.Props & {size?: Size};

function NumberedTabsList({className, size = 'default', children, ref, ...props}: NumberedTabsListProps) {
  const list = useRef<HTMLDivElement>(null);
  const refs = useMemo(() => mergeRefs(list, ref), [ref]);
  useActiveInView(list, 'numbered-tabs-trigger');
  const ctx = useMemo(() => ({size}), [size]);
  let n = 0;
  const numbered = Children.map(children as ReactNode, child => {
    if (!isValidElement(child)) return child;
    n += 1;
    const el = child as ReactElement<NumberedTabsTriggerProps>;
    return el.props.index === undefined ? cloneElement(el, {index: n}) : el;
  });
  return <ListContext.Provider value={ctx}>
    <TabsPrimitive.List
      ref={refs}
      data-slot="numbered-tabs-list"
      data-size={size}
      className={mergeClass('relative flex w-full max-w-full min-w-0 items-stretch overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden after:min-w-0 after:flex-1 after:border-b after:border-line', className)}
      {...props}
    >{numbered}</TabsPrimitive.List>
  </ListContext.Provider>;
}

type NumberedTabsTriggerProps = TabsPrimitive.Tab.Props & {
  index?: number;
};

const sizes: Record<Size, string> = {
  sm: 'h-[max(var(--control),calc(1lh+var(--space-2)))] px-3 type-label-sm',
  default: 'h-[max(var(--row),calc(1lh+var(--space-2)))] px-3 type-label',
};

function NumberedTabsTrigger({className, index = 1, children, ...props}: NumberedTabsTriggerProps) {
  const {size} = useContext(ListContext);
  return <TabsPrimitive.Tab
    data-slot="numbered-tabs-trigger"
    className={mergeClass([tabBase, sizes[size], 'data-active:after:bg-accent-fill'], className)}
    {...props}
  >
    <span data-slot="numbered-tabs-index" className="bracketed data text-text-3 in-data-active:text-accent-text in-data-disabled:text-text-disabled">{String(index).padStart(2, '0')}</span>
    <span className="min-w-0">{children}</span>
  </TabsPrimitive.Tab>;
}

function NumberedTabsContent({className, keepMounted = true, ...props}: TabsPrimitive.Panel.Props) {
  return <TabsPrimitive.Panel
    keepMounted={keepMounted}
    data-slot="numbered-tabs-content"
    className={mergeClass('min-w-0 flex-1 type-body-sm text-text-1 focus-visible:focus-ring-inset', className)}
    {...props}
  />;
}

function NumberedTabsPanels({className, children, ...props}: React.ComponentProps<'div'>) {
  const inner = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();
  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setHeight(el.offsetHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return <div
    data-slot="numbered-tabs-panels"
    className={cn('min-w-0 overflow-hidden transition-[height] duration-(--dur-wipe) ease-out', className)}
    style={{height}}
    {...props}
  >
    <div ref={inner}>{children}</div>
  </div>;
}

export {NumberedTabs, NumberedTabsList, NumberedTabsTrigger, NumberedTabsContent, NumberedTabsPanels, type NumberedTabsTriggerProps};
