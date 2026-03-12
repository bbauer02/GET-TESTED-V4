'use client';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import Tooltip from '@mui/material/Tooltip';
import LoadingButton from '@mui/lab/LoadingButton';

import axios from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';
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
  const assessmentIri = `/api/assessments/${assessmentId}`;

  const [resolvedSkills, setResolvedSkills] = useState([]);
  const [skillsLoading, setSkillsLoading] = useState(false);

  // Skill creation form
  const [showForm, setShowForm] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newParent, setNewParent] = useState(null);
  const [creating, setCreating] = useState(false);

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
      toast.error('Le label est requis.');
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

      toast.success('Compétence créée !');
      setNewLabel('');
      setNewDescription('');
      setNewParent(null);
      setShowForm(false);
      fetchSkills();
    } catch (error) {
      toast.error(error?.message || 'Erreur lors de la création.');
    } finally {
      setCreating(false);
    }
  };

  // Delete skill
  const handleDelete = async (skillId) => {
    try {
      await axios.delete(`/api/skills/${skillId}`);
      toast.success('Compétence supprimée');
      fetchSkills();
    } catch (error) {
      toast.error(error?.message || 'Erreur lors de la suppression.');
    }
  };

  // Render skill node recursively
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
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1} sx={{ flexGrow: 1 }}>
            {depth > 0 && (
              <Iconify icon="eva:corner-down-right-fill" width={16} sx={{ color: 'text.disabled' }} />
            )}
            <Typography variant="subtitle2">{skill.label}</Typography>
          </Stack>

          {canEdit && (
            <Tooltip title="Supprimer">
              <IconButton size="small" color="error" onClick={() => handleDelete(skill.id)}>
                <Iconify icon="solar:trash-bin-trash-bold" width={18} />
              </IconButton>
            </Tooltip>
          )}
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

  const skillTree = buildSkillTree(resolvedSkills);

  return (
    <Card sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h6">
          Compétences ({resolvedSkills.length})
        </Typography>

        {canEdit && (
          <Button
            size="small"
            color="primary"
            variant={showForm ? 'outlined' : 'contained'}
            startIcon={<Iconify icon={showForm ? 'mingcute:close-line' : 'mingcute:add-line'} />}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Annuler' : 'Ajouter'}
          </Button>
        )}
      </Stack>

      {/* Creation form */}
      <Collapse in={showForm}>
        <Card variant="outlined" sx={{ p: 2.5, mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Nouvelle compétence
          </Typography>

          <Stack spacing={2}>
            <TextField
              label="Label *"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              size="small"
              fullWidth
            />

            <TextField
              label="Description"
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
                  <TextField {...params} label="Compétence parente (optionnel)" size="small" />
                )}
                size="small"
              />
            )}

            <Stack direction="row" justifyContent="flex-end">
              <LoadingButton variant="contained" size="small" loading={creating} onClick={handleCreate}>
                Créer la compétence
              </LoadingButton>
            </Stack>
          </Stack>
        </Card>
      </Collapse>

      {/* Skills tree */}
      {skillsLoading ? (
        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 2 }}>
          Chargement...
        </Typography>
      ) : resolvedSkills.length === 0 ? (
        <EmptyContent title="Aucune compétence" description={canEdit ? 'Ajoutez-en une pour commencer.' : undefined} />
      ) : (
        <Stack spacing={1}>
          {skillTree.map((skill) => renderSkillNode(skill))}
        </Stack>
      )}
    </Card>
  );
}
