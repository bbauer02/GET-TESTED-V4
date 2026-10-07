'use client';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Collapse from '@mui/material/Collapse';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import Autocomplete from '@mui/material/Autocomplete';

import { paths } from 'src/routes/paths';
import { useParams, useSearchParams } from 'src/routes/hooks';

import axios from 'src/lib/axios';
import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { useGetAssessment } from 'src/actions/assessment';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useCurrentInstitute } from 'src/auth/hooks';

import { AssessmentExamList } from '../assessment-exam-list';
import { AssessmentQuestionBank } from '../assessment-question-bank';

// ----------------------------------------------------------------------

// TABS is defined inside the component to use translations

// ----------------------------------------------------------------------

function matchesInstitute(ownership, instituteId) {
  const inst = ownership?.institute;
  if (inst?.id === instituteId) return true;
  const iri = inst?.['@id'] || '';
  return iri === `/api/institutes/${instituteId}` || iri.endsWith(`/${instituteId}`);
}

function getOwnerLabel(assessment, tFn) {
  if (assessment?.internal) return tFn('platform');
  const owner = (assessment?.ownerships || []).find((o) => o.ownershipType === 'OWNER');
  return owner?.institute?.label || '-';
}

function getRelationType(assessment, instituteId, tFn) {
  if (assessment?.internal) return { label: tFn('internal'), color: 'info' };

  const ownerships = assessment?.ownerships || [];
  const match = ownerships.find((o) => matchesInstitute(o, instituteId));

  if (!match) return { label: '-', color: 'default' };
  if (match.ownershipType === 'OWNER') return { label: tFn('owner_relation'), color: 'success' };
  if (match.ownershipType === 'BUYER') return { label: tFn('license'), color: 'warning' };
  return { label: match.ownershipType, color: 'default' };
}

function isOwner(assessment, instituteId) {
  const ownerships = assessment?.ownerships || [];
  return ownerships.some(
    (o) => o.ownershipType === 'OWNER' && matchesInstitute(o, instituteId)
  );
}

function getSkillIri(skill) {
  return skill?.['@id'] || `/api/skills/${skill?.id}`;
}

// Build a tree structure from flat skills list
function buildSkillTree(skills) {
  const map = {};
  const roots = [];

  skills.forEach((s) => {
    map[getSkillIri(s)] = { ...s, children: [] };
  });

  skills.forEach((s) => {
    const parentIri =
      typeof s.parent === 'string'
        ? s.parent
        : s.parent?.['@id'] || (s.parent ? `/api/skills/${s.parent.id}` : null);

    if (parentIri && map[parentIri]) {
      map[parentIri].children.push(map[getSkillIri(s)]);
    } else {
      roots.push(map[getSkillIri(s)]);
    }
  });

  return roots;
}

// ----------------------------------------------------------------------

export function InstituteAssessmentDetailsView() {
  const { t } = useTranslate('institute_space');
  const { id } = useParams();
  const currentInstitute = useCurrentInstitute();

  const TABS = [
    { value: 'informations', label: t('tab_information'), icon: 'solar:info-circle-bold' },
    { value: 'examens', label: t('tab_exams'), icon: 'solar:document-bold' },
    { value: 'questions', label: t('tab_questions'), icon: 'solar:question-circle-bold' },
  ];
  const { assessment, assessmentLoading } = useGetAssessment(id);

  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const validTabs = ['informations', 'examens', 'questions'];
  const initialTab = validTabs.includes(tabFromUrl) ? tabFromUrl : 'informations';

  const [currentTab, setCurrentTab] = useState(initialTab);

  const [resolvedLevels, setResolvedLevels] = useState([]);
  const [parentAssessment, setParentAssessment] = useState(null);
  const [parentLevels, setParentLevels] = useState([]);

  // Skills
  const [resolvedSkills, setResolvedSkills] = useState([]);
  const [skillsLoading, setSkillsLoading] = useState(false);

  // Skill creation form
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [newSkillLabel, setNewSkillLabel] = useState('');
  const [newSkillDescription, setNewSkillDescription] = useState('');
  const [newSkillParent, setNewSkillParent] = useState(null);
  const [creatingSkill, setCreatingSkill] = useState(false);

  const assessmentIri = `/api/assessments/${id}`;

  // Resolve levels (may be IRIs or objects)
  useEffect(() => {
    if (!assessment?.levels) return;

    const levels = assessment.levels;
    if (levels.length === 0) {
      setResolvedLevels([]);
      return;
    }

    if (typeof levels[0] === 'string') {
      Promise.all(levels.map((iri) => axios.get(iri).then((r) => r.data))).then(setResolvedLevels);
    } else {
      setResolvedLevels(levels);
    }
  }, [assessment?.levels]);

  // Resolve parent assessment and its levels
  useEffect(() => {
    if (!assessment?.parent) {
      setParentAssessment(null);
      setParentLevels([]);
      return;
    }

    const parentIri =
      typeof assessment.parent === 'string'
        ? assessment.parent
        : assessment.parent['@id'] || `/api/assessments/${assessment.parent.id}`;

    axios
      .get(parentIri)
      .then((res) => {
        setParentAssessment(res.data);
        const levels = res.data?.levels || [];
        if (levels.length === 0) {
          setParentLevels([]);
        } else if (typeof levels[0] === 'string') {
          Promise.all(levels.map((iri) => axios.get(iri).then((r) => r.data))).then(
            setParentLevels
          );
        } else {
          setParentLevels(levels);
        }
      })
      .catch(() => {
        setParentAssessment(null);
        setParentLevels([]);
      });
  }, [assessment?.parent]);

  // Fetch and resolve skills
  const fetchSkills = useCallback(() => {
    if (!id) return;

    setSkillsLoading(true);

    axios
      .get(`${assessmentIri}/skills`)
      .then(async (res) => {
        const data = res.data;
        const items = data?.member ?? data?.['hydra:member'] ?? (Array.isArray(data) ? data : []);

        // Resolve parent IRIs if needed
        const resolved = await Promise.all(
          items.map(async (s) => {
            if (s.parent && typeof s.parent === 'string') {
              try {
                const parentRes = await axios.get(s.parent);
                return { ...s, parent: parentRes.data };
              } catch {
                return s;
              }
            }
            return s;
          })
        );

        setResolvedSkills(resolved);
      })
      .catch(() => setResolvedSkills([]))
      .finally(() => setSkillsLoading(false));
  }, [id, assessmentIri]);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  // Create skill handler
  const handleCreateSkill = async () => {
    if (!newSkillLabel.trim()) {
      toast.error(t('skill_label_required'));
      return;
    }

    setCreatingSkill(true);
    try {
      const payload = {
        label: newSkillLabel.trim(),
        description: newSkillDescription.trim() || null,
      };

      if (newSkillParent) {
        payload.parent = getSkillIri(newSkillParent);
      }

      await axios.post(`${assessmentIri}/skills`, payload);

      toast.success(t('skill_created'));
      setNewSkillLabel('');
      setNewSkillDescription('');
      setNewSkillParent(null);
      setShowSkillForm(false);

      // Refresh skills
      fetchSkills();
    } catch (error) {
      toast.error(error?.message || t('skill_creation_error'));
    } finally {
      setCreatingSkill(false);
    }
  };

  if (assessmentLoading) {
    return <LoadingScreen />;
  }

  if (!assessment) {
    return null;
  }

  // ------ Render sections ------

  const canEdit = isOwner(assessment, currentInstitute?.id);

  const renderInfo = () => (
    <>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        {t('assessment_info')}
      </Typography>

      <Box
        sx={{
          rowGap: 2,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
        }}
      >
        <Stack spacing={0.5}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {t('label')}
          </Typography>
          <Typography variant="body2">{assessment.label}</Typography>
        </Stack>

        <Stack spacing={0.5}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {t('reference')}
          </Typography>
          <Typography variant="body2">{assessment.ref || '-'}</Typography>
        </Stack>

        <Stack spacing={0.5}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {t('owner')}
          </Typography>
          <Typography variant="body2">{getOwnerLabel(assessment, t)}</Typography>
        </Stack>

        <Stack spacing={0.5}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {t('relation')}
          </Typography>
          <Label
            variant="soft"
            color={getRelationType(assessment, currentInstitute?.id, t).color}
            sx={{ alignSelf: 'flex-start' }}
          >
            {getRelationType(assessment, currentInstitute?.id, t).label}
          </Label>
        </Stack>

        {parentAssessment && (
          <Stack spacing={0.5}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t('parent_assessment')}
            </Typography>
            <Typography variant="body2">{parentAssessment.label}</Typography>
          </Stack>
        )}
      </Box>
    </>
  );

  const renderParentLevels = () => {
    if (!parentAssessment || parentLevels.length === 0) return null;

    return (
      <>
        <Divider sx={{ my: 3, borderStyle: 'dashed' }} />

        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          {t('inherited_levels', { label: parentAssessment.label })}
        </Typography>

        <Stack spacing={2}>
          {parentLevels.map((level) => (
            <Box
              key={level.id || level['@id']}
              sx={{ p: 2, borderRadius: 1, bgcolor: 'action.hover' }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="subtitle2">{level.label}</Typography>
                <Chip label={level.ref} size="small" variant="outlined" />
              </Stack>

              {level.description && (
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                  {level.description}
                </Typography>
              )}
            </Box>
          ))}
        </Stack>
      </>
    );
  };

  const renderLevels = () => {
    if (resolvedLevels.length === 0) return null;

    return (
      <>
        <Divider sx={{ my: 3, borderStyle: 'dashed' }} />

        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          {t('own_levels')}
        </Typography>

        <Stack spacing={2}>
          {resolvedLevels.map((level) => (
            <Box
              key={level.id || level['@id']}
              sx={{ p: 2, borderRadius: 1, bgcolor: 'action.hover' }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="subtitle2">{level.label}</Typography>
                <Chip label={level.ref} size="small" variant="outlined" />
              </Stack>

              {level.description && (
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                  {level.description}
                </Typography>
              )}
            </Box>
          ))}
        </Stack>
      </>
    );
  };

  // Recursive skill tree renderer
  const renderSkillNode = (skill, depth = 0) => (
    <Box key={skill.id || skill['@id']}>
      <Box
        sx={{
          p: 2,
          ml: depth * 4,
          borderRadius: 1,
          bgcolor: depth === 0 ? 'action.hover' : 'background.neutral',
          borderLeft: depth > 0 ? '3px solid' : 'none',
          borderColor: 'primary.main',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          {depth > 0 && (
            <Iconify icon="eva:corner-down-right-fill" width={16} sx={{ color: 'text.disabled' }} />
          )}
          <Typography variant="subtitle2">{skill.label}</Typography>
        </Stack>

        {skill.description && (
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, ml: depth > 0 ? 3 : 0 }}>
            {skill.description}
          </Typography>
        )}
      </Box>

      {skill.children?.length > 0 && (
        <Stack spacing={1} sx={{ mt: 1 }}>
          {skill.children.map((child) => renderSkillNode(child, depth + 1))}
        </Stack>
      )}
    </Box>
  );

  const renderSkills = () => {
    const skillTree = buildSkillTree(resolvedSkills);

    return (
      <>
        <Divider sx={{ my: 3, borderStyle: 'dashed' }} />

        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="subtitle1">
            {t('skills_count', { count: resolvedSkills.length })}
          </Typography>

          {canEdit && (
            <Button
              size="small"
              color="primary"
              startIcon={<Iconify icon={showSkillForm ? 'mingcute:close-line' : 'mingcute:add-line'} />}
              onClick={() => setShowSkillForm(!showSkillForm)}
            >
              {showSkillForm ? t('cancel') : t('add_skill')}
            </Button>
          )}
        </Stack>

        {/* Skill creation form */}
        <Collapse in={showSkillForm}>
          <Card variant="outlined" sx={{ p: 2.5, mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              {t('new_skill')}
            </Typography>

            <Stack spacing={2}>
              <TextField
                label="Label *"
                value={newSkillLabel}
                onChange={(e) => setNewSkillLabel(e.target.value)}
                size="small"
                fullWidth
              />

              <TextField
                label="Description"
                value={newSkillDescription}
                onChange={(e) => setNewSkillDescription(e.target.value)}
                size="small"
                fullWidth
                multiline
                rows={2}
              />

              {resolvedSkills.length > 0 && (
                <Autocomplete
                  value={newSkillParent}
                  onChange={(_, value) => setNewSkillParent(value)}
                  options={resolvedSkills}
                  getOptionLabel={(option) => option?.label || ''}
                  isOptionEqualToValue={(option, value) =>
                    (option?.id || option?.['@id']) === (value?.id || value?.['@id'])
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Competence parente (optionnel)" size="small" />
                  )}
                  size="small"
                />
              )}

              <Stack direction="row" justifyContent="flex-end">
                <LoadingButton
                  variant="contained"
                  size="small"
                  loading={creatingSkill}
                  onClick={handleCreateSkill}
                >
                  {t('create_skill')}
                </LoadingButton>
              </Stack>
            </Stack>
          </Card>
        </Collapse>

        {/* Skills list */}
        {skillsLoading ? (
          <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 2 }}>
            {t('loading')}
          </Typography>
        ) : resolvedSkills.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 2 }}>
            {t('no_skills')}
          </Typography>
        ) : (
          <Stack spacing={1}>
            {skillTree.map((skill) => renderSkillNode(skill))}
          </Stack>
        )}
      </>
    );
  };

  const renderTabInformations = () => (
    <Card sx={{ p: 3 }}>
      {renderInfo()}
      {renderParentLevels()}
      {renderLevels()}
      {renderSkills()}
    </Card>
  );

  const renderTabExamens = () => (
    <AssessmentExamList assessmentId={id} canEdit={canEdit} />
  );

  const renderTabQuestions = () => (
    <AssessmentQuestionBank
      assessmentId={id}
      assessmentLevels={resolvedLevels}
    />
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={assessment.label}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: currentInstitute?.label || 'Institut' },
          { name: t('assessments'), href: paths.dashboard.espaceInstitut.assessments },
          { name: assessment.label },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Tabs
        value={currentTab}
        onChange={(_, value) => setCurrentTab(value)}
        sx={{ mb: 3 }}
      >
        {TABS.map((tab) => (
          <Tab
            key={tab.value}
            value={tab.value}
            label={tab.label}
            icon={<Iconify icon={tab.icon} />}
            iconPosition="start"
          />
        ))}
      </Tabs>

      {currentTab === 'informations' && renderTabInformations()}
      {currentTab === 'examens' && renderTabExamens()}
      {currentTab === 'questions' && renderTabQuestions()}
    </DashboardContent>
  );
}
