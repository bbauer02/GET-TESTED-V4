import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

function getParentIri(parent) {
  if (!parent) return null;
  if (typeof parent === 'string') return parent;
  return parent['@id'] || `/api/assessments/${parent.id}`;
}

function getOwnerLabel(row) {
  if (row.internal) return 'Plateforme';

  const ownerships = row.ownerships || [];
  const owner = ownerships.find((o) => o.ownershipType === 'OWNER');
  if (owner?.institute?.label) return owner.institute.label;

  return '-';
}

export function AssessmentTableRow({ row, levelsCountMap = {} }) {
  const menuActions = usePopover();

  const ownLevelsCount = Array.isArray(row.levels) ? row.levels.length : 0;
  const parentIri = getParentIri(row.parent);
  const parentLevelsCount = parentIri ? (levelsCountMap[parentIri] || 0) : 0;
  const totalLevelsCount = ownLevelsCount + parentLevelsCount;

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
          href={paths.dashboard.assessment.edit(row.id)}
          onClick={menuActions.onClose}
        >
          <Iconify icon="solar:pen-bold" />
          Modifier
        </MenuItem>
      </MenuList>
    </CustomPopover>
  );

  return (
    <>
      <TableRow hover tabIndex={-1}>
        <TableCell sx={{ fontWeight: 'fontWeightSemiBold' }}>{row.label}</TableCell>

        <TableCell>{row.ref}</TableCell>

        <TableCell>
          <Label variant="soft" color={row.internal ? 'info' : 'default'}>
            {row.internal ? 'Interne' : 'Externe'}
          </Label>
        </TableCell>

        <TableCell>{getOwnerLabel(row)}</TableCell>

        <TableCell>{totalLevelsCount}</TableCell>

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
