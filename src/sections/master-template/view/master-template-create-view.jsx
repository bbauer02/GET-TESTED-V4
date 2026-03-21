'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { MasterTemplateCreateEditForm } from '../master-template-create-edit-form';

// ----------------------------------------------------------------------

export function MasterTemplateCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Nouveau modele maitre"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Modeles maitre', href: paths.dashboard.masterTemplate.root },
          { name: 'Nouveau' },
        ]}
      />

      <MasterTemplateCreateEditForm />
    </DashboardContent>
  );
}
