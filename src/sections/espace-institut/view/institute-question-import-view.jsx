'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useCurrentInstitute } from 'src/auth/hooks';

import { QuestionImportForm } from '../question-import-form';

// ----------------------------------------------------------------------

export function InstituteQuestionImportView() {
  const currentInstitute = useCurrentInstitute();

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Import de questions"
        links={[
          { name: 'Tableau de bord', href: paths.dashboard.root },
          { name: currentInstitute?.label || 'Institut' },
          { name: 'Banque de questions', href: paths.dashboard.espaceInstitut.questions },
          { name: 'Import' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <QuestionImportForm />
    </DashboardContent>
  );
}
