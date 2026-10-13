'use client';

import * as React from 'react';
import {Icon, Undo, Close} from '../../icon';
import {cn, withDefaults} from '../../lib/utils';
import {formatBytes} from '../../lib/format';
import {
  Attachment as AttachmentChip, AttachmentAction, AttachmentActions, AttachmentContent, AttachmentDescription, AttachmentGlyph, AttachmentMedia,
  AttachmentProgress, AttachmentTitle, acceptTokens, dragVerdict,
} from '../../ui/attachment';

type Attachment = {
  id: string;
  name: string;
  size?: number;
  progress?: number;
  status: 'uploading' | 'done' | 'error';
  error?: string;
};

function accepts(file: File, accept?: string) {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  return accept.split(',').map(s => s.trim().toLowerCase()).filter(Boolean).some(rule =>
    rule.startsWith('.') ? name.endsWith(rule) : rule.endsWith('/*') ? file.type.startsWith(rule.slice(0, -1)) : file.type === rule);
}

function useFileDrop(enabled: boolean, onFiles: (files: File[]) => void, accept?: string) {
  const depth = React.useRef(0);
  const [dragging, setDragging] = React.useState<false | 'accept' | 'reject'>(false);
  React.useEffect(() => {
    if (!dragging) return;
    const reset = () => { depth.current = 0; setDragging(false); };
    window.addEventListener('dragend', reset);
    window.addEventListener('blur', reset);
    return () => { window.removeEventListener('dragend', reset); window.removeEventListener('blur', reset); };
  }, [dragging]);
  React.useEffect(() => {
    if (enabled) return;
    depth.current = 0;
    setDragging(false);
  }, [enabled]);
  const hasFiles = (event: React.DragEvent) => Array.from(event.dataTransfer.types).includes('Files');
  const dropProps = enabled ? {
    onDragEnter: (event: React.DragEvent) => { if (!hasFiles(event)) return; event.preventDefault(); depth.current += 1; setDragging(dragVerdict(acceptTokens(accept), event.dataTransfer.items)); },
    onDragOver: (event: React.DragEvent) => { if (!hasFiles(event)) return; event.preventDefault(); event.dataTransfer.dropEffect = dragging === 'reject' ? 'none' : 'copy'; },
    onDragLeave: (event: React.DragEvent) => { if (!hasFiles(event)) return; depth.current = Math.max(0, depth.current - 1); if (!depth.current) setDragging(false); },
    onDrop: (event: React.DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      depth.current = 0;
      setDragging(false);
      onFiles(Array.from(event.dataTransfer.files));
    },
  } : {};
  return {dragging: enabled && dragging, dropProps};
}

type PromptAttachmentLabels = {
  uploading?: (percent: number) => string;
  uploadFailed?: string;
  attached?: string;
  retryFile?: (name: string) => string;
  cancelUpload?: (name: string) => string;
  removeFile?: (name: string) => string;
};

const attachmentLabels: Required<PromptAttachmentLabels> = {
  uploading: percent => `Uploading ${percent}%`,
  uploadFailed: 'Upload failed',
  attached: 'Attached',
  retryFile: name => `Retry ${name}`,
  cancelUpload: name => `Cancel upload of ${name}`,
  removeFile: name => `Remove ${name}`,
};

type PromptAttachmentProps = Omit<React.ComponentProps<'div'>, 'children'> & {
  attachment: Attachment;
  onRemove?: () => void;
  onRetry?: () => void;
  labels?: PromptAttachmentLabels;
};

function PromptAttachment({attachment, onRemove, onRetry, labels, className, ...props}: PromptAttachmentProps) {
  const words = withDefaults(attachmentLabels, labels);
  const {name, size, progress = 0, status, error} = attachment;
  const percent = Math.round(Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0)) * 100);
  return <AttachmentChip
    data-slot="prompt-attachment"
    state={status}
    title={name}
    className={cn('max-w-(--attachment-max)', className)}
    {...props}
  >
    <AttachmentMedia><AttachmentGlyph type="" name={name}/></AttachmentMedia>
    <AttachmentContent>
      <AttachmentTitle>{name}</AttachmentTitle>
      <AttachmentDescription>
        {status === 'uploading' ? words.uploading(percent) : status === 'error' ? (error ?? words.uploadFailed) : size !== undefined ? formatBytes(size) : words.attached}
      </AttachmentDescription>
    </AttachmentContent>
    {(onRemove || (status === 'error' && onRetry)) && <AttachmentActions>
      {status === 'error' && onRetry && <AttachmentAction aria-label={words.retryFile(name)} onClick={onRetry}><Icon icon={Undo} size={16}/></AttachmentAction>}
      {onRemove && <AttachmentAction aria-label={status === 'uploading' ? words.cancelUpload(name) : words.removeFile(name)} onClick={onRemove}><Icon icon={Close} size={16}/></AttachmentAction>}
    </AttachmentActions>}
    {status === 'uploading' && <AttachmentProgress value={percent} label={name} aria-hidden/>}
  </AttachmentChip>;
}

export {PromptAttachment, accepts, useFileDrop, type Attachment, type PromptAttachmentProps, type PromptAttachmentLabels};
