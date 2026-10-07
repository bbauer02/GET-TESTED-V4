'use client';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

/** Actions de l'en-tête des pages publiques : recherche de sessions et accès au compte. */
export function PublicHeaderActions({ showSignIn = true, sx }) {
  const { t } = useTranslate('common');
  const { authenticated } = useAuthContext();

  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={sx}>
      <Button
        component={RouterLink}
        href={paths.sessions.root}
        size="small"
        sx={{ fontWeight: 600, color: 'text.primary' }}
      >
        {t('nav_sessions')}
      </Button>

      {authenticated ? (
        <Button component={RouterLink} href={paths.dashboard.root} variant="contained" size="small">
          {t('nav_my_space')}
        </Button>
      ) : (
        showSignIn && (
          <Button
            component={RouterLink}
            href={paths.auth.jwt.signIn}
            variant="outlined"
            size="small"
            sx={{ fontWeight: 600 }}
          >
            {t('nav_sign_in')}
          </Button>
        )
      )}
    </Stack>
  );
}
