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

import axios, { endpoints } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, { error: 'Le mot de passe actuel est requis' }),
  newPassword: z.string().min(8, { error: 'Le nouveau mot de passe doit contenir au moins 8 caractères' }),
  confirmPassword: z.string().min(1, { error: 'La confirmation est requise' }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  error: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

// ----------------------------------------------------------------------

export function ChangePasswordForm() {
  const [alertState, setAlertState] = useState(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      setAlertState({ severity: 'success', message: 'Mot de passe modifié avec succès !' });
    } catch (error) {
      const message = error?.message || 'Une erreur est survenue';
      setAlertState({ severity: 'error', message });
    }
  });

  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 3 }}>
        Changer le mot de passe
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
            label="Mot de passe actuel"
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
            label="Nouveau mot de passe"
            type={showNewPassword ? 'text' : 'password'}
            helperText="Minimum 8 caractères"
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
            label="Confirmer le nouveau mot de passe"
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
              Modifier le mot de passe
            </LoadingButton>
          </Stack>
        </Stack>
      </Form>
    </Card>
  );
}
