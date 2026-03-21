'use client';

import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fCurrency } from 'src/utils/format-number';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

function getMinPrice(session) {
  const scheduledExams = session?.scheduledExams || session?.scheduled_exams || [];

  let total = 0;

  for (const se of scheduledExams) {
    const exam = se.exam || {};
    if (exam.isOption) continue; // Skip optional exams for "starting from" price

    const institutePrice = se.examPricing?.price?.amount ?? se.exam_pricing?.price?.amount;
    const defaultPrice = exam.price?.amount;
    const price = institutePrice ?? defaultPrice ?? 0;

    total += price;
  }

  return total;
}

function formatSessionDate(session) {
  const start = session?.start;
  if (!start) return '';

  const date = new Date(start);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getCity(session) {
  const scheduledExams = session?.scheduledExams || session?.scheduled_exams || [];
  for (const se of scheduledExams) {
    const city = se.address?.city;
    if (city) return city;
  }
  return session?.institute?.address?.city || '';
}

// ----------------------------------------------------------------------

export function SessionCard({ session, basePath, sx, ...other }) {
  const institute = session?.institute || {};
  const assessment = session?.assessment || {};
  const level = session?.level;
  const minPrice = getMinPrice(session);
  const city = getCity(session);
  const sessionDate = formatSessionDate(session);
  const placesAvailable = session?.placesAvailable;
  const enrollmentsCount = (session?.enrollments || []).length;
  const placesLeft = placesAvailable ? placesAvailable - enrollmentsCount : null;

  return (
    <Card
      sx={[
        {
          display: 'flex',
          flexDirection: 'column',
          '&:hover': { boxShadow: (theme) => theme.shadows[10] },
          transition: (theme) => theme.transitions.create(['box-shadow']),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {/* Banner / Cover */}
      <Box
        sx={{
          position: 'relative',
          height: 140,
          background: (theme) =>
            `linear-gradient(135deg, ${theme.vars.palette.primary.main} 0%, ${theme.vars.palette.primary.dark} 100%)`,
          overflow: 'hidden',
        }}
      >
        {/* Assessment name as overlay */}
        <Typography
          variant="h6"
          sx={{
            position: 'absolute',
            bottom: 40,
            left: 16,
            right: 16,
            color: 'common.white',
            textShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
        >
          {assessment.label || 'Session de test'}
        </Typography>

        {level && (
          <Label
            color="warning"
            sx={{ position: 'absolute', top: 12, right: 12 }}
          >
            Niveau {level.label || level.ref}
          </Label>
        )}

        {/* Institute logo */}
        <Avatar
          alt={institute.label}
          src={institute.logo}
          sx={{
            position: 'absolute',
            bottom: -20,
            left: 16,
            width: 48,
            height: 48,
            border: (theme) => `2px solid ${theme.vars.palette.background.paper}`,
            bgcolor: (theme) => theme.vars.palette.background.paper,
            color: (theme) => theme.vars.palette.primary.main,
            fontWeight: 'bold',
            fontSize: 18,
          }}
        >
          {(institute.label || '?')[0].toUpperCase()}
        </Avatar>
      </Box>

      {/* Content */}
      <Stack spacing={1.5} sx={{ p: 2, pt: 4, flexGrow: 1 }}>
        {/* Institute name */}
        <Typography variant="subtitle1" noWrap>
          {institute.label || 'Institut'}
        </Typography>

        {/* Info row */}
        <Stack direction="row" spacing={2} sx={{ color: 'text.secondary', typography: 'body2' }}>
          {city && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Iconify icon="eva:pin-outline" width={16} />
              {city}
            </Box>
          )}
          {sessionDate && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Iconify icon="eva:calendar-outline" width={16} />
              {sessionDate}
            </Box>
          )}
        </Stack>

        {/* Places left */}
        {placesLeft !== null && (
          <Typography
            variant="caption"
            sx={{
              color: placesLeft <= 5 ? 'error.main' : 'text.secondary',
              fontWeight: placesLeft <= 5 ? 'bold' : 'normal',
            }}
          >
            {placesLeft > 0 ? `${placesLeft} place${placesLeft > 1 ? 's' : ''} restante${placesLeft > 1 ? 's' : ''}` : 'Complet'}
          </Typography>
        )}
      </Stack>

      {/* Footer */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: 2,
          py: 1.5,
          borderTop: (theme) => `1px dashed ${varAlpha(theme.vars.palette.grey['500Channel'], 0.2)}`,
        }}
      >
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            A partir de
          </Typography>
          <Typography variant="h6" color="primary">
            {fCurrency(minPrice)}
          </Typography>
        </Box>

        <Button
          component={RouterLink}
          href={
            basePath
              ? `${basePath}/${session.id || session['@id']?.split('/').pop()}`
              : paths.sessions.details(session.id || session['@id']?.split('/').pop())
          }
          variant="contained"
          size="small"
          disabled={placesLeft !== null && placesLeft <= 0}
        >
          {placesLeft !== null && placesLeft <= 0 ? 'Complet' : "S\u0027inscrire"}
        </Button>
      </Stack>
    </Card>
  );
}
