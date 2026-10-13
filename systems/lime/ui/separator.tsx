'use client';

import {Separator as SeparatorPrimitive} from '@base-ui/react/separator';
import {mergeClass} from '../lib/utils';

type SeparatorProps = SeparatorPrimitive.Props & {
  decorative?: boolean;
};

function Separator({className, orientation = 'horizontal', decorative, ...props}: SeparatorProps) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      role={decorative ? 'none' : undefined}
      render={decorative ? ({'aria-orientation': _, ...rest}: React.HTMLAttributes<HTMLDivElement>) => <div {...rest}/> : undefined}
      className={mergeClass('shrink-0 bg-line data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px', className)}
      {...props}
    />
  );
}

export {Separator, type SeparatorProps};
