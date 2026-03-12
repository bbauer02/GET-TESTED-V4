import { Controller, useFormContext } from 'react-hook-form';

import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';

// ----------------------------------------------------------------------

export function RHFAutocomplete({ name, label, slotProps, helperText, placeholder, ...other }) {
  const { control, setValue } = useFormContext();

  const { textField, ...otherSlotProps } = slotProps ?? {};

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Autocomplete
          {...field}
          id={`${name}-rhf-autocomplete`}
          onChange={(event, newValue) => setValue(name, newValue, { shouldValidate: true })}
          renderInput={(params) => {
            const startAdornment = textField?.slotProps?.input?.startAdornment;

            return (
              <TextField
                {...params}
                {...textField}
                label={label}
                placeholder={placeholder}
                error={!!error}
                helperText={error?.message ?? helperText}
                slotProps={{
                  ...textField?.slotProps,
                  input: {
                    ...params.InputProps,
                    ...textField?.slotProps?.input,
                    startAdornment: startAdornment ?? params.InputProps?.startAdornment,
                  },
                  htmlInput: {
                    ...params.inputProps,
                    ...textField?.slotProps?.htmlInput,
                    autoComplete: 'new-password',
                  },
                }}
              />
            );
          }}
          slotProps={{
            ...otherSlotProps,
            chip: {
              size: 'small',
              variant: 'soft',
              ...otherSlotProps?.chip,
            },
          }}
          {...other}
        />
      )}
    />
  );
}
