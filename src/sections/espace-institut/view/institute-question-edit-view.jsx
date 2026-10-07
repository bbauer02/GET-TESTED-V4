'use client';

import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hooks';

import { useGetQuestion } from 'src/actions/questions';
import { DashboardContent } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { QuestionCreateEditForm } from '../question-create-edit-form';

// ----------------------------------------------------------------------

export function InstituteQuestionEditView() {
  const { id } = useParams();
  const { question, questionLoading } = useGetQuestion(id);

  if (questionLoading) return <LoadingScreen />;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Modifier la question"
        links={[
          { name: 'Tableau de bord', href: paths.dashboard.root },
          { name: 'Espace Institut', href: paths.dashboard.espaceInstitut.root },
          { name: 'Banque de questions', href: paths.dashboard.espaceInstitut.questions },
          { name: question?.label || '...' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <QuestionCreateEditForm currentQuestion={question} />
    </DashboardContent>
  );
}
