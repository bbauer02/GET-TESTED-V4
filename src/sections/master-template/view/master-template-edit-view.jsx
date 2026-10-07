'use client';

import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';
import { useGetDocumentTemplate } from 'src/actions/document-template';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { MasterTemplateCreateEditForm } from '../master-template-create-edit-form';

// ----------------------------------------------------------------------

export function MasterTemplateEditView() {
  const { id } = useParams();
  const { template, templateLoading, templateError } = useGetDocumentTemplate(id);

  if (templateLoading || (!template && !templateError)) {
    return <LoadingScreen />;
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Modifier le modele maitre"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Modeles maitre', href: paths.dashboard.masterTemplate.root },
          { name: template?.label || 'Modifier' },
        ]}
      />

      <MasterTemplateCreateEditForm currentTemplate={template} />
    </DashboardContent>
  );
}
