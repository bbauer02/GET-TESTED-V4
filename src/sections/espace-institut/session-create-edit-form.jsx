'use client';

import { z } from 'zod';
import { mutate } from 'swr';
import { useForm } from 'react-hook-form';
import { useMemo, useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import axios, { endpoints } from 'src/lib/axios';
import { useGetInstituteAssessments } from 'src/actions/espace-institut';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

import { getErrorMessage } from 'src/auth/utils';

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

const isFilled = (val) => val !== null && val !== undefined && val !== '';

// ----------------------------------------------------------------------

export function SessionCreateEditForm({ currentSession, instituteId }) {
  const router = useRouter();
  const { t } = useTranslate('session_management');
  const isEdit = !!currentSession;

  // Règles de l'API : en OPEN, dates de début/fin figées et places uniquement en hausse ;
  // le test et le niveau ne se modifient pas après création.
  const isOpen = currentSession?.status === 'OPEN';
  const minPlaces = isOpen ? currentSession?.placesAvailable ?? 0 : 0;

  const { assessments } = useGetInstituteAssessments(instituteId);

  const SessionSchema = useMemo(
    () =>
      z
        .object({
          assessment: z.string().min(1, { message: t('form_assessment_required') }),
          level: z.string().nullable(),
          start: z.any().refine(isFilled, { message: t('form_start_required') }),
          end: z.any().refine(isFilled, { message: t('form_end_required') }),
          limitDateSubscribe: z.any().refine(isFilled, { message: t('form_limit_date_required') }),
          placesAvailable: z.any().nullable(),
        })
        .refine((data) => !data.start || !data.end || new Date(data.end) > new Date(data.start), {
          message: t('form_end_after_start'),
          path: ['end'],
        })
        .refine(
          (data) => !data.limitDateSubscribe || !data.start || new Date(data.limitDateSubscribe) < new Date(data.start),
          { message: t('form_limit_before_start'), path: ['limitDateSubscribe'] }
        )
        .refine((data) => !isFilled(data.placesAvailable) || Number(data.placesAvailable) >= minPlaces, {
          message: t('form_places_only_increase', { count: minPlaces }),
          path: ['placesAvailable'],
        }),
    [t, minPlaces]
  );

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
  const watchStart = watch('start');

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
      return undefined;
    }

    // If already objects with label, use directly
    if (typeof levels[0] !== 'string') {
      setLevelOptions(
        levels.map((l) => ({
          iri: l['@id'] || `/api/levels/${l.id}`,
          label: l.label || '',
        }))
      );
      return undefined;
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

    return () => {
      cancelled = true;
    };
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
        placesAvailable: isFilled(data.placesAvailable) ? Number(data.placesAvailable) : null,
      };

      let sessionId = currentSession?.id;

      if (isEdit) {
        await axios.patch(`/api/sessions/${currentSession.id}`, payload, {
          headers: { 'Content-Type': 'application/merge-patch+json' },
        });
        toast.success(t('form_update_success'));
      } else {
        const response = await axios.post(endpoints.institute.sessions(instituteId), payload);
        sessionId = response.data?.id;
        toast.success(t('form_create_success'));
      }

      await Promise.all([
        mutate(endpoints.institute.sessions(instituteId)),
        sessionId ? mutate(endpoints.session.details(sessionId)) : null,
      ]);

      // Après création, l'étape suivante (planifier les épreuves) se fait sur le détail de la session
      router.push(
        sessionId ? paths.dashboard.espaceInstitut.sessionView(sessionId) : paths.dashboard.espaceInstitut.sessions
      );
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error));
    }
  });

  // ------ Render ------

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Card sx={{ p: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          {t('form_section_title')}
        </Typography>

        {isOpen && (
          <Alert severity="info" sx={{ mb: 3 }}>
            {t('form_open_restrictions')}
          </Alert>
        )}

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
            label={t('form_assessment')}
            disabled={isEdit}
            options={assessments.map((a) => getAssessmentIri(a))}
            getOptionLabel={(option) => {
              const found = assessments.find((a) => getAssessmentIri(a) === option);
              return found?.label ?? currentSession?.assessment?.label ?? '';
            }}
            isOptionEqualToValue={(option, value) => option === value}
            sx={{ gridColumn: '1 / -1' }}
          />

          {(levelOptions.length > 0 || (isEdit && currentSession?.level)) && (
            <Field.Autocomplete
              name="level"
              label={t('form_level')}
              disabled={isEdit}
              options={levelOptions.map((l) => l.iri)}
              getOptionLabel={(option) => {
                const found = levelOptions.find((l) => l.iri === option);
                return found?.label ?? currentSession?.level?.label ?? '';
              }}
              isOptionEqualToValue={(option, value) => option === value}
              sx={{ gridColumn: '1 / -1' }}
            />
          )}

          <Field.DateTimePicker name="start" label={t('form_start')} disabled={isOpen} disablePast={!isEdit} />
          <Field.DateTimePicker
            name="end"
            label={t('form_end')}
            disabled={isOpen}
            minDateTime={watchStart ? new Date(watchStart) : undefined}
          />
          <Field.DateTimePicker
            name="limitDateSubscribe"
            label={t('form_limit_date')}
            maxDateTime={watchStart ? new Date(watchStart) : undefined}
            slotProps={{ textField: { helperText: t('form_limit_date_hint') } }}
          />
          <Field.Text
            name="placesAvailable"
            label={t('form_places')}
            type="number"
            helperText={t('form_places_hint')}
            slotProps={{ htmlInput: { min: minPlaces } }}
          />
        </Box>

        <Stack alignItems="flex-end" sx={{ mt: 3 }}>
          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            {isEdit ? t('form_submit_update') : t('form_submit_create')}
          </LoadingButton>
        </Stack>
      </Card>
    </Form>
  );
}
