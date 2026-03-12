'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { AssessmentCreateEditForm } from '../assessment-create-edit-form';

// ----------------------------------------------------------------------

export function AssessmentCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Creer un assessment"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Assessments', href: paths.dashboard.assessment.list },
          { name: 'Nouveau' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <AssessmentCreateEditForm />
    </DashboardContent>
  );
}
