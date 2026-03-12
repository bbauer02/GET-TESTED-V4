'use client';

import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

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

export function EnrollmentStepRecap({
  session,
  selectedExamIds,
  registrationData,
  onBack,
  onPayNow,
  onPayLater,
  isSubmitting,
}) {
  const scheduledExams = session?.scheduledExams || session?.scheduled_exams || [];
  const institute = session?.institute || {};
  const assessment = session?.assessment || {};

  const selectedExams = scheduledExams.filter((se) => {
    if (!se.exam?.isOption) return true; // mandatory
    return selectedExamIds.includes(se.id || se['@id']);
  });

  const total = selectedExams.reduce((sum, se) => sum + getExamPrice(se), 0);

  return (
    <Stack spacing={3}>
      <Typography variant="h6">Recapitulatif</Typography>

      {/* Session info */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            {assessment.label}
          </Typography>
          <Stack direction="row" spacing={2} sx={{ color: 'text.secondary', typography: 'body2' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Iconify icon="eva:briefcase-outline" width={16} />
              {institute.label}
            </Box>
            {session?.start && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Iconify icon="eva:calendar-outline" width={16} />
                {new Date(session.start).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Candidate info */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
            Candidat
          </Typography>
          <Typography variant="body1">
            {registrationData?.civility} {registrationData?.firstname} {registrationData?.lastname}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {registrationData?.email}
          </Typography>
          {registrationData?.phone && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {registrationData.phone}
            </Typography>
          )}
          {registrationData?.address1 && (
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              {registrationData.address1}
              {registrationData.address2 ? `, ${registrationData.address2}` : ''}
              {' — '}
              {registrationData.zipcode} {registrationData.city}
              {registrationData.countryCode ? ` (${registrationData.countryCode})` : ''}
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Exams detail */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
            Detail des examens
          </Typography>

          <Stack spacing={1}>
            {selectedExams.map((se) => {
              const exam = se.exam || {};
              const price = getExamPrice(se);

              return (
                <Stack
                  key={se.id || se['@id']}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box>
                    <Typography variant="body2">
                      {exam.label}
                      {exam.isOption && (
                        <Typography component="span" variant="caption" sx={{ ml: 0.5, color: 'info.main' }}>
                          (option)
                        </Typography>
                      )}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {fCurrency(price)}
                  </Typography>
                </Stack>
              );
            })}
          </Stack>

          <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Total</Typography>
            <Typography variant="h5" color="primary">
              {fCurrency(total)}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {/* Actions */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between">
        <Button
          variant="outlined"
          startIcon={<Iconify icon="eva:arrow-back-fill" />}
          onClick={onBack}
          disabled={isSubmitting}
        >
          Retour
        </Button>

        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={onPayLater}
            disabled={isSubmitting}
          >
            Payer plus tard
          </Button>

          <Button
            variant="contained"
            size="large"
            endIcon={<Iconify icon="eva:credit-card-fill" />}
            onClick={onPayNow}
            disabled={isSubmitting}
          >
            Payer maintenant
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
}
