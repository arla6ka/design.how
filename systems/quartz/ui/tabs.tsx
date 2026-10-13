'use client';

import {createPortal} from 'react-dom';
import {createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, useMemo, type DragEvent, type KeyboardEvent, type ReactNode} from 'react';
import {Tabs as TabsPrimitive} from '@base-ui/react/tabs';
import {cva, type VariantProps} from 'class-variance-authority';
import {cn, mergeClass, mergeRefs} from '../lib/utils';
import {cssNumber} from '../lib/css-var';
import type {Kind} from '../lib/kind';
import {Icon, Close} from '../icon';

type DocumentContextValue = {
  onClose?: (value: string) => void;
  reorder: (value: string, by: -1 | 1) => void;
  dragging: string | null;
  setDragging: (value: string | null) => void;
  drop: (target: string) => void;
  over: string | null;
  setOver: (value: string | null) => void;
  canReorder: boolean;
  closeSlot: HTMLElement | null;
};

const DocumentContext = createContext<DocumentContextValue | null>(null);

const SelectedContext = createContext<unknown>(undefined);

function Tabs({className, orientation = 'horizontal', value, defaultValue, onValueChange, ...props}: TabsPrimitive.Root.Props) {
  const [inner, setInner] = useState<unknown>(defaultValue);
  return <SelectedContext.Provider value={value !== undefined ? value : inner}>
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      orientation={orientation}
      value={value}
      defaultValue={defaultValue}
      onValueChange={(next, details) => { setInner(next); onValueChange?.(next, details); }}
      className={mergeClass('group/tabs flex max-w-full min-w-0 gap-3 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:has-[[data-slot=tabs-list][data-variant=default]]:gap-0', className)}
      {...props}
    />
  </SelectedContext.Provider>;
}

const tabsListVariants = cva(
  'group/tabs-list relative flex w-fit max-w-full min-w-0 items-center overflow-x-auto [scrollbar-width:none] group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col group-data-[orientation=vertical]/tabs:items-stretch group-data-[orientation=vertical]/tabs:overflow-visible',
  {
    variants: {
      variant: {
        default: 'gap-0 group-data-[orientation=horizontal]/tabs:w-full group-data-[orientation=horizontal]/tabs:rule-row-frame group-data-[orientation=vertical]/tabs:gap-0.5',
        line: 'gap-1 group-data-[orientation=horizontal]/tabs:shadow-[inset_0_-1px_0_var(--line-row)] group-data-[orientation=vertical]/tabs:shadow-[inset_-1px_0_0_var(--line-row)] rtl:group-data-[orientation=vertical]/tabs:shadow-[inset_1px_0_0_var(--line-row)]',
        document: 'min-h-(--control) flex-1 gap-0',
      },
      size: {
        sm: '',
        default: '',
      },
    },
    defaultVariants: {variant: 'default', size: 'default'},
  },
);

type TabsListProps = TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants> & {
  onClose?: (value: string) => void;
  onReorder?: (values: string[]) => void;
  actions?: ReactNode;
  activateOnFocus?: boolean;
};

function TabsList({className, variant = 'default', size = 'default', children, onClose, onReorder, actions, activateOnFocus, ref, ...props}: TabsListProps) {
  const list = useRef<HTMLDivElement>(null);
  const listRefs = useMemo(() => mergeRefs(list, ref), [ref]);
  const [overflow, setOverflow] = useState<{start: boolean; end: boolean}>({start: false, end: false});
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [closeSlot, setCloseSlot] = useState<HTMLElement | null>(null);

  const measure = useCallback(() => {
    const el = list.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const pos = Math.abs(el.scrollLeft);
    setOverflow({start: max > 1 && pos > 1, end: max > 1 && pos < max - 1});
  }, []);

  useLayoutEffect(() => {
    const el = list.current;
    if (!el) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    for (const child of el.children) ro.observe(child);
    el.addEventListener('scroll', measure, {passive: true});
    return () => { ro.disconnect(); el.removeEventListener('scroll', measure); };
  }, [measure, children]);

  useEffect(() => {
    const el = list.current;
    if (!el) return;
    const show = () => {
      const trigger = el.querySelector<HTMLElement>('[data-slot=tabs-trigger][data-active]');
      if (!trigger) return;
      const chip = trigger.closest<HTMLElement>('[data-slot=tabs-document-tab]') ?? trigger;
      const pad = cssNumber(el, '--fade-edge', 24);
      const list = el.getBoundingClientRect();
      const box = chip.getBoundingClientRect();
      if (box.left < list.left + pad) el.scrollBy({left: box.left - list.left - pad});
      else if (box.right > list.right - pad) el.scrollBy({left: box.right - list.right + pad});
      const v = el.getBoundingClientRect(), c = chip.getBoundingClientRect();
      if (c.top < v.top || c.bottom > v.bottom) chip.scrollIntoView({block: 'nearest', inline: 'nearest'});
    };
    show();
    const mo = new MutationObserver(records => { if (records.some(r => r.attributeName === 'data-active' && (r.target as HTMLElement).hasAttribute('data-active'))) show(); });
    mo.observe(el, {subtree: true, attributes: true, attributeFilter: ['data-active']});
    return () => mo.disconnect();
  }, []);

  const order = () => [...(list.current?.querySelectorAll<HTMLElement>('[data-slot=tabs-trigger]') ?? [])].map(t => ({value: t.dataset.value ?? '', pinned: t.hasAttribute('data-pinned')}));

  const reorder = useCallback((value: string, by: -1 | 1) => {
    if (!onReorder) return;
    const all = order();
    const item = all.find(t => t.value === value);
    if (!item) return;
    const group = all.filter(t => t.pinned === item.pinned);
    const at = group.findIndex(t => t.value === value);
    const to = at + by;
    if (to < 0 || to >= group.length) return;
    [group[at], group[to]] = [group[to], group[at]];
    const others = all.filter(t => t.pinned !== item.pinned);
    onReorder((item.pinned ? [...group, ...others] : [...others, ...group]).map(t => t.value));
    requestAnimationFrame(() => list.current?.querySelector<HTMLElement>(`[data-slot=tabs-trigger][data-value="${CSS.escape(value)}"]`)?.focus());
  }, [onReorder]);

  const drop = useCallback((target: string) => {
    setOver(null);
    if (!onReorder || !dragging || dragging === target) return;
    const all = order();
    const from = all.find(t => t.value === dragging);
    const to = all.find(t => t.value === target);
    if (!from || !to || from.pinned !== to.pinned) return;
    const values = all.map(t => t.value).filter(v => v !== dragging);
    const fromAt = all.findIndex(t => t.value === dragging);
    const toAt = all.findIndex(t => t.value === target);
    values.splice(values.indexOf(target) + (fromAt < toAt ? 1 : 0), 0, dragging);
    onReorder(values);
  }, [onReorder, dragging]);

  const fade = overflow.start && overflow.end ? 'both' : overflow.start ? 'start' : overflow.end ? 'end' : undefined;
  const scroller = <TabsPrimitive.List
    ref={listRefs}
    data-slot="tabs-list"
    activateOnFocus={activateOnFocus ?? variant !== 'document'}
    data-variant={variant}
    data-size={size}
    data-overflow-start={overflow.start || undefined}
    data-overflow-end={overflow.end || undefined}
    data-fade={fade}
    className={mergeClass([tabsListVariants({variant, size}), 'fade-x [--fade-from:left] [--fade-to:right] rtl:[--fade-from:right] rtl:[--fade-to:left]'], className)}
    {...props}
  >
    {children}
    {variant === 'line' && <TabsPrimitive.Indicator
      data-slot="tabs-indicator"
      className={cn(
        'absolute bg-ink transition-[left,top,width,height] duration-(--dur-fast) ease-(--ease-step) motion-reduce:transition-none forced-colors:bg-[Highlight]',
        'group-data-[orientation=horizontal]/tabs:bottom-0 group-data-[orientation=horizontal]/tabs:left-(--active-tab-left) group-data-[orientation=horizontal]/tabs:h-(--line-accent) group-data-[orientation=horizontal]/tabs:w-(--active-tab-width)',
        'group-data-[orientation=vertical]/tabs:end-0 group-data-[orientation=vertical]/tabs:top-(--active-tab-top) group-data-[orientation=vertical]/tabs:h-(--active-tab-height) group-data-[orientation=vertical]/tabs:w-(--line-accent)',
      )}
    />}
  </TabsPrimitive.List>;

  if (variant !== 'document' && !actions) return scroller;
  return <DocumentContext.Provider value={variant === 'document' ? {onClose, reorder, dragging, setDragging, drop, over, setOver, canReorder: !!onReorder, closeSlot} : null}>
    <div data-slot="tabs-frame" data-variant={variant} className={cn('flex max-w-full min-w-0 items-center gap-0.5', variant === 'document' && 'min-h-(--control) items-stretch rule-row-frame')}>
      {scroller}
      {variant === 'document' && onClose && <span ref={setCloseSlot} data-slot="tabs-close-slot" className="contents"/>}
      {actions && <div data-slot="tabs-actions" className="flex shrink-0 items-center ps-1 pe-0.5 rule-col">{actions}</div>}
    </div>
  </DocumentContext.Provider>;
}

type TabsTriggerProps = TabsPrimitive.Tab.Props & {
  kind?: Kind;
  pinned?: boolean;
  dirty?: boolean;
  label?: string;
  icon?: ReactNode;
};

function TabsTrigger({className, children, kind, pinned, dirty, label, icon, value, title, onKeyDown, ...props}: TabsTriggerProps) {
  const doc = useContext(DocumentContext);
  const name = label ?? (typeof children === 'string' ? children : String(value));
  const closable = !!doc?.onClose && !pinned;
  const selected = useContext(SelectedContext) === value;

  const keyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (doc) {
      if (event.altKey && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
        event.preventDefault();
        event.stopPropagation();
        const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
        const left = event.key === 'ArrowLeft';
        doc.reorder(String(value), left !== rtl ? -1 : 1);
        return;
      }
      if ((event.key === 'Delete' || event.key === 'Backspace') && closable) {
        event.preventDefault();
        const list = event.currentTarget.closest('[data-slot=tabs-list]');
        doc.onClose?.(String(value));
        requestAnimationFrame(() => list?.querySelector<HTMLElement>('[data-slot=tabs-trigger][data-active]')?.focus());
        return;
      }
    }
    onKeyDown?.(event as never);
  };

  const dragProps = doc?.canReorder ? {
    draggable: true,
    onDragStart: (e: DragEvent) => { doc.setDragging(String(value)); e.dataTransfer.effectAllowed = 'move'; },
    onDragEnd: () => { doc.setDragging(null); doc.setOver(null); },
    onDragOver: (e: DragEvent) => { if (doc.dragging) { e.preventDefault(); doc.setOver(String(value)); } },
    onDragLeave: () => doc.setOver(null),
    onDrop: (e: DragEvent) => { e.preventDefault(); doc.drop(String(value)); },
  } : {};

  const triggerClass = cn(
    'group/tab relative inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap select-none type-label text-text-2',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
    'group-data-[orientation=vertical]/tabs:justify-start',
    'group-data-[variant=default]/tabs-list:min-h-(--control) group-data-[variant=default]/tabs-list:rounded-t-soft group-data-[variant=default]/tabs-list:px-3',
    'group-data-[size=sm]/tabs-list:group-data-[variant=default]/tabs-list:min-h-(--control-sm) group-data-[size=sm]/tabs-list:group-data-[variant=default]/tabs-list:px-2.5 group-data-[size=sm]/tabs-list:type-label-sm',
    'group-data-[variant=default]/tabs-list:data-active:bg-page group-data-[variant=default]/tabs-list:hover:not-data-disabled:not-data-active:bg-hover',
    'group-data-[orientation=horizontal]/tabs:group-data-[variant=default]/tabs-list:data-active:shadow-[inset_1px_0_0_var(--line-frame),inset_-1px_0_0_var(--line-frame),inset_0_1px_0_var(--line-frame)]',
    'group-data-[orientation=vertical]/tabs:group-data-[variant=default]/tabs-list:rounded-soft group-data-[orientation=vertical]/tabs:group-data-[variant=default]/tabs-list:data-active:bg-accent-wash group-data-[orientation=vertical]/tabs:group-data-[variant=default]/tabs-list:data-active:shadow-[inset_0_0_0_1px_var(--line-frame)]',
    'group-data-[variant=line]/tabs-list:min-h-(--control) group-data-[variant=line]/tabs-list:px-2 group-data-[size=sm]/tabs-list:group-data-[variant=line]/tabs-list:min-h-(--control-sm)',
    'group-data-[variant=line]/tabs-list:rounded-soft',
    'data-disabled:cursor-not-allowed data-disabled:text-text-disabled',
    'data-active:text-text-1 hover:not-data-disabled:text-text-1',
    'transition-[background-color,color,box-shadow] duration-(--dur-fast) ease-(--ease-step) focus-visible:focus-ring-inset',
    'forced-colors:data-active:outline forced-colors:data-active:outline-1',
  );

  if (!doc) return <TabsPrimitive.Tab
    data-slot="tabs-trigger"
    data-value={String(value)}
    data-kind={kind}
    value={value}
    title={title}
    onKeyDown={keyDown}
    className={mergeClass(triggerClass, className)}
    {...props}
  >{children}</TabsPrimitive.Tab>;

  const close = (from: HTMLElement) => {
    const list = from.closest('[data-slot=tabs-frame], [data-slot=tabs-list]');
    doc.onClose?.(String(value));
    requestAnimationFrame(() => list?.querySelector<HTMLElement>('[data-slot=tabs-trigger][data-active]')?.focus());
  };
  const namedClose = closable && selected && doc.closeSlot ? createPortal(<button
    type="button"
    data-slot="tabs-close-selected"
    aria-label={`Close ${name}${dirty ? ', unsaved changes' : ''}`}
    onClick={event => close(event.currentTarget)}
    className={cn(
      'grid size-(--control-xs) shrink-0 place-items-center rounded-inner text-text-2 hover:bg-pressed hover:text-text-1 pointer-coarse:size-(--control)',
      'pointer-fine:not-[:focus-visible]:sr-only',
    )}
  ><Icon icon={Close} size={16}/></button>, doc.closeSlot) : null;
  return <div
    role="presentation"
    data-slot="tabs-document-tab"
    data-kind={kind}
    data-pinned={pinned || undefined}
    data-dirty={dirty || undefined}
    data-dragging={doc.dragging === String(value) || undefined}
    data-over={doc.over === String(value) || undefined}
    onAuxClick={event => { if (event.button === 1 && closable) { event.preventDefault(); doc.onClose?.(String(value)); } }}
    {...dragProps}
    className={cn(
      'group/tab relative inline-flex max-w-(--tab-max) shrink-0 items-center self-stretch rounded-t-soft text-text-2',
      'has-data-active:bg-page has-data-active:text-text-1 has-data-active:shadow-[inset_1px_0_0_var(--line-frame),inset_-1px_0_0_var(--line-frame),inset_0_1px_0_var(--line-frame)] hover:not-has-data-disabled:not-has-data-active:bg-hover hover:not-has-data-disabled:text-text-1',
      'data-pinned:w-8 data-dragging:opacity-40 data-over:shadow-[inset_0_0_0_1px_var(--ink)]',
      'forced-colors:has-data-active:outline forced-colors:has-data-active:outline-1',
    )}
  >
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      data-value={String(value)}
      data-pinned={pinned || undefined}
      value={value}
      title={title ?? name}
      aria-keyshortcuts={closable ? 'Delete' : undefined}
      onKeyDown={keyDown}
      className={mergeClass([
        'relative inline-flex min-w-0 flex-1 items-center gap-2 self-stretch rounded-t-soft whitespace-nowrap select-none type-label text-inherit',
        '[&_svg]:pointer-events-none [&_svg]:shrink-0',
        pinned ? 'justify-center' : closable ? 'ps-3' : 'ps-3 pe-3',
        'data-disabled:cursor-not-allowed data-disabled:text-text-disabled',
        'focus-visible:focus-ring-inset',
      ], className)}
      {...props}
    >
      {icon}
      {pinned ? <span className="sr-only">{name}, pinned</span> : <span data-slot="tabs-label" className="min-w-0 truncate">{children}</span>}
      {dirty && <span className="sr-only">, unsaved changes</span>}
      {pinned && dirty && <span aria-hidden className="absolute end-1 top-1 size-1.5 bg-ink"/>}
    </TabsPrimitive.Tab>
    {closable && <span className="relative ms-1 me-1 grid size-(--control-xs) shrink-0 place-items-center">
      {dirty && <span aria-hidden data-slot="tabs-dirty" className="size-2 bg-ink pointer-fine:group-hover/tab:invisible pointer-fine:group-has-focus-visible/tab:invisible"/>}
      <button
        type="button"
        aria-hidden
        title={`Close ${name}`}
        data-slot="tabs-close"
        tabIndex={-1}
        onClick={event => close(event.currentTarget)}
        className={cn(
          'absolute inset-0 grid place-items-center rounded-inner text-text-2 hover:bg-pressed hover:text-text-1',
          selected && dirty && 'pointer-events-none opacity-0 group-hover/tab:pointer-events-auto group-hover/tab:opacity-100 group-has-focus-visible/tab:pointer-events-auto group-has-focus-visible/tab:opacity-100',
          !selected && 'invisible group-hover/tab:visible',
          'pointer-coarse:hidden',
        )}
      ><Icon icon={Close} size={16}/></button>
    </span>}
    {namedClose}
  </div>;
}

function TabsContent({className, ...props}: TabsPrimitive.Panel.Props) {
  return <TabsPrimitive.Panel
    data-slot="tabs-content"
    className={mergeClass([
      'min-w-0 flex-1 type-body text-text-1 focus-visible:rounded-soft',
      'group-data-[orientation=horizontal]/tabs:group-has-[[data-slot=tabs-list][data-variant=default]]/tabs:rounded-b-frame group-data-[orientation=horizontal]/tabs:group-has-[[data-slot=tabs-list][data-variant=default]]/tabs:p-4',
      'group-data-[orientation=horizontal]/tabs:group-has-[[data-slot=tabs-list][data-variant=default]]/tabs:shadow-[inset_1px_0_0_var(--line-frame),inset_-1px_0_0_var(--line-frame),inset_0_-1px_0_var(--line-frame)]',
    ], className)}
    {...props}
  />;
}

function TabsCount({className, ...props}: React.ComponentProps<'span'>) {
  return <span data-slot="tabs-count" className={cn('type-label-sm text-text-3 data', className)} {...props}/>;
}

export {Tabs, TabsList, TabsTrigger, TabsContent, TabsCount, tabsListVariants, type TabsListProps, type TabsTriggerProps};
