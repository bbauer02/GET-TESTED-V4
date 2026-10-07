'use client';

import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

export function ExamTableRow({ row, assessmentLabel, levelLabel }) {
  const { t } = useTranslate('exam');
  const menuActions = usePopover();

  const price = row.price;
  const priceDisplay = price?.amount != null ? `${price.amount} ${price.currency || 'EUR'}` : '-';

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
          href={paths.dashboard.exam.edit(row.id)}
          onClick={menuActions.onClose}
        >
          <Iconify icon="solar:pen-bold" />
          {t('menu_edit')}
        </MenuItem>
      </MenuList>
    </CustomPopover>
  );

  return (
    <>
      <TableRow hover tabIndex={-1}>
        <TableCell sx={{ fontWeight: 'fontWeightSemiBold' }}>{row.label}</TableCell>

        <TableCell>{assessmentLabel || '-'}</TableCell>

        <TableCell>{levelLabel || '-'}</TableCell>

        <TableCell>
          <Label variant="soft" color={row.isWritten ? 'info' : 'default'}>
            {row.isWritten ? t('yes') : t('no')}
          </Label>
        </TableCell>

        <TableCell>
          <Label variant="soft" color={row.isOption ? 'warning' : 'default'}>
            {row.isOption ? t('yes') : t('no')}
          </Label>
        </TableCell>

        <TableCell>{row.coeff ?? '-'}</TableCell>

        <TableCell>{priceDisplay}</TableCell>

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
    </>
  );
}
