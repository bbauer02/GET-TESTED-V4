'use client';

import * as z from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { Form, Field, schemaUtils } from 'src/components/hook-form';

import { getErrorMessage } from '../../utils';
import { FormHead } from '../../components/form-head';
import { requestPasswordReset } from '../../context/jwt';
import { FormReturnLink } from '../../components/form-return-link';

// ----------------------------------------------------------------------

export function JwtForgotPasswordView() {
  const { t } = useTranslate('auth');

  const [sentTo, setSentTo] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const ForgotPasswordSchema = z.object({
    email: schemaUtils.email(),
  });

  const methods = useForm({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      setErrorMessage(null);
      await requestPasswordReset(data.email);
      setSentTo(data.email);
    } catch (error) {
      console.error(error);
      setErrorMessage(getErrorMessage(error));
    }
  });

  if (sentTo) {
    return (
      <>
        <FormHead
          icon={<Iconify icon="solar:letter-bold-duotone" width={64} sx={{ color: 'primary.main' }} />}
          title={t('forgot_password_sent_title')}
          description={t('forgot_password_sent_description', { email: sentTo })}
        />

        <FormReturnLink href={paths.auth.jwt.signIn} label={t('return_to_sign_in')} />
      </>
    );
  }

  return (
    <>
      <FormHead
        title={t('forgot_password_title')}
        description={t('forgot_password_description')}
        sx={{ textAlign: { xs: 'center', md: 'left' } }}
      />

      {!!errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      <Form methods={methods} onSubmit={onSubmit}>
        <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
          <Field.Text
            autoFocus
            name="email"
            label={t('sign_in_email_label')}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Button
            fullWidth
            color="inherit"
            size="large"
            type="submit"
            variant="contained"
            loading={isSubmitting}
            loadingIndicator={t('forgot_password_button_loading')}
          >
            {t('forgot_password_button')}
          </Button>
        </Box>
      </Form>

      <FormReturnLink href={paths.auth.jwt.signIn} label={t('return_to_sign_in')} />
    </>
  );
}
