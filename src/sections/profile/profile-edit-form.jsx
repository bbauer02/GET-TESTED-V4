'use client';

import { z } from 'zod';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import axios, { endpoints } from 'src/lib/axios';

import { useAuthContext } from 'src/auth/hooks';
import { getErrorMessage } from 'src/auth/utils/error-message';

import { Label } from 'src/components/label';
import { Form, Field, schemaUtils } from 'src/components/hook-form';

import { COUNTRIES, LANGUAGES, GENDER_OPTIONS, CIVILITY_OPTIONS } from './utils/countries';

// ----------------------------------------------------------------------

const ProfileSchema = z.object({
  civility: z.string(),
  gender: z.string(),
  firstname: z.string().min(1, { error: 'Le prenom est requis !' }),
  lastname: z.string().min(1, { error: 'Le nom est requis !' }),
  email: z.string(),
  phone: z.string(),
  birthday: schemaUtils.date({ error: { required: 'La date de naissance est requise !' } }),
  firstlanguage: z.string().nullable(),
  address1: z.string(),
  zipcode: z.string(),
  city: z.string(),
  countryCode: z.string().nullable(),
  nativeCountry: z.string().nullable(),
  nationality: z.string().nullable(),
});

// ----------------------------------------------------------------------

export function ProfileEditForm() {
  const { user, checkUserSession } = useAuthContext();
  const [alertState, setAlertState] = useState(null);

  const defaultValues = useMemo(
    () => ({
      civility: user?.civility || '',
      gender: user?.gender || '',
      firstname: user?.firstname || '',
      lastname: user?.lastname || '',
      email: user?.email || '',
      phone: user?.phone || '',
      birthday: user?.birthday ? dayjs(user.birthday).format() : null,
      firstlanguage: user?.firstlanguage?.code || null,
      address1: user?.address?.address1 || '',
      zipcode: user?.address?.zipcode || '',
      city: user?.address?.city || '',
      countryCode: user?.address?.countryCode || null,
      nativeCountry: user?.nativeCountry?.code || null,
      nationality: user?.nationality?.code || null,
    }),
    [user]
  );

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(ProfileSchema),
    defaultValues,
    values: defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload = {
        civility: data.civility || null,
        gender: data.gender || null,
        firstname: data.firstname,
        lastname: data.lastname,
        phone: data.phone || null,
        birthday: data.birthday ? dayjs(data.birthday).format('YYYY-MM-DD') : null,
        firstlanguage: data.firstlanguage ? `/api/languages/${data.firstlanguage}` : null,
        nativeCountry: data.nativeCountry ? `/api/countries/${data.nativeCountry}` : null,
        nationality: data.nationality ? `/api/countries/${data.nationality}` : null,
        address: {
          address1: data.address1 || null,
          zipcode: data.zipcode || null,
          city: data.city || null,
          countryCode: data.countryCode || null,
        },
      };

      await axios.patch(endpoints.user.update, payload, {
        headers: { 'Content-Type': 'application/merge-patch+json' },
      });
      await checkUserSession();
      setAlertState({ severity: 'success', message: 'Profil mis a jour avec succes !' });
    } catch (error) {
      setAlertState({ severity: 'error', message: getErrorMessage(error) });
    }
  });

  const renderUserCard = () => (
    <Card sx={{ pt: 8, pb: 5, px: 3, textAlign: 'center' }}>
      <Box
        sx={{
          mx: 'auto',
          width: 96,
          height: 96,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'primary.lighter',
          color: 'primary.dark',
          typography: 'h3',
          mb: 3,
        }}
      >
        {(user?.firstname?.[0] || '').toUpperCase()}
        {(user?.lastname?.[0] || '').toUpperCase()}
      </Box>

      <Typography variant="subtitle1" noWrap>
        {user?.firstname} {user?.lastname}
      </Typography>

      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, mb: 2 }} noWrap>
        {user?.email}
      </Typography>

      <Label color="primary" variant="soft">
        {user?.role || 'Utilisateur'}
      </Label>
    </Card>
  );

  const renderPersonalInfo = () => (
    <>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
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
        <Field.Select name="civility" label="Civilite">
          {CIVILITY_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Field.Select>

        <Field.Select name="gender" label="Genre">
          {GENDER_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Field.Select>

        <Field.Text name="firstname" label="Prenom" />
        <Field.Text name="lastname" label="Nom" />

        <Field.Text name="email" label="Email" disabled />

        <Field.Text name="phone" label="Telephone" type="tel" />

        <Field.DatePicker name="birthday" label="Date de naissance" />

        <Field.Autocomplete
          name="firstlanguage"
          label="Langue maternelle"
          options={LANGUAGES.map((lang) => lang.code)}
          getOptionLabel={(option) => LANGUAGES.find((l) => l.code === option)?.label ?? ''}
          isOptionEqualToValue={(option, value) => option === value}
        />
      </Box>
    </>
  );

  const renderAddress = () => (
    <>
      <Typography variant="subtitle1" sx={{ mb: 2, mt: 4 }}>
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

        <Field.Autocomplete
          name="countryCode"
          label="Pays"
          options={COUNTRIES.map((c) => c.code)}
          getOptionLabel={(option) => COUNTRIES.find((c) => c.code === option)?.label ?? ''}
          isOptionEqualToValue={(option, value) => option === value}
        />
      </Box>
    </>
  );

  const renderNationality = () => (
    <>
      <Typography variant="subtitle1" sx={{ mb: 2, mt: 4 }}>
        Nationalite et origine
      </Typography>

      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
        }}
      >
        <Field.Autocomplete
          name="nativeCountry"
          label="Pays de naissance"
          options={COUNTRIES.map((c) => c.code)}
          getOptionLabel={(option) => COUNTRIES.find((c) => c.code === option)?.label ?? ''}
          isOptionEqualToValue={(option, value) => option === value}
        />

        <Field.Autocomplete
          name="nationality"
          label="Nationalite"
          options={COUNTRIES.map((c) => c.code)}
          getOptionLabel={(option) => COUNTRIES.find((c) => c.code === option)?.label ?? ''}
          isOptionEqualToValue={(option, value) => option === value}
        />
      </Box>
    </>
  );

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      {alertState && (
        <Alert severity={alertState.severity} sx={{ mb: 3 }} onClose={() => setAlertState(null)}>
          {alertState.message}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>{renderUserCard()}</Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ p: 3 }}>
            {renderPersonalInfo()}
            {renderAddress()}
            {renderNationality()}

            <Stack alignItems="flex-end" sx={{ mt: 3 }}>
              <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                Enregistrer
              </LoadingButton>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Form>
  );
}
