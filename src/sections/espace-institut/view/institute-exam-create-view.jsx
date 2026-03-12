'use client';

import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useGetAssessment } from 'src/actions/assessment';

import { ExamCreateEditForm } from 'src/sections/exam/exam-create-edit-form';

// ----------------------------------------------------------------------

export function InstituteExamCreateView() {
  const { id: assessmentId } = useParams();
  const { assessment, assessmentLoading } = useGetAssessment(assessmentId);

  if (assessmentLoading) {
    return <LoadingScreen />;
  }

  const assessmentIri = `/api/assessments/${assessmentId}`;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Creer un exam"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Espace Institut' },
          { name: 'Assessments', href: paths.dashboard.espaceInstitut.assessments },
          { name: assessment?.label || '', href: paths.dashboard.espaceInstitut.assessmentView(assessmentId) },
          { name: 'Nouvel exam' },
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
