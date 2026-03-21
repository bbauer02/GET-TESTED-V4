'use client';

import useSWR from 'swr';

import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hooks';

import { fetcher } from 'src/lib/axios';

import { DashboardContent } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { DocumentTypeCreateEditForm } from '../document-type-create-edit-form';

// ----------------------------------------------------------------------

export function DocumentTypeEditView() {
  const { id } = useParams();

  const { data: currentDocumentType, isLoading } = useSWR(
    id ? `/api/document-types/${id}` : null,
    fetcher
  );

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Modifier le type de document"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Types de documents', href: paths.dashboard.documentType.root },
          { name: currentDocumentType?.label || '' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <DocumentTypeCreateEditForm currentDocumentType={currentDocumentType} />
    </DashboardContent>
  );
}
