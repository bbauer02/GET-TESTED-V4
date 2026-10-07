'use client';

import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

export function InstituteTableRow({ row, selected, onSelectRow, onDeleteRow }) {
  const { t } = useTranslate('institute');
  const menuActions = usePopover();
  const confirmDialog = useBoolean();

  const renderMenuActions = () => (
    <CustomPopover
      open={menuActions.open}
      anchorEl={menuActions.anchorEl}
      onClose={menuActions.onClose}
      slotProps={{ arrow: { placement: 'right-top' } }}
    >
      <MenuList>
        <MenuItem
          component={RouterLink}
          href={paths.dashboard.institute.profile(row.id)}
          onClick={menuActions.onClose}
        >
          <Iconify icon="solar:eye-bold" />
          {t('menu_view')}
        </MenuItem>

        <MenuItem
          component={RouterLink}
          href={paths.dashboard.institute.edit(row.id)}
          onClick={menuActions.onClose}
        >
          <Iconify icon="solar:pen-bold" />
          {t('menu_edit')}
        </MenuItem>

        <MenuItem
          onClick={() => {
            confirmDialog.onTrue();
            menuActions.onClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" />
          {t('menu_delete')}
        </MenuItem>
      </MenuList>
    </CustomPopover>
  );

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title={t('delete_title')}
      content={t('delete_confirm_single')}
      action={
        <Button variant="contained" color="error" onClick={onDeleteRow}>
          {t('delete_button')}
        </Button>
      }
    />
  );

  return (
    <>
      <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1}>
        <TableCell padding="checkbox">
          <Checkbox
            checked={selected}
            onClick={onSelectRow}
            slotProps={{
              input: {
                id: `${row.id}-checkbox`,
                'aria-label': `${row.id} checkbox`,
              },
            }}
          />
        </TableCell>

        <TableCell>
          <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
            <Link
              component={RouterLink}
              href={paths.dashboard.institute.profile(row.id)}
              color="inherit"
              underline="hover"
              sx={{ fontWeight: 'fontWeightSemiBold' }}
            >
              {row.label}
            </Link>
            {row.address?.address1 && (
              <Box component="span" sx={{ color: 'text.disabled' }}>
                {row.address.address1}
              </Box>
            )}
          </Stack>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          {row.address?.city || '—'}
          {row.address?.zipcode && (
            <Box component="span" sx={{ color: 'text.disabled', ml: 0.5 }}>
              ({row.address.zipcode})
            </Box>
          )}
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          {row.siteweb ? (
            <Link
              href={row.siteweb.startsWith('http') ? row.siteweb : `https://${row.siteweb}`}
              target="_blank"
              rel="noopener"
              color="inherit"
              underline="always"
            >
              {row.siteweb}
            </Link>
          ) : (
            '—'
          )}
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.siren || '—'}</TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.siret || '—'}</TableCell>

        <TableCell>
          {row.stripeAccount ? (
            <Label
              variant="soft"
              color={row.stripeAccount.chargesEnabled ? 'success' : 'warning'}
            >
              {row.stripeAccount.chargesEnabled ? t('stripe_active') : t('stripe_pending')}
            </Label>
          ) : (
            <Label variant="soft" color="default">
              {t('stripe_not_connected')}
            </Label>
          )}
        </TableCell>

        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color={menuActions.open ? 'inherit' : 'default'}
              onClick={menuActions.onOpen}
            >
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          </Box>
        </TableCell>
      </TableRow>

      {renderMenuActions()}
      {renderConfirmDialog()}
    </>
  );
}
