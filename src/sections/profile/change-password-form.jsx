'use client';

import { z } from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';

import { useTranslate } from 'src/locales';
import axios, { endpoints } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export function ChangePasswordForm() {
  const { t } = useTranslate('profile');
  const [alertState, setAlertState] = useState(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const ChangePasswordSchema = z.object({
    currentPassword: z.string().min(1, { error: t('validation_current_password_required') }),
    newPassword: z.string().min(8, { error: t('validation_new_password_min') }),
    confirmPassword: z.string().min(1, { error: t('validation_confirm_required') }),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    error: t('validation_passwords_mismatch'),
    path: ['confirmPassword'],
  });

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      setAlertState(null);

      await axios.post(endpoints.user.changePassword, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      reset();
      setAlertState({ severity: 'success', message: t('password_changed') });
    } catch (error) {
      const message = error?.message || t('error_occurred');
      setAlertState({ severity: 'error', message });
    }
  });

  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 3 }}>
        {t('change_password')}
      </Typography>

      <Form methods={methods} onSubmit={onSubmit}>
        {alertState && (
          <Alert severity={alertState.severity} sx={{ mb: 3 }} onClose={() => setAlertState(null)}>
            {alertState.message}
          </Alert>
        )}

        <Stack spacing={3}>
          <Field.Text
            name="currentPassword"
            label={t('current_password')}
            type={showCurrentPassword ? 'text' : 'password'}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowCurrentPassword(!showCurrentPassword)} edge="end">
                      <Iconify icon={showCurrentPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <Field.Text
            name="newPassword"
            label={t('new_password')}
            type={showNewPassword ? 'text' : 'password'}
            helperText={t('min_chars')}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end">
                      <Iconify icon={showNewPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <Field.Text
            name="confirmPassword"
            label={t('confirm_password')}
            type={showConfirmPassword ? 'text' : 'password'}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                      <Iconify icon={showConfirmPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <Stack alignItems="flex-end">
            <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
              {t('change_password_btn')}
            </LoadingButton>
          </Stack>
        </Stack>
      </Form>
    </Card>
  );
}
