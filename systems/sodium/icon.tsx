import {forwardRef} from 'react';
import {
  Activity as ActivityGlyph, ArrowDown as ArrowDownGlyph, ArrowLeft as ArrowLeftGlyph, ArrowRight as ArrowRightGlyph,
  ArrowUp as ArrowUpGlyph, ArrowUpRight as ArrowUpRightGlyph, Box, Calendar as CalendarGlyph,
  Check, ChevronDown as ChevronDownGlyph, ChevronLeft as ChevronLeftGlyph, ChevronRight as ChevronRightGlyph,
  ChevronUp as ChevronUpGlyph, ChevronsUpDown, CircleAlert, CircleStop, CircleX, Clock,
  Code as CodeGlyph, Copy as CopyGlyph, Cpu, Database, Download as DownloadGlyph, Ellipsis, ExternalLink, Eye, EyeOff,
  FileText, FoldVertical, Folder as FolderGlyph, Funnel, Gauge, GitBranch, Info, Lock, Minus, Moon as MoonGlyph,
  MoveHorizontal, Pause as PauseGlyph, Pencil, Play as PlayGlyph, Plus, RefreshCw, Search as SearchGlyph, Server,
  Settings as SettingsGlyph, SquareTerminal, Sun as SunGlyph, Table, TextWrap as TextWrapGlyph, Trash, TriangleAlert,
  Undo2, UnfoldVertical, Upload as UploadGlyph, Workflow, X, Zap,
  type LucideIcon, type LucideProps,
} from 'lucide-react';
import {cn} from './lib/utils';

const SQUARED = {strokeWidth: 1.25, nonScalingStroke: true, strokeLinecap: 'square', strokeLinejoin: 'miter'} as const;

function squared(Glyph: LucideIcon, name: string): LucideIcon {
  const Squared = forwardRef<SVGSVGElement, Omit<LucideProps, 'ref'>>((props, ref) => <Glyph ref={ref} {...props} {...SQUARED}/>);
  Squared.displayName = name;
  return Squared;
}

export const Activity = squared(ActivityGlyph, 'Activity');
export const Add = squared(Plus, 'Add');
export const ArrowDown = squared(ArrowDownGlyph, 'ArrowDown');
export const ArrowLeft = squared(ArrowLeftGlyph, 'ArrowLeft');
export const ArrowRight = squared(ArrowRightGlyph, 'ArrowRight');
export const ArrowUp = squared(ArrowUpGlyph, 'ArrowUp');
export const ArrowUpRight = squared(ArrowUpRightGlyph, 'ArrowUpRight');
export const Branch = squared(GitBranch, 'Branch');
export const Calendar = squared(CalendarGlyph, 'Calendar');
export const Checkmark = squared(Check, 'Checkmark');
export const ChevronDown = squared(ChevronDownGlyph, 'ChevronDown');
export const ChevronLeft = squared(ChevronLeftGlyph, 'ChevronLeft');
export const ChevronRight = squared(ChevronRightGlyph, 'ChevronRight');
export const ChevronSort = squared(ChevronsUpDown, 'ChevronSort');
export const ChevronUp = squared(ChevronUpGlyph, 'ChevronUp');
export const Chip = squared(Cpu, 'Chip');
export const Close = squared(X, 'Close');
export const Code = squared(CodeGlyph, 'Code');
export const Copy = squared(CopyGlyph, 'Copy');
export const Cube = squared(Box, 'Cube');
export const DataBase = squared(Database, 'DataBase');
export const DataTable = squared(Table, 'DataTable');
export const Document = squared(FileText, 'Document');
export const Download = squared(DownloadGlyph, 'Download');
export const Edit = squared(Pencil, 'Edit');
export const ErrorOutline = squared(CircleAlert, 'ErrorOutline');
export const Filter = squared(Funnel, 'Filter');
export const Flow = squared(Workflow, 'Flow');
export const Folder = squared(FolderGlyph, 'Folder');
export const Information = squared(Info, 'Information');
export const Launch = squared(ExternalLink, 'Launch');
export const Lightning = squared(Zap, 'Lightning');
export const Locked = squared(Lock, 'Locked');
export const Meter = squared(Gauge, 'Meter');
export const Moon = squared(MoonGlyph, 'Moon');
export const OverflowMenuHorizontal = squared(Ellipsis, 'OverflowMenuHorizontal');
export const Pause = squared(PauseGlyph, 'Pause');
export const Play = squared(PlayGlyph, 'Play');
export const Renew = squared(RefreshCw, 'Renew');
export const Search = squared(SearchGlyph, 'Search');
export const ServerDns = squared(Server, 'ServerDns');
export const Settings = squared(SettingsGlyph, 'Settings');
export const StopOutline = squared(CircleStop, 'StopOutline');
export const Subtract = squared(Minus, 'Subtract');
export const Sun = squared(SunGlyph, 'Sun');
export const Terminal = squared(SquareTerminal, 'Terminal');
export const Time = squared(Clock, 'Time');
export const TrashCan = squared(Trash, 'TrashCan');
export const Undo = squared(Undo2, 'Undo');
export const Upload = squared(UploadGlyph, 'Upload');
export const View = squared(Eye, 'View');
export const ViewOff = squared(EyeOff, 'ViewOff');
export const WarningAlt = squared(TriangleAlert, 'WarningAlt');
export const ArrowsHorizontal = squared(MoveHorizontal, 'ArrowsHorizontal');
export const CollapseAll = squared(FoldVertical, 'CollapseAll');
export const ExpandAll = squared(UnfoldVertical, 'ExpandAll');
export const Misuse = squared(CircleX, 'Misuse');
export const TextWrap = squared(TextWrapGlyph, 'TextWrap');

export type SodiumIcon = LucideIcon;

type IconProps = Omit<LucideProps, 'size' | 'ref'> & {
  icon: SodiumIcon;
  size?: 14 | 16 | 20 | 24 | 32;
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
