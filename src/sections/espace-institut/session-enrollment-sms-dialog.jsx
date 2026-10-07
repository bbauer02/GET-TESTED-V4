'use client';

import { toast } from 'sonner';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { fDate, fDateTime } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';
import { sendEnrollmentSms } from 'src/actions/session-management';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { getErrorMessage } from 'src/auth/utils/error-message';

import {
  toEntityId,
  buildWhatsAppUrl,
  getEnrollmentPhoneE164,
  getEnrollmentDisplayName,
  isEnrollmentPhoneVerified,
} from './session-enrollment-utils';

// ----------------------------------------------------------------------

export const SMS_MAX_LENGTH = 480;

export function SessionEnrollmentSmsDialog({ open, onClose, enrollment, session, onSent }) {
  const { t } = useTranslate('session_management');

  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const phone = getEnrollmentPhoneE164(enrollment);
  const verified = isEnrollmentPhoneVerified(enrollment);
  const resolvedSession = session || enrollment?.session || {};

  const templates = useMemo(() => {
    const exams = (enrollment?.enrollmentExams || [])
      .map((ee) => ee.scheduledExam)
      .filter((se) => se?.startDate)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    const nextExam = exams.find((se) => new Date(se.startDate) >= new Date()) || exams[0];

    return [
      {
        key: 'reminder',
        label: t('sms_template_reminder_label'),
        text: t('sms_template_reminder', {
          exam: nextExam?.exam?.label || resolvedSession.assessment?.label || '—',
          date: nextExam?.startDate ? fDateTime(nextExam.startDate) : fDate(resolvedSession.start),
        }),
      },
      {
        key: 'payment',
        label: t('sms_template_payment_label'),
        text: t('sms_template_payment', {
          assessment: resolvedSession.assessment?.label || '—',
          date: resolvedSession.start ? fDate(resolvedSession.start) : '—',
        }),
      },
    ];
  }, [enrollment?.enrollmentExams, resolvedSession, t]);

  const tooLong = message.length > SMS_MAX_LENGTH;
  const whatsAppUrl = buildWhatsAppUrl(enrollment, message);

  const handleSend = useCallback(async () => {
    const enrollmentId = toEntityId(enrollment);
    if (!enrollmentId || !message.trim() || tooLong) return;

    setSending(true);
    try {
      const result = await sendEnrollmentSms(enrollmentId, message.trim());
      toast.success(t('sms_sent'));
      onSent?.(result);
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSending(false);
    }
  }, [enrollment, message, tooLong, onSent, onClose, t]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('sms_title')}</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Iconify icon="solar:phone-bold" width={20} sx={{ color: 'text.secondary' }} />
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                {t('sms_recipient')}
              </Typography>
              <Typography variant="subtitle2" noWrap>
                {getEnrollmentDisplayName(enrollment)}
                {phone ? ` · ${phone}` : ''}
              </Typography>
            </Box>
            {phone && (
              <Label color={verified ? 'success' : 'default'} variant="soft">
                {verified ? t('phone_verified') : t('phone_unverified')}
              </Label>
            )}
          </Stack>

          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
              {t('sms_templates')}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {templates.map((tpl) => (
                <Chip
                  key={tpl.key}
                  label={tpl.label}
                  size="small"
                  variant="outlined"
                  icon={<Iconify icon="solar:magic-stick-3-bold" width={16} />}
                  onClick={() => setMessage(tpl.text)}
                />
              ))}
            </Stack>
          </Box>

          <TextField
            fullWidth
            multiline
            minRows={4}
            label={t('sms_message')}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            error={tooLong}
            helperText={
              tooLong
                ? t('sms_too_long', { max: SMS_MAX_LENGTH })
                : t('sms_chars', { count: message.length, max: SMS_MAX_LENGTH })
            }
            slotProps={{ htmlInput: { maxLength: SMS_MAX_LENGTH * 2 } }}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          {t('cancel')}
        </Button>
        <Button
          variant="outlined"
          color="success"
          component="a"
          href={whatsAppUrl || undefined}
          target="_blank"
          rel="noopener noreferrer"
          disabled={!whatsAppUrl || !message.trim()}
          startIcon={<Iconify icon="ic:baseline-whatsapp" />}
        >
          {t('whatsapp')}
        </Button>
        <LoadingButton
          variant="contained"
          loading={sending}
          disabled={!phone || !message.trim() || tooLong}
          onClick={handleSend}
          startIcon={<Iconify icon="solar:plain-bold" />}
        >
          {t('send')}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
