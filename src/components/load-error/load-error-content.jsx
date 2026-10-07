'use client';

import Button from '@mui/material/Button';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';

// ----------------------------------------------------------------------

const MESSAGES = {
  401: 'Votre session a expiré. Reconnectez-vous pour continuer.',
  403: "Vous n'avez pas accès à ces données.",
  404: 'Ces données sont introuvables.',
};

/**
 * État d'erreur de chargement (à la place de « aucune donnée ») avec un bouton « Réessayer ».
 * `error` est l'erreur levée par le client axios (status, message).
 */
export function LoadErrorContent({ error, onRetry, title = 'Chargement impossible', sx, ...other }) {
  const status = error?.status;
  const description =
    MESSAGES[status] ||
    (status >= 500 || !status
      ? 'Le serveur ne répond pas pour le moment. Réessayez dans quelques instants.'
      : error?.message);

  return (
    <EmptyContent
      filled
      title={title}
      description={description}
      imgUrl={undefined}
      action={
        onRetry && status !== 403 && status !== 404 ? (
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:restart-bold" />}
            onClick={() => onRetry()}
            sx={{ mt: 2 }}
          >
            Réessayer
          </Button>
        ) : null
      }
      sx={[{ py: 6 }, ...(Array.isArray(sx) ? sx : [sx])]}
      {...other}
    />
  );
}
