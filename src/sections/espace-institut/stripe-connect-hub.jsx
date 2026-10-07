'use client';

import { useMemo, useState } from 'react';
import { loadConnectAndInitialize } from '@stripe/connect-js';
import {
  ConnectPayouts,
  ConnectPayments,
  ConnectBalances,
  ConnectAccountOnboarding,
  ConnectComponentsProvider,
  ConnectNotificationBanner,
} from '@stripe/react-connect-js';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { useStripeAccountSession } from './hooks/use-stripe';

// ----------------------------------------------------------------------

const TABS = [
  { value: 'onboarding', label: 'Onboarding', icon: 'mdi:account-check' },
  { value: 'payments', label: 'Paiements', icon: 'mdi:credit-card-outline' },
  { value: 'payouts', label: 'Virements', icon: 'mdi:bank-transfer-out' },
  { value: 'balances', label: 'Soldes', icon: 'mdi:wallet-outline' },
];

// ----------------------------------------------------------------------

export function StripeConnectHub({ instituteId, status }) {
  const [currentTab, setCurrentTab] = useState(status?.onboardingComplete ? 'payments' : 'onboarding');
  const { fetchClientSecret } = useStripeAccountSession(instituteId);

  const stripeConnectInstance = useMemo(
    () =>
      loadConnectAndInitialize({
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        fetchClientSecret,
        appearance: {
          overlays: 'dialog',
          variables: {
            colorPrimary: '#1877F2',
            borderRadius: '8px',
          },
        },
      }),
    [fetchClientSecret]
  );

  return (
    <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
      <Stack spacing={3}>
        {/* Notification banner */}
        <ConnectNotificationBanner />

        {/* Status bar */}
        <Card sx={{ p: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <Iconify icon="logos:stripe" width={48} />

            <Label
              color={status?.chargesEnabled ? 'success' : 'warning'}
              startIcon={
                <Iconify
                  icon={status?.chargesEnabled ? 'mdi:check-circle' : 'mdi:clock-outline'}
                  width={16}
                />
              }
            >
              {status?.chargesEnabled ? 'Paiements actifs' : 'Paiements inactifs'}
            </Label>

            <Label
              color={status?.payoutsEnabled ? 'success' : 'warning'}
              startIcon={
                <Iconify
                  icon={status?.payoutsEnabled ? 'mdi:check-circle' : 'mdi:clock-outline'}
                  width={16}
                />
              }
            >
              {status?.payoutsEnabled ? 'Virements actifs' : 'Virements inactifs'}
            </Label>

            <Label
              color={status?.onboardingComplete ? 'success' : 'error'}
              startIcon={
                <Iconify
                  icon={status?.onboardingComplete ? 'mdi:check-circle' : 'mdi:alert-circle'}
                  width={16}
                />
              }
            >
              {status?.onboardingComplete ? 'Verification terminee' : 'Verification requise'}
            </Label>
          </Stack>
        </Card>

        {/* Alert if onboarding not complete */}
        {!status?.onboardingComplete && (
          <Alert severity="warning" variant="outlined">
            Votre compte Stripe necessite une verification. Completez l&apos;onboarding ci-dessous
            pour activer les paiements et virements.
          </Alert>
        )}

        {/* Tabs */}
        <Card>
          <Tabs
            value={currentTab}
            onChange={(_, newValue) => setCurrentTab(newValue)}
            sx={{ px: 2, pt: 1 }}
          >
            {TABS.map((tab) => (
              <Tab
                key={tab.value}
                value={tab.value}
                label={tab.label}
                icon={<Iconify icon={tab.icon} width={20} />}
                iconPosition="start"
              />
            ))}
          </Tabs>

          <Box sx={{ p: 3 }}>
            {currentTab === 'onboarding' && (
              <ConnectAccountOnboarding
                onExit={() => {
                  setCurrentTab('payments');
                  window.location.reload();
                }}
              />
            )}

            {currentTab === 'payments' && <ConnectPayments />}

            {currentTab === 'payouts' && <ConnectPayouts />}

            {currentTab === 'balances' && <ConnectBalances />}
          </Box>
        </Card>
      </Stack>
    </ConnectComponentsProvider>
  );
}
