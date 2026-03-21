'use client';

import { m } from 'framer-motion';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';
import { varFade, MotionViewport } from 'src/components/animate';

// ----------------------------------------------------------------------

const FEATURES = [
  {
    icon: 'solar:magnifer-bold-duotone',
    title: 'Recherche de sessions',
    description:
      'Parcourez les sessions de test disponibles, filtrez par type de certification et par niveau.',
    color: 'primary',
  },
  {
    icon: 'solar:pen-new-round-bold-duotone',
    title: 'Inscription en ligne',
    description:
      'Inscrivez-vous en quelques etapes, choisissez vos epreuves et payez en toute securite via Stripe.',
    color: 'info',
  },
  {
    icon: 'solar:diploma-verified-bold-duotone',
    title: 'Documents certifies',
    description:
      'Recevez vos convocations, attestations et certificats directement dans votre espace candidat.',
    color: 'warning',
  },
  {
    icon: 'solar:buildings-2-bold-duotone',
    title: 'Espace institut',
    description:
      'Gerez vos sessions, suivez les inscriptions, publiez les documents et generez vos factures.',
    color: 'secondary',
  },
  {
    icon: 'solar:chart-square-bold-duotone',
    title: 'Suivi des resultats',
    description:
      'Consultez vos scores et suivez votre progression pour chaque epreuve passee.',
    color: 'success',
  },
  {
    icon: 'solar:shield-check-bold-duotone',
    title: 'Paiement securise',
    description:
      'Transactions protegees par Stripe avec facturation automatique et suivi en temps reel.',
    color: 'error',
  },
];

// ----------------------------------------------------------------------

export function HomeFeatures() {
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
          {/* Section header */}
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
                Fonctionnalites
              </Typography>
            </m.div>

            <m.div variants={varFade('inUp', { distance: 24 })}>
              <Typography variant="h2" sx={{ fontWeight: 800 }}>
                Tout ce dont vous avez{' '}
                <Box
                  component="span"
                  sx={(t) => ({
                    ...t.mixins.textGradient(
                      `135deg, ${t.vars.palette.primary.main} 0%, ${t.vars.palette.primary.dark} 100%`
                    ),
                  })}
                >
                  besoin
                </Box>
              </Typography>
            </m.div>

            <m.div variants={varFade('inUp', { distance: 24 })}>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                Une plateforme complete pour candidats et instituts de certification.
              </Typography>
            </m.div>
          </Stack>

          {/* Feature cards */}
          <Grid container spacing={3}>
            {FEATURES.map((feature, index) => (
              <Grid key={feature.title} size={{ xs: 12, sm: 6, md: 4 }}>
                <m.div variants={varFade('inUp', { distance: 24 })}>
                  <FeatureCard feature={feature} index={index} />
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

function FeatureCard({ feature, index }) {
  const theme = useTheme();
  const { icon, title, description, color } = feature;

  return (
    <Stack
      spacing={2.5}
      sx={{
        p: 4,
        height: 1,
        borderRadius: 3,
        textAlign: 'center',
        border: `1px solid ${varAlpha(theme.vars.palette.grey['500Channel'], 0.12)}`,
        transition: theme.transitions.create(['box-shadow', 'border-color'], {
          duration: theme.transitions.duration.shorter,
        }),
        '&:hover': {
          borderColor: 'transparent',
          boxShadow: `-8px 8px 40px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.12)}`,
          ...theme.applyStyles('dark', {
            boxShadow: `-8px 8px 40px ${varAlpha(theme.vars.palette.common.blackChannel, 0.4)}`,
          }),
        },
      }}
    >
      <Box
        sx={{
          mx: 'auto',
          width: 64,
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 2,
          bgcolor: varAlpha(theme.vars.palette[color].mainChannel, 0.08),
          color: `${color}.main`,
        }}
      >
        <Iconify icon={icon} width={36} />
      </Box>

      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>

      <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
        {description}
      </Typography>
    </Stack>
  );
}
