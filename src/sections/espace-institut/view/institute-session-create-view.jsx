'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useCurrentInstitute } from 'src/auth/hooks';

import { SessionCreateEditForm } from '../session-create-edit-form';

// ----------------------------------------------------------------------

export function InstituteSessionCreateView() {
  const currentInstitute = useCurrentInstitute();

  if (!currentInstitute) {
    return <LoadingScreen />;
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Créer une session"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: currentInstitute?.label || 'Institut' },
          { name: 'Sessions', href: paths.dashboard.espaceInstitut.sessions },
          { name: 'Nouvelle' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <SessionCreateEditForm instituteId={currentInstitute.id} />
    </DashboardContent>
  );
}
