'use client';

import { z } from 'zod';
import { useMemo, useState, useEffect } from 'react';
import { mutate } from 'swr';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import axios, { endpoints } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

import { useGetInstituteAssessments } from 'src/actions/espace-institut';

// ----------------------------------------------------------------------

const SessionSchema = z
  .object({
    assessment: z.string().min(1, { message: "L'assessment est requis !" }),
    level: z.string().nullable(),
    start: z.any().refine((val) => val !== null && val !== '', { message: 'La date de debut est requise !' }),
    end: z.any().refine((val) => val !== null && val !== '', { message: 'La date de fin est requise !' }),
    limitDateSubscribe: z.any().nullable(),
    placesAvailable: z.any().nullable(),
  })
  .refine(
    (data) => {
      if (!data.limitDateSubscribe || !data.start) return true;
      return new Date(data.limitDateSubscribe) < new Date(data.start);
    },
    { message: "La date limite d'inscription doit etre avant la date de debut", path: ['limitDateSubscribe'] }
  );

// ----------------------------------------------------------------------

function getAssessmentIri(assessment) {
  if (!assessment) return '';
  if (typeof assessment === 'string') return assessment;
  return assessment['@id'] || `/api/assessments/${assessment.id}`;
}

function getLevelIri(level) {
  if (!level) return null;
  if (typeof level === 'string') return level;
  return level['@id'] || `/api/levels/${level.id}`;
}

// ----------------------------------------------------------------------

export function SessionCreateEditForm({ currentSession, instituteId }) {
  const router = useRouter();
  const isEdit = !!currentSession;

  const { assessments } = useGetInstituteAssessments(instituteId);

  // Build level options from the selected assessment
  const defaultValues = useMemo(
    () => ({
      assessment: getAssessmentIri(currentSession?.assessment) || '',
      level: getLevelIri(currentSession?.level) || null,
      start: currentSession?.start ? new Date(currentSession.start) : null,
      end: currentSession?.end ? new Date(currentSession.end) : null,
      limitDateSubscribe: currentSession?.limitDateSubscribe
        ? new Date(currentSession.limitDateSubscribe)
        : null,
      placesAvailable: currentSession?.placesAvailable ?? '',
    }),
    [currentSession]
  );

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(SessionSchema),
    defaultValues,
  });

  const {
    watch,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const watchAssessment = watch('assessment');

  // Get levels for the selected assessment
  const selectedAssessment = useMemo(
    () => assessments.find((a) => getAssessmentIri(a) === watchAssessment),
    [assessments, watchAssessment]
  );

  // Resolve levels (may be IRI strings or objects)
  const [levelOptions, setLevelOptions] = useState([]);

  useEffect(() => {
    const levels = selectedAssessment?.levels;
    if (!Array.isArray(levels) || levels.length === 0) {
      setLevelOptions([]);
      return;
    }

    // If already objects with label, use directly
    if (typeof levels[0] !== 'string') {
      setLevelOptions(
        levels.map((l) => ({
          iri: l['@id'] || `/api/levels/${l.id}`,
          label: l.label || '',
        }))
      );
      return;
    }

    // Resolve IRI strings
    let cancelled = false;

    Promise.all(levels.map((iri) => axios.get(iri).then((res) => res.data)))
      .then((resolved) => {
        if (!cancelled) {
          setLevelOptions(
            resolved.map((l) => ({
              iri: l['@id'] || `/api/levels/${l.id}`,
              label: l.label || '',
            }))
          );
        }
      })
      .catch(() => {
        if (!cancelled) setLevelOptions([]);
      });

    return () => { cancelled = true; };
  }, [selectedAssessment]);

  // ------ Submit ------

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload = {
        assessment: data.assessment,
        level: data.level || null,
        start: data.start ? new Date(data.start).toISOString() : null,
        end: data.end ? new Date(data.end).toISOString() : null,
        limitDateSubscribe: data.limitDateSubscribe
          ? new Date(data.limitDateSubscribe).toISOString()
          : null,
        placesAvailable: data.placesAvailable ? Number(data.placesAvailable) : null,
      };

      if (isEdit) {
        await axios.patch(`/api/sessions/${currentSession.id}`, payload, {
          headers: { 'Content-Type': 'application/merge-patch+json' },
        });
        toast.success('Session modifiee avec succes !');
      } else {
        await axios.post(endpoints.institute.sessions(instituteId), payload);
        toast.success('Session creee avec succes !');
      }

      await mutate(endpoints.institute.sessions(instituteId), undefined, { revalidate: false });

      router.push(paths.dashboard.espaceInstitut.sessions);
    } catch (error) {
      console.error(error);
      toast.error(
        error?.message ||
          `Erreur lors de ${isEdit ? 'la modification' : 'la creation'} de la session`
      );
    }
  });

  // ------ Render ------

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Card sx={{ p: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Informations de la session
        </Typography>

        <Box
          sx={{
            rowGap: 3,
            columnGap: 2,
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
          }}
        >
          <Field.Autocomplete
            name="assessment"
            label="Assessment"
            options={assessments.map((a) => getAssessmentIri(a))}
            getOptionLabel={(option) => {
              const found = assessments.find((a) => getAssessmentIri(a) === option);
              return found?.label ?? '';
            }}
            isOptionEqualToValue={(option, value) => option === value}
            sx={{ gridColumn: '1 / -1' }}
          />

          {levelOptions.length > 0 && (
            <Field.Autocomplete
              name="level"
              label="Niveau"
              options={levelOptions.map((l) => l.iri)}
              getOptionLabel={(option) => {
                const found = levelOptions.find((l) => l.iri === option);
                return found?.label ?? '';
              }}
              isOptionEqualToValue={(option, value) => option === value}
              sx={{ gridColumn: '1 / -1' }}
            />
          )}

          <Field.DatePicker name="start" label="Date de debut" />
          <Field.DatePicker name="end" label="Date de fin" />
          <Field.DatePicker name="limitDateSubscribe" label="Date limite d'inscription" />
          <Field.Text
            name="placesAvailable"
            label="Places disponibles"
            type="number"
            slotProps={{ htmlInput: { min: 0 } }}
          />
        </Box>

        <Stack alignItems="flex-end" sx={{ mt: 3 }}>
          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            {isEdit ? 'Modifier la session' : 'Creer la session'}
          </LoadingButton>
        </Stack>
      </Card>
    </Form>
  );
}
