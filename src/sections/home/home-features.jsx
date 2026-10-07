'use client';

import { m } from 'framer-motion';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { varFade, MotionViewport } from 'src/components/animate';

// ----------------------------------------------------------------------

const FEATURE_CONFIGS = [
  { icon: 'solar:magnifer-bold-duotone', color: 'primary', key: 1 },
  { icon: 'solar:pen-new-round-bold-duotone', color: 'info', key: 2 },
  { icon: 'solar:diploma-verified-bold-duotone', color: 'warning', key: 3 },
  { icon: 'solar:buildings-2-bold-duotone', color: 'secondary', key: 4 },
  { icon: 'solar:chart-square-bold-duotone', color: 'success', key: 5 },
  { icon: 'solar:shield-check-bold-duotone', color: 'error', key: 6 },
];

// ----------------------------------------------------------------------

export function HomeFeatures() {
  const { t } = useTranslate('home');

  const features = FEATURE_CONFIGS.map((cfg) => ({
    ...cfg,
    title: t(`feature_${cfg.key}_title`),
    description: t(`feature_${cfg.key}_description`),
  }));

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
                {t('features_overline')}
              </Typography>
            </m.div>

            <m.div variants={varFade('inUp', { distance: 24 })}>
              <Typography variant="h2" sx={{ fontWeight: 800 }}>
                {t('features_title_prefix')}
                <Box
                  component="span"
                  sx={(th) => ({
                    ...th.mixins.textGradient(
                      `135deg, ${th.vars.palette.primary.main} 0%, ${th.vars.palette.primary.dark} 100%`
                    ),
                  })}
                >
                  {t('features_title_highlight')}
                </Box>
              </Typography>
            </m.div>

            <m.div variants={varFade('inUp', { distance: 24 })}>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                {t('features_subtitle')}
              </Typography>
            </m.div>
          </Stack>

          {/* Feature cards */}
          <Grid container spacing={3}>
            {features.map((feature, index) => (
              <Grid key={feature.key} size={{ xs: 12, sm: 6, md: 4 }}>
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
