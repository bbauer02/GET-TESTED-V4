'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { usePathname } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

// TODO: remove dev defaults before production
const DEV_DEFAULTS = {
  civility: 'M',
  gender: 'MASCULIN',
  firstname: 'Jean',
  lastname: 'Dupont',
  email: `test.${Date.now()}@example.com`,
  password: 'Password123!',
  phone: '0612345678',
  address1: '12 rue de la Paix',
  address2: '',
  zipcode: '75002',
  city: 'Paris',
  countryCode: 'FR',
};

const prodDefaults = {
  civility: '',
  gender: '',
  firstname: '',
  lastname: '',
  email: '',
  password: '',
  phone: '',
  address1: '',
  address2: '',
  zipcode: '',
  city: '',
  countryCode: '',
};

// ----------------------------------------------------------------------

export function EnrollmentStepRegister({ registrationData, onNext, onBack }) {
  const { t } = useTranslate('sessions');
  const showPassword = useBoolean();
  const pathname = usePathname();

  // Après connexion, le GuestGuard renvoie sur cette session (le candidat reprend le tunnel connecté)
  const signInHref = `${paths.auth.jwt.signIn}?${new URLSearchParams({ returnTo: pathname })}`;

  const RegisterSchema = z.object({
    civility: z.string().min(1, { message: t('validation_civility_required') }),
    firstname: z.string().min(1, { message: t('validation_firstname_required') }),
    lastname: z.string().min(1, { message: t('validation_lastname_required') }),
    email: z.string().min(1, { message: t('validation_email_required') }).email({ message: t('validation_email_invalid') }),
    password: z.string().min(8, { message: t('validation_password_min') }),
    phone: z.string().optional(),
    gender: z.string().min(1, { message: t('validation_gender_required') }),
    // Address
    address1: z.string().min(1, { message: t('validation_address_required') }),
    address2: z.string().optional(),
    zipcode: z.string().min(1, { message: t('validation_zipcode_required') }),
    city: z.string().min(1, { message: t('validation_city_required') }),
    countryCode: z.string().min(1, { message: t('validation_country_required') }),
  });

  const defaultValues = process.env.NODE_ENV === 'development' ? DEV_DEFAULTS : prodDefaults;

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(RegisterSchema),
    defaultValues: registrationData || defaultValues,
  });

  const { handleSubmit } = methods;

  const onSubmit = handleSubmit((data) => {
    onNext(data);
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={3}>
        <Alert severity="info" icon={<Iconify icon="solar:user-check-bold" />}>
          {t('already_have_account')}{' '}
          <Link component={RouterLink} href={signInHref} underline="always" sx={{ fontWeight: 600 }}>
            {t('sign_in_to_continue')}
          </Link>
        </Alert>

        <Typography variant="h6">{t('create_account')}</Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Field.Select name="civility" label={t('civility')} fullWidth>
            <MenuItem value="M">{t('mr')}</MenuItem>
            <MenuItem value="MME">{t('mrs')}</MenuItem>
            <MenuItem value="MLLE">{t('miss')}</MenuItem>
            <MenuItem value="AUTRE">{t('other')}</MenuItem>
          </Field.Select>

          <Field.Select name="gender" label={t('gender')} fullWidth>
            <MenuItem value="MASCULIN">{t('male')}</MenuItem>
            <MenuItem value="FEMININ">{t('female')}</MenuItem>
            <MenuItem value="AUTRE">{t('other')}</MenuItem>
            <MenuItem value="NON_SPECIFIE">{t('not_specified')}</MenuItem>
          </Field.Select>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Field.Text name="firstname" label={t('firstname')} fullWidth />
          <Field.Text name="lastname" label={t('lastname')} fullWidth />
        </Stack>

        <Field.Text name="email" label={t('email')} type="email" />

        <Field.Text
          name="password"
          label={t('password')}
          type={showPassword.value ? 'text' : 'password'}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={showPassword.onToggle} edge="end">
                    <Iconify icon={showPassword.value ? 'eva:eye-fill' : 'eva:eye-off-fill'} />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        <Field.Text name="phone" label={t('phone_optional')} />

        {/* Address section */}
        <Typography variant="subtitle1" sx={{ pt: 1 }}>
          {t('address')}
        </Typography>

        <Field.Text name="address1" label={t('address')} />

        <Field.Text name="address2" label={t('address_complement')} />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Field.Text name="zipcode" label={t('zipcode')} sx={{ maxWidth: { sm: 200 } }} />
          <Field.Text name="city" label={t('city')} fullWidth />
        </Stack>

        <Field.CountrySelect name="countryCode" label={t('country')} displayValue="code" />

        {/* Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="eva:arrow-back-fill" />}
            onClick={onBack}
          >
            {t('back')}
          </Button>

          <Button
            type="submit"
            variant="contained"
            size="large"
            endIcon={<Iconify icon="eva:arrow-forward-fill" />}
          >
            {t('continue')}
          </Button>
        </Box>
      </Stack>
    </Form>
  );
}
