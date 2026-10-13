import type {CarbonIconType} from '@carbon/icons-react';
import {cn} from './lib/utils';

export {
  Add, ArrowDown, ArrowRight, ArrowUp, Attachment, Checkmark, CheckmarkFilled, ChevronDown, ChevronRight,
  ChevronSort, ChevronUp, Close, Copy, ErrorFilled, Image, Information, Menu, Play, Receipt, Renew, Search,
  Send, Subtract, Time, Upload, Wallet, PiggyBank, Warning, WarningFilled, ChevronLeft, ArrowLeft, Pause,
  OverflowMenuHorizontal, Folder, Star, Add as Plus, Delete, Cafe, ShoppingBag, Notification, Locked, Undo, Edit, CircleDash,
  Location
} from '@carbon/icons-react';

export type LimeIcon = CarbonIconType;

type IconProps = Omit<React.ComponentProps<CarbonIconType>, 'size'> & {
  icon: LimeIcon;
  size?: 12 | 16 | 20 | 24 | 32;
  label?: string;
};

export function Icon({icon: Glyph, size = 16, label, className, ...props}: IconProps) {
  return <Glyph
    size={size}
    aria-hidden={label ? undefined : true}
    aria-label={label}
    role={label ? 'img' : undefined}
    className={cn('shrink-0', className)}
    {...props}
  />;
}
