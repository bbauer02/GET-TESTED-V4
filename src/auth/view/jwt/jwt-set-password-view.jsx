'use client';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { getInvitation, acceptInvitation } from 'src/actions/institute-team';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { getErrorMessage } from '../../utils';
import { FormHead } from '../../components/form-head';
import { FormReturnLink } from '../../components/form-return-link';

// ----------------------------------------------------------------------

export function JwtSetPasswordView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const { t } = useTranslate('auth');

  const showPassword = useBoolean();

  const [invitation, setInvitation] = useState(null);
  const [loadingInvitation, setLoadingInvitation] = useState(!!token);
  const [invalidToken, setInvalidToken] = useState(!token);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (!token) return undefined;

    let cancelled = false;

    getInvitation(token)
      .then((data) => {
        if (!cancelled) {
          setInvitation(data);
          setInvalidToken(false);
        }
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) setInvalidToken(true);
      })
      .finally(() => {
        if (!cancelled) setLoadingInvitation(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const SetPasswordSchema = useMemo(
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
    resolver: zodResolver(SetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      setErrorMessage(null);
      await acceptInvitation(token, data.password);
      toast.success(t('set_password_success'));
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

  const renderForm = () => (
    <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
      {invitation?.email && (
        <TextField
          disabled
          fullWidth
          value={invitation.email}
          label={t('set_password_email_label')}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      )}

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
        loadingIndicator={t('set_password_button_loading')}
      >
        {t('set_password_button')}
      </Button>
    </Box>
  );

  if (loadingInvitation) {
    return (
      <Box sx={{ py: 10, gap: 2, display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
        <CircularProgress />
        <Box sx={{ typography: 'body2', color: 'text.secondary' }}>{t('set_password_loading')}</Box>
      </Box>
    );
  }

  if (invalidToken) {
    return (
      <>
        <FormHead
          icon={<Iconify icon="solar:shield-warning-bold" width={64} sx={{ color: 'error.main' }} />}
          title={t('set_password_invalid_title')}
          description={token ? t('set_password_invalid_description') : t('set_password_missing_token')}
        />

        <FormReturnLink href={paths.auth.jwt.signIn} label={t('return_to_sign_in')} />
      </>
    );
  }

  return (
    <>
      <FormHead
        title={t('set_password_title')}
        description={
          <>
            {invitation?.firstname && (
              <>
                {invitation.institute
                  ? t('set_password_welcome', {
                      firstname: invitation.firstname,
                      institute: invitation.institute,
                    })
                  : t('set_password_welcome_platform', { firstname: invitation.firstname })}
                <br />
              </>
            )}
            {t('set_password_description')}
          </>
        }
        sx={{ textAlign: { xs: 'center', md: 'left' } }}
      />

      {!!errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm()}
      </Form>

      <FormReturnLink href={paths.auth.jwt.signIn} label={t('return_to_sign_in')} />
    </>
  );
}
