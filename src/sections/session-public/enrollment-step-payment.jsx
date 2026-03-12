'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function EnrollmentStepPayment({ status }) {
  // status: 'processing' | 'success' | 'error'

  if (status === 'processing') {
    return (
      <Stack alignItems="center" spacing={3} sx={{ py: 8 }}>
        <CircularProgress size={48} />
        <Typography variant="h6">Traitement en cours...</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Veuillez patienter pendant que nous traitons votre inscription.
        </Typography>
      </Stack>
    );
  }

  if (status === 'success') {
    return (
      <Stack alignItems="center" spacing={3} sx={{ py: 8 }}>
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'success.lighter',
            color: 'success.main',
          }}
        >
          <Iconify icon="eva:checkmark-fill" width={40} />
        </Box>

        <Typography variant="h5">Inscription confirmee !</Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', textAlign: 'center', maxWidth: 480 }}>
          Votre inscription a bien ete enregistree. Vous allez recevoir un email de confirmation avec les details de votre session.
        </Typography>
      </Stack>
    );
  }

  if (status === 'pending_payment') {
    return (
      <Stack alignItems="center" spacing={3} sx={{ py: 8 }}>
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'warning.lighter',
            color: 'warning.main',
          }}
        >
          <Iconify icon="eva:clock-outline" width={40} />
        </Box>

        <Typography variant="h5">Inscription enregistree</Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', textAlign: 'center', maxWidth: 480 }}>
          Votre inscription a bien ete prise en compte. Votre place sera confirmee une fois le paiement recu.
          Vous recevrez un email avec les instructions de paiement.
        </Typography>
      </Stack>
    );
  }

  // error
  return (
    <Stack alignItems="center" spacing={3} sx={{ py: 8 }}>
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'error.lighter',
          color: 'error.main',
        }}
      >
        <Iconify icon="eva:close-fill" width={40} />
      </Box>

      <Typography variant="h5">Erreur</Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', textAlign: 'center', maxWidth: 480 }}>
        Une erreur est survenue lors du traitement. Votre inscription a ete enregistree mais le paiement a echoue. Veuillez contacter l&apos;institut pour regulariser.
      </Typography>
    </Stack>
  );
}
