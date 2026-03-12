'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ExamCreateEditForm } from '../exam-create-edit-form';

// ----------------------------------------------------------------------

export function ExamCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Creer un exam"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Exams', href: paths.dashboard.exam.list },
          { name: 'Nouveau' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ExamCreateEditForm />
    </DashboardContent>
  );
}
