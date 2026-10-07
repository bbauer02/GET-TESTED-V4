'use client';

import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Logo } from 'src/components/logo';

import { MainSection, LayoutSection, HeaderSection } from '../core';
import { PublicHeaderActions } from '../components/public-header-actions';

// ----------------------------------------------------------------------

export function MainLayout({ children, sx }) {
  const renderHeader = () => {
    const headerSlots = {
      leftArea: <Logo isSingle={false} />,
      rightArea: <PublicHeaderActions />,
    };

    return <HeaderSection layoutQuery="sm" slots={headerSlots} />;
  };

  const renderFooter = () => (
    <Box
      component="footer"
      sx={(theme) => ({
        py: 4,
        textAlign: 'center',
        borderTop: `1px solid ${varAlpha(theme.vars.palette.grey['500Channel'], 0.12)}`,
      })}
    >
      <Container maxWidth="lg">
        <Stack spacing={2} alignItems="center">
          <Logo />

          <Stack
            direction="row"
            spacing={3}
            sx={{ color: 'text.secondary', typography: 'body2' }}
          >
            <Box
              component={RouterLink}
              href={paths.sessions.root}
              sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { color: 'text.primary' } }}
            >
              Sessions
            </Box>
            <Box
              component={RouterLink}
              href={paths.auth.jwt.signIn}
              sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { color: 'text.primary' } }}
            >
              Connexion
            </Box>
            <Box
              component={RouterLink}
              href={paths.auth.jwt.signUp}
              sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { color: 'text.primary' } }}
            >
              Inscription
            </Box>
          </Stack>

          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            &copy; {new Date().getFullYear()} GetTested. Tous droits réservés.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );

  return (
    <LayoutSection
      headerSection={renderHeader()}
      footerSection={renderFooter()}
      sx={sx}
    >
      <MainSection>{children}</MainSection>
    </LayoutSection>
  );
}
