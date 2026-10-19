import {cva, type VariantProps} from 'class-variance-authority';
import {cn} from '../lib/utils';

const panelVariants = cva('panel relative flex min-w-0 flex-col text-text-1 forced-colors:border-[CanvasText]', {
  variants: {
    padding: {
      default: 'p-3',
      none: 'p-0',
    },
  },
  defaultVariants: {padding: 'default'},
});

type PanelProps = React.ComponentProps<'div'> & VariantProps<typeof panelVariants>;

function Panel({className, padding = 'default', ...props}: PanelProps) {
  return <div data-slot="panel" data-padding={padding} className={cn(panelVariants({padding}), className)} {...props}/>;
}

export {Panel, panelVariants, type PanelProps};
