'use client';

import {Avatar as AvatarPrimitive} from '@base-ui/react/avatar';
import {Children, createContext, isValidElement, useContext, type ReactElement} from 'react';
import {cva, type VariantProps} from 'class-variance-authority';
import {Icon, Bot, Globe} from '../icon';
import {TextHint} from './truncate';
import {cn, mergeClass} from '../lib/utils';

const avatarVariants = cva(
  [
    'group/avatar relative inline-flex shrink-0 select-none',
    'after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:border after:border-line after:content-[""]',
  ],
  {
    variants: {
      size: {
        xs: 'size-4',
        sm: 'size-5',
        default: 'size-6',
        lg: 'size-8',
      },
      type: {
        person: 'rounded-pill',
        agent: 'rounded-tag',
        source: 'rounded-tag',
      },
    },
    defaultVariants: {size: 'default', type: 'person'},
  },
);

type AvatarSize = NonNullable<VariantProps<typeof avatarVariants>['size']>;
type AvatarType = NonNullable<VariantProps<typeof avatarVariants>['type']>;

function initialsOf(name: string, size: AvatarSize = 'default') {
  const clean = name.replace(/^(https?:\/\/)?(www\.)?/i, '').split('@')[0];
  const words = clean.split(/[\s._\-/]+/).map(w => w.match(/[\p{L}\p{N}]/gu)?.join('') ?? '').filter(Boolean);
  if (!words.length) return '';
  if (size === 'xs' || size === 'sm') return [...words[0]][0].toUpperCase();
  if (words.length === 1) return [...words[0]].slice(0, 2).join('').toUpperCase();
  return ([...words[0]][0] + [...words[words.length - 1]][0]).toUpperCase();
}

const glyphSize: Record<AvatarSize, 12 | 14 | 16> = {xs: 12, sm: 12, default: 14, lg: 16};

const AvatarContext = createContext<{type: AvatarType; size: AvatarSize}>({type: 'person', size: 'default'});

type AvatarProps = AvatarPrimitive.Root.Props & VariantProps<typeof avatarVariants> & {
  name?: string;
  src?: string;
  decorative?: boolean;
};

function Avatar({className, size = 'default', type = 'person', name, src, decorative, children, ...props}: AvatarProps) {
  const px: AvatarSize = size ?? 'default';
  const kind: AvatarType = type ?? 'person';
  const labelled = !!name && !decorative;
  return <AvatarContext.Provider value={{type: kind, size: px}}><AvatarPrimitive.Root
    data-slot="avatar"
    data-size={px}
    data-type={kind}
    role={labelled ? 'img' : undefined}
    aria-label={labelled ? name : undefined}
    aria-hidden={decorative || undefined}
    className={mergeClass(avatarVariants({size: px, type: kind}), className)}
    {...props}
  >
    {children ?? <>
      {src && <AvatarImage src={src} alt="" referrerPolicy={kind === 'source' ? 'no-referrer' : undefined}/>}
      <AvatarFallback>{name && kind === 'person' ? initialsOf(name, px) || undefined : undefined}</AvatarFallback>
    </>}
  </AvatarPrimitive.Root></AvatarContext.Provider>;
}

function AvatarImage({className, ...props}: AvatarPrimitive.Image.Props) {
  return <AvatarPrimitive.Image
    data-slot="avatar-image"
    decoding="async"
    draggable={false}
    className={mergeClass('aspect-square size-full rounded-[inherit] object-cover group-data-[type=source]/avatar:object-contain', className)}
    {...props}
  />;
}

function AvatarFallback({className, children, ...props}: AvatarPrimitive.Fallback.Props) {
  return <AvatarPrimitive.Fallback
    data-slot="avatar-fallback"
    className={mergeClass([
      'flex size-full items-center justify-center overflow-hidden rounded-[inherit] bg-field pe-(--avatar-covered) type-label-sm leading-none text-text-1',
      'group-data-[type=agent]/avatar:text-text-2 group-data-[type=source]/avatar:text-text-2 group-data-[size=lg]/avatar:type-label',
      'forced-colors:border forced-colors:border-[CanvasText]',
    ], className)}
    {...props}
  >
    {children ?? <FallbackGlyph/>}
  </AvatarPrimitive.Fallback>;
}

function FallbackGlyph() {
  const {type, size} = useContext(AvatarContext);
  if (type === 'source') return <Icon icon={Globe} size={glyphSize[size]}/>;
  if (type === 'agent') return <Icon icon={Bot} size={glyphSize[size]}/>;
  return null;
}

const overlap: Record<AvatarSize, string> = {
  xs: '[--avatar-overlap:var(--space-0-5)]',
  sm: '[--avatar-overlap:var(--space-0-5)]',
  default: '[--avatar-overlap:var(--space-0-5)]',
  lg: '[--avatar-overlap:var(--space-1)]',
};
const countSize: Record<AvatarSize, string> = {xs: 'size-4 min-w-4', sm: 'size-5 min-w-5', default: 'size-6 min-w-6', lg: 'size-8 min-w-8'};

type AvatarGroupProps = React.ComponentProps<'div'> & {
  max?: number;
  label?: string;
  size?: AvatarSize;
};

function AvatarGroup({className, children, max = 4, label, size = 'default', ...props}: AvatarGroupProps) {
  const items = Children.toArray(children).filter(isValidElement) as ReactElement<{name?: string}>[];
  const shown = items.length > max ? items.slice(0, Math.max(1, max - 1)) : items;
  const hidden = items.slice(shown.length);
  return <div
    data-slot="avatar-group"
    data-size={size}
    role="list"
    aria-label={label}
    className={cn(
      'flex items-center [--avatar-cutout:var(--paper)] [&>*+*]:-ms-(--avatar-overlap)',
      '[&>*:not(:last-child)]:[--avatar-covered:calc(var(--avatar-overlap)+var(--space-0-5))]',
      overlap[size], className,
    )}
    {...props}
  >
    {shown.map((item, i) => <div key={item.key ?? i} role="listitem" className="relative flex rounded-pill outline-2 outline-(--avatar-cutout) has-data-[type=agent]:rounded-tag has-data-[type=source]:rounded-tag">{item}</div>)}
    {hidden.length > 0 && <AvatarGroupCount size={size} names={hidden.map(h => h.props.name).filter((n): n is string => !!n)}>{hidden.length}</AvatarGroupCount>}
  </div>;
}

function AvatarGroupCount({className, children, size = 'default', names = [], ...props}: React.ComponentProps<'div'> & {size?: AvatarSize; names?: string[]}) {
  const list = names.length ? names.join(', ') : undefined;
  const count = <div
    data-slot="avatar-group-count"
    role="listitem"
    tabIndex={list ? 0 : undefined}
    className={cn(
      'relative flex shrink-0 items-center justify-center rounded-pill bg-field px-1 type-label-sm leading-none text-text-1 data outline-2 outline-(--avatar-cutout)',
      countSize[size],
      className,
    )}
    {...props}
  >
    <span aria-hidden dir="ltr">+{children}</span>
    <span className="sr-only">and {children} more{list ? `: ${list}` : ''}</span>
  </div>;
  return list ? <TextHint content={list}>{count}</TextHint> : count;
}

export {Avatar, AvatarImage, AvatarFallback, AvatarGroup, AvatarGroupCount, avatarVariants, initialsOf, type AvatarProps, type AvatarSize, type AvatarType};
