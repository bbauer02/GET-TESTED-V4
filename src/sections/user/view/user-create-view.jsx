'use client';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { UserCreateForm } from '../user-create-form';

// ----------------------------------------------------------------------

export function UserCreateView() {
  const { t } = useTranslate('user');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('heading_create')}
        links={[
          { name: t('dashboard'), href: paths.dashboard.root },
          { name: t('heading'), href: paths.dashboard.user.list },
          { name: t('breadcrumb_new') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <UserCreateForm />
    </DashboardContent>
  );
}
