import Box from '@mui/material/Box';

import { fCurrency } from 'src/utils/format-number';

// ----------------------------------------------------------------------

export function InvoiceTotalSummary({ sx, totalHT, totalTVA, totalTTC, ...other }) {
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
          Total HT
        </Box>
        <Box component="span" sx={[valueStyles, { fontWeight: 'fontWeightSemiBold' }]}>
          {fCurrency(totalHT) || '-'}
        </Box>
      </Box>

      <Box sx={rowStyles}>
        <Box component="span" sx={labelStyles}>
          TVA
        </Box>
        <Box component="span" sx={valueStyles}>
          {fCurrency(totalTVA) || '-'}
        </Box>
      </Box>

      <Box sx={[rowStyles, { typography: 'subtitle1' }]}>
        <Box component="span">Total TTC</Box>
        <Box component="span" sx={valueStyles}>
          {fCurrency(totalTTC) || '-'}
        </Box>
      </Box>
    </Box>
  );
}
