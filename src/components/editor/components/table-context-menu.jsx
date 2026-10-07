'use client';

import { useState, useEffect, useCallback } from 'react';

import Menu from '@mui/material/Menu';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import ListSubheader from '@mui/material/ListSubheader';

import { Iconify } from '../../iconify';

// ----------------------------------------------------------------------

export function TableContextMenu({ editor }) {
  const [anchorPosition, setAnchorPosition] = useState(null);

  const open = Boolean(anchorPosition);

  const handleContextMenu = useCallback(
    (event) => {
      // Only show if right-click is inside a table cell
      const cell = event.target.closest('td, th');
      if (!cell || !editor?.isActive('table')) return;

      event.preventDefault();
      setAnchorPosition({ top: event.clientY, left: event.clientX });
    },
    [editor]
  );

  const handleClose = useCallback(() => {
    setAnchorPosition(null);
  }, []);

  const run = useCallback(
    (action) => {
      handleClose();
      action();
    },
    [handleClose]
  );

  useEffect(() => {
    const el = editor?.view?.dom;
    if (!el) return undefined;

    el.addEventListener('contextmenu', handleContextMenu);
    return () => el.removeEventListener('contextmenu', handleContextMenu);
  }, [editor, handleContextMenu]);

  if (!open) return null;

  return (
    <Menu
      open={open}
      onClose={handleClose}
      anchorReference="anchorPosition"
      anchorPosition={anchorPosition}
      slotProps={{
        paper: { sx: { width: 250, maxHeight: 400 } },
      }}
    >
      {/* Lignes */}
      <ListSubheader sx={{ lineHeight: '32px', fontWeight: 700 }}>
        Lignes
      </ListSubheader>

      <MenuItem
        onClick={() => run(() => editor.chain().focus().addRowBefore().run())}
        sx={{ fontSize: '0.875rem', pl: 3 }}
      >
        <Iconify icon="mdi:table-row-plus-before" sx={{ mr: 1.5, flexShrink: 0 }} />
        Inserer au-dessus
      </MenuItem>

      <MenuItem
        onClick={() => run(() => editor.chain().focus().addRowAfter().run())}
        sx={{ fontSize: '0.875rem', pl: 3 }}
      >
        <Iconify icon="mdi:table-row-plus-after" sx={{ mr: 1.5, flexShrink: 0 }} />
        Inserer en-dessous
      </MenuItem>

      <MenuItem
        onClick={() => run(() => editor.chain().focus().deleteRow().run())}
        sx={{ fontSize: '0.875rem', pl: 3, color: 'error.main' }}
      >
        <Iconify icon="mdi:table-row-remove" sx={{ mr: 1.5, flexShrink: 0 }} />
        Supprimer la ligne
      </MenuItem>

      <Divider />

      {/* Colonnes */}
      <ListSubheader sx={{ lineHeight: '32px', fontWeight: 700 }}>
        Colonnes
      </ListSubheader>

      <MenuItem
        onClick={() => run(() => editor.chain().focus().addColumnBefore().run())}
        sx={{ fontSize: '0.875rem', pl: 3 }}
      >
        <Iconify icon="mdi:table-column-plus-before" sx={{ mr: 1.5, flexShrink: 0 }} />
        Inserer avant
      </MenuItem>

      <MenuItem
        onClick={() => run(() => editor.chain().focus().addColumnAfter().run())}
        sx={{ fontSize: '0.875rem', pl: 3 }}
      >
        <Iconify icon="mdi:table-column-plus-after" sx={{ mr: 1.5, flexShrink: 0 }} />
        Inserer apres
      </MenuItem>

      <MenuItem
        onClick={() => run(() => editor.chain().focus().deleteColumn().run())}
        sx={{ fontSize: '0.875rem', pl: 3, color: 'error.main' }}
      >
        <Iconify icon="mdi:table-column-remove" sx={{ mr: 1.5, flexShrink: 0 }} />
        Supprimer la colonne
      </MenuItem>

      <Divider />

      {/* Cellules */}
      <ListSubheader sx={{ lineHeight: '32px', fontWeight: 700 }}>
        Cellules
      </ListSubheader>

      <MenuItem
        onClick={() => run(() => editor.chain().focus().mergeCells().run())}
        sx={{ fontSize: '0.875rem', pl: 3 }}
      >
        <Iconify icon="mdi:table-merge-cells" sx={{ mr: 1.5, flexShrink: 0 }} />
        Fusionner
      </MenuItem>

      <MenuItem
        onClick={() => run(() => editor.chain().focus().splitCell().run())}
        sx={{ fontSize: '0.875rem', pl: 3 }}
      >
        <Iconify icon="mdi:table-split-cell" sx={{ mr: 1.5, flexShrink: 0 }} />
        Scinder
      </MenuItem>

      <Divider />

      {/* En-têtes */}
      <MenuItem
        onClick={() => run(() => editor.chain().focus().toggleHeaderRow().run())}
        sx={{ fontSize: '0.875rem', pl: 3 }}
      >
        <Iconify icon="mdi:table-header-row" sx={{ mr: 1.5, flexShrink: 0 }} />
        Ligne d&apos;en-tete
      </MenuItem>

      <MenuItem
        onClick={() => run(() => editor.chain().focus().toggleHeaderColumn().run())}
        sx={{ fontSize: '0.875rem', pl: 3 }}
      >
        <Iconify icon="mdi:table-header-column" sx={{ mr: 1.5, flexShrink: 0 }} />
        Colonne d&apos;en-tete
      </MenuItem>

      <Divider />

      {/* Supprimer */}
      <MenuItem
        onClick={() => run(() => editor.chain().focus().deleteTable().run())}
        sx={{ fontSize: '0.875rem', pl: 3, color: 'error.main', fontWeight: 600 }}
      >
        <Iconify icon="mdi:table-remove" sx={{ mr: 1.5, flexShrink: 0 }} />
        Supprimer le tableau
      </MenuItem>
    </Menu>
  );
}
