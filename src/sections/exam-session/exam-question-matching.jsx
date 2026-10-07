'use client';

import { useMemo, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function ExamQuestionMatching({ question, answer, onAnswer }) {
  const leftItems = useMemo(() => question.leftItems || question.premises || [], [question.leftItems, question.premises]);
  const rightItems = useMemo(() => question.rightItems || question.responses || [], [question.rightItems, question.responses]);
  const pairs = useMemo(() => answer?.pairs || {}, [answer]);

  const handlePairChange = useCallback((leftId, rightId) => {
    const newPairs = { ...pairs, [String(leftId)]: rightId };
    onAnswer({ pairs: newPairs });
  }, [pairs, onAnswer]);

  const renderInstruction = question.instruction && (
    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontStyle: 'italic' }}>
      {question.instruction}
    </Typography>
  );

  const renderMedia = question.medias?.length > 0 && (
    <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap' }}>
      {question.medias.map((media, index) => (
        <Box
          key={media.id || index}
          component="img"
          src={media.url}
          alt={media.alt || `Media ${index + 1}`}
          sx={{ maxWidth: 400, maxHeight: 300, borderRadius: 1, objectFit: 'contain' }}
        />
      ))}
    </Stack>
  );

  return (
    <Box sx={{ flex: 1 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        {question.text}
      </Typography>

      {renderInstruction}
      {renderMedia}

      <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
        Associez chaque élément de gauche à un élément de droite
      </Typography>

      <Stack spacing={1.5}>
        {leftItems.map((leftItem) => {
          const leftId = String(leftItem.id);
          const selectedRightId = pairs[leftId] || '';

          return (
            <Paper
              key={leftItem.id}
              variant="outlined"
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                flexWrap: { xs: 'wrap', sm: 'nowrap' },
              }}
            >
              <Box
                sx={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: selectedRightId ? 'success.main' : 'grey.400',
                    flexShrink: 0,
                  }}
                />
                <Typography variant="body1" noWrap>
                  {leftItem.text || leftItem.label}
                </Typography>
              </Box>

              <Iconify
                icon="solar:arrow-right-line-duotone"
                width={20}
                sx={{ color: 'text.disabled', flexShrink: 0 }}
              />

              <TextField
                select
                size="small"
                value={selectedRightId}
                onChange={(e) => handlePairChange(leftId, e.target.value)}
                placeholder="Choisir..."
                sx={{ minWidth: 200 }}
                slotProps={{
                  select: {
                    displayEmpty: true,
                  },
                }}
              >
                <MenuItem value="">
                  <Typography variant="body2" color="text.secondary">
                    -- Choisir --
                  </Typography>
                </MenuItem>
                {rightItems.map((rightItem) => (
                  <MenuItem key={rightItem.id} value={String(rightItem.id)}>
                    {rightItem.text || rightItem.label}
                  </MenuItem>
                ))}
              </TextField>
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
}
