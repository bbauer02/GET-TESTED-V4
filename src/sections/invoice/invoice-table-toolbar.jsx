'use client';

import { useCallback } from 'react';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { formHelperTextClasses } from '@mui/material/FormHelperText';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function InvoiceTableToolbar({ filters, dateError, onResetPage }) {
  const { t } = useTranslate('invoice');
  const { state: currentFilters, setState: updateFilters } = filters;

  const handleFilterName = useCallback(
    (event) => {
      onResetPage();
      updateFilters({ name: event.target.value });
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
      <DatePicker
        label={t('filter_start_date')}
        value={currentFilters.startDate}
        onChange={handleFilterStartDate}
        sx={{ maxWidth: { md: 180 } }}
      />

      <DatePicker
        label={t('filter_end_date')}
        value={currentFilters.endDate}
        onChange={handleFilterEndDate}
        slotProps={{
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
