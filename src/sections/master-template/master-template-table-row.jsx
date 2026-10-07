import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

export function MasterTemplateTableRow({ row, onEdit, onDelete }) {
  const popover = usePopover();
  const confirm = useBoolean();

  const typeLabel = row.documentType?.label || '—';

  return (
    <>
      <TableRow hover>
        <TableCell>{row.label}</TableCell>
        <TableCell>
          <Label variant="soft" color="info">
            {typeLabel}
          </Label>
        </TableCell>
        <TableCell align="right" sx={{ px: 1 }}>
          <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem
            onClick={() => {
              popover.onClose();
              onEdit();
            }}
          >
            <Iconify icon="solar:pen-bold" />
            Modifier
          </MenuItem>
          <MenuItem
            onClick={() => {
              popover.onClose();
              confirm.onTrue();
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            Supprimer
          </MenuItem>
        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Supprimer"
        content="Etes-vous sur de vouloir supprimer ce modele maitre ?"
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              onDelete();
              confirm.onFalse();
            }}
          >
            Supprimer
          </Button>
        }
      />
    </>
  );
}
