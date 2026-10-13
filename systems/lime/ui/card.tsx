'use client';

import {cva, type VariantProps} from 'class-variance-authority';
import {cn} from '../lib/utils';

const cardVariants = cva('flex flex-col gap-4 rounded-panel p-5 text-fg', {
  variants: {
    variant: {
      surface: 'bg-surface',
      outline: 'border border-line bg-page',
      raised: 'bg-raised shadow-card',
      glow: 'glow glow-accent bg-accent text-on-accent **:data-[slot=card-description]:text-on-accent',
    },
    interactive: {
      true: 'cursor-pointer transition-[background-color,border-color] duration-(--dur-instant) ease-out hover:bg-surface-2 active:bg-surface-3',
      false: '',
    },
  },
  defaultVariants: {variant: 'surface', interactive: false},
});

type CardLook = {variant?: VariantProps<typeof cardVariants>['variant']};

type CardProps =
  | (React.ComponentProps<'div'> & CardLook & {interactive?: false; href?: never})
  | (React.ComponentProps<'button'> & CardLook & {interactive: true; href?: never})
  | (React.ComponentProps<'a'> & CardLook & {interactive: true; href: string});

const cardClass = (variant: CardLook['variant'], interactive: boolean, className: string | undefined) =>
  cn(cardVariants({variant, interactive}), interactive && variant === 'outline' && 'hover:bg-surface active:bg-surface-2', variant === 'glow' && (interactive ? 'hover:bg-accent active:bg-accent' : 'glow-still'), className);

function Card(props: CardProps) {
  if (props.interactive && props.href !== undefined) {
    const {className, variant, interactive: _, ...rest} = props;
    return <a data-slot="card" className={cn(cardClass(variant, true, className), 'no-underline')} {...rest}/>;
  }
  if (props.interactive) {
    const {className, variant, interactive: _, href: __, ...rest} = props;
    return <button data-slot="card" type="button" className={cn(cardClass(variant, true, className), 'w-full text-start')} {...rest}/>;
  }
  const {className, variant, interactive: _, href: __, ...rest} = props;
  return <div data-slot="card" className={cardClass(variant, false, className)} {...rest}/>;
}

function CardHeader({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="card-header" className={cn('flex flex-col gap-1', className)} {...props}/>;
}

function CardTitle({className, ...props}: React.ComponentProps<'h3'>) {
  return <h3 data-slot="card-title" className={cn('text-lg leading-tight font-semibold', className)} {...props}/>;
}

function CardDescription({className, ...props}: React.ComponentProps<'p'>) {
  return <p data-slot="card-description" className={cn('text-sm text-fg-2', className)} {...props}/>;
}

function CardContent({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('flex flex-col gap-3', className)} {...props}/>;
}

function CardFooter({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="card-footer" className={cn('flex items-center gap-2', className)} {...props}/>;
}

export {Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, cardVariants, type CardProps};
