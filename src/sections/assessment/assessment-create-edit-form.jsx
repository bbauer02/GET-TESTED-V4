'use client';

import { z } from 'zod';
import { useMemo, useRef, useState, useEffect } from 'react';
import { mutate } from 'swr';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import axios, { endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { useGetAssessments } from 'src/actions/assessment';

// ----------------------------------------------------------------------

function getLevelIri(level) {
  return level['@id'] || (level.id ? `/api/levels/${level.id}` : '');
}

// ----------------------------------------------------------------------

const LevelSchema = z.object({
  iri: z.string().optional(),
  label: z.string().min(1, { message: 'Le label est requis !' }),
  ref: z.string().min(1, { message: 'La ref est requise !' }).max(50),
  description: z.string(),
});

const AssessmentSchema = z.object({
  label: z.string().min(1, { message: 'Le label est requis !' }),
  ref: z.string().min(1, { message: 'La ref est requise !' }).max(50),
  isInternal: z.boolean(),
  parent: z.string().nullable(),
  levels: z.array(LevelSchema),
});

// ----------------------------------------------------------------------

function mapLevelsToFormValues(levels) {
  if (!Array.isArray(levels) || levels.length === 0) {
    return [];
  }

  return levels.map((level) => ({
    iri: getLevelIri(level),
    label: level.label || '',
    ref: level.ref || '',
    description: level.description || '',
  }));
}

function getParentIri(assessment) {
  if (!assessment?.parent) return null;
  if (typeof assessment.parent === 'string') return assessment.parent;
  return assessment.parent['@id'] || `/api/assessments/${assessment.parent.id}`;
}

// ----------------------------------------------------------------------

export function AssessmentCreateEditForm({ currentAssessment, instituteId }) {
  const router = useRouter();

  const isEdit = !!currentAssessment;

  const { assessments } = useGetAssessments();

  // Filter out self from parent options
  const parentOptions = useMemo(
    () => assessments.filter((a) => a.id !== currentAssessment?.id),
    [assessments, currentAssessment?.id]
  );

  // Track original level IRIs to detect removals
  const originalLevelIris = useRef(
    (currentAssessment?.levels || []).map((l) => getLevelIri(l)).filter(Boolean)
  );

  const defaultValues = useMemo(
    () => ({
      label: currentAssessment?.label || 'Certification Francais Professionnel',
      ref: currentAssessment?.ref || 'CFP-2026',
      isInternal: currentAssessment?.internal ?? (instituteId ? false : true),
      parent: getParentIri(currentAssessment),
      levels: mapLevelsToFormValues(currentAssessment?.levels),
    }),
    [currentAssessment]
  );

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(AssessmentSchema),
    defaultValues,
  });

  const {
    control,
    watch,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'levels',
  });

  // ------ Parent levels (read-only) ------

  const watchParent = watch('parent');

  const [parentLevels, setParentLevels] = useState([]);

  useEffect(() => {
    if (!watchParent) {
      setParentLevels([]);
      return;
    }

    let cancelled = false;

    // Fetch parent assessment to get its levels
    axios
      .get(watchParent)
      .then((res) => {
        const levels = res.data?.levels;

        if (!Array.isArray(levels) || levels.length === 0) {
          if (!cancelled) setParentLevels([]);
          return;
        }

        // Levels can be IRIs or objects
        if (typeof levels[0] === 'string') {
          // Resolve IRIs
          Promise.all(levels.map((iri) => axios.get(iri).then((r) => r.data))).then(
            (resolved) => {
              if (!cancelled) setParentLevels(resolved);
            }
          );
        } else {
          if (!cancelled) setParentLevels(levels);
        }
      })
      .catch(() => {
        if (!cancelled) setParentLevels([]);
      });

    return () => {
      cancelled = true;
    };
  }, [watchParent]);

  // ------ Handlers ------

  const handleAddLevel = () => {
    append({ iri: '', label: '', ref: '', description: '' });
  };

  const handleRemoveLevel = (index) => {
    remove(index);
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      // ------ Step 1: Create or update the assessment ------

      const assessmentPayload = {
        label: data.label,
        ref: data.ref,
        isInternal: data.isInternal,
        parent: data.parent || null,
      };

      let assessmentIri;

      if (isEdit) {
        assessmentIri = `${endpoints.assessment.details}/${currentAssessment.id}`;

        // Separate unchanged levels (keep IRI) from modified/new ones
        const unchangedLevelIris = [];
        const levelsToRecreate = [];
        const levelsToCreate = [];

        for (const level of data.levels || []) {
          if (!level.iri) {
            // New level
            levelsToCreate.push(level);
          } else {
            // Existing level — check if modified
            const original = (currentAssessment?.levels || []).find(
              (l) => (l['@id'] || `/api/levels/${l.id}`) === level.iri
            );
            const changed =
              original &&
              (original.label !== level.label ||
                original.ref !== level.ref ||
                (original.description || '') !== (level.description || ''));

            if (changed) {
              levelsToRecreate.push(level);
            } else {
              unchangedLevelIris.push(level.iri);
            }
          }
        }

        // Step 1: PATCH assessment with only unchanged level IRIs (this dissociates removed + to-be-recreated levels)
        assessmentPayload.levels = unchangedLevelIris;

        await axios.patch(assessmentIri, assessmentPayload, {
          headers: { 'Content-Type': 'application/merge-patch+json' },
        });

        // Step 2: Create new + modified levels via sub-resource endpoint
        for (const level of [...levelsToRecreate, ...levelsToCreate]) {
          await axios.post(`${assessmentIri}/levels`, {
            label: level.label,
            ref: level.ref,
            description: level.description || '',
          });
        }

        toast.success('Assessment modifie avec succes !');
      } else {
        // Create the assessment first (without levels)
        let res;

        if (instituteId) {
          res = await axios.post(
            `/api/institutes/${instituteId}/assessments`,
            assessmentPayload
          );
        } else {
          res = await axios.post(endpoints.assessment.list, assessmentPayload);
        }

        assessmentIri = res.data?.['@id'] || `${endpoints.assessment.details}/${res.data?.id}`;

        // ------ Step 2: Create levels via sub-resource endpoint ------

        for (const level of data.levels || []) {
          await axios.post(`${assessmentIri}/levels`, {
            label: level.label,
            ref: level.ref,
            description: level.description || '',
          });
        }

        toast.success('Assessment cree avec succes !');
      }

      // Clear caches so SWR refetches on next mount
      await mutate(endpoints.assessment.list, undefined, { revalidate: false });
      if (instituteId) {
        await mutate(`/api/institutes/${instituteId}/assessments`, undefined, {
          revalidate: false,
        });
      }
      if (isEdit) {
        await mutate(`${endpoints.assessment.details}/${currentAssessment.id}`, undefined, {
          revalidate: false,
        });
      }

      const redirectPath = instituteId
        ? paths.dashboard.espaceInstitut.assessments
        : paths.dashboard.assessment.list;

      router.push(redirectPath);
    } catch (error) {
      console.error(error);
      toast.error(
        error?.message ||
          `Erreur lors de ${isEdit ? 'la modification' : 'la creation'} de l'assessment`
      );
    }
  });

  // ------ Render ------

  const renderAssessmentInfo = () => (
    <>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Informations de l&apos;assessment
      </Typography>

      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
        }}
      >
        <Field.Text name="label" label="Label" />
        <Field.Text name="ref" label="Ref" slotProps={{ htmlInput: { maxLength: 50 } }} />

        <Field.Autocomplete
          name="parent"
          label="Assessment parent"
          options={parentOptions.map((a) => a['@id'] || `/api/assessments/${a.id}`)}
          getOptionLabel={(option) => {
            const found = parentOptions.find(
              (a) => (a['@id'] || `/api/assessments/${a.id}`) === option
            );
            return found?.label ?? '';
          }}
          isOptionEqualToValue={(option, value) => option === value}
          sx={{ gridColumn: '1 / -1' }}
        />
      </Box>

      <Field.Switch name="isInternal" label="Assessment interne" disabled sx={{ mt: 2 }} />
    </>
  );

  const renderParentLevels = () => {
    if (!watchParent || parentLevels.length === 0) return null;

    const parentAssessment = parentOptions.find(
      (a) => (a['@id'] || `/api/assessments/${a.id}`) === watchParent
    );

    return (
      <>
        <Divider sx={{ my: 3, borderStyle: 'dashed' }} />

        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Niveaux herites de &laquo; {parentAssessment?.label || 'Parent'} &raquo;
        </Typography>

        <Stack spacing={2}>
          {parentLevels.map((level) => (
            <Box
              key={level.id || level['@id']}
              sx={{
                p: 2,
                borderRadius: 1,
                bgcolor: 'action.hover',
                rowGap: 1,
                columnGap: 2,
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="subtitle2">{level.label}</Typography>
                <Chip label={level.ref} size="small" variant="outlined" />
              </Stack>

              {level.description && (
                <Typography variant="body2" sx={{ color: 'text.secondary', gridColumn: '1 / -1' }}>
                  {level.description}
                </Typography>
              )}
            </Box>
          ))}
        </Stack>
      </>
    );
  };

  const renderLevels = () => (
    <>
      <Divider sx={{ my: 3, borderStyle: 'dashed' }} />

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="subtitle1">Niveaux propres</Typography>

        <Button
          size="small"
          color="primary"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={handleAddLevel}
        >
          Ajouter un niveau
        </Button>
      </Stack>

      {fields.length === 0 && (
        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 3 }}>
          Aucun niveau propre.{' '}
          {parentLevels.length > 0
            ? "Cet assessment utilise les niveaux du parent."
            : "Cet assessment ne necessite pas de niveaux."}
        </Typography>
      )}

      <Stack spacing={3}>
        {fields.map((field, index) => (
          <Stack key={field.id} spacing={1.5}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', flexGrow: 1 }}>
                Niveau {index + 1}
              </Typography>

              <Button
                size="small"
                color="error"
                startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                onClick={() => handleRemoveLevel(index)}
              >
                Supprimer
              </Button>
            </Stack>

            <Box
              sx={{
                rowGap: 2,
                columnGap: 2,
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
              }}
            >
              <Field.Text name={`levels[${index}].label`} label="Label" />
              <Field.Text
                name={`levels[${index}].ref`}
                label="Ref"
                slotProps={{ htmlInput: { maxLength: 50 } }}
              />
              <Field.Text
                name={`levels[${index}].description`}
                label="Description"
                multiline
                rows={2}
                sx={{ gridColumn: '1 / -1' }}
              />
            </Box>
          </Stack>
        ))}
      </Stack>
    </>
  );

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Card sx={{ p: 3 }}>
        {renderAssessmentInfo()}
        {renderParentLevels()}
        {renderLevels()}

        <Stack alignItems="flex-end" sx={{ mt: 3 }}>
          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            {isEdit ? "Modifier l'assessment" : "Creer l'assessment"}
          </LoadingButton>
        </Stack>
      </Card>
    </Form>
  );
}

