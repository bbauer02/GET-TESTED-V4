'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

const RegisterSchema = z.object({
  civility: z.string().min(1, { message: 'Civilite requise' }),
  firstname: z.string().min(1, { message: 'Prenom requis' }),
  lastname: z.string().min(1, { message: 'Nom requis' }),
  email: z.string().min(1, { message: 'Email requis' }).email({ message: 'Email invalide' }),
  password: z.string().min(8, { message: '8 caracteres minimum' }),
  phone: z.string().optional(),
  gender: z.string().min(1, { message: 'Genre requis' }),
  // Address
  address1: z.string().min(1, { message: 'Adresse requise' }),
  address2: z.string().optional(),
  zipcode: z.string().min(1, { message: 'Code postal requis' }),
  city: z.string().min(1, { message: 'Ville requise' }),
  countryCode: z.string().min(1, { message: 'Pays requis' }),
});

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

const defaultValues = process.env.NODE_ENV === 'development' ? DEV_DEFAULTS : {
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
  const showPassword = useBoolean();

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
        <Typography variant="h6">Creer votre compte</Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Field.Select name="civility" label="Civilite" fullWidth>
            <MenuItem value="M">M.</MenuItem>
            <MenuItem value="MME">Mme</MenuItem>
            <MenuItem value="MLLE">Mlle</MenuItem>
            <MenuItem value="AUTRE">Autre</MenuItem>
          </Field.Select>

          <Field.Select name="gender" label="Genre" fullWidth>
            <MenuItem value="MASCULIN">Homme</MenuItem>
            <MenuItem value="FEMININ">Femme</MenuItem>
            <MenuItem value="AUTRE">Autre</MenuItem>
            <MenuItem value="NON_SPECIFIE">Non specifie</MenuItem>
          </Field.Select>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Field.Text name="firstname" label="Prenom" fullWidth />
          <Field.Text name="lastname" label="Nom" fullWidth />
        </Stack>

        <Field.Text name="email" label="Email" type="email" />

        <Field.Text
          name="password"
          label="Mot de passe"
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

        <Field.Text name="phone" label="Telephone (optionnel)" />

        {/* Address section */}
        <Typography variant="subtitle1" sx={{ pt: 1 }}>
          Adresse
        </Typography>

        <Field.Text name="address1" label="Adresse" />

        <Field.Text name="address2" label="Complement d'adresse (optionnel)" />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Field.Text name="zipcode" label="Code postal" sx={{ maxWidth: { sm: 200 } }} />
          <Field.Text name="city" label="Ville" fullWidth />
        </Stack>

        <Field.CountrySelect name="countryCode" label="Pays" displayValue="code" />

        {/* Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="eva:arrow-back-fill" />}
            onClick={onBack}
          >
            Retour
          </Button>

          <Button
            type="submit"
            variant="contained"
            size="large"
            endIcon={<Iconify icon="eva:arrow-forward-fill" />}
          >
            Continuer
          </Button>
        </Box>
      </Stack>
    </Form>
  );
}
