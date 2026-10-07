'use client';

import { useMemo, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

const HighlightZone = styled('span', {
  shouldForwardProp: (prop) => !['isSelected'].includes(prop),
})(({ theme, isSelected }) => ({
  cursor: 'pointer',
  padding: '2px 4px',
  borderRadius: 4,
  transition: theme.transitions.create(['background-color', 'color']),
  backgroundColor: isSelected ? theme.vars.palette.primary.main : theme.vars.palette.action.hover,
  color: isSelected ? theme.vars.palette.primary.contrastText : theme.vars.palette.text.primary,
  '&:hover': {
    backgroundColor: isSelected
      ? theme.vars.palette.primary.dark
      : theme.vars.palette.action.selected,
  },
}));

// ----------------------------------------------------------------------

export function ExamQuestionHighlight({ question, answer, onAnswer }) {
  const zones = useMemo(() => question.zones || [], [question.zones]);
  const selectedIds = useMemo(() => answer?.zoneIds || [], [answer]);

  const handleToggleZone = useCallback((zoneId) => {
    const id = String(zoneId);
    const newIds = selectedIds.includes(id)
      ? selectedIds.filter((z) => z !== id)
      : [...selectedIds, id];
    onAnswer({ zoneIds: newIds });
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

  // Build text with clickable zones
  const renderTextWithZones = () => {
    const text = question.text || '';

    // If zones have positions, we replace segments of the text
    if (zones.length > 0 && zones[0]?.start !== undefined) {
      const sorted = [...zones].sort((a, b) => a.start - b.start);
      const elements = [];
      let lastEnd = 0;

      sorted.forEach((zone) => {
        if (zone.start > lastEnd) {
          elements.push(
            <span key={`text-${lastEnd}`}>{text.slice(lastEnd, zone.start)}</span>
          );
        }
        const isSelected = selectedIds.includes(String(zone.id));
        elements.push(
          <HighlightZone
            key={`zone-${zone.id}`}
            isSelected={isSelected}
            onClick={() => handleToggleZone(zone.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleToggleZone(zone.id); }}
          >
            {text.slice(zone.start, zone.end) || zone.text || zone.label}
          </HighlightZone>
        );
        lastEnd = zone.end || lastEnd;
      });

      if (lastEnd < text.length) {
        elements.push(<span key={`text-${lastEnd}`}>{text.slice(lastEnd)}</span>);
      }

      return (
        <Typography variant="body1" component="div" sx={{ lineHeight: 2.2 }}>
          {elements}
        </Typography>
      );
    }

    // Fallback: zones are standalone items
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {zones.map((zone) => {
          const isSelected = selectedIds.includes(String(zone.id));
          return (
            <HighlightZone
              key={zone.id}
              isSelected={isSelected}
              onClick={() => handleToggleZone(zone.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleToggleZone(zone.id); }}
              style={{ padding: '8px 16px', fontSize: '1rem' }}
            >
              {zone.text || zone.label}
            </HighlightZone>
          );
        })}
      </Box>
    );
  };

  return (
    <Box sx={{ flex: 1 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        {question.text && zones[0]?.start !== undefined ? '' : question.text}
      </Typography>

      {renderInstruction}
      {renderMedia}

      <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
        Cliquez sur les zones à sélectionner
      </Typography>

      {renderTextWithZones()}
    </Box>
  );
}
