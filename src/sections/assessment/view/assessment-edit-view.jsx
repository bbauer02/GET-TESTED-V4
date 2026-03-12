'use client';

import { useState, useEffect } from 'react';

import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hooks';

import axios from 'src/lib/axios';

import { DashboardContent } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useGetAssessment } from 'src/actions/assessment';

import { AssessmentCreateEditForm } from '../assessment-create-edit-form';

// ----------------------------------------------------------------------

export function AssessmentEditView() {
  const { id } = useParams();

  const { assessment, assessmentLoading } = useGetAssessment(id);

  const [resolvedAssessment, setResolvedAssessment] = useState(null);
  const [resolvingLevels, setResolvingLevels] = useState(false);

  useEffect(() => {
    if (!assessment) return;

    const levels = assessment.levels;

    // No levels or already embedded objects → nothing to resolve
    if (!Array.isArray(levels) || levels.length === 0 || typeof levels[0] !== 'string') {
      setResolvedAssessment(assessment);
      return;
    }

    // Levels are IRIs → fetch each one
    let cancelled = false;
    setResolvingLevels(true);

    Promise.all(levels.map((iri) => axios.get(iri).then((res) => res.data)))
      .then((resolvedLevels) => {
        if (!cancelled) {
          setResolvedAssessment({ ...assessment, levels: resolvedLevels });
        }
      })
      .catch((error) => {
        console.error('Failed to resolve levels:', error);
        if (!cancelled) {
          setResolvedAssessment(assessment);
        }
      })
      .finally(() => {
        if (!cancelled) setResolvingLevels(false);
      });

    return () => {
      cancelled = true;
    };
  }, [assessment]);

  if (assessmentLoading || resolvingLevels || !resolvedAssessment) {
    return <LoadingScreen />;
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Modifier l'assessment"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Assessments', href: paths.dashboard.assessment.list },
          { name: resolvedAssessment?.label || '' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <AssessmentCreateEditForm currentAssessment={resolvedAssessment} />
    </DashboardContent>
  );
}
