'use client';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { InstituteCreateEditForm } from '../institute-create-edit-form';

// ----------------------------------------------------------------------

export function InstituteCreateView() {
  const { t } = useTranslate('institute');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('heading_create')}
        links={[
          { name: t('dashboard'), href: paths.dashboard.root },
          { name: t('heading'), href: paths.dashboard.institute.list },
          { name: t('breadcrumb_new') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <InstituteCreateEditForm />
    </DashboardContent>
  );
}
