'use client';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ExamCreateEditForm } from '../exam-create-edit-form';

// ----------------------------------------------------------------------

export function ExamCreateView() {
  const { t } = useTranslate('exam');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('heading_create')}
        links={[
          { name: t('dashboard'), href: paths.dashboard.root },
          { name: t('heading'), href: paths.dashboard.exam.list },
          { name: t('breadcrumb_new') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ExamCreateEditForm />
    </DashboardContent>
  );
}
