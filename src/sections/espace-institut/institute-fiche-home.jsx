'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import CardHeader from '@mui/material/CardHeader';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableContainer from '@mui/material/TableContainer';

import { fDate } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';

// ----------------------------------------------------------------------

const SOCIAL_ICONS = {
  facebook: 'socials:facebook',
  twitter: 'socials:twitter',
  instagram: 'socials:instagram',
  linkedin: 'socials:linkedin',
};

// ----------------------------------------------------------------------

export function InstituteFicheHome({ institute, memberships, sessions, sx, ...other }) {
  const openSessions = (sessions || []).filter((s) => s.status === 'OPEN');

  const renderStats = () => (
    <Card sx={{ py: 3, textAlign: 'center', typography: 'h4' }}>
      <Stack
        divider={<Divider orientation="vertical" flexItem sx={{ borderStyle: 'dashed' }} />}
        sx={{ flexDirection: 'row' }}
      >
        <Stack sx={{ width: 1 }}>
          {openSessions.length}
          <Box component="span" sx={{ color: 'text.secondary', typography: 'body2' }}>
            Sessions ouvertes
          </Box>
        </Stack>

        <Stack sx={{ width: 1 }}>
          {(memberships || []).length}
          <Box component="span" sx={{ color: 'text.secondary', typography: 'body2' }}>
            Membres
          </Box>
        </Stack>
      </Stack>
    </Card>
  );

  const renderAbout = () => (
    <Card>
      <CardHeader title="À propos" />

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

    if (!entries.length) return null;

    return (
      <Card>
        <CardHeader title="Réseaux sociaux" />

        <Box sx={{ p: 3, gap: 2, display: 'flex', flexDirection: 'column', typography: 'body2' }}>
          {entries.map(([key, url]) => (
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
          ))}
        </Box>
      </Card>
    );
  };

  const renderSessions = () => (
    <Card>
      <CardHeader title="Sessions ouvertes" />

      {openSessions.length > 0 ? (
        <TableContainer sx={{ px: 1, pb: 2 }}>
          <Scrollbar>
            <Table size="small" sx={{ minWidth: 480 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Assessment</TableCell>
                  <TableCell>Début</TableCell>
                  <TableCell>Fin</TableCell>
                  <TableCell align="center">Places</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {openSessions.map((session) => (
                  <TableRow key={session.id || session['@id']}>
                    <TableCell>
                      {session.assessment?.label || '—'}
                    </TableCell>
                    <TableCell>{session.start ? fDate(session.start) : '—'}</TableCell>
                    <TableCell>{session.end ? fDate(session.end) : '—'}</TableCell>
                    <TableCell align="center">{session.placesAvailable ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>
      ) : (
        <Box sx={{ p: 3 }}>
          <EmptyContent title="Aucune session ouverte" />
        </Box>
      )}
    </Card>
  );

  return (
    <Grid container spacing={3} sx={sx} {...other}>
      <Grid size={{ xs: 12, md: 4 }} sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
        {renderStats()}
        {renderAbout()}
        {renderSocials()}
      </Grid>

      <Grid size={{ xs: 12, md: 8 }} sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
        {renderSessions()}
      </Grid>
    </Grid>
  );
}
