'use client';


import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Avatar from '@mui/material/Avatar';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';

import { RouterLink } from 'src/routes/components';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

// STATUS_MAP moved inside component for i18n

// ----------------------------------------------------------------------

export function InvoiceTableRow({ row, detailsHref, showSeller, hideType }) {
  const { t } = useTranslate('invoice');

  const STATUS_MAP = {
    DRAFT: { label: t('status_draft'), color: 'default' },
    ISSUED: { label: t('status_issued'), color: 'warning' },
    PAID: { label: t('status_paid'), color: 'success' },
    CANCELLED: { label: t('status_cancelled'), color: 'error' },
  };

  const statusInfo = STATUS_MAP[row.status] || { label: row.status, color: 'default' };

  const displayName = showSeller ? (row.seller?.name || '-') : (row.buyer?.name || '-');

  return (
    <TableRow hover>
      <TableCell>
        <Box sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
          <Avatar alt={displayName}>{displayName.charAt(0).toUpperCase()}</Avatar>

          <ListItemText
            primary={displayName}
            secondary={
              <Link component={RouterLink} href={detailsHref} color="inherit">
                {row.invoiceNumber || t('status_draft')}
              </Link>
            }
            slotProps={{
              primary: { noWrap: true, sx: { typography: 'body2' } },
              secondary: {
                sx: { color: 'text.disabled', '&:hover': { color: 'text.secondary' } },
              },
            }}
          />
        </Box>
      </TableCell>

      <TableCell>
        <ListItemText
          primary={fDate(row.invoiceDate)}
          slotProps={{
            primary: { noWrap: true, sx: { typography: 'body2' } },
          }}
        />
      </TableCell>

      <TableCell>{fCurrency(row.totalTTC)}</TableCell>

      <TableCell>
        <Label variant="soft" color={statusInfo.color}>
          {statusInfo.label}
        </Label>
      </TableCell>

      {!hideType && (
        <TableCell>
          <Label variant="soft" color={row.businessType === 'PLATFORM_COMMISSION' ? 'info' : 'default'}>
            {row.businessType === 'PLATFORM_COMMISSION' ? t('type_commission') : t('type_enrollment')}
          </Label>
        </TableCell>
      )}

      <TableCell align="right" sx={{ px: 1 }}>
        <IconButton
          component={RouterLink}
          href={detailsHref}
          color="default"
        >
          <Iconify icon="solar:eye-bold" />
        </IconButton>
      </TableCell>
    </TableRow>
  );
}
