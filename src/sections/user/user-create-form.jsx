'use client';

import { z } from 'zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { parsePhoneNumber } from 'react-phone-number-input/input';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { inviteUser } from 'src/actions/user';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaUtils } from 'src/components/hook-form';

import { getErrorMessage } from 'src/auth/utils';

// ----------------------------------------------------------------------

const defaultValues = {
  firstname: '',
  lastname: '',
  email: '',
  platformRole: 'USER',
  phone: '',
};

// ----------------------------------------------------------------------

/**
 * Création d'un compte par l'admin plateforme : le compte est créé inactif et
 * l'utilisateur reçoit un email pour définir son mot de passe (POST /api/admin/users/invite).
 */
export function UserCreateForm() {
  const { t } = useTranslate('user');
  const router = useRouter();

  const UserInviteSchema = useMemo(
    () =>
      z.object({
        firstname: z.string().trim().min(1, { error: t('validation_firstname') }),
        lastname: z.string().trim().min(1, { error: t('validation_lastname') }),
        email: schemaUtils.email({ error: t('validation_email') }),
        platformRole: z.enum(['USER', 'ADMIN']),
        phone: z.string(),
      }),
    [t]
  );

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(UserInviteSchema),
    defaultValues,
  });

  const {
    setError,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    let parsed = null;
    if (data.phone) {
      try {
        parsed = parsePhoneNumber(data.phone);
      } catch {
        parsed = null;
      }
    }

    try {
      await inviteUser({
        firstname: data.firstname.trim(),
        lastname: data.lastname.trim(),
        email: data.email.trim(),
        platformRole: data.platformRole,
        phone: parsed?.nationalNumber || null,
        phoneCountryCode: parsed ? `+${parsed.countryCallingCode}` : null,
      });

      toast.success(t('invite_success', { email: data.email.trim(), interpolation: { escapeValue: false } }));
      router.push(paths.dashboard.user.list);
    } catch (error) {
      const message = getErrorMessage(error);
      if (error?.status === 409) {
        // Email déjà utilisé
        setError('email', { type: 'manual', message });
      }
      (error?.violations || []).forEach((violation) => {
        if (violation.propertyPath in defaultValues) {
          setError(violation.propertyPath, { type: 'manual', message: violation.message });
        }
      });
      toast.error(message);
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Card sx={{ p: 3, maxWidth: 720 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          {t('section_account_info')}
        </Typography>

        <Alert severity="info" variant="outlined" sx={{ mb: 3 }}>
          {t('invite_hint')}
        </Alert>

        <Box
          sx={{
            rowGap: 3,
            columnGap: 2,
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
          }}
        >
          <Field.Text name="firstname" label={t('label_firstname')} />
          <Field.Text name="lastname" label={t('label_lastname')} />
          <Field.Text name="email" type="email" label={t('label_email')} />

          <Field.Select name="platformRole" label={t('label_role')}>
            <MenuItem value="USER">{t('role_user')}</MenuItem>
            <MenuItem value="ADMIN">{t('role_admin')}</MenuItem>
          </Field.Select>

          <Field.Phone
            name="phone"
            label={t('label_phone_optional')}
            defaultCountry="FR"
            sx={{ gridColumn: '1 / -1' }}
          />
        </Box>

        <Stack direction="row" justifyContent="flex-end" spacing={1.5} sx={{ mt: 3 }}>
          <Button variant="outlined" color="inherit" onClick={() => router.push(paths.dashboard.user.list)}>
            {t('cancel')}
          </Button>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            {t('submit_invite')}
          </Button>
        </Stack>
      </Card>
    </Form>
  );
}
