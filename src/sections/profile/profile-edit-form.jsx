'use client';

import { z } from 'zod';
import dayjs from 'dayjs';
import { mutate } from 'swr';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useCallback } from 'react';
import { parsePhoneNumber } from 'react-phone-number-input/input';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';

import { fData } from 'src/utils/format-number';

import { useTranslate } from 'src/locales';
import axios, { endpoints } from 'src/lib/axios';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { FlagIcon } from 'src/components/flag-icon';
import { Form, Field, schemaUtils } from 'src/components/hook-form';

import { useAuthContext } from 'src/auth/hooks';
import { getErrorMessage } from 'src/auth/utils/error-message';

import { ProfilePhoneVerifyDialog } from './profile-phone-verify-dialog';
import { COUNTRIES, LANGUAGES, GENDER_OPTIONS, CIVILITY_OPTIONS } from './utils/countries';

// ----------------------------------------------------------------------

export function ProfileEditForm() {
  const { t } = useTranslate('profile');
  const { user, checkUserSession } = useAuthContext();
  const [alertState, setAlertState] = useState(null);

  const phoneVerifyDialog = useBoolean();
  const isPhoneVerified = !!user?.phoneVerifiedAt;
  const hasSavedPhone = !!user?.phone;

  const ProfileSchema = z.object({
    avatar: z.any().nullable(),
    civility: z.string(),
    gender: z.string(),
    firstname: z.string().min(1, { error: t('validation_firstname_required') }),
    lastname: z.string().min(1, { error: t('validation_lastname_required') }),
    email: z.string(),
    phone: z.string(),
    birthday: schemaUtils.date({ error: { required: t('validation_birthday_required') } }),
    firstlanguage: z.string().nullable(),
    address1: z.string(),
    zipcode: z.string(),
    city: z.string(),
    countryCode: z.string().nullable(),
    nativeCountry: z.string().nullable(),
    nationality: z.string().nullable(),
  });

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
        message: t('file_too_large', { fileSize: fData(rejection.file.size), maxSize: fData(5242880) }),
      });
    } else {
      setAlertState({
        severity: 'error',
        message: t('file_rejected', { errors: rejection.errors.map((e) => e.message).join(', ') }),
      });
    }
  }, [t]);

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
      setAlertState({ severity: 'success', message: t('profile_updated') });
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
        {user?.active ? t('active') : t('inactive')}
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
              {t('avatar_formats')}
              <br /> {t('avatar_max_size', { size: fData(5242880) })}
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
              {t('email_verified')}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('email_verified_desc')}
            </Typography>
          </>
        }
        sx={{ mx: 0, mb: 3, width: 1, justifyContent: 'space-between' }}
      />

      <Stack sx={{ alignItems: 'center' }}>
        <Button variant="soft" color="error" disabled>
          {t('delete_account')}
        </Button>
      </Stack>
    </Card>
  );

  const renderPersonalInfo = () => (
    <>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
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
        <Field.Select name="civility" label={t('civility')}>
          {CIVILITY_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Field.Select>

        <Field.Select name="gender" label={t('gender')}>
          {GENDER_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Field.Select>

        <Field.Text name="firstname" label={t('firstname')} />
        <Field.Text name="lastname" label={t('lastname')} />

        <Field.Text name="email" label={t('email')} disabled />

        <Stack spacing={1}>
          <Field.Phone name="phone" label={t('phone')} defaultCountry="FR" />

          <Stack direction="row" spacing={1} alignItems="center" sx={{ pl: 0.5 }}>
            {isPhoneVerified ? (
              <Label variant="soft" color="success" startIcon={<Iconify icon="solar:verified-check-bold" />}>
                {t('phone_verified')}
              </Label>
            ) : (
              <>
                <Label variant="soft" color="warning">
                  {t('phone_not_verified')}
                </Label>
                <Tooltip title={hasSavedPhone ? '' : t('phone_verify_hint')}>
                  <span>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={!hasSavedPhone}
                      onClick={phoneVerifyDialog.onTrue}
                      startIcon={<Iconify icon="solar:shield-check-bold" />}
                    >
                      {t('phone_verify_button')}
                    </Button>
                  </span>
                </Tooltip>
              </>
            )}
          </Stack>
        </Stack>

        <Field.DatePicker name="birthday" label={t('birthday')} />

        <Field.Autocomplete
          name="firstlanguage"
          label={t('native_language')}
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

        <Field.Autocomplete
          name="countryCode"
          label={t('country')}
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
        {t('nationality_section')}
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
          label={t('native_country')}
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
          label={t('nationality')}
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
      <ProfilePhoneVerifyDialog
        open={phoneVerifyDialog.value}
        onClose={phoneVerifyDialog.onFalse}
        phone={defaultValues.phone}
        onVerified={checkUserSession}
      />

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
                {t('save')}
              </LoadingButton>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Form>
  );
}
