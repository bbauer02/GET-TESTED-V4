'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { SkillCreateEditForm } from '../skill-create-edit-form';

// ----------------------------------------------------------------------

export function SkillCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Creer un skill"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Skills', href: paths.dashboard.skill.list },
          { name: 'Nouveau' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <SkillCreateEditForm />
    </DashboardContent>
  );
}
