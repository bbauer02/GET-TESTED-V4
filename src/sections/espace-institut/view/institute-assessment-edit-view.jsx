'use client';

import { useState, useEffect } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hooks';

import axios from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';
import { useGetAssessment } from 'src/actions/assessment';

import { Iconify } from 'src/components/iconify';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { AssessmentSkillsTab } from 'src/sections/assessment/assessment-skills-tab';
import { AssessmentCreateEditForm } from 'src/sections/assessment/assessment-create-edit-form';

import { useCurrentInstitute } from 'src/auth/hooks';

// ----------------------------------------------------------------------

const TABS = [
  { value: 'general', label: 'Général', icon: 'solar:document-bold' },
  { value: 'skills', label: 'Compétences', icon: 'solar:star-bold' },
];

// ----------------------------------------------------------------------

export function InstituteAssessmentEditView() {
  const { id } = useParams();
  const currentInstitute = useCurrentInstitute();
  const { assessment, assessmentLoading } = useGetAssessment(id);

  const [currentTab, setCurrentTab] = useState('general');
  const [resolvedAssessment, setResolvedAssessment] = useState(null);
  const [resolvingLevels, setResolvingLevels] = useState(false);

  useEffect(() => {
    if (!assessment) return undefined;

    const levels = assessment.levels;

    // No levels or already embedded objects → nothing to resolve
    if (!Array.isArray(levels) || levels.length === 0 || typeof levels[0] !== 'string') {
      setResolvedAssessment(assessment);
      return undefined;
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

  if (assessmentLoading || resolvingLevels || !resolvedAssessment || !currentInstitute) {
    return <LoadingScreen />;
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Modifier le test"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: currentInstitute?.label || 'Institut' },
          { name: 'Tests', href: paths.dashboard.espaceInstitut.assessments },
          { name: resolvedAssessment?.label || '' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Tabs value={currentTab} onChange={(_, value) => setCurrentTab(value)} sx={{ mb: 3 }}>
        {TABS.map((tab) => (
          <Tab
            key={tab.value}
            value={tab.value}
            label={tab.label}
            icon={<Iconify icon={tab.icon} width={20} />}
            iconPosition="start"
          />
        ))}
      </Tabs>

      {currentTab === 'general' && (
        <AssessmentCreateEditForm currentAssessment={resolvedAssessment} instituteId={currentInstitute.id} />
      )}

      {currentTab === 'skills' && (
        <AssessmentSkillsTab assessmentId={id} canEdit />
      )}
    </DashboardContent>
  );
}
