import { useCallback } from 'react';

import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';

import { useAuthContext } from 'src/auth/hooks';
import { signOut } from 'src/auth/context/jwt/action';

// ----------------------------------------------------------------------

export function SignOutButton({ onClose, sx, ...other }) {
  const router = useRouter();
  const { t } = useTranslate('common');

  const { checkUserSession } = useAuthContext();

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
      onClose?.();

      // Déconnexion volontaire : retour à la connexion sans « returnTo », pour que la personne
      // suivante n'atterrisse pas sur la page (et les droits) de la précédente
      router.replace(paths.auth.jwt.signIn);
      await checkUserSession?.();
    } catch (error) {
      console.error(error);
    }
  }, [checkUserSession, onClose, router]);

  return (
    <Button
      fullWidth
      variant="soft"
      size="large"
      color="error"
      onClick={handleLogout}
      sx={sx}
      {...other}
    >
      {t('logout')}
    </Button>
  );
}
