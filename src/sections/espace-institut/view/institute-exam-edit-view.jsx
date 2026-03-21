'use client';

import { useState, useEffect } from 'react';

import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hooks';

import axios from 'src/lib/axios';

import { DashboardContent } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useCurrentInstitute } from 'src/auth/hooks';

import { useGetAssessment } from 'src/actions/assessment';
import { useGetExam } from 'src/actions/exam';

import { ExamCreateEditForm } from 'src/sections/exam/exam-create-edit-form';

// ----------------------------------------------------------------------

export function InstituteExamEditView() {
  const params = useParams();
  const assessmentId = params.id;
  const examId = params.examId;
  const currentInstitute = useCurrentInstitute();

  const { assessment, assessmentLoading } = useGetAssessment(assessmentId);
  const { exam, examLoading } = useGetExam(examId);

  const [resolvedExam, setResolvedExam] = useState(null);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!exam) return;

    const skills = exam.skills;

    if (!Array.isArray(skills) || skills.length === 0 || typeof skills[0] !== 'string') {
      setResolvedExam(exam);
      return;
    }

    let cancelled = false;
    setResolving(true);

    Promise.all(skills.map((iri) => axios.get(iri).then((res) => res.data)))
      .then((resolved) => {
        if (!cancelled) setResolvedExam({ ...exam, skills: resolved });
      })
      .catch(() => {
        if (!cancelled) setResolvedExam(exam);
      })
      .finally(() => {
        if (!cancelled) setResolving(false);
      });

    return () => { cancelled = true; };
  }, [exam]);

  if (assessmentLoading || examLoading || resolving || !resolvedExam) {
    return <LoadingScreen />;
  }

  const assessmentIri = `/api/assessments/${assessmentId}`;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Modifier l'exam"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: currentInstitute?.label || 'Institut' },
          { name: 'Assessments', href: paths.dashboard.espaceInstitut.assessments },
          { name: assessment?.label || '', href: paths.dashboard.espaceInstitut.assessmentView(assessmentId) },
          { name: resolvedExam?.label || '' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ExamCreateEditForm
        currentExam={resolvedExam}
        fixedAssessmentIri={assessmentIri}
        redirectPath={paths.dashboard.espaceInstitut.exams(assessmentId)}
      />
    </DashboardContent>
  );
}
