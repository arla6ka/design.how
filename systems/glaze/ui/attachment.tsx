'use client';

import * as React from 'react';
import {cva, type VariantProps} from 'class-variance-authority';
import {Icon, Document, DocumentBlank, FileArchive, FileAudio, FileCode, FileImage, FileTable, FileVideo, Upload, type GlazeIcon} from '../icon';
import {Button, type ButtonProps} from './button';
import {Truncate} from './truncate';
import {cn, mergeRefs} from '../lib/utils';

type AttachmentState = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

const attachmentVariants = cva(
  [
    'group/attachment relative flex w-fit max-w-full min-w-0 shrink-0 items-center gap-2 rounded-overlay border border-line bg-paper p-1 text-text-1',
    'data-[state=error]:border-fail forced-colors:border-[CanvasText]',
  ],
  {
    variants: {
      size: {
        default: 'min-w-48 pe-3 has-[>[data-slot=attachment-actions]]:pe-1 [--attachment-media:var(--row)]',
        sm: 'min-w-40 pe-2 has-[>[data-slot=attachment-actions]]:pe-1 [--attachment-media:var(--space-6)]',
      },
    },
    defaultVariants: {size: 'default'},
  },
);

type AttachmentProps = React.ComponentProps<'div'> & VariantProps<typeof attachmentVariants> & {
  state?: AttachmentState;
};

function Attachment({className, state = 'done', size = 'default', ...props}: AttachmentProps) {
  return <div
    data-slot="attachment"
    data-state={state}
    data-size={size}
    aria-busy={state === 'uploading' || state === 'processing' || undefined}
    className={cn(attachmentVariants({size}), className)}
    {...props}
  />;
}

function AttachmentMedia({className, children, ref: callerRef, ...props}: React.ComponentProps<'div'>) {
  const ref = React.useRef<HTMLDivElement>(null);
  const setRef = React.useMemo(() => mergeRefs(ref, callerRef), [callerRef]);
  const [broken, setBroken] = React.useState(false);
  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const onError = (event: Event) => { if ((event.target as HTMLElement).tagName === 'IMG') setBroken(true); };
    node.addEventListener('error', onError, true);
    const img = node.querySelector('img');
    if (img?.getAttribute('src') && img.complete && img.naturalWidth === 0) setBroken(true);
    return () => node.removeEventListener('error', onError, true);
  }, []);
  return <div
    ref={setRef}
    data-slot="attachment-media"
    className={cn(
      'relative flex size-(--attachment-media) shrink-0 items-center justify-center overflow-hidden rounded-tag bg-field text-text-2',
      '[&_img]:size-full [&_img]:object-cover [&_svg]:pointer-events-none',
      'transition-opacity duration-(--dur-state) ease-out group-data-[state=uploading]/attachment:opacity-60 group-data-[state=processing]/attachment:opacity-60',
      className,
    )}
    {...props}
  >
    {broken ? <Icon icon={FileImage} size={14}/> : children}
  </div>;
}

function AttachmentContent({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="attachment-content" className={cn('flex min-w-0 flex-1 flex-col', className)} {...props}/>;
}

function tailOf(name: string) {
  const dot = name.lastIndexOf('.');
  const ext = dot > 0 ? name.length - dot : 0;
  return Math.min(name.length, ext + 4);
}

function AttachmentTitle({className, children, ...props}: React.ComponentProps<'span'>) {
  return <span data-slot="attachment-title" className={cn('flex min-w-0 type-label text-text-1 group-data-[size=sm]/attachment:type-label-sm', className)} {...props}>
    {typeof children === 'string' ? <Truncate position="middle" tail={tailOf(children)} focusable={false}>{children}</Truncate> : children}
  </span>;
}

function AttachmentDescription({className, ...props}: React.ComponentProps<'span'>) {
  return <span data-slot="attachment-description" className={cn('block min-w-0 truncate type-caption text-text-2 data group-data-[state=error]/attachment:text-fail-text group-data-[size=sm]/attachment:hidden', className)} {...props}/>;
}

type AttachmentProgressProps = Omit<React.ComponentProps<'div'>, 'children'> & {
  value: number;
  label: string;
};

function AttachmentProgress({value, label, className, ...props}: AttachmentProgressProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));
  return <div
    data-slot="attachment-progress"
    role="progressbar"
    aria-label={label}
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={clamped}
    aria-valuetext={`${clamped}%`}
    className={cn('pointer-events-none absolute inset-x-3 bottom-0 h-0.5 overflow-hidden rounded-pill', className)}
    {...props}
  >
    <div className="h-full w-(--pct) rounded-pill bg-ink transition-[width] duration-(--dur-state) ease-out motion-reduce:transition-none forced-colors:bg-[CanvasText]" style={{'--pct': `${clamped}%`} as React.CSSProperties}/>
  </div>;
}

function AttachmentActions({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="attachment-actions" className={cn('relative z-(--z-raised) flex shrink-0 items-center gap-0.5', className)} {...props}/>;
}

function AttachmentAction({className, variant, size = 'icon-sm', ...props}: ButtonProps) {
  return <Button data-slot="attachment-action" variant={variant ?? 'ghost'} size={size} className={className} {...props}/>;
}

function AttachmentGroup({className, layout = 'wrap', ...props}: React.ComponentProps<'div'> & {layout?: 'wrap' | 'scroll'}) {
  return <div
    data-slot="attachment-group"
    data-layout={layout}
    role="group"
    className={cn('flex min-w-0 gap-2', layout === 'wrap' ? 'flex-wrap' : 'snap-x overflow-x-auto overscroll-x-contain [scrollbar-width:none] *:flex-none *:snap-start', className)}
    {...props}
  />;
}

const glyphs: [RegExp, GlazeIcon][] = [
  [/^image\/|\.(png|jpe?g|gif|webp|avif|svg|heic)$/i, FileImage],
  [/^video\/|\.(mp4|mov|webm)$/i, FileVideo],
  [/^audio\/|\.(mp3|wav|m4a|ogg)$/i, FileAudio],
  [/csv|spreadsheet|\.(csv|tsv|xlsx?)$/i, FileTable],
  [/zip|tar|gzip|\.(zip|tar|gz|tgz)$/i, FileArchive],
  [/json|javascript|typescript|x-python|yaml|\.(json|jsonl|js|ts|tsx|py|ya?ml|toml|sh|go|rs)$/i, FileCode],
  [/pdf|wordprocessing|msword|^text\/|\.(pdf|docx?|odt|rtf|txt|md|log)$/i, Document],
];

function fileGlyph(type: string, name = ''): GlazeIcon {
  for (const [pattern, glyph] of glyphs) if (pattern.test(type) || pattern.test(name)) return glyph;
  return DocumentBlank;
}

function AttachmentGlyph({type, name, size = 14, className}: {type: string; name?: string; size?: 12 | 14 | 16; className?: string}) {
  return <Icon icon={fileGlyph(type, name)} size={size} className={className}/>;
}

const units = ['B', 'KB', 'MB', 'GB'];

function formatBytes(bytes: number) {
  let size = Math.max(0, bytes);
  let i = 0;
  while (size >= 1000 && i < units.length - 1) { size /= 1000; i += 1; }
  return `${i === 0 || size >= 10 ? Math.round(size) : size.toFixed(1)} ${units[i]}`;
}

function formatByteProgress(loaded: number, total: number) {
  let i = 0;
  let whole = Math.max(0, total);
  while (whole >= 1000 && i < units.length - 1) { whole /= 1000; i += 1; }
  const scale = 1000 ** i;
  const fmt = (n: number) => (i === 0 || n >= 10 ? String(Math.round(n)) : n.toFixed(1));
  return `${fmt(Math.min(loaded, total) / scale)} of ${fmt(whole)} ${units[i]}`;
}

type FileRejection = {file: File; reason: 'type' | 'size' | 'count'};

type AttachmentDropContextValue = {open: () => void; disabled: boolean; dragging: false | 'accept' | 'reject'; accept?: string; multiple: boolean};
const AttachmentDropContext = React.createContext<AttachmentDropContextValue | null>(null);

function useAttachmentDrop() {
  const context = React.useContext(AttachmentDropContext);
  if (!context) throw new Error('useAttachmentDrop must be used within <AttachmentDrop>');
  return context;
}

function acceptTokens(accept?: string) {
  return (accept ?? '').split(',').map(token => token.trim().toLowerCase()).filter(Boolean);
}

function matches(tokens: string[], type: string, name?: string) {
  if (!tokens.length) return true;
  const mime = type.toLowerCase();
  const lower = name?.toLowerCase();
  return tokens.some(token => {
    if (token.startsWith('.')) return lower ? lower.endsWith(token) : false;
    if (token.endsWith('/*')) return mime.startsWith(token.slice(0, -1));
    return mime === token;
  });
}

function dragVerdict(tokens: string[], items: DataTransferItemList | undefined): 'accept' | 'reject' {
  if (!items || !tokens.length) return 'accept';
  const files = Array.from(items).filter(item => item.kind === 'file');
  if (!files.length) return 'reject';
  if (!tokens.every(token => !token.startsWith('.'))) return 'accept';
  return files.some(item => !item.type || matches(tokens, item.type)) ? 'accept' : 'reject';
}

function describeAccept(accept: string) {
  const word = (sub: string) => (sub.length <= 4 ? sub.toUpperCase() : sub);
  const words = [...new Set(acceptTokens(accept).map(t => t.endsWith('/*') ? `${t.slice(0, -2)}s` : t.startsWith('.') ? word(t.slice(1)) : word(t.split('/').pop()!)))];
  const list = words.length > 1 ? `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}` : words[0];
  return words.every(w => w.endsWith('s') && w === w.toLowerCase()) ? list : `${list} files`;
}

const hasFiles = (event: React.DragEvent) => Array.from(event.dataTransfer?.types ?? []).includes('Files');

const attachmentDropVariants = cva('group/attachment-drop relative', {
  variants: {
    variant: {
      region: '',
      zone: 'flex flex-col items-start gap-3 rounded-overlay border border-line-control bg-paper p-4 text-start data-disabled:text-text-disabled',
    },
  },
  defaultVariants: {variant: 'region'},
});

type AttachmentDropProps = Omit<React.ComponentProps<'div'>, 'onDrop'> & VariantProps<typeof attachmentDropVariants> & {
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
  disabled?: boolean;
  paste?: boolean;
  onFiles?: (files: File[]) => void;
  onReject?: (rejections: FileRejection[]) => void;
  overlayLabel?: React.ReactNode;
  rejectLabel?: React.ReactNode;
  dragState?: 'accept' | 'reject';
};

const claimed = new WeakSet<Event>();

function AttachmentDrop({
  accept, maxSize, multiple = true, disabled = false, paste = false, onFiles, onReject,
  overlayLabel, rejectLabel, dragState, variant = 'region', className, children, onPaste, ...props
}: AttachmentDropProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const depth = React.useRef(0);
  const [dragging, setDragging] = React.useState<false | 'accept' | 'reject'>(false);
  const [covered, setCovered] = React.useState(false);
  const tokens = React.useMemo(() => acceptTokens(accept), [accept]);

  const take = (list: File[]) => {
    const accepted: File[] = [];
    const rejected: FileRejection[] = [];
    for (const file of list) {
      if (!matches(tokens, file.type, file.name)) rejected.push({file, reason: 'type'});
      else if (maxSize !== undefined && file.size > maxSize) rejected.push({file, reason: 'size'});
      else if (!multiple && accepted.length >= 1) rejected.push({file, reason: 'count'});
      else accepted.push(file);
    }
    if (accepted.length) onFiles?.(accepted);
    if (rejected.length) onReject?.(rejected);
  };

  const reset = React.useCallback(() => { depth.current = 0; setDragging(false); setCovered(false); }, []);
  const nested = (event: React.DragEvent) => {
    if (claimed.has(event.nativeEvent)) return true;
    if (!disabled) claimed.add(event.nativeEvent);
    return false;
  };

  React.useEffect(() => {
    if (!dragging) return;
    window.addEventListener('dragend', reset);
    window.addEventListener('drop', reset);
    return () => { window.removeEventListener('dragend', reset); window.removeEventListener('drop', reset); };
  }, [dragging, reset]);

  const handlers = {
    onDragEnter: (event: React.DragEvent<HTMLDivElement>) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      if (disabled) return;
      depth.current += 1;
      setDragging(dragVerdict(tokens, event.dataTransfer.items));
    },
    onDragOver: (event: React.DragEvent<HTMLDivElement>) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      const inner = nested(event);
      if (inner !== covered) setCovered(inner);
      if (inner) return;
      event.dataTransfer.dropEffect = disabled || dragging === 'reject' ? 'none' : 'copy';
    },
    onDragLeave: (event: React.DragEvent<HTMLDivElement>) => {
      if (!hasFiles(event) || disabled) return;
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setDragging(false);
    },
    onDrop: (event: React.DragEvent<HTMLDivElement>) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      reset();
      if (disabled || nested(event)) return;
      take(Array.from(event.dataTransfer.files));
    },
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    onPaste?.(event);
    if (!paste || disabled || event.defaultPrevented) return;
    const files = Array.from(event.clipboardData.files);
    if (!files.length) return;
    event.preventDefault();
    take(files);
  };

  const open = () => { if (!disabled) inputRef.current?.click(); };
  const shown = disabled ? false : (dragState ?? (covered ? false : dragging));

  return <AttachmentDropContext.Provider value={{open, disabled, dragging: shown, accept, multiple}}>
    <div
      data-slot="attachment-drop"
      data-variant={variant}
      data-dragging={shown || undefined}
      data-disabled={disabled || undefined}
      aria-disabled={disabled || undefined}
      className={cn(attachmentDropVariants({variant}), className)}
      onPaste={handlePaste}
      {...handlers}
      {...props}
    >
      {children}
      <AttachmentDropOverlay label={overlayLabel} rejectLabel={rejectLabel}/>
      <input
        ref={inputRef}
        data-slot="attachment-drop-input"
        type="file"
        tabIndex={-1}
        aria-hidden
        hidden
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={event => {
          take(Array.from(event.currentTarget.files ?? []));
          event.currentTarget.value = '';
        }}
      />
    </div>
  </AttachmentDropContext.Provider>;
}

function AttachmentDropOverlay({label, rejectLabel}: {label?: React.ReactNode; rejectLabel?: React.ReactNode}) {
  const {dragging, multiple, accept} = useAttachmentDrop();
  if (!dragging) return null;
  const reject = dragging === 'reject';
  return <div
    data-slot="attachment-drop-overlay"
    data-status={reject ? 'fail' : undefined}
    aria-hidden
    className={cn(
      'pointer-events-none absolute inset-0 z-(--z-raised) flex flex-col items-start justify-center gap-1 rounded-overlay border border-ink bg-paper px-4 py-3 text-start text-text-1',
      'data-[status=fail]:border-fail forced-colors:border-dashed forced-colors:border-[CanvasText]',
    )}
  >
    <span className="flex items-center gap-2 type-label"><Icon icon={Upload} size={14} className="text-text-2"/>{label ?? (multiple ? 'Drop files to attach' : 'Drop a file to attach')}</span>
    {reject && <span className="type-body-sm text-fail-text">{rejectLabel ?? (accept ? `Only ${describeAccept(accept)} can be added here` : 'These files cannot be added here')}</span>}
  </div>;
}

function AttachmentDropTitle({className, ...props}: React.ComponentProps<'p'>) {
  return <p data-slot="attachment-drop-title" className={cn('type-label text-text-1 group-data-disabled/attachment-drop:text-text-disabled', className)} {...props}/>;
}

function AttachmentDropDescription({className, ...props}: React.ComponentProps<'p'>) {
  return <p data-slot="attachment-drop-description" className={cn('type-body-sm text-text-2 data group-data-disabled/attachment-drop:text-text-disabled group-data-[variant=zone]/attachment-drop:-mt-2', className)} {...props}/>;
}

function AttachmentDropTrigger({variant, size = 'sm', onClick, disabled, ...props}: ButtonProps) {
  const {open, disabled: dropDisabled} = useAttachmentDrop();
  return <Button
    data-slot="attachment-drop-trigger"
    variant={variant ?? 'secondary'}
    size={size}
    disabled={disabled || dropDisabled}
    onClick={event => { onClick?.(event); if (!event.defaultPrevented) open(); }}
    {...props}
  />;
}

function rejectionReason({file, reason}: FileRejection, {accept, maxSize}: {accept?: string; maxSize?: number} = {}) {
  if (reason === 'size') return maxSize ? `${formatBytes(file.size)}, over the ${formatBytes(maxSize)} limit` : 'Too large';
  if (reason === 'count') return 'One file at a time';
  const ext = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')) : file.type;
  return accept ? `${ext || 'This type'} files are not accepted here` : 'This type is not accepted';
}

export {
  Attachment, AttachmentMedia, AttachmentContent, AttachmentTitle, AttachmentDescription, AttachmentProgress, AttachmentActions, AttachmentAction, AttachmentGroup, AttachmentGlyph,
  AttachmentDrop, AttachmentDropTitle, AttachmentDropDescription, AttachmentDropTrigger, useAttachmentDrop,
  fileGlyph, formatBytes, formatByteProgress, rejectionReason, describeAccept,
  attachmentVariants, type AttachmentProps, type AttachmentState, type AttachmentDropProps, type FileRejection,
};
