'use client';

import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';
import { useGetSession } from 'src/actions/espace-institut';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useCurrentInstitute } from 'src/auth/hooks';

import { SessionCreateEditForm } from '../session-create-edit-form';

// ----------------------------------------------------------------------

export function InstituteSessionEditView() {
  const { id: sessionId } = useParams();
  const currentInstitute = useCurrentInstitute();
  const { session, sessionLoading } = useGetSession(sessionId);

  if (!currentInstitute || sessionLoading) {
    return <LoadingScreen />;
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Modifier la session"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: currentInstitute?.label || 'Institut' },
          { name: 'Sessions', href: paths.dashboard.espaceInstitut.sessions },
          { name: 'Modifier' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <SessionCreateEditForm currentSession={session} instituteId={currentInstitute.id} />
    </DashboardContent>
  );
}
