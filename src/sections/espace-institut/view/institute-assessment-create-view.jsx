'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { AssessmentCreateEditForm } from 'src/sections/assessment/assessment-create-edit-form';

import { useCurrentInstitute } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export function InstituteAssessmentCreateView() {
  const currentInstitute = useCurrentInstitute();

  if (!currentInstitute) {
    return <LoadingScreen />;
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Créer un test"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: currentInstitute?.label || 'Institut' },
          { name: 'Tests', href: paths.dashboard.espaceInstitut.assessments },
          { name: 'Nouveau' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <AssessmentCreateEditForm instituteId={currentInstitute.id} />
    </DashboardContent>
  );
}
