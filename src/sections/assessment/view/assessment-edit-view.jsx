'use client';

import { useState, useEffect } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hooks';

import axios from 'src/lib/axios';
import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { useGetAssessment } from 'src/actions/assessment';

import { Iconify } from 'src/components/iconify';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { AssessmentSkillsTab } from '../assessment-skills-tab';
import { AssessmentCreateEditForm } from '../assessment-create-edit-form';

// ----------------------------------------------------------------------

export function AssessmentEditView() {
  const { t } = useTranslate('assessment');
  const { id } = useParams();

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

  if (assessmentLoading || resolvingLevels || !resolvedAssessment) {
    return <LoadingScreen />;
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('heading_edit')}
        links={[
          { name: t('dashboard'), href: paths.dashboard.root },
          { name: t('heading'), href: paths.dashboard.assessment.list },
          { name: resolvedAssessment?.label || '' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Tabs value={currentTab} onChange={(_, value) => setCurrentTab(value)} sx={{ mb: 3 }}>
        <Tab
          value="general"
          iconPosition="start"
          icon={<Iconify icon="solar:document-bold" width={20} />}
          label={t('tab_general')}
        />
        <Tab
          value="skills"
          iconPosition="start"
          icon={<Iconify icon="solar:star-bold" width={20} />}
          label={t('skills_title')}
        />
      </Tabs>

      {currentTab === 'general' && (
        <AssessmentCreateEditForm currentAssessment={resolvedAssessment} />
      )}

      {currentTab === 'skills' && <AssessmentSkillsTab assessmentId={id} canEdit />}
    </DashboardContent>
  );
}
