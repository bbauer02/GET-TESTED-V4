'use client';

import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import FormControlLabel from '@mui/material/FormControlLabel';

import { fCurrency } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

function getExamPrice(scheduledExam) {
  const institutePrice = scheduledExam.examPricing?.price?.amount
    ?? scheduledExam.exam_pricing?.price?.amount;
  const defaultPrice = scheduledExam.exam?.price?.amount;
  return institutePrice ?? defaultPrice ?? 0;
}

// ----------------------------------------------------------------------

export function EnrollmentStepExams({ session, selectedExamIds, onToggleExam, onNext }) {
  const scheduledExams = session?.scheduledExams || session?.scheduled_exams || [];

  const mandatoryExams = scheduledExams.filter((se) => !se.exam?.isOption);
  const optionalExams = scheduledExams.filter((se) => se.exam?.isOption);

  const total = [...mandatoryExams, ...scheduledExams.filter((se) =>
    se.exam?.isOption && selectedExamIds.includes(se.id || se['@id'])
  )].reduce((sum, se) => sum + getExamPrice(se), 0);

  return (
    <Stack spacing={3}>
      {/* Mandatory exams */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Examens obligatoires
        </Typography>

        <Stack spacing={1.5}>
          {mandatoryExams.map((se) => (
            <ExamRow key={se.id || se['@id']} scheduledExam={se} mandatory />
          ))}

          {mandatoryExams.length === 0 && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Aucun examen obligatoire pour cette session.
            </Typography>
          )}
        </Stack>
      </Box>

      {/* Optional exams */}
      {optionalExams.length > 0 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Examens optionnels
          </Typography>

          <Stack spacing={1.5}>
            {optionalExams.map((se) => {
              const examId = se.id || se['@id'];
              const isSelected = selectedExamIds.includes(examId);

              return (
                <ExamRow
                  key={examId}
                  scheduledExam={se}
                  selected={isSelected}
                  onToggle={() => onToggleExam(examId)}
                />
              );
            })}
          </Stack>
        </Box>
      )}

      {/* Total */}
      <Card
        sx={{
          bgcolor: (theme) => varAlpha(theme.vars.palette.primary.mainChannel, 0.08),
          border: (theme) => `1px solid ${varAlpha(theme.vars.palette.primary.mainChannel, 0.2)}`,
        }}
      >
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Total</Typography>
            <Typography variant="h4" color="primary">
              {fCurrency(total)}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {/* Next */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          size="large"
          endIcon={<Iconify icon="eva:arrow-forward-fill" />}
          onClick={onNext}
        >
          Continuer
        </Button>
      </Box>
    </Stack>
  );
}

// ----------------------------------------------------------------------

function ExamRow({ scheduledExam, mandatory, selected, onToggle }) {
  const exam = scheduledExam.exam || {};
  const price = getExamPrice(scheduledExam);

  return (
    <Card variant="outlined">
      <CardContent
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 1.5,
          '&:last-child': { pb: 1.5 },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flexGrow: 1 }}>
          {mandatory ? (
            <Checkbox checked disabled sx={{ p: 0 }} />
          ) : (
            <FormControlLabel
              control={<Checkbox checked={selected} onChange={onToggle} sx={{ p: 0 }} />}
              label=""
              sx={{ m: 0 }}
            />
          )}

          <Box>
            <Typography variant="subtitle2">
              {exam.label || 'Examen'}
              {mandatory && (
                <Typography
                  component="span"
                  variant="caption"
                  sx={{ ml: 1, color: 'text.secondary' }}
                >
                  (obligatoire)
                </Typography>
              )}
            </Typography>

            <Stack direction="row" spacing={2} sx={{ mt: 0.25 }}>
              {exam.duration && (
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Iconify icon="eva:clock-outline" width={14} />
                  {exam.duration} min
                </Typography>
              )}
              {exam.isWritten !== undefined && (
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Iconify icon={exam.isWritten ? 'eva:edit-outline' : 'eva:mic-outline'} width={14} />
                  {exam.isWritten ? 'Ecrit' : 'Oral'}
                </Typography>
              )}
            </Stack>
          </Box>
        </Stack>

        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
          {fCurrency(price)}
        </Typography>
      </CardContent>
    </Card>
  );
}
