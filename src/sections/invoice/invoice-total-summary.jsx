'use client';

import Box from '@mui/material/Box';

import { fCurrency } from 'src/utils/format-number';

import { useTranslate } from 'src/locales';

// ----------------------------------------------------------------------

export function InvoiceTotalSummary({ sx, totalHT, totalTVA, totalTTC, ...other }) {
  const { t } = useTranslate('invoice');
  const rowStyles = {
    display: 'flex',
    alignItems: 'center',
  };

  const labelStyles = {
    color: 'text.secondary',
  };

  const valueStyles = {
    width: 160,
  };

  return (
    <Box
      sx={[
        {
          mt: 3,
          gap: 2,
          display: 'flex',
          textAlign: 'right',
          typography: 'body2',
          alignItems: 'flex-end',
          flexDirection: 'column',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Box sx={rowStyles}>
        <Box component="span" sx={labelStyles}>
          {t('total_ht')}
        </Box>
        <Box component="span" sx={[valueStyles, { fontWeight: 'fontWeightSemiBold' }]}>
          {fCurrency(totalHT) || '-'}
        </Box>
      </Box>

      <Box sx={rowStyles}>
        <Box component="span" sx={labelStyles}>
          {t('total_tva')}
        </Box>
        <Box component="span" sx={valueStyles}>
          {fCurrency(totalTVA) || '-'}
        </Box>
      </Box>

      <Box sx={[rowStyles, { typography: 'subtitle1' }]}>
        <Box component="span">{t('total_ttc')}</Box>
        <Box component="span" sx={valueStyles}>
          {fCurrency(totalTTC) || '-'}
        </Box>
      </Box>
    </Box>
  );
}
