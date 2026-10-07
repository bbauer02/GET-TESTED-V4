'use client';

import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { formHelperTextClasses } from '@mui/material/FormHelperText';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function InvoiceTableToolbar({ filters, options, dateError, onResetPage }) {
  const { t } = useTranslate('invoice');
  const { state: currentFilters, setState: updateFilters } = filters;

  const handleFilterName = useCallback(
    (event) => {
      onResetPage();
      updateFilters({ name: event.target.value });
    },
    [onResetPage, updateFilters]
  );

  const handleFilterScope = useCallback(
    (event) => {
      onResetPage();
      updateFilters({ scope: event.target.value });
    },
    [onResetPage, updateFilters]
  );

  const handleFilterStartDate = useCallback(
    (newValue) => {
      onResetPage();
      updateFilters({ startDate: newValue });
    },
    [onResetPage, updateFilters]
  );

  const handleFilterEndDate = useCallback(
    (newValue) => {
      onResetPage();
      updateFilters({ endDate: newValue });
    },
    [onResetPage, updateFilters]
  );

  return (
    <Box
      sx={{
        p: 2.5,
        gap: 2,
        display: 'flex',
        pr: { xs: 2.5, md: 1 },
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'flex-end', md: 'center' },
      }}
    >
      {!!options?.scopes?.length && (
        <FormControl sx={{ flexShrink: 0, width: { xs: 1, md: 220 } }}>
          <InputLabel id="filter-scope-label">{t('filter_scope')}</InputLabel>
          <Select
            labelId="filter-scope-label"
            value={currentFilters.scope}
            onChange={handleFilterScope}
            label={t('filter_scope')}
          >
            {options.scopes.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      <DatePicker
        label={t('filter_start_date')}
        value={currentFilters.startDate}
        onChange={handleFilterStartDate}
        slotProps={{ field: { clearable: true } }}
        sx={{ maxWidth: { md: 180 } }}
      />

      <DatePicker
        label={t('filter_end_date')}
        value={currentFilters.endDate}
        onChange={handleFilterEndDate}
        slotProps={{
          field: { clearable: true },
          textField: {
            error: dateError,
            helperText: dateError ? t('filter_date_error') : null,
          },
        }}
        sx={{
          maxWidth: { md: 180 },
          [`& .${formHelperTextClasses.root}`]: {
            bottom: { md: -40 },
            position: { md: 'absolute' },
          },
        }}
      />

      <TextField
        fullWidth
        value={currentFilters.name}
        onChange={handleFilterName}
        placeholder={t('search_placeholder')}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          },
        }}
      />
    </Box>
  );
}
