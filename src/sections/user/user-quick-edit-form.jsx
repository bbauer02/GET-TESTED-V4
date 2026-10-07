'use client';

import { z } from 'zod';
import dayjs from 'dayjs';
import { mutate } from 'swr';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { parsePhoneNumber } from 'react-phone-number-input/input';

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

import { useTranslate } from 'src/locales';
import axios, { endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
import { FlagIcon } from 'src/components/flag-icon';
import { Form, Field, schemaUtils } from 'src/components/hook-form';

import { useAuthContext } from 'src/auth/hooks';

import { COUNTRIES, LANGUAGES, GENDER_OPTIONS, CIVILITY_OPTIONS } from '../profile/utils/countries';

// ----------------------------------------------------------------------

// ROLE_OPTIONS moved inside component for i18n

const UserQuickEditSchema = z.object({
  active: z.boolean(),
  verified: z.boolean(),
  avatar: z.any().nullable(),
  firstname: z.string().min(1, { error: 'Le prénom est requis !' }),
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
  const { t } = useTranslate('user');

  const { user: authUser, checkUserSession } = useAuthContext();

  const ROLE_OPTIONS = [
    { value: 'USER', label: t('role_user') },
    { value: 'ADMIN', label: t('role_admin') },
  ];

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

      toast.success(t('update_success'));
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error?.message || t('update_error'));
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
      <DialogTitle>{t('quick_edit_title')}</DialogTitle>

      <Form methods={methods} onSubmit={onSubmit}>
        <DialogContent>
          {!currentUser?.active && (
            <Alert variant="outlined" severity="warning" sx={{ mb: 3 }}>
              {t('account_disabled_alert')}
            </Alert>
          )}

          <Field.Switch
            name="active"
            labelPlacement="start"
            label={
              <>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  {t('switch_active_title')}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {t('switch_active_description')}
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
                  {t('switch_verified_title')}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {t('switch_verified_description')}
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
            <Field.Select name="platformRole" label={t('label_role')}>
              {ROLE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Field.Select>

            <Box sx={{ display: { xs: 'none', sm: 'block' } }} />

            <Field.Select name="civility" label={t('label_civility')}>
              {CIVILITY_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Field.Select>

            <Field.Select name="gender" label={t('label_gender')}>
              {GENDER_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Field.Select>

            <Field.Text name="firstname" label={t('label_firstname')} />
            <Field.Text name="lastname" label={t('label_lastname')} />
            <Field.Text name="email" label={t('label_email')} />
            <Field.Phone name="phone" label={t('label_phone')} defaultCountry="FR" />

            <Field.DatePicker name="birthday" label={t('label_birthday')} />

            <Field.Autocomplete
              name="firstlanguage"
              label={t('label_first_language')}
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

            <Field.Text name="address1" label={t('label_address')} sx={{ gridColumn: '1 / -1' }} />
            <Field.Text name="address2" label={t('label_address2')} sx={{ gridColumn: '1 / -1' }} />
            <Field.Text name="zipcode" label={t('label_zipcode')} />
            <Field.Text name="city" label={t('label_city')} />

            <Field.Autocomplete
              name="countryCode"
              label={t('label_country')}
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
              label={t('label_native_country')}
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
              label={t('label_nationality')}
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
            {t('cancel')}
          </Button>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            {t('save')}
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
