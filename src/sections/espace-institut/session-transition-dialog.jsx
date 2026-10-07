'use client';

import dayjs from 'dayjs';
import { useState, useEffect } from 'react';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

import { useTranslate } from 'src/locales';

import { ConfirmDialog } from 'src/components/custom-dialog';

// ----------------------------------------------------------------------

// Couleur du bouton de confirmation par statut cible
const CONFIRM_COLORS = {
  OPEN: 'success',
  LOCKED: 'warning',
  VALIDATED: 'info',
  DRAFT: 'inherit',
};

/**
 * Confirmation d'une transition de session (hors annulation, qui a son propre dialogue).
 * Pour `reopen_from_locked`, une nouvelle date limite d'inscription est demandée.
 */
export function SessionTransitionDialog({ open, onClose, transition, session, loading, onConfirm }) {
  const { t: tm } = useTranslate('session_management');

  const [limitDate, setLimitDate] = useState(null);

  const isReopen = transition?.transition === 'reopen_from_locked';
  const sessionStart = session?.start ? dayjs(session.start) : null;

  useEffect(() => {
    if (open && isReopen) {
      setLimitDate(null);
    }
  }, [open, isReopen]);

  if (!transition) return null;

  const enrollments = session?.enrollments || [];
  const enrollmentExams = enrollments.flatMap((enrollment) => enrollment.enrollmentExams || []);
  const missingScores = enrollmentExams.filter((ee) => ee.finalScore == null && ee.status !== 'ABSENT').length;

  const limitDateInvalid =
    isReopen && (!limitDate || !limitDate.isAfter(dayjs()) || (sessionStart && limitDate.isAfter(sessionStart)));

  const renderContent = () => {
    switch (transition.transition) {
      case 'open':
        return <Typography variant="body2">{tm('transition_open_desc')}</Typography>;

      case 'lock':
        return (
          <Typography variant="body2">
            {tm('transition_lock_desc', { count: enrollments.length })}
          </Typography>
        );

      case 'validate':
        return (
          <Stack spacing={2}>
            <Typography variant="body2">{tm('transition_validate_desc')}</Typography>
            {missingScores > 0 && (
              <Alert severity="warning">{tm('transition_validate_missing_scores', { count: missingScores })}</Alert>
            )}
          </Stack>
        );

      case 'reopen_from_locked':
        return (
          <Stack spacing={2.5} sx={{ pt: 0.5 }}>
            <Typography variant="body2">{tm('transition_reopen_locked_desc')}</Typography>
            <DateTimePicker
              label={tm('transition_new_limit_date')}
              value={limitDate}
              onChange={setLimitDate}
              disablePast
              maxDateTime={sessionStart || undefined}
              slotProps={{
                textField: {
                  fullWidth: true,
                  helperText: sessionStart
                    ? tm('transition_new_limit_date_hint', { date: sessionStart.format('DD/MM/YYYY HH:mm') })
                    : undefined,
                },
              }}
            />
          </Stack>
        );

      case 'reopen':
        return <Typography variant="body2">{tm('transition_reopen_desc')}</Typography>;

      default:
        return null;
    }
  };

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      title={tm(`transition_${transition.transition}_title`)}
      content={renderContent()}
      action={
        <LoadingButton
          variant="contained"
          color={CONFIRM_COLORS[transition.targetStatus] || 'primary'}
          loading={loading}
          disabled={limitDateInvalid}
          onClick={() => onConfirm(isReopen ? { limitDateSubscribe: limitDate.toISOString() } : {})}
        >
          {tm(`transition_${transition.transition}_confirm`)}
        </LoadingButton>
      }
    />
  );
}
