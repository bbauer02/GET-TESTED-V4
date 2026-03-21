'use client';

import { useParams } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useCurrentInstitute } from 'src/auth/hooks';
import { useGetDocumentTemplate } from 'src/actions/document-template';

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
        heading="Modifier le modele"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Documents', href: paths.dashboard.espaceInstitut.documents },
          { name: template?.label || 'Modifier' },
        ]}
      />

      <DocumentTemplateCreateEditForm currentTemplate={template} instituteId={institute?.id} />
    </DashboardContent>
  );
}
