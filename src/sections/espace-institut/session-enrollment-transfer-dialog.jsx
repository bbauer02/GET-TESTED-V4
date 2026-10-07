'use client';

import { toast } from 'sonner';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { fDate, fDateTime } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';
import { transferEnrollment } from 'src/actions/session-management';
import { useGetInstituteSessions } from 'src/actions/espace-institut';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { getErrorMessage } from 'src/auth/utils/error-message';

import { toEntityId } from './session-enrollment-utils';

// ----------------------------------------------------------------------

export function SessionEnrollmentTransferDialog({
  open,
  onClose,
  enrollment,
  session,
  instituteId,
  onTransferred,
}) {
  const { t } = useTranslate('session_management');

  const currentSession = session || enrollment?.session || {};
  const currentSessionId = toEntityId(currentSession);
  const currentAssessmentId = toEntityId(currentSession.assessment);

  const { sessions, sessionsLoading } = useGetInstituteSessions(open ? instituteId : null);

  const targetOptions = useMemo(
    () =>
      (sessions || []).filter((s) => {
        if (toEntityId(s) === currentSessionId) return false;
        if (s.status !== 'OPEN') return false;
        if (currentAssessmentId && toEntityId(s.assessment) !== currentAssessmentId) return false;
        return true;
      }),
    [sessions, currentSessionId, currentAssessmentId]
  );

  const [targetId, setTargetId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const enrollmentExams = enrollment?.enrollmentExams || [];

  const handleSubmit = useCallback(async () => {
    const enrollmentId = toEntityId(enrollment);
    if (!enrollmentId || !targetId) return;

    setSubmitting(true);
    setSubmitError('');
    try {
      const updated = await transferEnrollment(enrollmentId, targetId);
      toast.success(t('transfer_success'));
      onTransferred?.(updated, targetId);
      onClose();
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }, [enrollment, targetId, onTransferred, onClose, t]);

  const renderSessionOption = (s) => {
    const places =
      s.placesAvailable != null
        ? (s.placesRemaining ?? Math.max(0, s.placesAvailable - (s.enrollmentsCount ?? 0)))
        : null;
    return (
      <Stack direction="row" alignItems="center" spacing={1} sx={{ width: 1 }}>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="body2" noWrap>
            {s.assessment?.label || 'Session'}
            {s.level?.label ? ` · ${s.level.label}` : ''}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {s.start ? fDate(s.start) : ''}
            {s.end ? ` → ${fDate(s.end)}` : ''}
          </Typography>
        </Box>
        {places != null && (
          <Label color={places > 0 ? 'success' : 'error'} variant="soft">
            {t('transfer_places', { count: places })}
          </Label>
        )}
      </Stack>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('transfer_title')}</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('transfer_desc')}
          </Typography>

          {!sessionsLoading && targetOptions.length === 0 ? (
            <Alert severity="info">{t('transfer_no_target')}</Alert>
          ) : (
            <TextField
              select
              fullWidth
              label={t('transfer_target')}
              value={targetId}
              onChange={(event) => setTargetId(event.target.value)}
              disabled={sessionsLoading}
              helperText={sessionsLoading ? t('loading') : undefined}
            >
              {targetOptions.map((s) => (
                <MenuItem key={toEntityId(s)} value={toEntityId(s)}>
                  {renderSessionOption(s)}
                </MenuItem>
              ))}
            </TextField>
          )}

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {t('transfer_exams_summary')}
            </Typography>
            {enrollmentExams.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                {t('transfer_no_exams')}
              </Typography>
            ) : (
              <Stack spacing={1}>
                {enrollmentExams.map((ee) => {
                  const se = ee.scheduledExam || {};
                  const exam = se.exam || ee.exam || {};
                  return (
                    <Stack
                      key={ee.id || ee['@id']}
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      sx={{
                        px: 1.5,
                        py: 1,
                        borderRadius: 1,
                        bgcolor: 'background.neutral',
                      }}
                    >
                      <Iconify icon="solar:document-text-bold" width={18} sx={{ color: 'text.secondary' }} />
                      <Typography variant="body2" sx={{ flexGrow: 1 }} noWrap>
                        {exam.label || '—'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {se.startDate ? fDateTime(se.startDate) : ''}
                      </Typography>
                    </Stack>
                  );
                })}
              </Stack>
            )}
          </Box>

          {submitError && <Alert severity="error">{submitError}</Alert>}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          {t('cancel')}
        </Button>
        <LoadingButton
          variant="contained"
          loading={submitting}
          disabled={!targetId}
          onClick={handleSubmit}
          startIcon={<Iconify icon="solar:transfer-horizontal-bold" />}
        >
          {t('transfer')}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
