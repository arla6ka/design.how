import {cva, type VariantProps} from 'class-variance-authority';
import {ChevronRight, Icon, type LimeIcon} from '../icon';
import {cn} from '../lib/utils';

const listVariants = cva('flex flex-col', {
  variants: {
    variant: {
      plain: '',
      grouped: 'overflow-hidden rounded-panel bg-surface',
    },
  },
  defaultVariants: {variant: 'plain'},
});

type ListProps = React.ComponentProps<'ul'> & VariantProps<typeof listVariants>;

function List({className, variant, ...props}: ListProps) {
  return <ul data-slot="list" data-variant={variant ?? 'plain'} role="list" className={cn(listVariants({variant}), 'group/list', className)} {...props}/>;
}

type ListItemProps = Omit<React.ComponentProps<'li'>, 'title' | 'onClick'> & {
  title: React.ReactNode;
  description?: React.ReactNode;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  chevron?: boolean;
  href?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  menu?: React.ReactNode;
};

const rowClass = cn(
  'relative flex w-full min-h-14 items-center gap-3 p-4 text-start',
  'focus-visible:-outline-offset-2',
  'after:absolute after:inset-x-4 after:bottom-0 after:h-px after:bg-line group-last/item:after:hidden',
);

const pressable = 'cursor-pointer transition-colors duration-(--dur-instant) hover:bg-surface-2 active:bg-surface-3';

function ListItem({title, description, leading, trailing, chevron, href, onClick, disabled, menu, className, ...props}: ListItemProps) {
  const showChevron = chevron ?? Boolean(href);
  const body = <>
    {leading && <span data-slot="list-leading" className="flex shrink-0">{leading}</span>}
    <span className="flex min-w-0 flex-1 flex-col">
      <span data-slot="list-title" className="truncate text-base leading-snug font-medium text-fg">{title}</span>
      {description && <span data-slot="list-description" className="truncate text-sm text-fg-3">{description}</span>}
    </span>
    {trailing && <span data-slot="list-trailing" className="flex shrink-0 items-center text-base text-fg tabular-nums">{trailing}</span>}
    {showChevron && <Icon icon={ChevronRight} size={16} className="-me-1 text-fg-3 rtl:-scale-x-100"/>}
  </>;
  const shape = cn(rowClass, leading && 'after:start-17', menu ? 'pe-14' : undefined);
  return (
    <li data-slot="list-item" className={cn('group/item', menu && 'relative', className)} {...props}>
      {href && !disabled
        ? <a data-slot="list-row" href={href} className={cn(shape, pressable)}>{body}</a>
        : onClick
          ? <button data-slot="list-row" type="button" onClick={onClick} disabled={disabled} className={cn(shape, pressable, 'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent')}>{body}</button>
          : <div data-slot="list-row" className={cn(shape, disabled && 'opacity-50')}>{body}</div>}
      {menu && <span data-slot="list-menu" className="absolute end-3 top-1/2 flex -translate-y-1/2">{menu}</span>}
    </li>
  );
}

const listIconVariants = cva('inline-flex size-10 shrink-0 items-center justify-center rounded-full', {
  variants: {
    tone: {
      neutral: 'bg-surface-2 text-fg',
      accent: 'bg-accent-wash text-fg',
      success: 'bg-success-tint text-success-text',
      danger: 'bg-danger-tint text-danger-text',
    },
  },
  defaultVariants: {tone: 'neutral'},
});

type ListIconProps = Omit<React.ComponentProps<'span'>, 'children'> & VariantProps<typeof listIconVariants> & {icon: LimeIcon};

function ListIcon({icon, tone, className, ...props}: ListIconProps) {
  return <span data-slot="list-icon" aria-hidden="true" className={cn(listIconVariants({tone}), className)} {...props}><Icon icon={icon} size={20}/></span>;
}

export {List, ListItem, ListIcon, listVariants, type ListProps, type ListItemProps, type ListIconProps};
