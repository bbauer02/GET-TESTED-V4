'use client';

import Stack from '@mui/material/Stack';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

// ----------------------------------------------------------------------

export function SkillTableToolbar({
  assessments,
  exams,
  filterAssessment,
  filterExam,
  onFilterAssessment,
  onFilterExam,
}) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      sx={{ p: 2.5 }}
    >
      <Autocomplete
        value={filterAssessment}
        onChange={(_, newValue) => onFilterAssessment(newValue)}
        options={assessments}
        getOptionLabel={(option) => option.label || ''}
        isOptionEqualToValue={(option, value) => option.id === value?.id}
        renderInput={(params) => <TextField {...params} label="Assessment" placeholder="Tous" />}
        sx={{ minWidth: 240 }}
      />

      <Autocomplete
        value={filterExam}
        onChange={(_, newValue) => onFilterExam(newValue)}
        options={exams}
        getOptionLabel={(option) => option.label || ''}
        isOptionEqualToValue={(option, value) => option.id === value?.id}
        renderInput={(params) => <TextField {...params} label="Exam" placeholder="Tous" />}
        sx={{ minWidth: 240 }}
      />
    </Stack>
  );
}
