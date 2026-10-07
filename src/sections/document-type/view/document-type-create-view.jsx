'use client';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { DocumentTypeCreateEditForm } from '../document-type-create-edit-form';

// ----------------------------------------------------------------------

export function DocumentTypeCreateView() {
  const { t } = useTranslate('document_type');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('heading_create')}
        links={[
          { name: t('dashboard'), href: paths.dashboard.root },
          { name: t('heading'), href: paths.dashboard.documentType.root },
          { name: t('breadcrumb_new') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <DocumentTypeCreateEditForm />
    </DashboardContent>
  );
}
