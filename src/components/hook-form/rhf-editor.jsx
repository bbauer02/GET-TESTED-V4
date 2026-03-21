'use client';

import { Controller, useFormContext } from 'react-hook-form';

import { Editor } from '../editor';
import { HelperText } from './help-text';

// ----------------------------------------------------------------------

export function RHFEditor({ name, helperText, ...other }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Editor
          value={field.value}
          onChange={field.onChange}
          error={!!error}
          helperText={error?.message ?? helperText}
          {...other}
        />
      )}
    />
  );
}
