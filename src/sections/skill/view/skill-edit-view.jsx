'use client';

import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { useGetSkill } from 'src/actions/skill';
import { DashboardContent } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { SkillCreateEditForm } from '../skill-create-edit-form';

// ----------------------------------------------------------------------

export function SkillEditView() {
  const { t } = useTranslate('skill');
  const { id } = useParams();
  const { skill, skillLoading } = useGetSkill(id);

  if (skillLoading) {
    return (
      <DashboardContent>
        <LoadingScreen />
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('heading_edit')}
        links={[
          { name: t('dashboard'), href: paths.dashboard.root },
          { name: t('heading'), href: paths.dashboard.skill.list },
          { name: skill?.label || '' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <SkillCreateEditForm currentSkill={skill} />
    </DashboardContent>
  );
}
