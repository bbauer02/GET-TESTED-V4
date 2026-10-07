'use client';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useState, useCallback } from 'react';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { Form, Field, schemaUtils } from 'src/components/hook-form';

import { useAuthContext } from '../../hooks';
import { getErrorMessage } from '../../utils';
import { FormHead } from '../../components/form-head';
import { signInWithPassword } from '../../context/jwt';

// ----------------------------------------------------------------------

// Comptes de démonstration : uniquement en développement local
const SHOW_QUICK_LOGINS = process.env.NODE_ENV === 'development';

const QUICK_LOGINS = [
  { labelKey: 'sign_in_admin_platform', email: 'bbauer02@gmail.com', password: 'password123', color: 'error' },
  { labelKey: 'sign_in_admin_institute', email: 'umebosi1014@yahoo.co.jp', password: 'password123', color: 'warning' },
  { labelKey: 'sign_in_user', email: 'cLefebre@gmail.com', password: 'password123', color: 'info' },
];

export function JwtSignInView() {
  const router = useRouter();

  const { t } = useTranslate('auth');

  const showPassword = useBoolean();

  const { checkUserSession } = useAuthContext();

  const SignInSchema = z.object({
    email: schemaUtils.email(),
    password: z
      .string()
      .min(1, { message: t('sign_in_password_required') })
      .min(6, { message: t('sign_in_password_min') }),
  });

  const [errorMessage, setErrorMessage] = useState(null);

  const defaultValues = {
    email: '',
    password: '',
  };

  const methods = useForm({
    resolver: zodResolver(SignInSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await signInWithPassword({ email: data.email, password: data.password });
      await checkUserSession?.();

      router.refresh();
    } catch (error) {
      console.error(error);
      const feedbackMessage = getErrorMessage(error);
      setErrorMessage(feedbackMessage);
    }
  });

  const handleQuickLogin = useCallback(
    (account) => {
      setValue('email', account.email, { shouldValidate: true });
      setValue('password', account.password, { shouldValidate: true });
    },
    [setValue]
  );

  const renderForm = () => (
    <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
      <Field.Text name="email" label={t('sign_in_email_label')} slotProps={{ inputLabel: { shrink: true } }} />

      <Box sx={{ gap: 1.5, display: 'flex', flexDirection: 'column' }}>
        <Link
          component={RouterLink}
          href={paths.auth.jwt.forgotPassword}
          variant="body2"
          color="inherit"
          sx={{ alignSelf: 'flex-end' }}
        >
          {t('sign_in_forgot_password')}
        </Link>

        <Field.Text
          name="password"
          label={t('sign_in_password_label')}
          placeholder={t('sign_in_password_placeholder')}
          type={showPassword.value ? 'text' : 'password'}
          slotProps={{
            inputLabel: { shrink: true },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={showPassword.onToggle} edge="end">
                    <Iconify
                      icon={showPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                    />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      <Button
        fullWidth
        color="inherit"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator={t('sign_in_button_loading')}
      >
        {t('sign_in_button')}
      </Button>
    </Box>
  );

  return (
    <>
      <FormHead
        title={t('sign_in_title')}
        description={
          <>
            {`${t('sign_in_no_account')} `}
            <Link component={RouterLink} href={paths.auth.jwt.signUp} variant="subtitle2">
              {t('sign_in_get_started')}
            </Link>
          </>
        }
        sx={{ textAlign: { xs: 'center', md: 'left' } }}
      />

      {SHOW_QUICK_LOGINS && (
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
          {t('sign_in_quick_login')}
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {QUICK_LOGINS.map((account) => (
            <Chip
              key={account.email}
              label={t(account.labelKey)}
              color={account.color}
              variant="soft"
              onClick={() => handleQuickLogin(account)}
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Stack>
      </Box>
      )}

      {!!errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm()}
      </Form>
    </>
  );
}
