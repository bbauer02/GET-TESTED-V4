'use client';

import { useParams } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useGetSkill } from 'src/actions/skill';
import { SkillCreateEditForm } from '../skill-create-edit-form';

// ----------------------------------------------------------------------

export function SkillEditView() {
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
        heading="Modifier le skill"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Skills', href: paths.dashboard.skill.list },
          { name: skill?.label || '' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <SkillCreateEditForm currentSkill={skill} />
    </DashboardContent>
  );
}
