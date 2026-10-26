'use client';

import {useEffect, useRef, useState} from 'react';
import {Icon, Checkmark, Copy, WarningAlt} from '../icon';
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

type CopyButtonProps = Omit<ButtonProps, 'onClick' | 'onCopy' | 'children' | 'pending' | 'pendingLabel' | 'value' | 'variant'> & {
  value: string | (() => string | Promise<string>);
  label?: string;
  showLabel?: boolean;
  variant?: 'ghost' | 'secondary';
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
  const glyph = state === 'copied' ? Checkmark : state === 'failed' ? WarningAlt : Copy;

  return <>
    <Button
      data-slot="copy-button"
      data-state={state}
      variant={variant}
      size={s}
      aria-label={label ? `Copy ${label}` : 'Copy'}
      aria-busy={state === 'fetching' || undefined}
      onClick={copy}
      className={cn('data-[state=failed]:text-fail-text', className)}
      {...props}
    >
      {state === 'fetching' ? <span aria-hidden className="pending shrink-0"/> : <Icon icon={glyph}/>}
      {showLabel && <span aria-hidden>{state === 'copied' ? 'Copied' : state === 'failed' ? 'Failed' : 'Copy'}</span>}
    </Button>
    <span role="status" data-slot="copy-button-status" className="sr-only">{announcement}</span>
  </>;
}

export {CopyButton, type CopyButtonProps};
