'use client';

import { z } from 'zod';
import dayjs from 'dayjs';
import { mutate } from 'swr';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { parsePhoneNumber } from 'react-phone-number-input/input';

import axios, { endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
import { FlagIcon } from 'src/components/flag-icon';
import { Form, Field, schemaUtils } from 'src/components/hook-form';

import { COUNTRIES, LANGUAGES, GENDER_OPTIONS, CIVILITY_OPTIONS } from '../profile/utils/countries';

// ----------------------------------------------------------------------

const ROLE_OPTIONS = [
  { value: 'USER', label: 'Utilisateur' },
  { value: 'ADMIN', label: 'Administrateur' },
];

const UserCreateSchema = z.object({
  avatar: z.any().nullable(),
  firstname: z.string().min(1, { error: 'Le prenom est requis !' }),
  lastname: z.string().min(1, { error: 'Le nom est requis !' }),
  email: schemaUtils.email({ error: 'Email invalide !' }),
  password: z.string().min(8, { error: 'Le mot de passe doit faire au moins 8 caracteres !' }),
  civility: z.string().min(1, { error: 'La civilite est requise !' }),
  platformRole: z.string(),
  phone: z.string(),
  gender: z.string(),
  birthday: z.any().nullable(),
  firstlanguage: z.string().nullable(),
  address1: z.string(),
  address2: z.string(),
  zipcode: z.string(),
  city: z.string(),
  countryCode: z.string().nullable(),
  nativeCountry: z.string().nullable(),
  nationality: z.string().nullable(),
});

const defaultValues = {
  avatar: null,
  firstname: 'Jean',
  lastname: 'Dupont',
  email: 'jean.dupont@test.fr',
  password: 'Test1234!',
  civility: 'MR',
  platformRole: 'USER',
  phone: '+33612345678',
  gender: 'MALE',
  birthday: dayjs('1990-05-15'),
  firstlanguage: 'fr',
  address1: '10 Avenue des Champs-Elysees',
  address2: 'Apt 42',
  zipcode: '75008',
  city: 'Paris',
  countryCode: 'FR',
  nativeCountry: 'FR',
  nationality: 'FR',
};

// ----------------------------------------------------------------------

export function UserCreateForm() {
  const router = useRouter();

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(UserCreateSchema),
    defaultValues,
  });

  const {
    watch,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const watchLang = watch('firstlanguage');
  const watchCountry = watch('countryCode');
  const watchNativeCountry = watch('nativeCountry');
  const watchNationality = watch('nationality');

  const onSubmit = handleSubmit(async (data) => {
    try {
      // Step 1: Register with required fields
      const registerPayload = {
        email: data.email,
        password: data.password,
        firstname: data.firstname,
        lastname: data.lastname,
        civility: data.civility,
      };

      const res = await axios.post(endpoints.user.create, registerPayload);
      const newUserId = res.data?.id;

      // Step 2: PATCH additional fields if any were filled
      const parsed = data.phone ? parsePhoneNumber(data.phone) : null;
      const patchPayload = {
        platformRole: data.platformRole || 'USER',
        phone: parsed?.nationalNumber || (data.phone?.startsWith('+') ? null : data.phone) || null,
        phoneCountryCode: parsed ? `+${parsed.countryCallingCode}` : null,
        gender: data.gender || null,
        birthday: data.birthday ? dayjs(data.birthday).format('YYYY-MM-DD') : null,
        firstlanguage: data.firstlanguage ? `/api/languages/${data.firstlanguage}` : null,
        nativeCountry: data.nativeCountry ? `/api/countries/${data.nativeCountry}` : null,
        nationality: data.nationality ? `/api/countries/${data.nationality}` : null,
        address: {
          address1: data.address1 || null,
          address2: data.address2 || null,
          zipcode: data.zipcode || null,
          city: data.city || null,
          countryCode: data.countryCode || null,
        },
      };

      if (newUserId) {
        await axios.patch(`${endpoints.user.details}/${newUserId}/`, patchPayload, {
          headers: { 'Content-Type': 'application/merge-patch+json' },
        });

        // Upload avatar if a file was selected
        if (data.avatar instanceof File) {
          const formData = new FormData();
          formData.append('file', data.avatar);
          await axios.post(`${endpoints.user.details}/${newUserId}/avatar`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
      }

      // Invalidate the user list cache so it re-fetches on next mount
      await mutate(endpoints.user.list, undefined, { revalidate: false });

      toast.success('Utilisateur cree avec succes !');
      router.push(paths.dashboard.user.list);
    } catch (error) {
      console.error(error);
      toast.error(error?.message || 'Erreur lors de la creation');
    }
  });

  const renderAccountInfo = () => (
    <>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Informations du compte
      </Typography>

      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
        }}
      >
        <Field.Text name="email" label="Email" />
        <Field.Text name="password" label="Mot de passe" type="password" />

        <Field.Select name="platformRole" label="Role">
          {ROLE_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Field.Select>
      </Box>
    </>
  );

  const renderPersonalInfo = () => (
    <>
      <Typography variant="subtitle1" sx={{ mb: 2, mt: 4 }}>
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
        <Field.Text name="address2" label="Complement d'adresse" sx={{ gridColumn: '1 / -1' }} />
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
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ pt: 8, pb: 5, px: 3, textAlign: 'center' }}>
            <Field.UploadAvatar name="avatar" />
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ p: 3 }}>
            {renderAccountInfo()}
            {renderPersonalInfo()}
            {renderAddress()}
            {renderNationality()}

            <Stack alignItems="flex-end" sx={{ mt: 3 }}>
              <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                Creer l&apos;utilisateur
              </LoadingButton>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Form>
  );
}
