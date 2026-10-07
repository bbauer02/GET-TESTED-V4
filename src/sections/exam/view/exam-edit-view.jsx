'use client';

import { useState, useEffect } from 'react';

import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hooks';

import axios from 'src/lib/axios';
import { useTranslate } from 'src/locales';
import { useGetExam } from 'src/actions/exam';
import { DashboardContent } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ExamCreateEditForm } from '../exam-create-edit-form';

// ----------------------------------------------------------------------

export function ExamEditView() {
  const { t } = useTranslate('exam');
  const { id } = useParams();

  const { exam, examLoading } = useGetExam(id);

  const [resolvedExam, setResolvedExam] = useState(null);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!exam) return undefined;

    const skills = exam.skills;

    if (!Array.isArray(skills) || skills.length === 0 || typeof skills[0] !== 'string') {
      setResolvedExam(exam);
      return undefined;
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

  if (examLoading || resolving || !resolvedExam) {
    return <LoadingScreen />;
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('heading_edit')}
        links={[
          { name: t('dashboard'), href: paths.dashboard.root },
          { name: t('heading'), href: paths.dashboard.exam.list },
          { name: resolvedExam?.label || '' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ExamCreateEditForm currentExam={resolvedExam} />
    </DashboardContent>
  );
}
