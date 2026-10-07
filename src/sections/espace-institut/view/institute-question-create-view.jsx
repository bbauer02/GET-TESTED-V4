'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { QuestionCreateEditForm } from '../question-create-edit-form';

// ----------------------------------------------------------------------

export function InstituteQuestionCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Nouvelle question"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Espace Institut', href: paths.dashboard.espaceInstitut.root },
          { name: 'Banque de questions', href: paths.dashboard.espaceInstitut.questions },
          { name: 'Nouvelle question' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <QuestionCreateEditForm />
    </DashboardContent>
  );
}
