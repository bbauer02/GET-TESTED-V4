'use client';

import { useState, useCallback } from 'react';
import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import ListSubheader from '@mui/material/ListSubheader';

import { Iconify } from '../../iconify';

// ----------------------------------------------------------------------

const MAX_ROWS = 8;
const MAX_COLS = 8;

// ----------------------------------------------------------------------

function GridPicker({ onSelect }) {
  const [hoverRow, setHoverRow] = useState(0);
  const [hoverCol, setHoverCol] = useState(0);

  return (
    <Box sx={{ px: 2, pb: 1.5, pt: 0.5 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, display: 'block' }}>
        {hoverRow > 0 ? `${hoverRow} × ${hoverCol}` : 'Choisir la taille'}
      </Typography>

      <Box
        sx={{ display: 'grid', gridTemplateColumns: `repeat(${MAX_COLS}, 1fr)`, gap: '3px' }}
        onMouseLeave={() => { setHoverRow(0); setHoverCol(0); }}
      >
        {Array.from({ length: MAX_ROWS * MAX_COLS }, (_, i) => {
          const row = Math.floor(i / MAX_COLS) + 1;
          const col = (i % MAX_COLS) + 1;
          const isHighlighted = row <= hoverRow && col <= hoverCol;

          return (
            <Box
              key={i}
              onMouseEnter={() => { setHoverRow(row); setHoverCol(col); }}
              onClick={() => onSelect(row, col)}
              sx={{
                width: 18,
                height: 18,
                borderRadius: 0.5,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: isHighlighted ? 'primary.main' : 'divider',
                bgcolor: isHighlighted ? 'primary.lighter' : 'transparent',
                transition: 'all 0.1s',
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
}

// ----------------------------------------------------------------------

export function TableBlock({ editor }) {
  const { anchorEl, open, onOpen, onClose } = usePopover();

  const run = useCallback(
    (action) => {
      onClose();
      action();
    },
    [onClose]
  );

  const handleGridSelect = useCallback(
    (rows, cols) => {
      run(() =>
        editor.chain().focus().insertTable({ rows, cols, withHeaderRow: false }).run()
      );
    },
    [editor, run]
  );

  return (
    <>
      <Button
        size="small"
        variant="soft"
        color="secondary"
        onClick={onOpen}
        startIcon={<Iconify icon="mdi:table" />}
        sx={{ height: 28, fontSize: '0.8125rem' }}
      >
        Tableau
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={onClose}
        slotProps={{
          paper: { sx: { width: 260 } },
        }}
      >
        <ListSubheader sx={{ lineHeight: '32px', fontWeight: 700 }}>
          Inserer un tableau
        </ListSubheader>

        <GridPicker onSelect={handleGridSelect} />

        <Divider />

        <ListSubheader sx={{ lineHeight: '32px', fontWeight: 700 }}>
          Mise en page rapide
        </ListSubheader>

        <MenuItem
          onClick={() =>
            run(() =>
              editor.chain().focus().insertTable({ rows: 1, cols: 2, withHeaderRow: false }).run()
            )
          }
          sx={{ fontSize: '0.875rem', pl: 3 }}
        >
          <Iconify icon="mdi:table-column" sx={{ mr: 1, flexShrink: 0 }} />
          Bloc 2 colonnes
        </MenuItem>

        <MenuItem
          onClick={() =>
            run(() =>
              editor.chain().focus().insertTable({ rows: 1, cols: 3, withHeaderRow: false }).run()
            )
          }
          sx={{ fontSize: '0.875rem', pl: 3 }}
        >
          <Iconify icon="mdi:table" sx={{ mr: 1, flexShrink: 0 }} />
          Bloc 3 colonnes
        </MenuItem>
      </Menu>
    </>
  );
}
