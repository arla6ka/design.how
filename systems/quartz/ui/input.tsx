'use client';

import {CopyMode, type CopyModeProps} from './input/copy';
import {NumberMode, autoStep, type NumberModeProps} from './input/number';
import {OtpMode, type OtpModeProps} from './input/otp';
import {InputAction, InputControl, InputPrefix, InputRoot, InputSuffix, splitBox, type BoxProps, type InputRootProps, type NativeProps, type StringValue} from './input/parts';
import {PasswordMode, generatePassword, type PasswordModeProps} from './input/password';
import {SearchMode, type SearchModeProps} from './input/search';
import {SecretMode, maskSecret, type SecretModeProps} from './input/secret';

type TextModeProps = BoxProps & NativeProps & StringValue & {
  mode?: 'text';
  type?: string;
};

type InputProps = TextModeProps | PasswordModeProps | SecretModeProps | CopyModeProps | SearchModeProps | NumberModeProps | OtpModeProps;
type InputMode = NonNullable<InputProps['mode']>;

function Input(props: InputProps) {
  switch (props.mode) {
    case 'password': return <PasswordMode {...props}/>;
    case 'secret': return <SecretMode {...props}/>;
    case 'copy': return <CopyMode {...props}/>;
    case 'search': return <SearchMode {...props}/>;
    case 'number': return <NumberMode {...props}/>;
    case 'otp': return <OtpMode {...props}/>;
    default: return <TextMode {...props}/>;
  }
}

function TextMode({mode: _mode, size = 'default', prefix, suffix, className, controlClassName, disabled, readOnly, type = 'text', ...all}: TextModeProps) {
  const {box, rest} = splitBox(all);
  return <InputRoot size={size} disabled={disabled} readOnly={readOnly} invalid={rest['aria-invalid'] === true || rest['aria-invalid'] === 'true'} className={className} data-mode="text" {...box}>
    {prefix !== undefined && <InputPrefix>{prefix}</InputPrefix>}
    <InputControl type={type} disabled={disabled} readOnly={readOnly} className={controlClassName} {...rest}/>
    {suffix !== undefined && <InputSuffix>{suffix}</InputSuffix>}
  </InputRoot>;
}

export {
  Input,
  InputAction,
  InputControl,
  InputPrefix,
  InputRoot,
  InputSuffix,
  autoStep,
  generatePassword,
  maskSecret,
  type InputMode,
  type InputProps,
  type InputRootProps,
  type SearchModeProps,
};
