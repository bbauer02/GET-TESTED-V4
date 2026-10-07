'use client';

import * as z from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { Form, Field, schemaUtils } from 'src/components/hook-form';

import { signUp } from '../../context/jwt';
import { useAuthContext } from '../../hooks';
import { getErrorMessage } from '../../utils';
import { FormHead } from '../../components/form-head';
import { SignUpTerms } from '../../components/sign-up-terms';

// ----------------------------------------------------------------------

export function JwtSignUpView() {
  const router = useRouter();

  const { t } = useTranslate('auth');

  const showPassword = useBoolean();

  const { checkUserSession } = useAuthContext();

  const SignUpSchema = z.object({
    firstName: z.string().min(1, { message: t('sign_up_first_name_required') }),
    lastName: z.string().min(1, { message: t('sign_up_last_name_required') }),
    email: schemaUtils.email(),
    password: z
      .string()
      .min(1, { message: t('sign_up_password_required') })
      .min(6, { message: t('sign_up_password_min') }),
  });

  const [errorMessage, setErrorMessage] = useState(null);

  const defaultValues = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  };

  const methods = useForm({
    resolver: zodResolver(SignUpSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await signUp({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });
      await checkUserSession?.();

      router.refresh();
    } catch (error) {
      console.error(error);
      const feedbackMessage = getErrorMessage(error);
      setErrorMessage(feedbackMessage);
    }
  });

  const renderForm = () => (
    <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{ display: 'flex', gap: { xs: 3, sm: 2 }, flexDirection: { xs: 'column', sm: 'row' } }}
      >
        <Field.Text
          name="firstName"
          label={t('sign_up_first_name')}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <Field.Text
          name="lastName"
          label={t('sign_up_last_name')}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Box>

      <Field.Text name="email" label={t('sign_up_email_label')} slotProps={{ inputLabel: { shrink: true } }} />

      <Field.Text
        name="password"
        label={t('sign_up_password_label')}
        placeholder={t('sign_up_password_placeholder')}
        type={showPassword.value ? 'text' : 'password'}
        slotProps={{
          inputLabel: { shrink: true },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={showPassword.onToggle} edge="end">
                  <Iconify icon={showPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      <Button
        fullWidth
        color="inherit"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator={t('sign_up_button_loading')}
      >
        {t('sign_up_button')}
      </Button>
    </Box>
  );

  return (
    <>
      <FormHead
        title={t('sign_up_title')}
        description={
          <>
            {`${t('sign_up_already_account')} `}
            <Link component={RouterLink} href={paths.auth.jwt.signIn} variant="subtitle2">
              {t('sign_up_sign_in_link')}
            </Link>
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

      <SignUpTerms />
    </>
  );
}
