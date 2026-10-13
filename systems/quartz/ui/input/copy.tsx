'use client';

import type {FocusEvent} from 'react';
import {cn} from '../../lib/utils';
import {EMPTY_VALUE} from '../../lib/format';
import {CopyButton} from '../copy-button';
import {InputControl, InputPrefix, InputRoot, InputSuffix, actionClass, splitBox, useOff, type BoxProps, type NativeProps} from './parts';

type CopyModeProps = BoxProps & Omit<NativeProps, 'onCopy'> & {
  mode: 'copy';
  value: string;
  copyLabel?: string;
  onCopy?: (value: string) => void;
  mono?: boolean;
  forceCopyState?: 'copied' | 'failed';
};

function CopyMode({mode: _mode, size = 'default', prefix, suffix: _suffix, className, controlClassName, value, copyLabel = 'Copy', onCopy, mono = true, forceCopyState, disabled: disabledProp, ...all}: CopyModeProps) {
  const disabled = useOff(disabledProp);
  const {box, rest} = splitBox(all);
  return <InputRoot size={size} disabled={disabled} readOnly className={className} data-mode="copy" {...box}>
    {prefix !== undefined && <InputPrefix>{prefix}</InputPrefix>}
    <InputControl
      readOnly
      value={value}
      disabled={disabled}
      placeholder={EMPTY_VALUE}
      onFocus={(e: FocusEvent<HTMLInputElement>) => e.currentTarget.select()}
      className={cn('truncate', mono && 'type-code pointer-coarse:type-code-touch', controlClassName)}
      {...rest}
    />
    <InputSuffix>
      <CopyButton
        value={value}
        label={copyLabel === 'Copy' ? undefined : copyLabel.replace(/^Copy\s*/, '')}
        showLabel={size !== 'sm'}
        onCopy={onCopy as never}
        forceState={forceCopyState}
        disabled={disabled || !value}
        className={cn('bg-transparent hover:not-data-disabled:bg-hover', actionClass(size, size === 'sm'))}
      />
    </InputSuffix>
  </InputRoot>;
}

export {CopyMode, type CopyModeProps};
