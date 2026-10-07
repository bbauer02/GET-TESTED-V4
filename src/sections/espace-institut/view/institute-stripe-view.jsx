'use client';

import { useCallback } from 'react';

import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useCurrentInstitute } from 'src/auth/hooks/use-current-institute';

import { StripeConnectHub } from '../stripe-connect-hub';
import { useStripeStatus, useCreateStripeAccount } from '../hooks/use-stripe';

// ----------------------------------------------------------------------

export function InstituteStripeView() {
  const institute = useCurrentInstitute();
  const instituteId = institute?.id;

  const { status, statusLoading, statusMutate } = useStripeStatus(instituteId);
  const { createAccount, creating } = useCreateStripeAccount(instituteId);

  const handleConnect = useCallback(async () => {
    await createAccount();
    statusMutate();
  }, [createAccount, statusMutate]);

  // Not connected yet
  if (!statusLoading && !status?.connected) {
    return (
      <DashboardContent maxWidth="xl">
        <CustomBreadcrumbs
          heading="Stripe"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: institute?.label || 'Institut', href: paths.dashboard.espaceInstitut.root },
            { name: 'Stripe' },
          ]}
          sx={{ mb: 3 }}
        />

        <Card sx={{ p: 5, textAlign: 'center' }}>
          <Iconify icon="logos:stripe" width={80} sx={{ mb: 3 }} />

          <Typography variant="h4" sx={{ mb: 1 }}>
            Connectez votre institut a Stripe
          </Typography>

          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4, maxWidth: 480, mx: 'auto' }}>
            Activez les paiements en ligne pour votre institut. Vous pourrez recevoir des paiements,
            gerer vos virements et suivre vos soldes directement depuis cette page.
          </Typography>

          <LoadingButton
            variant="contained"
            size="large"
            loading={creating}
            onClick={handleConnect}
            startIcon={<Iconify icon="mdi:link-variant" />}
          >
            Connecter Stripe
          </LoadingButton>
        </Card>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs
        heading="Stripe"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: institute?.label || 'Institut', href: paths.dashboard.espaceInstitut.root },
          { name: 'Stripe' },
        ]}
        sx={{ mb: 3 }}
      />

      {statusLoading ? (
        <Card sx={{ p: 5, textAlign: 'center' }}>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Chargement...
          </Typography>
        </Card>
      ) : (
        <StripeConnectHub instituteId={instituteId} status={status} />
      )}
    </DashboardContent>
  );
}
