'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { useMemo, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import axios, { endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';
import { useGetInstituteFiche } from 'src/actions/espace-institut';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { FlagIcon } from 'src/components/flag-icon';
import { Form, Field } from 'src/components/hook-form';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { COUNTRIES } from 'src/sections/profile/utils/countries';

import { useCurrentInstitute } from 'src/auth/hooks';

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
});

// ----------------------------------------------------------------------

export function InstituteFicheEditView() {
  const router = useRouter();
  const currentInstitute = useCurrentInstitute();
  const { institute, instituteLoading, instituteMutate } = useGetInstituteFiche(
    currentInstitute?.id
  );

  const defaultValues = useMemo(
    () => ({
      label: institute?.label || '',
      email: institute?.email || '',
      siteweb: institute?.siteweb || '',
      address: {
        address1: institute?.address?.address1 || '',
        address2: institute?.address?.address2 || '',
        zipcode: institute?.address?.zipcode || '',
        city: institute?.address?.city || '',
        countryCode: institute?.address?.countryCode || null,
      },
      legalForm: institute?.legalForm || '',
      shareCapital: institute?.shareCapital || '',
      siren: institute?.siren || '',
      siret: institute?.siret || '',
      vatNumber: institute?.vatNumber || '',
      rcsCity: institute?.rcsCity || '',
      socialNetworks: {
        facebook: institute?.socialNetworks?.facebook || '',
        twitter: institute?.socialNetworks?.twitter || '',
        instagram: institute?.socialNetworks?.instagram || '',
        linkedin: institute?.socialNetworks?.linkedin || '',
      },
    }),
    [institute]
  );

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(InstituteSchema),
    defaultValues,
  });

  const {
    watch,
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (institute) {
      reset(defaultValues);
    }
  }, [institute, reset, defaultValues]);

  const watchCountry = watch('address.countryCode');

  const onSubmit = handleSubmit(async (data) => {
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

      await axios.patch(`${endpoints.institute.details}/${currentInstitute.id}`, payload, {
        headers: { 'Content-Type': 'application/merge-patch+json' },
      });

      toast.success('Institut modifié avec succès !');
      instituteMutate();
      router.push(paths.dashboard.espaceInstitut.fiche);
    } catch (error) {
      console.error(error);
      toast.error(error?.message || "Erreur lors de la modification de l'institut");
    }
  });

  if (instituteLoading) {
    return (
      <DashboardContent>
        <LoadingScreen />
      </DashboardContent>
    );
  }

  const renderGeneralInfo = () => (
    <>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Informations générales
      </Typography>

      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
        }}
      >
        <Field.Text name="label" label="Nom de l'institut" />
        <Field.Text name="email" label="Email de contact" />
        <Field.Text name="siteweb" label="Site web" sx={{ gridColumn: '1 / -1' }} />
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
        <Field.Text name="address.address1" label="Adresse" sx={{ gridColumn: '1 / -1' }} />
        <Field.Text
          name="address.address2"
          label="Complément d'adresse"
          sx={{ gridColumn: '1 / -1' }}
        />
        <Field.Text name="address.zipcode" label="Code postal" />
        <Field.Text name="address.city" label="Ville" />

        <Field.Autocomplete
          name="address.countryCode"
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

  const renderLegalInfo = () => (
    <>
      <Typography variant="subtitle1" sx={{ mb: 2, mt: 4 }}>
        Informations légales
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
        <Field.Text name="shareCapital" label="Capital social" />
        <Field.Text name="siren" label="SIREN" slotProps={{ htmlInput: { maxLength: 9 } }} />
        <Field.Text name="siret" label="SIRET" slotProps={{ htmlInput: { maxLength: 14 } }} />
        <Field.Text name="vatNumber" label="Numéro de TVA" />
        <Field.Text name="rcsCity" label="Ville RCS" />
      </Box>
    </>
  );

  const renderSocialNetworks = () => (
    <>
      <Typography variant="subtitle1" sx={{ mb: 2, mt: 4 }}>
        Réseaux sociaux
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

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Modifier la fiche"
        backHref={paths.dashboard.espaceInstitut.fiche}
        links={[
          { name: 'Tableau de bord', href: paths.dashboard.root },
          { name: institute?.label || 'Institut' },
          { name: 'Fiche', href: paths.dashboard.espaceInstitut.fiche },
          { name: 'Modifier' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Form methods={methods} onSubmit={onSubmit}>
        <Card sx={{ p: 3 }}>
          {renderGeneralInfo()}
          {renderAddress()}
          {renderLegalInfo()}
          {renderSocialNetworks()}

          <Stack alignItems="flex-end" sx={{ mt: 3 }}>
            <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
              Enregistrer les modifications
            </LoadingButton>
          </Stack>
        </Card>
      </Form>
    </DashboardContent>
  );
}
