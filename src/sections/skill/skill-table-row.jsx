'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import { RouterLink } from 'src/routes/components';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function SkillTableRow({ row, assessmentLabels, levelLabels, editHref, onDelete }) {
  const parentLabel = row.parent?.label || '-';
  const assessments = assessmentLabels ? [...assessmentLabels] : [];
  const levels = levelLabels ? [...levelLabels] : [];

  return (
    <TableRow hover>
      <TableCell sx={{ fontWeight: 'fontWeightSemiBold' }}>{row.label}</TableCell>
      <TableCell>{parentLabel}</TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {assessments.length > 0
            ? assessments.map((label) => (
                <Label key={label} variant="soft" color="info">
                  {label}
                </Label>
              ))
            : '-'}
        </Box>
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {levels.length > 0
            ? levels.map((label) => (
                <Label key={label} variant="soft" color="warning">
                  {label}
                </Label>
              ))
            : '-'}
        </Box>
      </TableCell>
      <TableCell sx={{ maxWidth: 250 }}>
        {row.description || '-'}
      </TableCell>
      <TableCell align="right" sx={{ display: 'flex', gap: 0.5 }}>
        <Tooltip title="Modifier">
          <IconButton component={RouterLink} href={editHref} size="small">
            <Iconify icon="solar:pen-bold" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Supprimer">
          <IconButton size="small" color="error" onClick={onDelete}>
            <Iconify icon="solar:trash-bin-trash-bold" />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}
