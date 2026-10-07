'use client';

import { z } from 'zod';
import { mutate } from 'swr';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import axios, { endpoints } from 'src/lib/axios';
import { inviteInstituteAdmin } from 'src/actions/institute';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { FlagIcon } from 'src/components/flag-icon';
import { Form, Field } from 'src/components/hook-form';

import { getErrorMessage } from 'src/auth/utils';

import { COUNTRIES } from '../profile/utils/countries';

// ----------------------------------------------------------------------

const InstituteSchema = z.object({
  label: z.string().min(1, { error: 'Le nom est requis !' }),
  email: z.string().email({ error: 'Email invalide !' }).or(z.literal('')),
  siteweb: z.string(),
  address: z.object({
    address1: z.string(),
    address2: z.string(),
    zipcode: z.string(),
    city: z.string(),
    countryCode: z.string().nullable(),
  }),
  legalForm: z.string(),
  shareCapital: z.string(),
  siren: z.string().max(9, { error: '9 caractères maximum !' }),
  siret: z.string().max(14, { error: '14 caractères maximum !' }),
  vatNumber: z.string(),
  rcsCity: z.string(),
  socialNetworks: z.object({
    facebook: z.string(),
    twitter: z.string(),
    instagram: z.string(),
    linkedin: z.string(),
  }),
  // Administrateur de l'institut désigné à la création (facultatif, création uniquement)
  admin: z.object({
    firstname: z.string(),
    lastname: z.string(),
    email: z.string().email({ error: 'Email invalide !' }).or(z.literal('')),
  }),
});

const hasAdmin = (admin) => !!(admin?.firstname || admin?.lastname || admin?.email);

// ----------------------------------------------------------------------

export function InstituteCreateEditForm({ currentInstitute }) {
  const { t } = useTranslate('institute');
  const router = useRouter();

  const isEdit = !!currentInstitute;

  const defaultValues = useMemo(
    () => ({
      label: currentInstitute?.label || 'Institut de Formation Test',
      email: currentInstitute?.email || 'contact@institut-test.fr',
      siteweb: currentInstitute?.siteweb || 'https://www.institut-test.fr',
      address: {
        address1: currentInstitute?.address?.address1 || '15 Rue de la Paix',
        address2: currentInstitute?.address?.address2 || 'Bâtiment B',
        zipcode: currentInstitute?.address?.zipcode || '75002',
        city: currentInstitute?.address?.city || 'Paris',
        countryCode: currentInstitute?.address?.countryCode || 'FR',
      },
      legalForm: currentInstitute?.legalForm || 'SAS',
      shareCapital: currentInstitute?.shareCapital || '10000',
      siren: currentInstitute?.siren || '123456789',
      siret: currentInstitute?.siret || '12345678900014',
      vatNumber: currentInstitute?.vatNumber || 'FR12345678901',
      rcsCity: currentInstitute?.rcsCity || 'Paris',
      socialNetworks: {
        facebook: currentInstitute?.socialNetworks?.facebook || 'https://facebook.com/institut-test',
        twitter: currentInstitute?.socialNetworks?.twitter || 'https://x.com/institut_test',
        instagram: currentInstitute?.socialNetworks?.instagram || 'https://instagram.com/institut_test',
        linkedin: currentInstitute?.socialNetworks?.linkedin || 'https://linkedin.com/company/institut-test',
      },
      admin: { firstname: '', lastname: '', email: '' },
    }),
    [currentInstitute]
  );

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(InstituteSchema),
    defaultValues,
  });

  const {
    watch,
    setError,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const watchCountry = watch('address.countryCode');

  const onSubmit = handleSubmit(async (data) => {
    const admin = {
      firstname: data.admin.firstname.trim(),
      lastname: data.admin.lastname.trim(),
      email: data.admin.email.trim(),
    };
    const inviteAdmin = !isEdit && hasAdmin(admin);

    // Les trois champs de l'administrateur vont ensemble
    if (inviteAdmin) {
      const missing = ['firstname', 'lastname', 'email'].filter((key) => !admin[key]);
      if (missing.length) {
        missing.forEach((key) =>
          setError(`admin.${key}`, { type: 'manual', message: t('admin_fields_required') })
        );
        return;
      }
    }

    try {
      const payload = {
        label: data.label,
        email: data.email || null,
        siteweb: data.siteweb || null,
        address: {
          address1: data.address.address1 || null,
          address2: data.address.address2 || null,
          zipcode: data.address.zipcode || null,
          city: data.address.city || null,
          countryCode: data.address.countryCode || null,
        },
        legalForm: data.legalForm || null,
        shareCapital: data.shareCapital || null,
        siren: data.siren || null,
        siret: data.siret || null,
        vatNumber: data.vatNumber || null,
        rcsCity: data.rcsCity || null,
        socialNetworks: {
          facebook: data.socialNetworks.facebook || null,
          twitter: data.socialNetworks.twitter || null,
          instagram: data.socialNetworks.instagram || null,
          linkedin: data.socialNetworks.linkedin || null,
        },
      };

      if (isEdit) {
        await axios.patch(`${endpoints.institute.details}/${currentInstitute.id}`, payload, {
          headers: { 'Content-Type': 'application/merge-patch+json' },
        });
        toast.success(t('edit_success'));
      } else {
        const { data: created } = await axios.post(endpoints.institute.list, payload);
        toast.success(t('create_success'));

        if (inviteAdmin && created?.id) {
          try {
            await inviteInstituteAdmin(created.id, admin);
            toast.success(t('admin_invite_success', { email: admin.email, interpolation: { escapeValue: false } }));
          } catch (inviteError) {
            // L'institut est créé : on signale l'échec sans bloquer (invitation possible ensuite)
            toast.error(t('admin_invite_error', {
                message: getErrorMessage(inviteError),
                interpolation: { escapeValue: false },
              }));
          }
        }
      }

      await mutate(endpoints.institute.list, undefined, { revalidate: false });

      router.push(paths.dashboard.institute.list);
    } catch (error) {
      console.error(error);
      toast.error(error?.message || (isEdit ? t('edit_error') : t('create_error')));
    }
  });

  const renderGeneralInfo = () => (
    <>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        {t('section_general')}
      </Typography>

      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
        }}
      >
        <Field.Text name="label" label={t('label_name')} />
        <Field.Text name="email" label={t('label_email')} />
        <Field.Text name="siteweb" label={t('label_website')} sx={{ gridColumn: '1 / -1' }} />
      </Box>
    </>
  );

  const renderAddress = () => (
    <>
      <Typography variant="subtitle1" sx={{ mb: 2, mt: 4 }}>
        {t('section_address')}
      </Typography>

      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
        }}
      >
        <Field.Text name="address.address1" label={t('label_address')} sx={{ gridColumn: '1 / -1' }} />
        <Field.Text
          name="address.address2"
          label={t('label_address2')}
          sx={{ gridColumn: '1 / -1' }}
        />
        <Field.Text name="address.zipcode" label={t('label_zipcode')} />
        <Field.Text name="address.city" label={t('label_city')} />

        <Field.Autocomplete
          name="address.countryCode"
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
      </Box>
    </>
  );

  const renderLegalInfo = () => (
    <>
      <Typography variant="subtitle1" sx={{ mb: 2, mt: 4 }}>
        {t('section_legal')}
      </Typography>

      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
        }}
      >
        <Field.Text name="legalForm" label={t('label_legal_form')} />
        <Field.Text name="shareCapital" label={t('label_share_capital')} />
        <Field.Text name="siren" label={t('label_siren')} slotProps={{ htmlInput: { maxLength: 9 } }} />
        <Field.Text name="siret" label={t('label_siret')} slotProps={{ htmlInput: { maxLength: 14 } }} />
        <Field.Text name="vatNumber" label={t('label_vat_number')} />
        <Field.Text name="rcsCity" label={t('label_rcs_city')} />
      </Box>
    </>
  );

  const renderSocialNetworks = () => (
    <>
      <Typography variant="subtitle1" sx={{ mb: 2, mt: 4 }}>
        {t('section_social')}
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
          name="socialNetworks.facebook"
          label="Facebook"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="mdi:facebook" width={22} />
                </InputAdornment>
              ),
            },
          }}
        />
        <Field.Text
          name="socialNetworks.twitter"
          label="Twitter / X"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="mdi:twitter" width={22} />
                </InputAdornment>
              ),
            },
          }}
        />
        <Field.Text
          name="socialNetworks.instagram"
          label="Instagram"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="mdi:instagram" width={22} />
                </InputAdornment>
              ),
            },
          }}
        />
        <Field.Text
          name="socialNetworks.linkedin"
          label="LinkedIn"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="mdi:linkedin" width={22} />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>
    </>
  );

  const renderAdmin = () => (
    <>
      <Typography variant="subtitle1" sx={{ mb: 0.5, mt: 4 }}>
        {t('section_admin')}
      </Typography>
      <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
        {t('section_admin_hint')}
      </Typography>

      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
        }}
      >
        <Field.Text name="admin.firstname" label={t('label_admin_firstname')} />
        <Field.Text name="admin.lastname" label={t('label_admin_lastname')} />
        <Field.Text
          name="admin.email"
          type="email"
          label={t('label_admin_email')}
          sx={{ gridColumn: '1 / -1' }}
        />
      </Box>
    </>
  );

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Card sx={{ p: 3 }}>
        {renderGeneralInfo()}
        {!isEdit && renderAdmin()}
        {renderAddress()}
        {renderLegalInfo()}
        {renderSocialNetworks()}

        <Stack alignItems="flex-end" sx={{ mt: 3 }}>
          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            {isEdit ? t('submit_edit') : t('submit_create')}
          </LoadingButton>
        </Stack>
      </Card>
    </Form>
  );
}
