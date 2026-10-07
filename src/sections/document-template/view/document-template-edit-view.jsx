'use client';

import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';
import { useGetDocumentTemplate } from 'src/actions/document-template';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useCurrentInstitute } from 'src/auth/hooks';

import { DocumentTemplateCreateEditForm } from '../document-template-create-edit-form';

// ----------------------------------------------------------------------

export function DocumentTemplateEditView() {
  const { id } = useParams();
  const institute = useCurrentInstitute();
  const { template, templateLoading, templateError } = useGetDocumentTemplate(id);

  if (templateLoading || (!template && !templateError)) {
    return <LoadingScreen />;
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Modifier le modèle"
        links={[
          { name: 'Tableau de bord', href: paths.dashboard.root },
          { name: 'Documents', href: paths.dashboard.espaceInstitut.documents },
          { name: template?.label || 'Modifier' },
        ]}
      />

      <DocumentTemplateCreateEditForm currentTemplate={template} instituteId={institute?.id} />
    </DashboardContent>
  );
}
