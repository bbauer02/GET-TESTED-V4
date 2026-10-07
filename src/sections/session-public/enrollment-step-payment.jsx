'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function EnrollmentStepPayment({ status }) {
  const { t } = useTranslate('sessions');
  // status: 'processing' | 'success' | 'pending_payment' | 'payment_unconfirmed' | 'error'

  const renderEnrollmentsButton = () => (
    // Navigation complète : recharge le contexte d'auth après une inscription en tant qu'invité
    <Button
      href={paths.dashboard.mesInscriptions.root}
      variant="contained"
      startIcon={<Iconify icon="solar:list-check-bold" />}
    >
      {t('go_to_my_enrollments')}
    </Button>
  );

  if (status === 'processing') {
    return (
      <Stack alignItems="center" spacing={3} sx={{ py: 8 }}>
        <CircularProgress size={48} />
        <Typography variant="h6">{t('processing')}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('processing_desc')}
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

        <Typography variant="h5">{t('enrollment_confirmed')}</Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', textAlign: 'center', maxWidth: 480 }}>
          {t('enrollment_confirmed_desc')}
        </Typography>

        {renderEnrollmentsButton()}
      </Stack>
    );
  }

  if (status === 'payment_unconfirmed') {
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
            bgcolor: 'info.lighter',
            color: 'info.main',
          }}
        >
          <Iconify icon="eva:clock-outline" width={40} />
        </Box>

        <Typography variant="h5">{t('payment_unconfirmed')}</Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', textAlign: 'center', maxWidth: 480 }}>
          {t('payment_unconfirmed_desc')}
        </Typography>

        {renderEnrollmentsButton()}
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

        <Typography variant="h5">{t('enrollment_registered')}</Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', textAlign: 'center', maxWidth: 480 }}>
          {t('enrollment_registered_desc')}
        </Typography>

        {renderEnrollmentsButton()}
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

      <Typography variant="h5">{t('error_title')}</Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', textAlign: 'center', maxWidth: 480 }}>
        {t('error_desc')}
      </Typography>

      {renderEnrollmentsButton()}
    </Stack>
  );
}
