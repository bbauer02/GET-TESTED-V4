'use client';

import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';
import { useGetAssessment } from 'src/actions/assessment';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ExamCreateEditForm } from 'src/sections/exam/exam-create-edit-form';

import { useCurrentInstitute } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export function InstituteExamCreateView() {
  const { id: assessmentId } = useParams();
  const currentInstitute = useCurrentInstitute();
  const { assessment, assessmentLoading } = useGetAssessment(assessmentId);

  if (assessmentLoading) {
    return <LoadingScreen />;
  }

  const assessmentIri = `/api/assessments/${assessmentId}`;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Créer une épreuve"
        links={[
          { name: 'Tableau de bord', href: paths.dashboard.root },
          { name: currentInstitute?.label || 'Institut' },
          { name: 'Tests', href: paths.dashboard.espaceInstitut.assessments },
          { name: assessment?.label || '', href: paths.dashboard.espaceInstitut.assessmentView(assessmentId) },
          { name: 'Nouvelle épreuve' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ExamCreateEditForm
        fixedAssessmentIri={assessmentIri}
        redirectPath={paths.dashboard.espaceInstitut.exams(assessmentId)}
      />
    </DashboardContent>
  );
}
