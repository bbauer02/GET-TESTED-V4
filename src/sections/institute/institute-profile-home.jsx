'use client';

import { toast } from 'sonner';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import TableContainer from '@mui/material/TableContainer';
import InputAdornment from '@mui/material/InputAdornment';

import { fDate } from 'src/utils/format-time';

import axiosInstance from 'src/lib/axios';

import { Label } from 'src/components/label';
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

export function InstituteProfileHome({ institute, memberships, sessions, sx, ...other }) {
  const openSessions = sessions.filter((s) => s.status === 'OPEN');

  const admins = memberships.filter((m) => m.role === 'ADMIN');
  const teachers = memberships.filter((m) => m.role === 'TEACHER');
  const staff = memberships.filter((m) => m.role === 'STAFF');

  const [commission, setCommission] = useState('');
  const [savingCommission, setSavingCommission] = useState(false);

  useEffect(() => {
    setCommission(institute.stripeAccount?.commissionPercent ?? '');
  }, [institute.stripeAccount?.commissionPercent]);

  const handleSaveCommission = useCallback(async () => {
    const stripe = institute.stripeAccount;
    if (!stripe?.id) return;
    setSavingCommission(true);
    try {
      await axiosInstance.patch(
        `/api/stripe-accounts/${stripe.id}`,
        { commissionPercent: commission === '' ? null : commission },
        { headers: { 'Content-Type': 'application/merge-patch+json' } }
      );
      toast.success('Commission mise a jour !');
    } catch (error) {
      toast.error(error.message || 'Erreur');
    } finally {
      setSavingCommission(false);
    }
  }, [institute.stripeAccount, commission]);

  // ------------------------------------

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
          {memberships.length}
          <Box component="span" sx={{ color: 'text.secondary', typography: 'body2' }}>
            Membres
          </Box>
        </Stack>
      </Stack>
    </Card>
  );

  const renderAbout = () => (
    <Card>
      <CardHeader title="A propos" />

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
        <CardHeader title="Social" />

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

  const renderMemberGroup = (title, members) => {
    if (!members.length) return null;

    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          {title}
        </Typography>

        <Stack spacing={2}>
          {members.map((membership) => {
            const user = membership.user || {};
            const fullName = [user.firstname, user.lastname].filter(Boolean).join(' ') || '—';

            return (
              <Stack key={membership.id || membership['@id']} direction="row" alignItems="center" spacing={2}>
                <Avatar alt={fullName} src={user.avatar} sx={{ width: 40, height: 40 }}>
                  {fullName.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="subtitle2">{fullName}</Typography>
                  {user.email && (
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {user.email}
                    </Typography>
                  )}
                </Box>
              </Stack>
            );
          })}
        </Stack>
      </Box>
    );
  };

  const renderTeam = () => (
    <Card>
      <CardHeader title="Equipe" />

      <Box sx={{ p: 3 }}>
        {renderMemberGroup('Administrateurs', admins)}
        {renderMemberGroup('Enseignants', teachers)}
        {renderMemberGroup('Personnel', staff)}

        {!admins.length && !teachers.length && !staff.length && (
          <EmptyContent title="Aucun membre" />
        )}
      </Box>
    </Card>
  );

  const renderSessions = () => (
    <Card>
      <CardHeader title="Sessions ouvertes" />

      {openSessions.length > 0 ? (
        <TableContainer sx={{ px: 1, pb: 2 }}>
          <Scrollbar>
            <Table size="small" sx={{ minWidth: 480 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Test</TableCell>
                  <TableCell>Debut</TableCell>
                  <TableCell>Fin</TableCell>
                  <TableCell align="center">Places</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {openSessions.map((session) => (
                  <TableRow key={session.id || session['@id']}>
                    <TableCell>
                      {session.assessment?.label || session.assessment?.['@id'] || '—'}
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

  // ------------------------------------

  const renderStripe = () => {
    const stripe = institute.stripeAccount;

    return (
      <Card>
        <CardHeader title="Stripe Connect" />

        <Box sx={{ p: 3, gap: 2, display: 'flex', flexDirection: 'column' }}>
          {!stripe ? (
            <Box sx={{ gap: 1, display: 'flex', alignItems: 'center' }}>
              <Iconify icon="mdi:alert-circle-outline" sx={{ color: 'text.disabled' }} />
              <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                Aucun compte Stripe connecte
              </Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ gap: 1.5, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                <Label
                  color={stripe.chargesEnabled ? 'success' : 'warning'}
                  startIcon={<Iconify icon={stripe.chargesEnabled ? 'mdi:check-circle' : 'mdi:clock-outline'} width={16} />}
                >
                  {stripe.chargesEnabled ? 'Paiements actifs' : 'Paiements inactifs'}
                </Label>

                <Label
                  color={stripe.payoutsEnabled ? 'success' : 'warning'}
                  startIcon={<Iconify icon={stripe.payoutsEnabled ? 'mdi:check-circle' : 'mdi:clock-outline'} width={16} />}
                >
                  {stripe.payoutsEnabled ? 'Virements actifs' : 'Virements inactifs'}
                </Label>

                <Label
                  color={stripe.onboardingComplete ? 'success' : 'error'}
                  startIcon={<Iconify icon={stripe.onboardingComplete ? 'mdi:check-circle' : 'mdi:alert-circle'} width={16} />}
                >
                  {stripe.onboardingComplete ? 'Verifie' : 'Non verifie'}
                </Label>
              </Box>

              <Divider sx={{ borderStyle: 'dashed' }} />

              <Stack direction="row" spacing={1.5} alignItems="center">
                <TextField
                  label="Commission plateforme"
                  type="number"
                  size="small"
                  value={commission}
                  onChange={(e) => setCommission(e.target.value)}
                  placeholder="Defaut (10%)"
                  slotProps={{
                    input: {
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    },
                    htmlInput: { min: 0, max: 100, step: 0.5 },
                  }}
                  sx={{ width: 200 }}
                />
                <LoadingButton
                  variant="contained"
                  size="small"
                  loading={savingCommission}
                  onClick={handleSaveCommission}
                >
                  Sauvegarder
                </LoadingButton>
              </Stack>

              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Laissez vide pour utiliser le taux par defaut de la plateforme.
                Taux actuel : {stripe.commissionPercent ? `${stripe.commissionPercent}%` : 'defaut (10%)'}
              </Typography>
            </>
          )}
        </Box>
      </Card>
    );
  };

  // ------------------------------------

  return (
    <Grid container spacing={3} sx={sx} {...other}>
      <Grid size={{ xs: 12, md: 4 }} sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
        {renderStats()}
        {renderAbout()}
        {renderSocials()}
        {renderStripe()}
      </Grid>

      <Grid size={{ xs: 12, md: 8 }} sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
        {renderTeam()}
        {renderSessions()}
      </Grid>
    </Grid>
  );
}
