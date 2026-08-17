import type {SelectProps as MUISelectProps} from '@mui/material';
import {
  FormControl,
  FormHelperText,
  InputLabel,
  Select as MUISelect
} from '@mui/material';
import React from 'react';

type SelectFieldProps = MUISelectProps & {
  helperText?: string,
  helperTextError?: boolean,
  scrollIntoView?: boolean,
};
export default function SelectField({
  scrollIntoView,
  helperText,
  helperTextError,
  required,
  onChange,
  onBlur,
  value,
  defaultValue,
  id,
  name,
  label,
  ...props
}: SelectFieldProps) {
  const fieldId = String(id || name || label || 'select')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const labelId = `${fieldId}-label`;

  return (
    <FormControl
      required={required}
      fullWidth
    >
      <InputLabel id={labelId}>{label}</InputLabel>
      <MUISelect
        id={fieldId}
        name={name}
        label={label}
        labelId={labelId}
        value={value || defaultValue} // Prevent usage of defaultValue
        inputRef={(inputRef) => {
          if (inputRef && scrollIntoView) {
            const scrollOptions: ScrollIntoViewOptions = {
              behavior: 'smooth',
              block: 'center',
              inline: 'center'
            };
            if (inputRef.node) {
              inputRef.node.scrollIntoView(scrollOptions);
              inputRef.focus();
            } else {
              const input = inputRef.querySelector('[tabindex="0"]') || inputRef;
              input.focus();
              input.scrollIntoView(scrollOptions);
            }
          }
        }}
        onChange={(...args) => {
          if (onChange) onChange(...args);
          // @ts-expect-error type mismatch
          if (onBlur) onBlur(args[0]);
        }}
        onBlur={onBlur}
        {...props}
      />
      {helperText && (
      <FormHelperText sx={{
        color: helperTextError ? 'red' : undefined
      }}
      >
        {helperText}
      </FormHelperText>
      )}
    </FormControl>
  );
}
