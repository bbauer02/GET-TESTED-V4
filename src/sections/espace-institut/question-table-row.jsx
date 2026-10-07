'use client';

import { usePopover } from 'minimal-shared/hooks';

import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

const TYPE_COLORS = {
  mcq: 'primary',
  fill_blank: 'info',
  highlight: 'warning',
  ordering: 'secondary',
  matching: 'success',
};

const TYPE_LABELS = {
  mcq: 'QCM',
  fill_blank: 'Texte à trous',
  highlight: 'Surlignage',
  ordering: 'Ordonnancement',
  matching: 'Appariement',
};

const STATUS_COLORS = {
  DRAFT: 'default',
  PRETESTING: 'warning',
  CALIBRATED: 'success',
  RETIRED: 'error',
};

const STATUS_LABELS = {
  DRAFT: 'Brouillon',
  PRETESTING: 'Pré-test',
  CALIBRATED: 'Calibrée',
  RETIRED: 'Retirée',
};

// ----------------------------------------------------------------------

export function QuestionTableRow({ question, canEdit, onView, onEdit, onRetire, onDelete }) {
  const popover = usePopover();

  const status = question.status || 'DRAFT';
  const type = question.type || question.questionType || 'mcq';

  return (
    <>
      <TableRow hover sx={{ cursor: 'pointer' }} onClick={onView}>
        <TableCell sx={{ fontWeight: 'fontWeightSemiBold', maxWidth: 260 }}>
          {question.label || '-'}
        </TableCell>

        <TableCell>
          <Label variant="soft" color={TYPE_COLORS[type] || 'default'}>
            {TYPE_LABELS[type] || type}
          </Label>
        </TableCell>

        <TableCell>{question.assessment?.label || '-'}</TableCell>

        <TableCell>{question.level?.label || '-'}</TableCell>

        <TableCell>
          <Label variant="soft" color={STATUS_COLORS[status] || 'default'}>
            {STATUS_LABELS[status] || status}
          </Label>
        </TableCell>

        <TableCell>{question.maxPoints ?? question.points ?? '-'}</TableCell>

        <TableCell>{question.timesAdministered ?? 0}</TableCell>

        <TableCell>
          {question.successRate != null ? `${Math.round(question.successRate * 100)}%` : '-'}
        </TableCell>

        <TableCell align="right" sx={{ px: 1 }} onClick={(e) => e.stopPropagation()}>
          <Tooltip title="Actions">
            <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
      >
        <MenuList>
          <MenuItem
            onClick={() => {
              popover.onClose();
              onView();
            }}
          >
            <Iconify icon="solar:eye-bold" />
            Voir
          </MenuItem>

          {canEdit && status !== 'RETIRED' && (
            <MenuItem
              onClick={() => {
                popover.onClose();
                onEdit();
              }}
            >
              <Iconify icon="solar:pen-bold" />
              Modifier
            </MenuItem>
          )}

          {canEdit && status !== 'RETIRED' && (
            <MenuItem
              onClick={() => {
                popover.onClose();
                onRetire();
              }}
              sx={{ color: 'warning.main' }}
            >
              <Iconify icon="solar:archive-bold" />
              Retirer
            </MenuItem>
          )}

          {canEdit && status === 'DRAFT' && (
            <MenuItem
              onClick={() => {
                popover.onClose();
                onDelete();
              }}
              sx={{ color: 'error.main' }}
            >
              <Iconify icon="solar:trash-bin-trash-bold" />
              Supprimer
            </MenuItem>
          )}
        </MenuList>
      </CustomPopover>
    </>
  );
}
