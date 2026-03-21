'use client';

import { m } from 'framer-motion';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';
import { varFade, MotionContainer } from 'src/components/animate';

// ----------------------------------------------------------------------

export function HomeHero() {
  const theme = useTheme();

  return (
    <Box
      component="section"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: { xs: 560, md: 680 },
        display: 'flex',
        alignItems: 'center',
        background: `linear-gradient(135deg, ${theme.vars.palette.primary.darker} 0%, ${theme.vars.palette.primary.dark} 50%, ${theme.vars.palette.primary.main} 100%)`,
      }}
    >
      {/* Decorative grid overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          opacity: 0.06,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      {/* Decorative floating shapes */}
      <Box
        component={m.div}
        animate={{ y: [-12, 12, -12], rotate: [0, 5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        sx={{
          position: 'absolute',
          top: '15%',
          right: '10%',
          width: 120,
          height: 120,
          borderRadius: '30%',
          border: `2px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.12)}`,
          display: { xs: 'none', md: 'block' },
        }}
      />
      <Box
        component={m.div}
        animate={{ y: [10, -14, 10], rotate: [0, -8, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        sx={{
          position: 'absolute',
          bottom: '20%',
          right: '20%',
          width: 80,
          height: 80,
          borderRadius: '50%',
          bgcolor: varAlpha(theme.vars.palette.common.whiteChannel, 0.06),
          display: { xs: 'none', md: 'block' },
        }}
      />
      <Box
        component={m.div}
        animate={{ y: [8, -8, 8] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        sx={{
          position: 'absolute',
          top: '30%',
          left: '5%',
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: `2px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.08)}`,
          display: { xs: 'none', lg: 'block' },
        }}
      />

      {/* Radial glow */}
      <Box
        sx={{
          position: 'absolute',
          top: '-30%',
          right: '-10%',
          width: '60%',
          height: '80%',
          borderRadius: '50%',
          background: `radial-gradient(ellipse, ${varAlpha(theme.vars.palette.primary.lightChannel, 0.2)} 0%, transparent 70%)`,
          filter: 'blur(80px)',
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <MotionContainer>
          <Stack
            spacing={4}
            sx={{
              maxWidth: 680,
              textAlign: { xs: 'center', md: 'left' },
              mx: { xs: 'auto', md: 0 },
            }}
          >
            <m.div variants={varFade('inUp', { distance: 40 })}>
              <Typography
                variant="overline"
                sx={{
                  color: varAlpha(theme.vars.palette.common.whiteChannel, 0.7),
                  letterSpacing: 3,
                  fontSize: { xs: '0.7rem', md: '0.75rem' },
                }}
              >
                Plateforme de certification linguistique
              </Typography>
            </m.div>

            <m.div variants={varFade('inUp', { distance: 40 })}>
              <Typography
                variant="h1"
                sx={{
                  color: 'common.white',
                  fontWeight: 800,
                  fontSize: { xs: '2.25rem', sm: '3rem', md: '3.75rem' },
                  lineHeight: 1.15,
                }}
              >
                Certifiez votre niveau
                <br />
                de langue en{' '}
                <Box
                  component="span"
                  sx={{
                    position: 'relative',
                    display: 'inline-block',
                    color: theme.vars.palette.primary.lighter,
                  }}
                >
                  quelques clics
                  <Box
                    component={m.span}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.6, ease: [0.43, 0.13, 0.23, 0.96] }}
                    sx={{
                      position: 'absolute',
                      bottom: 4,
                      left: 0,
                      right: 0,
                      height: 6,
                      borderRadius: 3,
                      bgcolor: varAlpha(theme.vars.palette.primary.lightChannel, 0.4),
                      transformOrigin: 'left',
                    }}
                  />
                </Box>
              </Typography>
            </m.div>

            <m.div variants={varFade('inUp', { distance: 40 })}>
              <Typography
                variant="h6"
                sx={{
                  color: varAlpha(theme.vars.palette.common.whiteChannel, 0.72),
                  fontWeight: 400,
                  lineHeight: 1.7,
                  maxWidth: 520,
                  mx: { xs: 'auto', md: 0 },
                }}
              >
                Trouvez une session de test, inscrivez-vous en ligne et recevez vos
                resultats et attestations directement sur votre espace.
              </Typography>
            </m.div>

            <m.div variants={varFade('inUp', { distance: 40 })}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{
                  justifyContent: { xs: 'center', md: 'flex-start' },
                }}
              >
                <Button
                  component={RouterLink}
                  href={paths.sessions.root}
                  size="large"
                  variant="contained"
                  endIcon={<Iconify icon="eva:arrow-forward-fill" />}
                  sx={{
                    bgcolor: 'common.white',
                    color: 'primary.darker',
                    px: 4,
                    py: 1.5,
                    fontWeight: 700,
                    fontSize: '1rem',
                    borderRadius: 2,
                    boxShadow: `0 8px 32px ${varAlpha(theme.vars.palette.common.blackChannel, 0.2)}`,
                    '&:hover': {
                      bgcolor: 'grey.100',
                    },
                  }}
                >
                  Trouver une session
                </Button>

                <Button
                  component={RouterLink}
                  href={paths.auth.jwt.signUp}
                  size="large"
                  variant="outlined"
                  sx={{
                    color: 'common.white',
                    borderColor: varAlpha(theme.vars.palette.common.whiteChannel, 0.32),
                    px: 4,
                    py: 1.5,
                    fontWeight: 600,
                    fontSize: '1rem',
                    borderRadius: 2,
                    '&:hover': {
                      borderColor: 'common.white',
                      bgcolor: varAlpha(theme.vars.palette.common.whiteChannel, 0.08),
                    },
                  }}
                >
                  Creer un compte
                </Button>
              </Stack>
            </m.div>
          </Stack>
        </MotionContainer>
      </Container>
    </Box>
  );
}
