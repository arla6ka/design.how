'use client';

import * as React from 'react';
import {Icon, ArrowUp} from '../icon';
import {Button, type ButtonProps} from '../ui/button';
import {cn, mergeClass} from '../lib/utils';

type SendStatus = 'ready' | 'submitted' | 'streaming' | 'stopping' | 'error';

type SendButtonLabels = {
  send?: string;
  stop?: string;
  stopping?: string;
  sendAgain?: string;
};

type SendButtonProps = Omit<ButtonProps, 'children' | 'pending' | 'pendingLabel' | 'variant'> & {
  status?: SendStatus;
  onStop?: (generation: string | number | undefined) => void;
  empty?: boolean;
  blockedReason?: string;
  generation?: string | number;
  labels?: SendButtonLabels;
};

const sendLabels: Required<SendButtonLabels> = {send: 'Send', stop: 'Stop', stopping: 'Stopping', sendAgain: 'Send again'};
const working = (status: SendStatus) => status === 'submitted' || status === 'streaming' || status === 'stopping';

function SendButton({status = 'ready', onStop, empty, blockedReason, generation, labels, disabled, onClick, size = 'icon-sm', className, type, ...props}: SendButtonProps) {
  const words = {...sendLabels, ...labels};
  const names: Record<SendStatus, string> = {ready: words.send, submitted: words.stop, streaming: words.stop, stopping: words.stopping, error: words.sendAgain};
  const reasonId = React.useId();
  const stopped = React.useRef<string | number | undefined | null>(null);
  const [stopPressed, setStopPressed] = React.useState(false);
  React.useEffect(() => {
    if (!working(status)) { stopped.current = null; setStopPressed(false); }
  }, [status]);
  React.useEffect(() => { stopped.current = null; setStopPressed(false); }, [generation]);

  const isWorking = working(status);
  const shown: SendStatus = isWorking && stopPressed ? 'stopping' : status;
  const blocked = !isWorking && !!blockedReason;
  const nothing = !isWorking && !!empty && !blocked;
  const stop = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (shown === 'stopping' || stopped.current === (generation ?? 'current')) return;
    stopped.current = generation ?? 'current';
    setStopPressed(true);
    onStop?.(generation);
  };
  const icon = size === 'icon-lg' ? 16 : size === 'icon' ? 14 : 12;

  return <>
    <Button
      data-slot="send-button"
      data-state={shown}
      data-empty={nothing || undefined}
      variant="primary"
      type={isWorking ? 'button' : type ?? 'submit'}
      size={size}
      disabled={isWorking ? disabled : disabled || empty || blocked}
      focusableWhenDisabled={blocked || shown === 'stopping'}
      aria-busy={shown === 'stopping' || undefined}
      aria-label={names[shown]}
      aria-describedby={blocked ? reasonId : undefined}
      aria-keyshortcuts={isWorking ? 'Escape' : 'Enter'}
      onClick={isWorking ? stop : onClick}
      className={mergeClass(shown === 'stopping' && 'cursor-progress', className)}
      {...props}
    >
      {isWorking
        ? <span aria-hidden data-slot="send-button-stop" className={cn('size-2 rounded-[1.5px] bg-current forced-colors:bg-[CanvasText]', shown === 'stopping' && 'opacity-40')}/>
        : <Icon icon={ArrowUp} size={icon}/>}
    </Button>
    {blocked && <span id={reasonId} hidden>{blockedReason}</span>}
  </>;
}

export {SendButton, type SendButtonProps, type SendButtonLabels, type SendStatus};
