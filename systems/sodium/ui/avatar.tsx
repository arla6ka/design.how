'use client';

import {Avatar as AvatarPrimitive} from '@base-ui/react/avatar';
import {Children, createContext, isValidElement, useContext, type ReactElement} from 'react';
import {cva, type VariantProps} from 'class-variance-authority';
import {Icon, ServerDns} from '../icon';
import {cn, mergeClass} from '../lib/utils';

const avatarVariants = cva(
  [
    'group/avatar relative inline-flex shrink-0 select-none overflow-hidden bg-well',
    'after:pointer-events-none after:absolute after:inset-0 after:border after:border-line after:content-[""]',
    'forced-colors:after:border-[CanvasText]',
  ],
  {
    variants: {
      size: {
        sm: 'size-5',
        default: 'size-6',
        lg: 'size-8',
      },
    },
    defaultVariants: {size: 'default'},
  },
);

type AvatarSize = NonNullable<VariantProps<typeof avatarVariants>['size']>;
type AvatarType = 'person' | 'service';

function initialsOf(name: string, size: AvatarSize = 'default') {
  const clean = name.split('@')[0];
  const words = clean.split(/[\s._\-/]+/).map(w => w.match(/[\p{L}\p{N}]/gu)?.join('') ?? '').filter(Boolean);
  if (!words.length) return '';
  if (size === 'sm') return [...words[0]][0].toUpperCase();
  if (words.length === 1) return [...words[0]].slice(0, 2).join('').toUpperCase();
  return ([...words[0]][0] + [...words[words.length - 1]][0]).toUpperCase();
}

const AvatarContext = createContext<{type: AvatarType; size: AvatarSize}>({type: 'person', size: 'default'});

type AvatarProps = AvatarPrimitive.Root.Props & VariantProps<typeof avatarVariants> & {
  type?: AvatarType;
  name?: string;
  src?: string;
  decorative?: boolean;
};

function Avatar({className, size = 'default', type = 'person', name, src, decorative, children, ...props}: AvatarProps) {
  const px: AvatarSize = size ?? 'default';
  const labelled = !!name && !decorative;
  return <AvatarContext.Provider value={{type, size: px}}><AvatarPrimitive.Root
    data-slot="avatar"
    data-size={px}
    data-type={type}
    role={labelled ? 'img' : undefined}
    aria-label={labelled ? name : undefined}
    aria-hidden={decorative || undefined}
    className={mergeClass(avatarVariants({size: px}), className)}
    {...props}
  >
    {children ?? <>
      {src && <AvatarImage src={src} alt=""/>}
      <AvatarFallback>{name && type === 'person' ? initialsOf(name, px) || undefined : undefined}</AvatarFallback>
    </>}
  </AvatarPrimitive.Root></AvatarContext.Provider>;
}

function AvatarImage({className, ...props}: AvatarPrimitive.Image.Props) {
  return <AvatarPrimitive.Image
    data-slot="avatar-image"
    decoding="async"
    draggable={false}
    className={mergeClass('aspect-square size-full object-cover', className)}
    {...props}
  />;
}

function AvatarFallback({className, children, ...props}: AvatarPrimitive.Fallback.Props) {
  return <AvatarPrimitive.Fallback
    data-slot="avatar-fallback"
    className={mergeClass([
      'flex size-full items-center justify-center type-micro text-text-1',
      'group-data-[type=service]/avatar:text-text-2 group-data-[size=lg]/avatar:type-label-sm',
    ], className)}
    {...props}
  >
    {children ?? <FallbackGlyph/>}
  </AvatarPrimitive.Fallback>;
}

function FallbackGlyph() {
  const {type} = useContext(AvatarContext);
  return type === 'service' ? <Icon icon={ServerDns}/> : null;
}

const countSize: Record<AvatarSize, string> = {sm: 'h-5 min-w-5', default: 'h-6 min-w-6', lg: 'h-8 min-w-8'};

type AvatarGroupProps = React.ComponentProps<'div'> & {
  max?: number;
  label?: string;
  size?: AvatarSize;
};

function AvatarGroup({className, children, max = 4, label, size = 'default', ...props}: AvatarGroupProps) {
  const items = Children.toArray(children).filter(isValidElement) as ReactElement<{name?: string}>[];
  const shown = items.length > max ? items.slice(0, Math.max(1, max - 1)) : items;
  const hidden = items.slice(shown.length);
  const names = hidden.map(h => h.props.name).filter((n): n is string => !!n);
  return <div
    data-slot="avatar-group"
    data-size={size}
    role="list"
    aria-label={label}
    className={cn('flex items-center [&>*+*]:-ms-px', className)}
    {...props}
  >
    {shown.map((item, i) => <div key={item.key ?? i} role="listitem" className="relative flex">{item}</div>)}
    {hidden.length > 0 && <div
      data-slot="avatar-group-count"
      role="listitem"
      title={names.length ? names.join(', ') : undefined}
      className={cn('relative flex shrink-0 items-center justify-center border border-line bg-page px-1 type-micro text-text-2', countSize[size])}
    >
      <span aria-hidden dir="ltr">+{hidden.length}</span>
      <span className="sr-only">and {hidden.length} more{names.length ? `: ${names.join(', ')}` : ''}</span>
    </div>}
  </div>;
}

export {Avatar, AvatarImage, AvatarFallback, AvatarGroup, avatarVariants, initialsOf, type AvatarProps, type AvatarSize, type AvatarType};
