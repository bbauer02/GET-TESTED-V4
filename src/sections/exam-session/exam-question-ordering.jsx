'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function ExamQuestionOrdering({ question, answer, onAnswer }) {
  const initialItems = useMemo(() => question.items || [], [question.items]);

  const [orderedItems, setOrderedItems] = useState(() => {
    if (answer?.order) {
      // Rebuild ordered list from saved answer
      return answer.order
        .map((id) => initialItems.find((item) => String(item.id) === String(id)))
        .filter(Boolean);
    }
    return [...initialItems];
  });

  // Sync when question changes
  useEffect(() => {
    if (!answer?.order) {
      setOrderedItems([...initialItems]);
    }
  }, [initialItems, answer]);

  const handleMoveUp = useCallback((index) => {
    if (index <= 0) return;
    setOrderedItems((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      onAnswer({ order: next.map((item) => String(item.id)) });
      return next;
    });
  }, [onAnswer]);

  const handleMoveDown = useCallback((index) => {
    setOrderedItems((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      onAnswer({ order: next.map((item) => String(item.id)) });
      return next;
    });
  }, [onAnswer]);

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
        Réorganisez les éléments dans le bon ordre
      </Typography>

      <Stack spacing={1}>
        {orderedItems.map((item, index) => (
          <Paper
            key={item.id}
            variant="outlined"
            sx={{
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: '0.75rem',
              }}
            >
              {index + 1}
            </Typography>

            <Typography variant="body1" sx={{ flex: 1 }}>
              {item.text || item.label}
            </Typography>

            <Stack direction="row" spacing={0.5}>
              <IconButton
                size="small"
                onClick={() => handleMoveUp(index)}
                disabled={index === 0}
              >
                <Iconify icon="solar:arrow-up-line-duotone" width={18} />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleMoveDown(index)}
                disabled={index === orderedItems.length - 1}
              >
                <Iconify icon="solar:arrow-down-line-duotone" width={18} />
              </IconButton>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
}
