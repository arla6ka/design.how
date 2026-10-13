'use client';

import {Avatar as AvatarPrimitive} from '@base-ui/react/avatar';
import {cva, type VariantProps} from 'class-variance-authority';
import {cn, mergeClass} from '../lib/utils';

const avatarVariants = cva('relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-2 font-medium text-fg-2 select-none', {
  variants: {
    size: {
      xs: 'size-6 text-xs',
      sm: 'size-8 text-xs',
      md: 'size-10 text-sm',
      lg: 'size-14 text-lg',
    },
  },
  defaultVariants: {size: 'md'},
});

type AvatarProps = Omit<AvatarPrimitive.Root.Props, 'children'> & VariantProps<typeof avatarVariants> & {
  src?: string;
  name: string;
};

const segmenter = typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter(undefined, {granularity: 'grapheme'}) : null;
const firstGrapheme = (word: string) => segmenter ? (segmenter.segment(word)[Symbol.iterator]().next().value?.segment ?? '') : (Array.from(word)[0] ?? '');
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => firstGrapheme(w).toLocaleUpperCase()).join('');

function Avatar({className, size, src, name, ...props}: AvatarProps) {
  return (
    <AvatarPrimitive.Root data-slot="avatar" data-size={size ?? 'md'} className={mergeClass(avatarVariants({size}), className)} {...props}>
      {src && <AvatarPrimitive.Image src={src} alt={name} className="size-full object-cover"/>}
      <AvatarPrimitive.Fallback role="img" aria-label={name} className="flex size-full items-center justify-center">{initials(name)}</AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}

function AvatarGroup({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="avatar-group" role="group" className={cn('flex items-center *:ring-2 *:ring-page *:not-first:-ms-1.5 *:data-[size=xs]:not-first:ms-0 *:data-[size=sm]:not-first:-ms-1 *:data-[size=lg]:not-first:-ms-2', className)} {...props}/>;
}

export {Avatar, AvatarGroup, avatarVariants, type AvatarProps};
