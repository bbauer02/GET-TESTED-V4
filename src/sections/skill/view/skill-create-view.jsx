'use client';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { SkillCreateEditForm } from '../skill-create-edit-form';

// ----------------------------------------------------------------------

export function SkillCreateView() {
  const { t } = useTranslate('skill');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('heading_create')}
        links={[
          { name: t('dashboard'), href: paths.dashboard.root },
          { name: t('heading'), href: paths.dashboard.skill.list },
          { name: t('breadcrumb_new') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <SkillCreateEditForm />
    </DashboardContent>
  );
}
