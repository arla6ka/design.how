'use client';

import {useEffect, useRef, useState} from 'react';
import {Icon, Check, Copy, Warning} from '../icon';
import {cn} from '../lib/utils';
import {Button, type ButtonProps} from './button';

type CopyState = 'idle' | 'fetching' | 'copied' | 'failed';

async function writeFetched(result: Promise<string>): Promise<string> {
  let text = '';
  const blob = result.then(t => { text = t; return new Blob([t], {type: 'text/plain'}); });
  if (typeof ClipboardItem !== 'undefined' && typeof navigator.clipboard?.write === 'function') {
    try {
      await navigator.clipboard.write([new ClipboardItem({'text/plain': blob})]);
      return text;
    } catch {
    }
  }
  text = await result;
  await navigator.clipboard.writeText(text);
  return text;
}

type CopyButtonProps = Omit<ButtonProps, 'onClick' | 'onCopy' | 'children' | 'pending' | 'pendingLabel' | 'value'> & {
  value: string | (() => string | Promise<string>);
  label?: string;
  showLabel?: boolean;
  timeout?: number;
  onCopy?: (value: string) => void;
  forceState?: Exclude<CopyState, 'idle'>;
};

function CopyButton({value, label, showLabel = false, timeout = 1600, onCopy, forceState, variant = 'ghost', size, className, ...props}: CopyButtonProps) {
  const [live, setState] = useState<CopyState>('idle');
  const [announcement, setAnnouncement] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const frame = useRef(0);
  useEffect(() => () => { clearTimeout(timer.current); cancelAnimationFrame(frame.current); }, []);
  const state = forceState ?? live;

  const announce = (message: string) => {
    cancelAnimationFrame(frame.current);
    setAnnouncement('');
    frame.current = requestAnimationFrame(() => setAnnouncement(message));
  };

  const copy = async () => {
    clearTimeout(timer.current);
    try {
      let text: string;
      const result = typeof value === 'function' ? value() : value;
      if (typeof result === 'string') {
        text = result;
        await navigator.clipboard.writeText(text);
      } else {
        const writing = writeFetched(result);
        setState('fetching');
        text = await writing;
      }
      setState('copied');
      announce(label ? `${label} copied` : 'Copied');
      onCopy?.(text);
    } catch {
      setState('failed');
      announce('Could not copy. Select the text and copy it by hand.');
    }
    timer.current = setTimeout(() => { setState('idle'); setAnnouncement(''); }, timeout);
  };

  const s = size ?? (showLabel ? 'sm' : 'icon-sm');
  const glyph = state === 'copied' ? Check : state === 'failed' ? Warning : Copy;
  const iconSize = s === 'sm' || s === 'icon-sm' ? 12 : s === 'lg' || s === 'icon-lg' ? 16 : 14;

  return <>
    <Button
      data-slot="copy-button"
      data-state={state}
      variant={variant}
      size={s}
      aria-label={label ? `Copy ${label}` : 'Copy'}
      pending={state === 'fetching'}
      onClick={copy}
      className={className}
      {...props}
    >
      <Icon icon={glyph} size={iconSize}/>
      {showLabel && <span aria-hidden className="grid [grid-template-areas:'stack']">
        <span className={cn('[grid-area:stack]', state !== 'idle' && state !== 'fetching' && 'invisible')}>Copy</span>
        <span className={cn('[grid-area:stack]', state !== 'copied' && 'invisible')}>Copied</span>
        <span className={cn('[grid-area:stack]', state !== 'failed' && 'invisible')}>Failed</span>
      </span>}
    </Button>
    <span role="status" data-slot="copy-button-status" className="sr-only">{announcement}</span>
  </>;
}

export {CopyButton, type CopyButtonProps};
