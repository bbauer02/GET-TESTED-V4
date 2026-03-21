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
import { varFade, AnimateCountUp, MotionViewport } from 'src/components/animate';

// ----------------------------------------------------------------------

const STATS = [
  {
    value: 500,
    unit: '+',
    label: 'Sessions organisees',
    icon: 'solar:calendar-check-bold-duotone',
    color: 'primary',
  },
  {
    value: 2000,
    unit: '+',
    label: 'Candidats inscrits',
    icon: 'solar:users-group-rounded-bold-duotone',
    color: 'info',
  },
  {
    value: 15,
    unit: '',
    label: 'Certifications proposees',
    icon: 'solar:diploma-verified-bold-duotone',
    color: 'warning',
  },
  {
    value: 98,
    unit: '%',
    label: 'Taux de satisfaction',
    icon: 'solar:like-bold-duotone',
    color: 'success',
  },
];

// ----------------------------------------------------------------------

export function HomeStats() {
  const theme = useTheme();

  return (
    <Box
      component="section"
      sx={{
        py: { xs: 8, md: 12 },
        background: `linear-gradient(135deg, ${theme.vars.palette.primary.darker} 0%, ${theme.vars.palette.primary.dark} 100%)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle texture */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          opacity: 0.04,
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <MotionViewport>
          <Grid container spacing={4}>
            {STATS.map((stat) => (
              <Grid key={stat.label} size={{ xs: 6, md: 3 }}>
                <m.div variants={varFade('inUp', { distance: 24 })}>
                  <StatItem stat={stat} />
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

function StatItem({ stat }) {
  const theme = useTheme();
  const { value, unit, label, icon } = stat;

  return (
    <Stack spacing={1} sx={{ textAlign: 'center', alignItems: 'center' }}>
      <Box
        sx={{
          mb: 1,
          width: 56,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          bgcolor: varAlpha(theme.vars.palette.common.whiteChannel, 0.08),
        }}
      >
        <Iconify
          icon={icon}
          width={28}
          sx={{ color: varAlpha(theme.vars.palette.common.whiteChannel, 0.8) }}
        />
      </Box>

      <Stack direction="row" alignItems="baseline" justifyContent="center">
        <AnimateCountUp
          to={value}
          duration={2}
          variant="h2"
          sx={{
            color: 'common.white',
            fontWeight: 800,
            fontSize: { xs: '2rem', md: '2.75rem' },
          }}
        />
        {unit && (
          <Typography
            variant="h3"
            sx={{
              color: varAlpha(theme.vars.palette.common.whiteChannel, 0.64),
              fontWeight: 700,
              ml: 0.25,
            }}
          >
            {unit}
          </Typography>
        )}
      </Stack>

      <Typography
        variant="body2"
        sx={{
          color: varAlpha(theme.vars.palette.common.whiteChannel, 0.64),
          fontWeight: 500,
        }}
      >
        {label}
      </Typography>
    </Stack>
  );
}
