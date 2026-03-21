'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { DocumentTypeCreateEditForm } from '../document-type-create-edit-form';

// ----------------------------------------------------------------------

export function DocumentTypeCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Nouveau type de document"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Types de documents', href: paths.dashboard.documentType.root },
          { name: 'Nouveau' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <DocumentTypeCreateEditForm />
    </DashboardContent>
  );
}
