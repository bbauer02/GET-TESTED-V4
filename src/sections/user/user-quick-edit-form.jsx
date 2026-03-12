'use client';

import { z } from 'zod';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import { mutate } from 'swr';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';

import { parsePhoneNumber } from 'react-phone-number-input/input';

import axios, { endpoints } from 'src/lib/axios';

import { useAuthContext } from 'src/auth/hooks';

import { toast } from 'src/components/snackbar';
import { FlagIcon } from 'src/components/flag-icon';
import { Form, Field, schemaUtils } from 'src/components/hook-form';

import { COUNTRIES, LANGUAGES, GENDER_OPTIONS, CIVILITY_OPTIONS } from '../profile/utils/countries';

// ----------------------------------------------------------------------

const ROLE_OPTIONS = [
  { value: 'USER', label: 'Utilisateur' },
  { value: 'ADMIN', label: 'Administrateur' },
];

const UserQuickEditSchema = z.object({
  active: z.boolean(),
  verified: z.boolean(),
  avatar: z.any().nullable(),
  firstname: z.string().min(1, { error: 'Le prenom est requis !' }),
  lastname: z.string().min(1, { error: 'Le nom est requis !' }),
  email: schemaUtils.email({ error: 'Email invalide !' }),
  civility: z.string(),
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

// ----------------------------------------------------------------------

export function UserQuickEditForm({ currentUser, open, onClose }) {
  const { user: authUser, checkUserSession } = useAuthContext();

  const defaultValues = useMemo(
    () => ({
      active: currentUser?.active ?? true,
      verified: currentUser?.verified ?? false,
      avatar: currentUser?.avatar || null,
      firstname: currentUser?.firstname || '',
      lastname: currentUser?.lastname || '',
      email: currentUser?.email || '',
      civility: currentUser?.civility || '',
      platformRole: currentUser?.platformRole || 'USER',
      phone: currentUser?.phone?.startsWith?.('+')
        ? currentUser.phone
        : currentUser?.phoneCountryCode && currentUser?.phone
          ? `${currentUser.phoneCountryCode}${currentUser.phone}`
          : currentUser?.phone || '',
      gender: currentUser?.gender || '',
      birthday: currentUser?.birthday ? dayjs(currentUser.birthday).format() : null,
      firstlanguage: currentUser?.firstlanguage?.code || currentUser?.firstlanguage || null,
      address1: currentUser?.address?.address1 || '',
      address2: currentUser?.address?.address2 || '',
      zipcode: currentUser?.address?.zipcode || '',
      city: currentUser?.address?.city || '',
      countryCode: currentUser?.address?.countryCode || null,
      nativeCountry: currentUser?.nativeCountry?.code || currentUser?.nativeCountry || null,
      nationality: currentUser?.nationality?.code || currentUser?.nationality || null,
    }),
    [currentUser]
  );

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(UserQuickEditSchema),
    defaultValues,
    values: defaultValues,
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
      // Upload avatar if a new file was selected
      if (data.avatar instanceof File) {
        const formData = new FormData();
        formData.append('file', data.avatar);
        await axios.post(`${endpoints.user.details}/${currentUser.id}/avatar`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      const parsed = data.phone ? parsePhoneNumber(data.phone) : null;
      const payload = {
        isActive: data.active,
        isVerified: data.verified,
        firstname: data.firstname,
        lastname: data.lastname,
        email: data.email,
        civility: data.civility || null,
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

      await axios.patch(`${endpoints.user.details}/${currentUser.id}/`, payload, {
        headers: { 'Content-Type': 'application/merge-patch+json' },
      });

      await mutate(endpoints.user.list);

      if (currentUser?.id === authUser?.id) {
        await checkUserSession?.();
      }

      toast.success('Utilisateur mis a jour !');
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error?.message || 'Erreur lors de la mise a jour');
    }
  });

  return (
    <Dialog
      fullWidth
      maxWidth={false}
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { maxWidth: 720 } } }}
    >
      <DialogTitle>Modification rapide</DialogTitle>

      <Form methods={methods} onSubmit={onSubmit}>
        <DialogContent>
          {!currentUser?.active && (
            <Alert variant="outlined" severity="warning" sx={{ mb: 3 }}>
              Le compte est desactive
            </Alert>
          )}

          <Field.Switch
            name="active"
            labelPlacement="start"
            label={
              <>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  Compte actif
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Desactiver le compte de l&apos;utilisateur
                </Typography>
              </>
            }
            sx={{ mx: 0, mb: 3, width: 1, justifyContent: 'space-between' }}
          />

          <Field.Switch
            name="verified"
            labelPlacement="start"
            label={
              <>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  Email verifie
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  L&apos;email de l&apos;utilisateur a ete verifie
                </Typography>
              </>
            }
            sx={{ mx: 0, mb: 3, width: 1, justifyContent: 'space-between' }}
          />

          <Box
            sx={{
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
            }}
          >
            <Field.Select name="platformRole" label="Role">
              {ROLE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Field.Select>

            <Box sx={{ display: { xs: 'none', sm: 'block' } }} />

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
            <Field.Text name="email" label="Email" />
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

            <Field.Text name="address1" label="Adresse" sx={{ gridColumn: '1 / -1' }} />
            <Field.Text name="address2" label="Complement" sx={{ gridColumn: '1 / -1' }} />
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
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            Enregistrer
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
