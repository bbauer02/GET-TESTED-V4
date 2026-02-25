'use client';

import { useState, useCallback } from 'react';

import { varAlpha } from 'minimal-shared/utils';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';

import { ProfileEditForm } from '../profile-edit-form';
import { ChangePasswordForm } from '../change-password-form';

// ----------------------------------------------------------------------

const TABS = [
  { value: 'general', label: 'Général', icon: 'solar:user-id-bold' },
  { value: 'security', label: 'Sécurité', icon: 'ic:round-vpn-key' },
];

// ----------------------------------------------------------------------

export function ProfileView() {
  const [currentTab, setCurrentTab] = useState('general');

  const handleChangeTab = useCallback((event, newValue) => {
    setCurrentTab(newValue);
  }, []);

  return (
    <DashboardContent maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 3 }}>
        Mon profil
      </Typography>

      <Tabs
        value={currentTab}
        onChange={handleChangeTab}
        sx={{
          mb: 3,
          boxShadow: (theme) =>
            `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
        }}
      >
        {TABS.map((tab) => (
          <Tab
            key={tab.value}
            value={tab.value}
            label={tab.label}
            icon={<Iconify icon={tab.icon} />}
            iconPosition="start"
          />
        ))}
      </Tabs>

      {currentTab === 'general' && <ProfileEditForm />}

      {currentTab === 'security' && <ChangePasswordForm />}
    </DashboardContent>
  );
}
