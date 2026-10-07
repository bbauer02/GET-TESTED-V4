'use client';

import { z } from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { varAlpha } from 'minimal-shared/utils';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Step from '@mui/material/Step';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Stepper from '@mui/material/Stepper';
import StepLabel from '@mui/material/StepLabel';
import Container from '@mui/material/Container';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import axios, { endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { setSession } from 'src/auth/context/jwt/utils';

// ----------------------------------------------------------------------

export function DevenirPartenaireView() {
  const { t } = useTranslate('partner');
  const theme = useTheme();
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);

  const STEPS = [t('step_account'), t('step_institute')];

  const FullSchema = z.object({
    // Account
    firstName: z.string().min(1, { message: t('validation_firstname_required') }),
    lastName: z.string().min(1, { message: t('validation_lastname_required') }),
    email: z.string().min(1, { message: t('validation_email_required') }).email({ message: t('validation_email_invalid') }),
    password: z.string().min(6, { message: t('validation_password_min') }),
    // Institute
    instituteLabel: z.string().min(1, { message: t('validation_institute_name_required') }),
    instituteEmail: z.string().email({ message: t('validation_email_invalid') }).or(z.literal('')),
    instituteSiteweb: z.string(),
    address1: z.string(),
    zipcode: z.string(),
    city: z.string(),
    legalForm: z.string(),
    siren: z.string().max(9, { message: t('validation_siren_max') }),
    siret: z.string().max(14, { message: t('validation_siret_max') }),
    vatNumber: z.string(),
    rcsCity: z.string(),
  });

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(FullSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      instituteLabel: '',
      instituteEmail: '',
      instituteSiteweb: '',
      address1: '',
      zipcode: '',
      city: '',
      legalForm: '',
      siren: '',
      siret: '',
      vatNumber: '',
      rcsCity: '',
    },
  });

  const {
    trigger,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const handleNext = async () => {
    const isValid = await trigger(['firstName', 'lastName', 'email', 'password']);
    if (isValid) {
      setActiveStep(1);
    }
  };

  const handleBack = () => {
    setActiveStep(0);
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      // Step 1: Register the user
      const registerRes = await axios.post(endpoints.auth.signUp, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      });

      const { access_token } = registerRes.data;

      if (!access_token) {
        throw new Error(t('account_creation_error'));
      }

      // Step 2: Set the session (stores token + sets Authorization header)
      await setSession(access_token);

      // Step 3: Create the institute
      await axios.post(endpoints.institute.list, {
        label: data.instituteLabel,
        email: data.instituteEmail || null,
        siteweb: data.instituteSiteweb || null,
        address: {
          address1: data.address1 || null,
          address2: null,
          zipcode: data.zipcode || null,
          city: data.city || null,
          countryCode: 'FR',
        },
        legalForm: data.legalForm || null,
        siren: data.siren || null,
        siret: data.siret || null,
        vatNumber: data.vatNumber || null,
        rcsCity: data.rcsCity || null,
      });

      toast.success(t('success_toast'));
      router.push(paths.dashboard.espaceInstitut.root);
    } catch (error) {
      console.error(error);
      toast.error(error?.message || t('error_toast'));
    }
  });

  const renderHeader = () => (
    <Stack spacing={2} sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
      <Box
        sx={{
          mx: 'auto',
          width: 64,
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 2,
          bgcolor: varAlpha(theme.vars.palette.primary.mainChannel, 0.08),
          color: 'primary.main',
        }}
      >
        <Iconify icon="solar:buildings-2-bold-duotone" width={36} />
      </Box>

      <Typography variant="h3" sx={{ fontWeight: 800 }}>
        {t('title')}
      </Typography>

      <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 480, mx: 'auto' }}>
        {t('subtitle')}
      </Typography>
    </Stack>
  );

  const renderStepper = () => (
    <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
      {STEPS.map((label) => (
        <Step key={label}>
          <StepLabel>{label}</StepLabel>
        </Step>
      ))}
    </Stepper>
  );

  const renderAccountStep = () => (
    <Stack spacing={3} sx={{ display: activeStep === 0 ? 'flex' : 'none' }}>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        {t('personal_info')}
      </Typography>

      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
        }}
      >
        <Field.Text
          name="firstName"
          label={t('firstname')}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="solar:user-bold-duotone" width={22} sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            },
          }}
        />
        <Field.Text
          name="lastName"
          label={t('lastname')}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="solar:user-bold-duotone" width={22} sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      <Field.Text
        name="email"
        label={t('email')}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="solar:letter-bold-duotone" width={22} sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          },
        }}
      />

      <Field.Text
        name="password"
        label={t('password')}
        type="password"
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="solar:lock-keyhole-bold-duotone" width={22} sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          },
        }}
      />

      <Button
        size="large"
        variant="contained"
        onClick={handleNext}
        endIcon={<Iconify icon="eva:arrow-forward-fill" />}
        sx={{ alignSelf: 'flex-end', minWidth: 200 }}
      >
        {t('next')}
      </Button>
    </Stack>
  );

  const renderInstituteStep = () => (
    <Stack spacing={3} sx={{ display: activeStep === 1 ? 'flex' : 'none' }}>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        {t('institute_info')}
      </Typography>

      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
        }}
      >
        <Field.Text
          name="instituteLabel"
          label={t('institute_name')}
          sx={{ gridColumn: '1 / -1' }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="solar:buildings-2-bold-duotone" width={22} sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            },
          }}
        />
        <Field.Text name="instituteEmail" label={t('institute_email')} />
        <Field.Text name="instituteSiteweb" label={t('website')} />
      </Box>

      <Typography variant="subtitle2" sx={{ mt: 1, color: 'text.secondary' }}>
        {t('address_section')}
      </Typography>

      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
        }}
      >
        <Field.Text name="address1" label={t('address')} sx={{ gridColumn: '1 / -1' }} />
        <Field.Text name="zipcode" label={t('zipcode')} />
        <Field.Text name="city" label={t('city')} />
      </Box>

      <Typography variant="subtitle2" sx={{ mt: 1, color: 'text.secondary' }}>
        {t('legal_info')}
      </Typography>

      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
        }}
      >
        <Field.Text name="legalForm" label={t('legal_form')} />
        <Field.Text name="siren" label={t('siren')} slotProps={{ htmlInput: { maxLength: 9 } }} />
        <Field.Text name="siret" label={t('siret')} slotProps={{ htmlInput: { maxLength: 14 } }} />
        <Field.Text name="vatNumber" label={t('vat_number')} />
        <Field.Text name="rcsCity" label={t('rcs_city')} />
      </Box>

      <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', pt: 1 }}>
        <Button
          size="large"
          variant="outlined"
          onClick={handleBack}
          startIcon={<Iconify icon="eva:arrow-back-fill" />}
        >
          {t('back')}
        </Button>

        <LoadingButton
          size="large"
          type="submit"
          variant="contained"
          loading={isSubmitting}
          endIcon={<Iconify icon="eva:checkmark-circle-2-fill" />}
          sx={{ minWidth: 200 }}
        >
          {t('create_institute')}
        </LoadingButton>
      </Stack>
    </Stack>
  );

  return (
    <Container maxWidth="md" sx={{ py: { xs: 8, md: 12 } }}>
      {renderHeader()}

      <Card sx={{ p: { xs: 3, md: 5 } }}>
        {renderStepper()}

        <Form methods={methods} onSubmit={onSubmit}>
          {renderAccountStep()}
          {renderInstituteStep()}
        </Form>
      </Card>

      <Typography
        variant="body2"
        sx={{ color: 'text.secondary', textAlign: 'center', mt: 4 }}
      >
        {t('already_account')}{' '}
        <Typography
          component="a"
          href={paths.auth.jwt.signIn}
          variant="subtitle2"
          sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          {t('sign_in')}
        </Typography>
      </Typography>
    </Container>
  );
}
