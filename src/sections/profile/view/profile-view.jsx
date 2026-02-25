'use client';

import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';

import { ProfileEditForm } from '../profile-edit-form';

// ----------------------------------------------------------------------

export function ProfileView() {
  return (
    <DashboardContent maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 3 }}>
        Mon profil
      </Typography>

      <ProfileEditForm />
    </DashboardContent>
  );
}
