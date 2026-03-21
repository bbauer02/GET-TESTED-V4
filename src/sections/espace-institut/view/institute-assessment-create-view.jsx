'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useCurrentInstitute } from 'src/auth/hooks';

import { AssessmentCreateEditForm } from 'src/sections/assessment/assessment-create-edit-form';

// ----------------------------------------------------------------------

export function InstituteAssessmentCreateView() {
  const currentInstitute = useCurrentInstitute();

  if (!currentInstitute) {
    return <LoadingScreen />;
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Creer un assessment"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: currentInstitute?.label || 'Institut' },
          { name: 'Assessments', href: paths.dashboard.espaceInstitut.assessments },
          { name: 'Nouveau' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <AssessmentCreateEditForm instituteId={currentInstitute.id} />
    </DashboardContent>
  );
}
