'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useCurrentInstitute } from 'src/auth/hooks';

import { DocumentTemplateCreateEditForm } from '../document-template-create-edit-form';

// ----------------------------------------------------------------------

export function DocumentTemplateCreateView() {
  const institute = useCurrentInstitute();

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Nouveau modele"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Documents', href: paths.dashboard.espaceInstitut.documents },
          { name: 'Nouveau' },
        ]}
      />

      <DocumentTemplateCreateEditForm instituteId={institute?.id} />
    </DashboardContent>
  );
}
