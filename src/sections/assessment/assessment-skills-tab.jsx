'use client';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Collapse from '@mui/material/Collapse';
import TextField from '@mui/material/TextField';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import Autocomplete from '@mui/material/Autocomplete';

import axios from 'src/lib/axios';
import { useTranslate } from 'src/locales';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';

// ----------------------------------------------------------------------

function getSkillIri(skill) {
  return skill?.['@id'] || `/api/skills/${skill?.id}`;
}

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

export function AssessmentSkillsTab({ assessmentId, canEdit }) {
  const { t } = useTranslate('assessment');
  const assessmentIri = `/api/assessments/${assessmentId}`;

  const [resolvedSkills, setResolvedSkills] = useState([]);
  const [skillsLoading, setSkillsLoading] = useState(false);

  // Skill creation form
  const [showForm, setShowForm] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newParent, setNewParent] = useState(null);
  const [creating, setCreating] = useState(false);

  // Cascade selection (3-column miller view)
  const [selectedRootIri, setSelectedRootIri] = useState(null);
  const [selectedSubIri, setSelectedSubIri] = useState(null);

  // Fetch skills
  const fetchSkills = useCallback(() => {
    if (!assessmentId) return;

    setSkillsLoading(true);
    axios
      .get(`${assessmentIri}/skills`)
      .then(async (res) => {
        const data = res.data;
        const items = data?.['hydra:member'] ?? data?.member ?? (Array.isArray(data) ? data : []);

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
  }, [assessmentId, assessmentIri]);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  // Create skill
  const handleCreate = async () => {
    if (!newLabel.trim()) {
      toast.error(t('skills_label_required_error'));
      return;
    }

    setCreating(true);
    try {
      const payload = {
        label: newLabel.trim(),
        description: newDescription.trim() || null,
      };
      if (newParent) {
        payload.parent = getSkillIri(newParent);
      }

      await axios.post(`${assessmentIri}/skills`, payload);

      toast.success(t('skills_create_success'));
      setNewLabel('');
      setNewDescription('');
      setNewParent(null);
      setShowForm(false);
      fetchSkills();
    } catch (error) {
      toast.error(error?.message || t('skills_create_error'));
    } finally {
      setCreating(false);
    }
  };

  // Delete skill
  const handleDelete = async (skillId) => {
    try {
      await axios.delete(`/api/skills/${skillId}`);
      toast.success(t('skills_delete_success'));
      fetchSkills();
    } catch (error) {
      toast.error(error?.message || t('skills_delete_error'));
    }
  };

  // Open the creation form with a preset parent (from a column "add" action)
  const openCreateForm = (parent) => {
    setNewParent(parent || null);
    setNewLabel('');
    setNewDescription('');
    setShowForm(true);
  };

  // Render one cascade column
  const renderColumn = ({ title, items, selectedIri, onSelect, drillable, disabled, addParent, emptyHint }) => (
    <Card variant="outlined" sx={{ display: 'flex', flexDirection: 'column', minHeight: 220 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2, py: 1.5, borderBottom: '1px dashed', borderColor: 'divider' }}
      >
        <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
          {title} {!disabled && items.length > 0 && `(${items.length})`}
        </Typography>

        {canEdit && !disabled && (
          <Tooltip title={t('skills_add')}>
            <IconButton size="small" color="primary" onClick={() => openCreateForm(addParent)}>
              <Iconify icon="mingcute:add-line" width={18} />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      <Box sx={{ flexGrow: 1, p: 1 }}>
        {disabled ? (
          <Typography
            variant="caption"
            sx={{ color: 'text.disabled', display: 'block', textAlign: 'center', py: 4, px: 1 }}
          >
            {emptyHint}
          </Typography>
        ) : items.length === 0 ? (
          <Typography
            variant="caption"
            sx={{ color: 'text.disabled', display: 'block', textAlign: 'center', py: 4, px: 1 }}
          >
            {t('skills_empty_column')}
          </Typography>
        ) : (
          <Stack spacing={0.5}>
            {items.map((skill) => {
              const iri = getSkillIri(skill);
              const isSelected = iri === selectedIri;
              const hasChildren = skill.children?.length > 0;
              return (
                <Stack
                  key={iri}
                  direction="row"
                  alignItems="center"
                  sx={{
                    borderRadius: 1,
                    bgcolor: isSelected ? 'action.selected' : 'transparent',
                    '&:hover': { bgcolor: isSelected ? 'action.selected' : 'action.hover' },
                  }}
                >
                  <ButtonBase
                    onClick={onSelect ? () => onSelect(iri) : undefined}
                    sx={{
                      flexGrow: 1,
                      justifyContent: 'space-between',
                      px: 1.5,
                      py: 1,
                      borderRadius: 1,
                      cursor: onSelect ? 'pointer' : 'default',
                    }}
                  >
                    <Stack sx={{ minWidth: 0, textAlign: 'left' }}>
                      <Typography variant="body2" noWrap sx={{ fontWeight: isSelected ? 'fontWeightSemiBold' : 'fontWeightMedium' }}>
                        {skill.label}
                      </Typography>
                      {skill.description && (
                        <Typography variant="caption" noWrap sx={{ color: 'text.secondary' }}>
                          {skill.description}
                        </Typography>
                      )}
                    </Stack>

                    {drillable && hasChildren && (
                      <Iconify icon="eva:chevron-right-fill" width={18} sx={{ color: 'text.disabled', flexShrink: 0 }} />
                    )}
                  </ButtonBase>

                  {canEdit && (
                    <Tooltip title={t('skills_delete_tooltip')}>
                      <IconButton
                        size="small"
                        color="error"
                        sx={{ mr: 0.5 }}
                        onClick={() => handleDelete(skill.id || iri.split('/').pop())}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              );
            })}
          </Stack>
        )}
      </Box>
    </Card>
  );

  const skillTree = buildSkillTree(resolvedSkills);
  const selectedRoot = skillTree.find((s) => getSkillIri(s) === selectedRootIri) || null;
  const subSkills = selectedRoot?.children || [];
  const selectedSub = subSkills.find((s) => getSkillIri(s) === selectedSubIri) || null;
  const subSubSkills = selectedSub?.children || [];

  return (
    <Card sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h6">
          {t('skills_title')} ({resolvedSkills.length})
        </Typography>

        {canEdit && (
          <Button
            size="small"
            color="primary"
            variant={showForm ? 'outlined' : 'contained'}
            startIcon={<Iconify icon={showForm ? 'mingcute:close-line' : 'mingcute:add-line'} />}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? t('skills_cancel') : t('skills_add')}
          </Button>
        )}
      </Stack>

      {/* Creation form */}
      <Collapse in={showForm}>
        <Card variant="outlined" sx={{ p: 2.5, mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            {t('skills_new')}
          </Typography>

          <Stack spacing={2}>
            <TextField
              label={t('skills_label_required')}
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              size="small"
              fullWidth
            />

            <TextField
              label={t('skills_label_description')}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              size="small"
              fullWidth
              multiline
              rows={2}
            />

            {resolvedSkills.length > 0 && (
              <Autocomplete
                value={newParent}
                onChange={(_, value) => setNewParent(value)}
                options={resolvedSkills}
                getOptionLabel={(option) => option?.label || ''}
                isOptionEqualToValue={(option, value) =>
                  (option?.id || option?.['@id']) === (value?.id || value?.['@id'])
                }
                renderInput={(params) => (
                  <TextField {...params} label={t('skills_parent_label')} size="small" />
                )}
                size="small"
              />
            )}

            <Stack direction="row" justifyContent="flex-end">
              <LoadingButton variant="contained" size="small" loading={creating} onClick={handleCreate}>
                {t('skills_create_button')}
              </LoadingButton>
            </Stack>
          </Stack>
        </Card>
      </Collapse>

      {/* Skills cascade (3 columns) */}
      {skillsLoading ? (
        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 2 }}>
          {t('skills_loading')}
        </Typography>
      ) : resolvedSkills.length === 0 ? (
        <EmptyContent title={t('skills_empty_title')} description={canEdit ? t('skills_empty_description') : undefined} />
      ) : (
        <Box
          sx={{
            gap: 2,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          }}
        >
          {renderColumn({
            title: t('skills_col_competence'),
            items: skillTree,
            selectedIri: selectedRootIri,
            onSelect: (iri) => {
              setSelectedRootIri(iri);
              setSelectedSubIri(null);
            },
            drillable: true,
            addParent: null,
          })}

          {renderColumn({
            title: t('skills_col_subcompetence'),
            items: subSkills,
            selectedIri: selectedSubIri,
            onSelect: (iri) => setSelectedSubIri(iri),
            drillable: true,
            disabled: !selectedRoot,
            addParent: selectedRoot,
            emptyHint: t('skills_select_competence'),
          })}

          {renderColumn({
            title: t('skills_col_subsubcompetence'),
            items: subSubSkills,
            selectedIri: null,
            onSelect: undefined,
            drillable: false,
            disabled: !selectedSub,
            addParent: selectedSub,
            emptyHint: t('skills_select_subcompetence'),
          })}
        </Box>
      )}
    </Card>
  );
}
