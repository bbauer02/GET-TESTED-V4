'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import CardHeader from '@mui/material/CardHeader';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import { useCurrentInstitute } from 'src/auth/hooks';

// ----------------------------------------------------------------------

const SOCIAL_ICONS = {
  facebook: 'socials:facebook',
  twitter: 'socials:twitter',
  instagram: 'socials:instagram',
  linkedin: 'socials:linkedin',
};

// ----------------------------------------------------------------------

export function InstituteFicheHome({ institute, sx, ...other }) {
  const currentInstitute = useCurrentInstitute();
  const canEditFiche = currentInstitute?.membershipRole === 'ADMIN';

  const editAction = (tooltip = 'Modifier') =>
    canEditFiche ? (
      <Tooltip title={tooltip}>
        <IconButton component={RouterLink} href={paths.dashboard.espaceInstitut.ficheEdit} size="small">
          <Iconify icon="solar:pen-bold" width={18} />
        </IconButton>
      </Tooltip>
    ) : null;

  const renderAbout = () => (
    <Card sx={{ height: 1 }}>
      <CardHeader title="À propos" action={editAction('Modifier les informations')} />

      <Box
        sx={{
          p: 3,
          gap: 2,
          display: 'flex',
          typography: 'body2',
          flexDirection: 'column',
        }}
      >
        {(institute.address?.address1 || institute.address?.city) && (
          <Box sx={{ gap: 2, display: 'flex', lineHeight: '24px' }}>
            <Iconify width={24} icon="mingcute:location-fill" />
            <span>
              {[
                institute.address?.address1,
                institute.address?.zipcode,
                institute.address?.city,
              ]
                .filter(Boolean)
                .join(', ')}
            </span>
          </Box>
        )}

        {institute.email && (
          <Box sx={{ gap: 2, display: 'flex', lineHeight: '24px' }}>
            <Iconify width={24} icon="solar:letter-bold" />
            <Link href={`mailto:${institute.email}`} color="inherit">
              {institute.email}
            </Link>
          </Box>
        )}

        {institute.siteweb && (
          <Box sx={{ gap: 2, display: 'flex', lineHeight: '24px' }}>
            <Iconify width={24} icon="solar:link-bold" />
            <Link
              href={institute.siteweb.startsWith('http') ? institute.siteweb : `https://${institute.siteweb}`}
              target="_blank"
              rel="noopener"
              color="inherit"
            >
              {institute.siteweb}
            </Link>
          </Box>
        )}

        {institute.legalForm && (
          <Box sx={{ gap: 2, display: 'flex', lineHeight: '24px' }}>
            <Iconify width={24} icon="solar:buildings-bold" />
            <span>
              {institute.legalForm}
              {institute.shareCapital && ` — Capital : ${institute.shareCapital}`}
            </span>
          </Box>
        )}

        {(institute.siren || institute.siret) && (
          <Box sx={{ gap: 2, display: 'flex', lineHeight: '24px' }}>
            <Iconify width={24} icon="solar:document-text-bold" />
            <span>
              {institute.siren && `SIREN : ${institute.siren}`}
              {institute.siren && institute.siret && ' — '}
              {institute.siret && `SIRET : ${institute.siret}`}
            </span>
          </Box>
        )}

        {institute.vatNumber && (
          <Box sx={{ gap: 2, display: 'flex', lineHeight: '24px' }}>
            <Iconify width={24} icon="solar:document-text-bold" />
            <span>TVA : {institute.vatNumber}</span>
          </Box>
        )}

        {institute.rcsCity && (
          <Box sx={{ gap: 2, display: 'flex', lineHeight: '24px' }}>
            <Iconify width={24} icon="solar:document-text-bold" />
            <span>RCS : {institute.rcsCity}</span>
          </Box>
        )}
      </Box>
    </Card>
  );

  const renderSocials = () => {
    const socialNetworks = institute.socialNetworks || {};
    const entries = Object.entries(socialNetworks).filter(([, url]) => url);

    return (
      <Card sx={{ height: 1 }}>
        <CardHeader title="Réseaux sociaux" action={editAction('Modifier les réseaux sociaux')} />

        <Box sx={{ p: 3, gap: 2, display: 'flex', flexDirection: 'column', typography: 'body2' }}>
          {entries.length === 0 ? (
            <Box sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
              Aucun réseau social renseigné
            </Box>
          ) : (
            entries.map(([key, url]) => (
              <Box
                key={key}
                sx={{
                  gap: 2,
                  display: 'flex',
                  lineHeight: '20px',
                  wordBreak: 'break-all',
                  alignItems: 'flex-start',
                }}
              >
                <Iconify icon={SOCIAL_ICONS[key] || 'solar:link-bold'} />
                <Link
                  href={url.startsWith('http') ? url : `https://${url}`}
                  target="_blank"
                  rel="noopener"
                  color="inherit"
                >
                  {url}
                </Link>
              </Box>
            ))
          )}
        </Box>
      </Card>
    );
  };

  return (
    <Stack spacing={3} sx={sx} {...other}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex' }}>
          {renderAbout()}
        </Grid>

        <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex' }}>
          {renderSocials()}
        </Grid>
      </Grid>
    </Stack>
  );
}
