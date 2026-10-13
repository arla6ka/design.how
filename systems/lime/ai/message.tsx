import {cva, type VariantProps} from 'class-variance-authority';
import {cn} from '../lib/utils';

const messageVariants = cva('flex w-full gap-3', {
  variants: {
    from: {
      user: 'justify-end',
      assistant: 'justify-start',
    },
  },
  defaultVariants: {from: 'assistant'},
});

type MessageProps = React.ComponentProps<'div'> & VariantProps<typeof messageVariants> & {
  name?: string;
  actions?: React.ReactNode;
};

function Message({from, name = 'Assistant', actions, className, children, ...props}: MessageProps) {
  return (
    <div data-slot="message" data-from={from ?? 'assistant'} className={cn(messageVariants({from}), className)} {...props}>
      <div className={cn('flex min-w-0 flex-col gap-2', from === 'user' ? 'max-w-[85%] items-end' : 'max-w-prose flex-1')}>
        <div className={cn('text-base leading-normal break-words', from === 'user' && 'rounded-panel rounded-ee-sm bg-surface-2 px-4 py-2.5 text-fg')}>
          {from !== 'user' && <span className="sr-only">{name}: </span>}
          {children}
        </div>
        {actions && from !== 'user' && <div className="-ms-2 flex items-center gap-1 text-fg-3">{actions}</div>}
      </div>
    </div>
  );
}

export {Message, messageVariants, type MessageProps};
