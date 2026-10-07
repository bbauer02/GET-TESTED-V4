'use client';

import { useMemo, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Radio from '@mui/material/Radio';
import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import Typography from '@mui/material/Typography';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';

// ----------------------------------------------------------------------

export function ExamQuestionMcq({ question, answer, onAnswer }) {
  const choices = useMemo(() => question.choices || [], [question.choices]);
  const isMultiple = question.isMultiple ?? question.multiple ?? false;
  const selectedIds = useMemo(() => answer?.choiceIds || [], [answer]);

  const handleSingleChange = useCallback((event) => {
    onAnswer({ choiceIds: [event.target.value] });
  }, [onAnswer]);

  const handleMultipleChange = useCallback((choiceId) => {
    const newIds = selectedIds.includes(choiceId)
      ? selectedIds.filter((id) => id !== choiceId)
      : [...selectedIds, choiceId];
    onAnswer({ choiceIds: newIds });
  }, [selectedIds, onAnswer]);

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

  const renderChoices = () => {
    if (isMultiple) {
      return (
        <FormGroup>
          {choices.map((choice) => (
            <FormControlLabel
              key={choice.id}
              control={
                <Checkbox
                  checked={selectedIds.includes(String(choice.id))}
                  onChange={() => handleMultipleChange(String(choice.id))}
                />
              }
              label={choice.text || choice.label}
              sx={{
                p: 1.5,
                mx: 0,
                mb: 1,
                borderRadius: 1,
                border: (t) => `1px solid ${t.vars.palette.divider}`,
                bgcolor: selectedIds.includes(String(choice.id)) ? 'primary.lighter' : 'transparent',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            />
          ))}
        </FormGroup>
      );
    }

    return (
      <RadioGroup value={selectedIds[0] || ''} onChange={handleSingleChange}>
        {choices.map((choice) => (
          <FormControlLabel
            key={choice.id}
            value={String(choice.id)}
            control={<Radio />}
            label={choice.text || choice.label}
            sx={{
              p: 1.5,
              mx: 0,
              mb: 1,
              borderRadius: 1,
              border: (t) => `1px solid ${t.vars.palette.divider}`,
              bgcolor: selectedIds[0] === String(choice.id) ? 'primary.lighter' : 'transparent',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          />
        ))}
      </RadioGroup>
    );
  };

  return (
    <Box sx={{ flex: 1 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        {question.text}
      </Typography>

      {renderInstruction}
      {renderMedia}

      <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
        {isMultiple ? 'Sélectionnez une ou plusieurs réponses' : 'Sélectionnez une réponse'}
      </Typography>

      {renderChoices()}
    </Box>
  );
}
