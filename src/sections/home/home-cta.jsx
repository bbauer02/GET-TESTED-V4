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

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { varFade, MotionViewport } from 'src/components/animate';

// ----------------------------------------------------------------------

export function HomeCta() {
  const theme = useTheme();
  const { t } = useTranslate('home');

  return (
    <Box
      component="section"
      sx={{
        py: { xs: 10, md: 16 },
        bgcolor: 'background.default',
      }}
    >
      <Container maxWidth="md">
        <MotionViewport>
          <Box
            sx={{
              p: { xs: 4, md: 8 },
              borderRadius: 4,
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              background: `linear-gradient(135deg, ${theme.vars.palette.primary.dark} 0%, ${theme.vars.palette.primary.darker} 100%)`,
            }}
          >
            {/* Background decoration */}
            <Box
              sx={{
                position: 'absolute',
                top: -60,
                right: -60,
                width: 240,
                height: 240,
                borderRadius: '50%',
                bgcolor: varAlpha(theme.vars.palette.common.whiteChannel, 0.04),
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: -40,
                left: -40,
                width: 160,
                height: 160,
                borderRadius: '50%',
                bgcolor: varAlpha(theme.vars.palette.common.whiteChannel, 0.04),
              }}
            />

            <Stack spacing={3} sx={{ position: 'relative', zIndex: 1 }}>
              <m.div variants={varFade('inUp', { distance: 24 })}>
                <Box
                  sx={{
                    mx: 'auto',
                    width: 64,
                    height: 64,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 2,
                    bgcolor: varAlpha(theme.vars.palette.common.whiteChannel, 0.12),
                    mb: 2,
                  }}
                >
                  <Iconify
                    icon="solar:rocket-2-bold-duotone"
                    width={36}
                    sx={{ color: 'common.white' }}
                  />
                </Box>
              </m.div>

              <m.div variants={varFade('inUp', { distance: 24 })}>
                <Typography
                  variant="h3"
                  sx={{
                    color: 'common.white',
                    fontWeight: 800,
                    fontSize: { xs: '1.75rem', md: '2.25rem' },
                  }}
                >
                  {t('cta_title')}
                </Typography>
              </m.div>

              <m.div variants={varFade('inUp', { distance: 24 })}>
                <Typography
                  variant="body1"
                  sx={{
                    color: varAlpha(theme.vars.palette.common.whiteChannel, 0.72),
                    maxWidth: 480,
                    mx: 'auto',
                    lineHeight: 1.7,
                  }}
                >
                  {t('cta_description')}
                </Typography>
              </m.div>

              <m.div variants={varFade('inUp', { distance: 24 })}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  sx={{ justifyContent: 'center', pt: 1 }}
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
                      borderRadius: 2,
                      '&:hover': { bgcolor: 'grey.200' },
                    }}
                  >
                    {t('cta_view_sessions')}
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
                      borderRadius: 2,
                      '&:hover': {
                        borderColor: 'common.white',
                        bgcolor: varAlpha(theme.vars.palette.common.whiteChannel, 0.08),
                      },
                    }}
                  >
                    {t('cta_create_account')}
                  </Button>
                </Stack>
              </m.div>
            </Stack>
          </Box>
        </MotionViewport>
      </Container>
    </Box>
  );
}
