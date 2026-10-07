'use client';

import * as z from 'zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { getErrorMessage } from '../../utils';
import { resetPassword } from '../../context/jwt';
import { FormHead } from '../../components/form-head';
import { FormReturnLink } from '../../components/form-return-link';

// ----------------------------------------------------------------------

export function JwtResetPasswordView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const { t } = useTranslate('auth');

  const showPassword = useBoolean();

  const [errorMessage, setErrorMessage] = useState(null);

  const ResetPasswordSchema = useMemo(
    () =>
      z
        .object({
          password: z
            .string()
            .min(1, { message: t('set_password_required') })
            .min(8, { message: t('set_password_min') }),
          confirmPassword: z.string().min(1, { message: t('set_password_required') }),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: t('set_password_mismatch'),
          path: ['confirmPassword'],
        }),
    [t]
  );

  const methods = useForm({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      setErrorMessage(null);
      await resetPassword(token, data.password);
      toast.success(t('reset_password_success'));
      router.push(paths.auth.jwt.signIn);
    } catch (error) {
      console.error(error);
      setErrorMessage(getErrorMessage(error));
    }
  });

  const passwordAdornment = (
    <InputAdornment position="end">
      <IconButton onClick={showPassword.onToggle} edge="end">
        <Iconify icon={showPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
      </IconButton>
    </InputAdornment>
  );

  if (!token) {
    return (
      <>
        <FormHead
          icon={<Iconify icon="solar:shield-warning-bold" width={64} sx={{ color: 'error.main' }} />}
          title={t('reset_password_invalid_title')}
          description={t('reset_password_invalid_description')}
        />

        <FormReturnLink href={paths.auth.jwt.forgotPassword} label={t('reset_password_new_request')} />
      </>
    );
  }

  return (
    <>
      <FormHead
        title={t('reset_password_title')}
        description={t('reset_password_description')}
        sx={{ textAlign: { xs: 'center', md: 'left' } }}
      />

      {!!errorMessage && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button
              component={RouterLink}
              href={paths.auth.jwt.forgotPassword}
              color="inherit"
              size="small"
            >
              {t('reset_password_new_request')}
            </Button>
          }
        >
          {errorMessage}
        </Alert>
      )}

      <Form methods={methods} onSubmit={onSubmit}>
        <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
          <Field.Text
            name="password"
            label={t('set_password_label')}
            placeholder={t('set_password_placeholder')}
            type={showPassword.value ? 'text' : 'password'}
            slotProps={{
              inputLabel: { shrink: true },
              input: { endAdornment: passwordAdornment },
            }}
          />

          <Field.Text
            name="confirmPassword"
            label={t('set_password_confirm_label')}
            placeholder={t('set_password_placeholder')}
            type={showPassword.value ? 'text' : 'password'}
            slotProps={{
              inputLabel: { shrink: true },
              input: { endAdornment: passwordAdornment },
            }}
          />

          <Button
            fullWidth
            color="inherit"
            size="large"
            type="submit"
            variant="contained"
            loading={isSubmitting}
          >
            {t('reset_password_button')}
          </Button>
        </Box>
      </Form>

      <FormReturnLink href={paths.auth.jwt.signIn} label={t('return_to_sign_in')} />
    </>
  );
}
