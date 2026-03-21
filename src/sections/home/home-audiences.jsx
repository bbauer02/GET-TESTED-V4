'use client';

import { m } from 'framer-motion';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';
import { varFade, MotionViewport } from 'src/components/animate';

// ----------------------------------------------------------------------

const AUDIENCES = [
  {
    title: 'Candidats',
    subtitle: 'Passez votre certification',
    description:
      'Trouvez une session pres de chez vous, inscrivez-vous en ligne et suivez vos resultats. Vos convocations et attestations sont disponibles dans votre espace personnel.',
    icon: 'solar:user-rounded-bold-duotone',
    features: [
      'Recherche de sessions par test et localisation',
      'Inscription et paiement en ligne',
      'Convocations et attestations telechargeable',
      'Suivi des scores et resultats',
    ],
    cta: { label: 'Trouver une session', href: paths.sessions.root },
    gradient: 'primary',
  },
  {
    title: 'Instituts',
    subtitle: 'Gerez votre centre de test',
    description:
      'Creez et gerez vos sessions, suivez les inscriptions, publiez les documents et generez automatiquement vos factures avec paiement Stripe Connect.',
    icon: 'solar:buildings-2-bold-duotone',
    features: [
      'Creation et gestion de sessions',
      'Suivi des inscriptions en temps reel',
      'Publication automatique des documents',
      'Facturation et paiement via Stripe Connect',
    ],
    cta: { label: 'Devenir partenaire', href: paths.devenirPartenaire },
    gradient: 'secondary',
  },
];

// ----------------------------------------------------------------------

export function HomeAudiences() {
  return (
    <Box
      component="section"
      sx={{
        py: { xs: 10, md: 16 },
        bgcolor: 'background.default',
      }}
    >
      <Container maxWidth="lg">
        <MotionViewport>
          {/* Header */}
          <Stack
            spacing={2}
            sx={{
              textAlign: 'center',
              mb: { xs: 6, md: 10 },
              maxWidth: 600,
              mx: 'auto',
            }}
          >
            <m.div variants={varFade('inUp', { distance: 24 })}>
              <Typography
                variant="overline"
                sx={{ color: 'primary.main', letterSpacing: 2 }}
              >
                Pour qui ?
              </Typography>
            </m.div>

            <m.div variants={varFade('inUp', { distance: 24 })}>
              <Typography variant="h2" sx={{ fontWeight: 800 }}>
                Une plateforme pour{' '}
                <Box
                  component="span"
                  sx={(t) => ({
                    ...t.mixins.textGradient(
                      `135deg, ${t.vars.palette.primary.main} 0%, ${t.vars.palette.secondary.main} 100%`
                    ),
                  })}
                >
                  tous
                </Box>
              </Typography>
            </m.div>
          </Stack>

          {/* Cards */}
          <Grid container spacing={4}>
            {AUDIENCES.map((audience) => (
              <Grid key={audience.title} size={{ xs: 12, md: 6 }}>
                <m.div variants={varFade('inUp', { distance: 24 })}>
                  <AudienceCard audience={audience} />
                </m.div>
              </Grid>
            ))}
          </Grid>
        </MotionViewport>
      </Container>
    </Box>
  );
}

// ----------------------------------------------------------------------

function AudienceCard({ audience }) {
  const theme = useTheme();
  const { title, subtitle, description, icon, features, cta, gradient } = audience;

  return (
    <Stack
      spacing={3}
      sx={{
        p: { xs: 3, md: 5 },
        height: 1,
        borderRadius: 3,
        position: 'relative',
        overflow: 'hidden',
        border: `1px solid ${varAlpha(theme.vars.palette.grey['500Channel'], 0.12)}`,
        transition: theme.transitions.create(['border-color', 'box-shadow']),
        '&:hover': {
          borderColor: `${gradient}.main`,
          boxShadow: `0 12px 48px ${varAlpha(theme.vars.palette[gradient].mainChannel, 0.16)}`,
        },
      }}
    >
      {/* Icon */}
      <Box
        sx={{
          width: 72,
          height: 72,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 2.5,
          background: `linear-gradient(135deg, ${varAlpha(theme.vars.palette[gradient].mainChannel, 0.16)} 0%, ${varAlpha(theme.vars.palette[gradient].mainChannel, 0.04)} 100%)`,
          color: `${gradient}.main`,
        }}
      >
        <Iconify icon={icon} width={40} />
      </Box>

      {/* Text */}
      <Box>
        <Typography variant="overline" sx={{ color: `${gradient}.main`, mb: 0.5, display: 'block' }}>
          {subtitle}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
      </Box>

      <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
        {description}
      </Typography>

      {/* Features list */}
      <Stack spacing={1.5}>
        {features.map((feature) => (
          <Stack key={feature} direction="row" spacing={1.5} alignItems="flex-start">
            <Iconify
              icon="eva:checkmark-circle-2-fill"
              width={20}
              sx={{ color: `${gradient}.main`, mt: 0.25, flexShrink: 0 }}
            />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {feature}
            </Typography>
          </Stack>
        ))}
      </Stack>

      {/* CTA */}
      <Box sx={{ pt: 1 }}>
        <Button
          component={RouterLink}
          href={cta.href}
          size="large"
          variant="outlined"
          color={gradient}
          endIcon={<Iconify icon="eva:arrow-forward-fill" />}
          sx={{ fontWeight: 600, borderRadius: 1.5 }}
        >
          {cta.label}
        </Button>
      </Box>
    </Stack>
  );
}
