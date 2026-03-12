'use client';

import { z } from 'zod';
import dayjs from 'dayjs';
import { mutate } from 'swr';
import { useMemo, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputAdornment from '@mui/material/InputAdornment';

import { parsePhoneNumber } from 'react-phone-number-input/input';

import { fData } from 'src/utils/format-number';

import axios, { endpoints } from 'src/lib/axios';

import { useAuthContext } from 'src/auth/hooks';
import { getErrorMessage } from 'src/auth/utils/error-message';

import { Label } from 'src/components/label';
import { FlagIcon } from 'src/components/flag-icon';
import { Form, Field, schemaUtils } from 'src/components/hook-form';

import { COUNTRIES, LANGUAGES, GENDER_OPTIONS, CIVILITY_OPTIONS } from './utils/countries';

// ----------------------------------------------------------------------

const ProfileSchema = z.object({
  avatar: z.any().nullable(),
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
      avatar: user?.avatar || null,
      civility: user?.civility || '',
      gender: user?.gender || '',
      firstname: user?.firstname || '',
      lastname: user?.lastname || '',
      email: user?.email || '',
      phone: user?.phone?.startsWith?.('+')
        ? user.phone
        : user?.phoneCountryCode && user?.phone
          ? `${user.phoneCountryCode}${user.phone}`
          : user?.phone || '',
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
    watch,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const handleDropRejected = useCallback((fileRejections) => {
    const rejection = fileRejections[0];
    if (!rejection) return;

    const isTooLarge = rejection.errors.some((e) => e.code === 'file-too-large');
    if (isTooLarge) {
      setAlertState({
        severity: 'error',
        message: `Le fichier est trop volumineux (${fData(rejection.file.size)}). Taille maximum autorisee : ${fData(5242880)}.`,
      });
    } else {
      setAlertState({
        severity: 'error',
        message: `Fichier refuse : ${rejection.errors.map((e) => e.message).join(', ')}`,
      });
    }
  }, []);

  const watchLang = watch('firstlanguage');
  const watchCountry = watch('countryCode');
  const watchNativeCountry = watch('nativeCountry');
  const watchNationality = watch('nationality');

  const onSubmit = handleSubmit(async (data) => {
    try {
      // Upload avatar if a new file was selected
      if (data.avatar instanceof File) {
        const formData = new FormData();
        formData.append('file', data.avatar);
        await axios.post(endpoints.user.uploadAvatar, formData);
      }

      const parsed = data.phone ? parsePhoneNumber(data.phone) : null;
      const payload = {
        civility: data.civility || null,
        gender: data.gender || null,
        firstname: data.firstname,
        lastname: data.lastname,
        phone: parsed?.nationalNumber || (data.phone?.startsWith('+') ? null : data.phone) || null,
        phoneCountryCode: parsed ? `+${parsed.countryCallingCode}` : null,
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
      // Clear the user list cache so it re-fetches on next mount
      await mutate(endpoints.user.list, undefined, { revalidate: false });
      setAlertState({ severity: 'success', message: 'Profil mis a jour avec succes !' });
    } catch (error) {
      setAlertState({ severity: 'error', message: getErrorMessage(error) });
    }
  });

  const renderUserCard = () => (
    <Card sx={{ pt: 10, pb: 5, px: 3 }}>
      <Label
        color={user?.active ? 'success' : 'error'}
        sx={{ position: 'absolute', top: 24, right: 24 }}
      >
        {user?.active ? 'Actif' : 'Inactif'}
      </Label>

      <Box sx={{ mb: 5 }}>
        <Field.UploadAvatar
          name="avatar"
          maxSize={5242880}
          onDropRejected={handleDropRejected}
          helperText={
            <Typography
              variant="caption"
              sx={{
                mt: 3,
                mx: 'auto',
                display: 'block',
                textAlign: 'center',
                color: 'text.disabled',
              }}
            >
              Formats : *.jpeg, *.jpg, *.png, *.gif
              <br /> Taille max : {fData(5242880)}
            </Typography>
          }
        />
      </Box>

      <FormControlLabel
        labelPlacement="start"
        control={<Switch checked={!!user?.verified} disabled />}
        label={
          <>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              Email verifie
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Le compte a ete verifie par email
            </Typography>
          </>
        }
        sx={{ mx: 0, mb: 3, width: 1, justifyContent: 'space-between' }}
      />

      <Stack sx={{ alignItems: 'center' }}>
        <Button variant="soft" color="error" disabled>
          Supprimer le compte
        </Button>
      </Stack>
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

        <Field.Phone name="phone" label="Telephone" defaultCountry="FR" />

        <Field.DatePicker name="birthday" label="Date de naissance" />

        <Field.Autocomplete
          name="firstlanguage"
          label="Langue maternelle"
          options={LANGUAGES.map((lang) => lang.code)}
          getOptionLabel={(option) => LANGUAGES.find((l) => l.code === option)?.label ?? ''}
          isOptionEqualToValue={(option, value) => option === value}
          renderOption={({ key, ...props }, option) => {
            const lang = LANGUAGES.find((l) => l.code === option);
            return (
              <li key={key} {...props}>
                <FlagIcon code={lang?.countryCode} sx={{ mr: 1.5 }} />
                {lang?.label}
              </li>
            );
          }}
          slotProps={{
            textField: {
              slotProps: {
                input: {
                  startAdornment: watchLang ? (
                    <InputAdornment position="start">
                      <FlagIcon code={LANGUAGES.find((l) => l.code === watchLang)?.countryCode} />
                    </InputAdornment>
                  ) : null,
                },
              },
            },
          }}
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
          renderOption={({ key, ...props }, option) => (
            <li key={key} {...props}>
              <FlagIcon code={option} sx={{ mr: 1.5 }} />
              {COUNTRIES.find((c) => c.code === option)?.label}
            </li>
          )}
          slotProps={{
            textField: {
              slotProps: {
                input: {
                  startAdornment: watchCountry ? (
                    <InputAdornment position="start">
                      <FlagIcon code={watchCountry} />
                    </InputAdornment>
                  ) : null,
                },
              },
            },
          }}
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
          renderOption={({ key, ...props }, option) => (
            <li key={key} {...props}>
              <FlagIcon code={option} sx={{ mr: 1.5 }} />
              {COUNTRIES.find((c) => c.code === option)?.label}
            </li>
          )}
          slotProps={{
            textField: {
              slotProps: {
                input: {
                  startAdornment: watchNativeCountry ? (
                    <InputAdornment position="start">
                      <FlagIcon code={watchNativeCountry} />
                    </InputAdornment>
                  ) : null,
                },
              },
            },
          }}
        />

        <Field.Autocomplete
          name="nationality"
          label="Nationalite"
          options={COUNTRIES.map((c) => c.code)}
          getOptionLabel={(option) => COUNTRIES.find((c) => c.code === option)?.label ?? ''}
          isOptionEqualToValue={(option, value) => option === value}
          renderOption={({ key, ...props }, option) => (
            <li key={key} {...props}>
              <FlagIcon code={option} sx={{ mr: 1.5 }} />
              {COUNTRIES.find((c) => c.code === option)?.label}
            </li>
          )}
          slotProps={{
            textField: {
              slotProps: {
                input: {
                  startAdornment: watchNationality ? (
                    <InputAdornment position="start">
                      <FlagIcon code={watchNationality} />
                    </InputAdornment>
                  ) : null,
                },
              },
            },
          }}
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
