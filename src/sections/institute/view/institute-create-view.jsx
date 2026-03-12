'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { InstituteCreateEditForm } from '../institute-create-edit-form';

// ----------------------------------------------------------------------

export function InstituteCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Creer un institut"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Instituts', href: paths.dashboard.institute.list },
          { name: 'Nouveau' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <InstituteCreateEditForm />
    </DashboardContent>
  );
}
