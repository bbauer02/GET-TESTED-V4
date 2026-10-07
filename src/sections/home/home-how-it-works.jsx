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

const STEP_CONFIGS = [
  { number: '01', icon: 'solar:magnifer-bold-duotone', key: 1 },
  { number: '02', icon: 'solar:user-plus-bold-duotone', key: 2 },
  { number: '03', icon: 'solar:card-bold-duotone', key: 3 },
  { number: '04', icon: 'solar:document-bold-duotone', key: 4 },
];

// ----------------------------------------------------------------------

export function HomeHowItWorks() {
  const theme = useTheme();
  const { t } = useTranslate('home');

  const steps = STEP_CONFIGS.map((cfg) => ({
    ...cfg,
    title: t(`step_${cfg.key}_title`),
    description: t(`step_${cfg.key}_description`),
  }));

  return (
    <Box
      component="section"
      sx={{
        py: { xs: 10, md: 16 },
        bgcolor: varAlpha(theme.vars.palette.grey['500Channel'], 0.04),
        ...theme.applyStyles('dark', {
          bgcolor: varAlpha(theme.vars.palette.common.blackChannel, 0.2),
        }),
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
                {t('how_it_works_overline')}
              </Typography>
            </m.div>

            <m.div variants={varFade('inUp', { distance: 24 })}>
              <Typography variant="h2" sx={{ fontWeight: 800 }}>
                {t('how_it_works_title_prefix')}
                <Box
                  component="span"
                  sx={(th) => ({
                    ...th.mixins.textGradient(
                      `135deg, ${th.vars.palette.info.main} 0%, ${th.vars.palette.primary.main} 100%`
                    ),
                  })}
                >
                  {t('how_it_works_title_highlight')}
                </Box>
              </Typography>
            </m.div>

            <m.div variants={varFade('inUp', { distance: 24 })}>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                {t('how_it_works_subtitle')}
              </Typography>
            </m.div>
          </Stack>

          {/* Steps */}
          <Grid container spacing={4}>
            {steps.map((step, index) => (
              <Grid key={step.number} size={{ xs: 12, sm: 6, md: 3 }}>
                <m.div variants={varFade('inUp', { distance: 24 })}>
                  <StepCard step={step} index={index} isLast={index === steps.length - 1} />
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

function StepCard({ step, index, isLast }) {
  const theme = useTheme();
  const { number, icon, title, description } = step;

  return (
    <Stack
      spacing={3}
      sx={{
        position: 'relative',
        textAlign: 'center',
        alignItems: 'center',
      }}
    >
      {/* Connector line */}
      {!isLast && (
        <Box
          sx={{
            display: { xs: 'none', md: 'block' },
            position: 'absolute',
            top: 40,
            left: '60%',
            width: 'calc(100% - 20%)',
            height: 2,
            borderTop: `2px dashed ${varAlpha(theme.vars.palette.primary.mainChannel, 0.24)}`,
          }}
        />
      )}

      {/* Number + icon */}
      <Box
        sx={{
          position: 'relative',
          width: 80,
          height: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          bgcolor: varAlpha(theme.vars.palette.primary.mainChannel, 0.08),
          border: `2px solid ${varAlpha(theme.vars.palette.primary.mainChannel, 0.2)}`,
        }}
      >
        <Iconify icon={icon} width={36} sx={{ color: 'primary.main' }} />

        {/* Step number badge */}
        <Box
          sx={{
            position: 'absolute',
            top: -4,
            right: -4,
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            fontWeight: 800,
            fontSize: '0.75rem',
          }}
        >
          {number}
        </Box>
      </Box>

      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>

      <Typography
        variant="body2"
        sx={{ color: 'text.secondary', lineHeight: 1.7, maxWidth: 240, mx: 'auto' }}
      >
        {description}
      </Typography>
    </Stack>
  );
}
