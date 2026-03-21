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

import axios, { endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { setSession } from 'src/auth/context/jwt/utils';

// ----------------------------------------------------------------------

const STEPS = ['Votre compte', 'Votre institut'];

const AccountSchema = z.object({
  firstName: z.string().min(1, { message: 'Le prenom est requis' }),
  lastName: z.string().min(1, { message: 'Le nom est requis' }),
  email: z.string().min(1, { message: "L'email est requis" }).email({ message: 'Email invalide' }),
  password: z.string().min(6, { message: '6 caracteres minimum' }),
});

const InstituteSchema = z.object({
  label: z.string().min(1, { message: "Le nom de l'institut est requis" }),
  email: z.string().email({ message: 'Email invalide' }).or(z.literal('')),
  siteweb: z.string(),
  address: z.object({
    address1: z.string(),
    zipcode: z.string(),
    city: z.string(),
  }),
  legalForm: z.string(),
  siren: z.string().max(9, { message: '9 caracteres maximum' }),
  siret: z.string().max(14, { message: '14 caracteres maximum' }),
  vatNumber: z.string(),
  rcsCity: z.string(),
});

const FullSchema = z.object({
  // Account
  firstName: AccountSchema.shape.firstName,
  lastName: AccountSchema.shape.lastName,
  email: AccountSchema.shape.email,
  password: AccountSchema.shape.password,
  // Institute
  instituteLabel: InstituteSchema.shape.label,
  instituteEmail: InstituteSchema.shape.email,
  instituteSiteweb: z.string(),
  address1: z.string(),
  zipcode: z.string(),
  city: z.string(),
  legalForm: z.string(),
  siren: z.string().max(9, { message: '9 caracteres maximum' }),
  siret: z.string().max(14, { message: '14 caracteres maximum' }),
  vatNumber: z.string(),
  rcsCity: z.string(),
});

// ----------------------------------------------------------------------

export function DevenirPartenaireView() {
  const theme = useTheme();
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);

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
        throw new Error('Erreur lors de la creation du compte');
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

      toast.success('Bienvenue ! Votre institut a ete cree avec succes.');
      router.push(paths.dashboard.espaceInstitut.root);
    } catch (error) {
      console.error(error);
      toast.error(error?.message || "Erreur lors de l'inscription");
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
        Devenir partenaire
      </Typography>

      <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 480, mx: 'auto' }}>
        Creez votre compte et votre institut en quelques minutes. Gerez vos sessions, inscriptions et
        documents depuis votre espace dedie.
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
        Informations personnelles
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
          label="Prenom"
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
          label="Nom"
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
        label="Adresse email"
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
        label="Mot de passe"
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
        Suivant
      </Button>
    </Stack>
  );

  const renderInstituteStep = () => (
    <Stack spacing={3} sx={{ display: activeStep === 1 ? 'flex' : 'none' }}>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        Informations de l&apos;institut
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
          label="Nom de l'institut"
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
        <Field.Text name="instituteEmail" label="Email de contact (institut)" />
        <Field.Text name="instituteSiteweb" label="Site web" />
      </Box>

      <Typography variant="subtitle2" sx={{ mt: 1, color: 'text.secondary' }}>
        Adresse
      </Typography>

      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
        }}
      >
        <Field.Text name="address1" label="Adresse" sx={{ gridColumn: '1 / -1' }} />
        <Field.Text name="zipcode" label="Code postal" />
        <Field.Text name="city" label="Ville" />
      </Box>

      <Typography variant="subtitle2" sx={{ mt: 1, color: 'text.secondary' }}>
        Informations legales
      </Typography>

      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
        }}
      >
        <Field.Text name="legalForm" label="Forme juridique" />
        <Field.Text name="siren" label="SIREN" slotProps={{ htmlInput: { maxLength: 9 } }} />
        <Field.Text name="siret" label="SIRET" slotProps={{ htmlInput: { maxLength: 14 } }} />
        <Field.Text name="vatNumber" label="Numero de TVA" />
        <Field.Text name="rcsCity" label="Ville RCS" />
      </Box>

      <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', pt: 1 }}>
        <Button
          size="large"
          variant="outlined"
          onClick={handleBack}
          startIcon={<Iconify icon="eva:arrow-back-fill" />}
        >
          Retour
        </Button>

        <LoadingButton
          size="large"
          type="submit"
          variant="contained"
          loading={isSubmitting}
          endIcon={<Iconify icon="eva:checkmark-circle-2-fill" />}
          sx={{ minWidth: 200 }}
        >
          Creer mon institut
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
        Vous avez deja un compte ?{' '}
        <Typography
          component="a"
          href={paths.auth.jwt.signIn}
          variant="subtitle2"
          sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          Se connecter
        </Typography>
      </Typography>
    </Container>
  );
}
