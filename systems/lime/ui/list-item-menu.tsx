'use client';

import type {ReactNode} from 'react';
import {Icon, OverflowMenuHorizontal} from '../icon';
import {Button} from './button';
import {DropdownMenu, DropdownMenuContent, DropdownMenuTrigger} from './dropdown-menu';

type ListItemMenuProps = {
  label: string;
  children: ReactNode;
  disabled?: boolean;
};

function ListItemMenu({label, children, disabled}: ListItemMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        render={<Button data-slot="list-item-menu" variant="ghost" size="icon-sm" aria-label={label}/>}
      >
        <Icon icon={OverflowMenuHorizontal} size={16}/>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">{children}</DropdownMenuContent>
    </DropdownMenu>
  );
}

export {ListItemMenu, type ListItemMenuProps};
