'use client';

import * as React from 'react';
import {Icon, Microphone, MicrophoneOff} from '../../icon';
import {Button} from '../../ui/button';
import {Tooltip, TooltipContent, TooltipTrigger} from '../../ui/tooltip';
import {cn, mergeClass, withDefaults} from '../../lib/utils';

type MicState = 'idle' | 'listening' | 'denied' | 'unsupported';

type PromptInputMicLabels = {
  start?: string;
  stop?: string;
  blocked?: string;
  unavailable?: string;
  startTip?: string;
  stopTip?: string;
  blockedTip?: string;
  unavailableTip?: string;
};

const micLabels: Required<PromptInputMicLabels> = {
  start: 'Start voice input',
  stop: 'Stop voice input',
  blocked: 'Voice input blocked',
  unavailable: 'Voice input unavailable',
  startTip: 'Voice input',
  stopTip: 'Stop listening',
  blockedTip: 'Microphone access is blocked. Allow it in the browser\'s site settings, then press again.',
  unavailableTip: 'This browser can\'t record audio. Type your message instead.',
};
const micBars = [0.6, 1, 0.75];

type PromptInputMicProps = Omit<React.ComponentProps<typeof Button>, 'size' | 'variant' | 'children' | 'pending'> & {
  state?: MicState;
  level?: number;
  onListeningChange?: (listening: boolean) => void;
  size?: 'sm' | 'default' | 'lg';
  reason?: string;
  tooltip?: boolean;
  labels?: PromptInputMicLabels;
};

function PromptInputMic({state = 'idle', level = 0, onListeningChange, size = 'sm', reason, tooltip = true, labels, className, onClick, ...props}: PromptInputMicProps) {
  const words = withDefaults(micLabels, labels);
  const descriptionId = React.useId();
  const listening = state === 'listening';
  const blocked = state === 'denied' || state === 'unsupported';
  const name = {idle: words.start, listening: words.stop, denied: words.blocked, unsupported: words.unavailable}[state];
  const tip = blocked && reason ? reason : {idle: words.startTip, listening: words.stopTip, denied: words.blockedTip, unsupported: words.unavailableTip}[state];
  const clamped = Math.min(1, Math.max(0, Number.isFinite(level) ? level : 0));
  const button = <Button
    data-slot="prompt-input-mic"
    data-state={state}
    variant={listening ? 'primary' : 'ghost'}
    size={size === 'sm' ? 'icon-sm' : size === 'lg' ? 'icon-lg' : 'icon'}
    aria-label={name}
    aria-pressed={state === 'unsupported' ? undefined : listening}
    aria-describedby={blocked ? descriptionId : undefined}
    disabled={state === 'unsupported'}
    focusableWhenDisabled={state === 'unsupported'}
    onClick={event => { onClick?.(event); if (!event.defaultPrevented && state !== 'unsupported') onListeningChange?.(!listening); }}
    className={mergeClass('relative', className)}
    {...props}
  >
    {listening
      ? <span aria-hidden data-slot="prompt-input-mic-level" className={cn('flex items-center justify-center gap-0.5', size === 'lg' ? 'size-5' : 'size-4')}>
          {micBars.map((peak, i) => <span
            key={i}
            style={{'--live': `${(0.2 + 0.8 * clamped * peak) * 100}%`, '--rest': `${peak * 70}%`} as React.CSSProperties}
            className="h-(--live) w-1 bg-current transition-[height] duration-(--dur-fast) ease-(--ease-step) motion-reduce:h-(--rest) motion-reduce:transition-none"
          />)}
        </span>
      : <Icon icon={blocked ? MicrophoneOff : Microphone} size={size === 'lg' ? 20 : 16}/>}
  </Button>;
  return <>
    {tooltip ? <Tooltip><TooltipTrigger render={button}/><TooltipContent className={blocked ? 'max-w-60' : undefined}>{tip}</TooltipContent></Tooltip> : button}
    {blocked && <span id={descriptionId} hidden>{tip}</span>}
  </>;
}

export {PromptInputMic, type PromptInputMicProps, type PromptInputMicLabels, type MicState};
