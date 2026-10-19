import type {Icon as PhosphorIcon, IconProps as PhosphorProps} from '@phosphor-icons/react';
import {
  ArrowBendDownRightIcon, ArrowClockwiseIcon, ArrowDownIcon, ArrowElbowDownLeftIcon, ArrowLeftIcon, ArrowRightIcon,
  ArrowSquareOutIcon, ArrowUDownLeftIcon, ArrowUUpLeftIcon, ArrowUpIcon, ArrowUpRightIcon, ArrowsInLineVerticalIcon,
  ArrowsOutLineVerticalIcon, BrainIcon, CalendarBlankIcon, CaretDownIcon, CaretLeftIcon, CaretRightIcon, CaretUpIcon,
  CaretUpDownIcon, ChartLineIcon, CheckIcon, CheckCircleIcon, CircleNotchIcon, ClockIcon, CodeIcon, ColumnsIcon,
  CopyIcon, DotsThreeIcon, DownloadSimpleIcon, EyeIcon, EyeSlashIcon, FileIcon, FileArchiveIcon, FileAudioIcon,
  FileCodeIcon, FileCsvIcon, FileImageIcon, FileTextIcon, FileVideoIcon, FunnelIcon, GearSixIcon, GlobeIcon, InfoIcon,
  KeyIcon, LinkSimpleIcon, LockIcon, MagnifyingGlassIcon, MicrophoneIcon, MicrophoneSlashIcon, MinusIcon, MoonIcon,
  PaperPlaneRightIcon, PaperclipIcon, PauseIcon, PencilSimpleIcon, PlayIcon, PlusIcon, RobotIcon, ShieldSlashIcon,
  SparkleIcon, SquareIcon, SunIcon, TableIcon, TerminalWindowIcon, TrashIcon, TrayIcon,
  UploadSimpleIcon, UserIcon, WarningIcon, WarningCircleIcon, WrenchIcon, XIcon, XCircleIcon, HourglassSimpleMediumIcon,
} from '@phosphor-icons/react/ssr';
import {cn} from './lib/utils';

export const Add = PlusIcon;
export const ArrowDown = ArrowDownIcon;
export const ArrowLeft = ArrowLeftIcon;
export const ArrowRight = ArrowRightIcon;
export const ArrowUp = ArrowUpIcon;
export const ArrowUpRight = ArrowUpRightIcon;
export const Attachment = PaperclipIcon;
export const Bot = RobotIcon;
export const Calendar = CalendarBlankIcon;
export const Check = CheckIcon;
export const ChevronDown = CaretDownIcon;
export const ChevronLeft = CaretLeftIcon;
export const ChevronRight = CaretRightIcon;
export const ChevronSort = CaretUpDownIcon;
export const ChevronUp = CaretUpIcon;
export const ChartLine = ChartLineIcon;
export const Close = XIcon;
export const CollapseAll = ArrowsInLineVerticalIcon;
export const Code = CodeIcon;
export const Columns = ColumnsIcon;
export const Copy = CopyIcon;
export const Dark = MoonIcon;
export const Document = FileTextIcon;
export const DocumentBlank = FileIcon;
export const Download = DownloadSimpleIcon;
export const Edit = PencilSimpleIcon;
export const Empty = TrayIcon;
export const ExpandAll = ArrowsOutLineVerticalIcon;
export const Failed = WarningCircleIcon;
export const FailedMark = XCircleIcon;
export const External = ArrowSquareOutIcon;
export const FileArchive = FileArchiveIcon;
export const FileAudio = FileAudioIcon;
export const FileCode = FileCodeIcon;
export const FileImage = FileImageIcon;
export const FileTable = FileCsvIcon;
export const FileVideo = FileVideoIcon;
export const Filter = FunnelIcon;
export const FollowUp = ArrowBendDownRightIcon;
export const Globe = GlobeIcon;
export const Hide = EyeSlashIcon;
export const Information = InfoIcon;
export const Key = KeyIcon;
export const Light = SunIcon;
export const Link = LinkSimpleIcon;
export const Locked = LockIcon;
export const NoAccess = ShieldSlashIcon;
export const NoResults = MagnifyingGlassIcon;
export const Microphone = MicrophoneIcon;
export const MicrophoneOff = MicrophoneSlashIcon;
export const Model = BrainIcon;
export const More = DotsThreeIcon;
export const Pause = PauseIcon;
export const Pending = CircleNotchIcon;
export const Play = PlayIcon;
export const Retry = ArrowClockwiseIcon;
export const Return = ArrowElbowDownLeftIcon;
export const Search = MagnifyingGlassIcon;
export const Send = PaperPlaneRightIcon;
export const Settings = GearSixIcon;
export const Show = EyeIcon;
export const Sparkle = SparkleIcon;
export const Stop = SquareIcon;
export const Subtract = MinusIcon;
export const Success = CheckCircleIcon;
export const TableView = TableIcon;
export const Terminal = TerminalWindowIcon;
export const Time = ClockIcon;
export const Tool = WrenchIcon;
export const TrashCan = TrashIcon;
export const Undo = ArrowUUpLeftIcon;
export const Upload = UploadSimpleIcon;
export const UserAvatar = UserIcon;
export const Warning = WarningIcon;
export const Waiting = HourglassSimpleMediumIcon;
export const Wrap = ArrowUDownLeftIcon;

export type GlazeIcon = PhosphorIcon;

export type IconWeight = 'light' | 'regular' | 'bold' | 'fill';

type IconProps = Omit<PhosphorProps, 'size' | 'weight' | 'color' | 'alt' | 'mirrored'> & {
  icon: GlazeIcon;
  size?: 12 | 14 | 16 | 20 | 24 | 32 | 40;
  weight?: IconWeight;
  label?: string;
};

export function Icon({icon: Glyph, size = 14, weight = 'regular', label, className, ...props}: IconProps) {
  return <Glyph
    size={size}
    weight={weight}
    focusable="false"
    aria-hidden={label ? undefined : true}
    aria-label={label}
    role={label ? 'img' : undefined}
    className={cn('shrink-0', className)}
    {...props}
  />;
}
