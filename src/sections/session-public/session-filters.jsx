'use client';

import { useMemo, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';

import { useTranslate } from 'src/locales';

// ----------------------------------------------------------------------

export function SessionFilters({
  filters,
  onChangeFilter,
  assessments,
  levels,
  assessmentsLoading,
  levelsLoading,
  selectedAssessment,
}) {
  const { t } = useTranslate('sessions');

  const handleChangeAssessment = useCallback(
    (event, newValue) => {
      onChangeFilter('assessment', newValue?.id || '');
      // Reset level when assessment changes
      onChangeFilter('level', '');
    },
    [onChangeFilter]
  );

  const handleChangeLevel = useCallback(
    (event, newValue) => {
      onChangeFilter('level', newValue?.id || '');
    },
    [onChangeFilter]
  );

  // Filter levels: only show levels linked to the selected assessment
  const filteredLevels = useMemo(() => {
    if (!selectedAssessment) return levels;
    const assessmentLevels = selectedAssessment.levels || [];
    if (!assessmentLevels.length) return levels;
    const levelIds = new Set(assessmentLevels.map((l) => l.id || l['@id']?.split('/').pop()));
    return levels.filter((l) => levelIds.has(l.id));
  }, [levels, selectedAssessment]);

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      sx={{ mb: 3 }}
    >
      <Autocomplete
        fullWidth
        loading={assessmentsLoading}
        options={assessments}
        getOptionLabel={(option) => option.label || ''}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        value={selectedAssessment}
        onChange={handleChangeAssessment}
        renderInput={(params) => (
          <TextField {...params} label={t('filter_assessment')} placeholder={t('filter_all')} />
        )}
        sx={{ maxWidth: { sm: 320 } }}
      />

      <Autocomplete
        fullWidth
        loading={levelsLoading}
        options={filteredLevels}
        getOptionLabel={(option) => option.label || option.ref || ''}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        onChange={handleChangeLevel}
        value={filters.level ? filteredLevels.find((l) => l.id === filters.level) || null : null}
        renderInput={(params) => (
          <TextField {...params} label={t('filter_level')} placeholder={t('filter_all')} />
        )}
        sx={{ maxWidth: { sm: 240 } }}
      />
    </Stack>
  );
}
