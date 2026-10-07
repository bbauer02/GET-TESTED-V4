'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import { verifyPhoneCode, sendPhoneVerificationCode } from 'src/actions/institute-team';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export function ProfilePhoneVerifyDialog({ open, onClose, phone, onVerified }) {
  const { t } = useTranslate('profile');

  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [debugCode, setDebugCode] = useState(null);

  const CodeSchema = useMemo(
    () =>
      z.object({
        code: z
          .string()
          .min(1, { message: t('validation_code_required') })
          .regex(/^\d{6}$/, { message: t('validation_code_format') }),
      }),
    [t]
  );

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(CodeSchema),
    defaultValues: { code: '' },
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const handleSendCode = useCallback(async () => {
    setSending(true);
    setSendError(null);
    setDebugCode(null);
    try {
      const response = await sendPhoneVerificationCode();
      if (response?.debugCode) {
        setDebugCode(String(response.debugCode));
      }
      toast.success(t('phone_verify_code_sent'));
    } catch (error) {
      console.error(error);
      setSendError(error?.message || t('phone_verify_send_error'));
    } finally {
      setSending(false);
    }
  }, [t]);

  useEffect(() => {
    if (open) {
      reset({ code: '' });
      handleSendCode();
    }
  }, [open, reset, handleSendCode]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      await verifyPhoneCode(data.code);
      toast.success(t('phone_verify_success'));
      await onVerified?.();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error?.message || t('phone_verify_error'));
    }
  });

  return (
    <Dialog fullWidth maxWidth="xs" open={open} onClose={onClose}>
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogTitle>{t('phone_verify_title')}</DialogTitle>

        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('phone_verify_description', { phone: phone || '' })}
            </Typography>

            {sending && (
              <Stack direction="row" spacing={1.5} alignItems="center">
                <CircularProgress size={18} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {t('phone_verify_resend')}...
                </Typography>
              </Stack>
            )}

            {!!sendError && <Alert severity="error">{sendError}</Alert>}

            {!!debugCode && (
              <Alert severity="info" icon={<Iconify icon="solar:bug-bold" />}>
                {t('phone_verify_debug_code', { code: debugCode })}
              </Alert>
            )}

            <Field.Text
              name="code"
              autoFocus
              label={t('phone_verify_code_label')}
              placeholder="000000"
              slotProps={{
                htmlInput: {
                  maxLength: 6,
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                  autoComplete: 'one-time-code',
                  style: { textAlign: 'center', letterSpacing: '0.5em', fontSize: 24 },
                },
              }}
            />

            <Button
              size="small"
              color="inherit"
              disabled={sending}
              onClick={handleSendCode}
              startIcon={<Iconify icon="solar:refresh-bold" />}
              sx={{ alignSelf: 'flex-start' }}
            >
              {t('phone_verify_resend')}
            </Button>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" color="inherit" onClick={onClose}>
            {t('cancel', { ns: 'common' })}
          </Button>

          <Button type="submit" variant="contained" loading={isSubmitting}>
            {t('phone_verify_submit')}
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
