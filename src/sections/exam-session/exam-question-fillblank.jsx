'use client';

import { useMemo, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

export function ExamQuestionFillBlank({ question, answer, onAnswer }) {
  const slots = useMemo(() => answer?.slots || {}, [answer]);

  // Parse the text to find blanks marked as {{0}}, {{1}}, etc.
  const parts = useMemo(() => {
    const text = question.text || '';
    const regex = /\{\{(\d+)\}\}/g;
    const result = [];
    let lastIndex = 0;
    let match = regex.exec(text);

    while (match !== null) {
      if (match.index > lastIndex) {
        result.push({ type: 'text', value: text.slice(lastIndex, match.index) });
      }
      result.push({ type: 'blank', index: match[1] });
      lastIndex = match.index + match[0].length;
      match = regex.exec(text);
    }

    if (lastIndex < text.length) {
      result.push({ type: 'text', value: text.slice(lastIndex) });
    }

    // If no blanks found in text, use blanks array from question
    if (result.every((p) => p.type === 'text') && question.blanks?.length > 0) {
      return question.blanks.map((blank, idx) => ({
        type: 'standalone-blank',
        index: String(idx),
        label: blank.label || blank.hint || `Réponse ${idx + 1}`,
      }));
    }

    return result;
  }, [question.text, question.blanks]);

  const handleSlotChange = useCallback((slotIndex, value) => {
    const newSlots = { ...slots, [slotIndex]: value };
    onAnswer({ slots: newSlots });
  }, [slots, onAnswer]);

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

  // Render inline blanks within text
  const hasInlineBlanks = parts.some((p) => p.type === 'blank');

  const renderInlineText = hasInlineBlanks && (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.5, lineHeight: 2.5 }}>
      {parts.map((part, idx) => {
        if (part.type === 'text') {
          return (
            <Typography key={idx} component="span" variant="body1">
              {part.value}
            </Typography>
          );
        }
        return (
          <TextField
            key={idx}
            size="small"
            variant="outlined"
            placeholder="..."
            value={slots[part.index] || ''}
            onChange={(e) => handleSlotChange(part.index, e.target.value)}
            sx={{
              width: 160,
              '& .MuiInputBase-input': { textAlign: 'center', py: 0.5 },
            }}
          />
        );
      })}
    </Box>
  );

  // Render standalone blank fields
  const renderStandaloneBlanks = !hasInlineBlanks && (
    <Stack spacing={2}>
      {parts.filter((p) => p.type === 'standalone-blank').length > 0 ? (
        parts
          .filter((p) => p.type === 'standalone-blank')
          .map((part) => (
            <TextField
              key={part.index}
              fullWidth
              label={part.label}
              value={slots[part.index] || ''}
              onChange={(e) => handleSlotChange(part.index, e.target.value)}
            />
          ))
      ) : (
        // Fallback: single blank
        <TextField
          fullWidth
          label="Votre réponse"
          value={slots['0'] || ''}
          onChange={(e) => handleSlotChange('0', e.target.value)}
        />
      )}
    </Stack>
  );

  return (
    <Box sx={{ flex: 1 }}>
      {!hasInlineBlanks && (
        <Typography variant="h6" sx={{ mb: 1 }}>
          {question.text}
        </Typography>
      )}

      {renderInstruction}
      {renderMedia}

      <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
        Complétez les champs vides
      </Typography>

      {renderInlineText}
      {renderStandaloneBlanks}
    </Box>
  );
}
