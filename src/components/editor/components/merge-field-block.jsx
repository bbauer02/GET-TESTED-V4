import { useCallback } from 'react';
import { usePopover } from 'minimal-shared/hooks';

import Menu from '@mui/material/Menu';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import ListSubheader from '@mui/material/ListSubheader';

import { Iconify } from '../../iconify';

// ----------------------------------------------------------------------

export function MergeFieldBlock({ editor, mergeFields = [] }) {
  const { anchorEl, open, onOpen, onClose } = usePopover();

  const handleInsert = useCallback(
    (field, label) => {
      onClose();
      editor.chain().focus().insertMergeField({ field, label }).run();
    },
    [editor, onClose]
  );

  return (
    <>
      <Button
        size="small"
        variant="soft"
        color="info"
        onClick={onOpen}
        startIcon={<Iconify icon="mdi:code-braces" />}
        sx={{ height: 28, fontSize: '0.8125rem' }}
      >
        Champs
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={onClose}
        slotProps={{
          paper: {
            sx: { maxHeight: 320, width: 260 },
          },
        }}
      >
        {mergeFields.map((category) => [
          <ListSubheader key={category.category} sx={{ lineHeight: '32px', fontWeight: 700 }}>
            {category.category}
          </ListSubheader>,
          ...category.fields.map((item) => (
            <MenuItem
              key={item.field}
              onClick={() => handleInsert(item.field, item.label)}
              sx={{ fontSize: '0.875rem', pl: 3 }}
            >
              {item.label}
            </MenuItem>
          )),
        ])}
      </Menu>
    </>
  );
}
