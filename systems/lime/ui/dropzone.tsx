'use client';

import {useId, useRef, useState} from 'react';
import {Icon, Upload} from '../icon';
import {cn} from '../lib/utils';

type RejectReason = 'type' | 'size' | 'count';

type DropzoneProps = Omit<React.ComponentProps<'label'>, 'onDrop' | 'onChange'> & {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
  onReject?: (rejected: {file: File; reason: RejectReason}[]) => void;
  title?: string;
  hint?: string;
};

function matches(file: File, accept?: string) {
  if (!accept) return true;
  return accept.split(',').map(s => s.trim().toLowerCase()).filter(Boolean).some(rule => {
    if (rule.startsWith('.')) return file.name.toLowerCase().endsWith(rule);
    if (rule.endsWith('/*')) return file.type.toLowerCase().startsWith(rule.slice(0, -1));
    return file.type.toLowerCase() === rule;
  });
}

function Dropzone({accept, multiple, maxSize, disabled, onFiles, onReject, title = 'Drop files here', hint, className, children, ...props}: DropzoneProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  function take(list: FileList | File[]) {
    const all = Array.from(list);
    const accepted: File[] = [];
    const rejected: {file: File; reason: RejectReason}[] = [];
    for (const file of all) {
      if (!matches(file, accept)) rejected.push({file, reason: 'type'});
      else if (maxSize !== undefined && file.size > maxSize) rejected.push({file, reason: 'size'});
      else if (!multiple && accepted.length >= 1) rejected.push({file, reason: 'count'});
      else accepted.push(file);
    }
    if (accepted.length) onFiles(accepted);
    if (rejected.length) onReject?.(rejected);
  }

  return (
    <label
      htmlFor={id}
      data-slot="dropzone"
      data-over={over || undefined}
      data-disabled={disabled || undefined}
      onDragOver={e => { if (!disabled) { e.preventDefault(); setOver(true); } }}
      onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(false); }}
      onDrop={e => { e.preventDefault(); setOver(false); if (!disabled) take(e.dataTransfer.files); }}
      className={cn(
        'flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-panel border border-dashed border-control bg-surface px-6 py-10 text-center',
        'transition-[background-color,border-color] duration-(--dur-instant) ease-out hover:not-data-disabled:bg-surface-2',
        'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring',
        'data-over:border-accent-line data-over:bg-accent-wash data-disabled:cursor-not-allowed data-disabled:border-line-strong data-disabled:text-fg-disabled',
        className,
      )}
      {...props}
    >
      <input
        ref={input}
        data-slot="dropzone-input"
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        onChange={e => { if (e.currentTarget.files) take(e.currentTarget.files); e.currentTarget.value = ''; }}
      />
      {children ?? (
        <>
          <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-full bg-page text-fg-2 in-data-disabled:text-fg-disabled"><Icon icon={Upload} size={20}/></span>
          <span className="text-sm font-medium text-fg in-data-disabled:text-fg-disabled">{title}</span>
          <span className="text-xs text-fg-3 in-data-disabled:text-fg-disabled">or <span className="underline underline-offset-2">choose from your device</span></span>
          {hint && <span className="text-xs text-fg-3 in-data-disabled:text-fg-disabled">{hint}</span>}
        </>
      )}
    </label>
  );
}

export {Dropzone, type DropzoneProps, type RejectReason};
