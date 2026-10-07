'use client';

import { z } from 'zod';
import { mutate } from 'swr';
import { useForm } from 'react-hook-form';
import { useMemo, useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import axios, { endpoints } from 'src/lib/axios';
import { useGetAssessments } from 'src/actions/assessment';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

const ExamSchema = z.object({
  label: z.string().min(1, { message: 'Le label est requis !' }),
  assessment: z.string().min(1, { message: 'Le test est requis !' }),
  level: z.string().nullable(),
  isWritten: z.boolean(),
  isOption: z.boolean(),
  coeff: z.coerce.number().nullable(),
  nbrQuestions: z.coerce.number().nullable(),
  duration: z.coerce.number().nullable(),
  successScore: z.coerce.number().nullable(),
  priceAmount: z.coerce.number().nullable(),
  priceCurrency: z.string(),
  priceTva: z.coerce.number().nullable(),
  skills: z.array(z.string()),
});

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

function getSkillIris(exam) {
  if (!Array.isArray(exam?.skills)) return [];
  return exam.skills.map((s) => {
    if (typeof s === 'string') return s;
    return s['@id'] || `/api/skills/${s.id}`;
  });
}

// ----------------------------------------------------------------------

export function ExamCreateEditForm({ currentExam, fixedAssessmentIri, redirectPath }) {
  const { t } = useTranslate('exam');
  const router = useRouter();

  const isEdit = !!currentExam;

  const { assessments } = useGetAssessments();

  // Available levels for the selected assessment (own + parent)
  const [availableLevels, setAvailableLevels] = useState([]);
  // Available skills from the selected assessment
  const [assessmentSkills, setAssessmentSkills] = useState([]);

  const defaultValues = useMemo(
    () => ({
      label: currentExam?.label || 'Examen de Français B2',
      assessment: fixedAssessmentIri || getAssessmentIri(currentExam?.assessment) || '',
      level: getLevelIri(currentExam?.level) || null,
      isWritten: currentExam?.isWritten ?? true,
      isOption: currentExam?.isOption || false,
      coeff: currentExam?.coeff ?? 2,
      nbrQuestions: currentExam?.nbrQuestions ?? 40,
      duration: currentExam?.duration ?? 60,
      successScore: currentExam?.successScore ?? 70,
      priceAmount: currentExam?.price?.amount ?? 150,
      priceCurrency: currentExam?.price?.currency || 'EUR',
      priceTva: currentExam?.price?.tva ?? 20,
      skills: getSkillIris(currentExam),
    }),
    [currentExam, fixedAssessmentIri]
  );

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(ExamSchema),
    defaultValues,
  });

  const {
    watch,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = methods;

  const watchAssessment = watch('assessment');

  // When assessment changes, fetch its levels + parent levels AND skills
  useEffect(() => {
    if (!watchAssessment) {
      setAvailableLevels([]);
      setAssessmentSkills([]);
      return undefined;
    }

    let cancelled = false;

    axios
      .get(watchAssessment)
      .then(async (res) => {
        if (cancelled) return;

        const assessmentData = res.data;

        // ------ Levels ------
        let levels = [];

        const ownLevels = assessmentData?.levels;
        if (Array.isArray(ownLevels) && ownLevels.length > 0) {
          if (typeof ownLevels[0] === 'string') {
            const resolved = await Promise.all(
              ownLevels.map((iri) => axios.get(iri).then((r) => r.data))
            );
            levels = [...levels, ...resolved];
          } else {
            levels = [...levels, ...ownLevels];
          }
        }

        // Parent levels
        const parentIri =
          typeof assessmentData?.parent === 'string'
            ? assessmentData.parent
            : assessmentData?.parent?.['@id'];

        if (parentIri) {
          try {
            const parentRes = await axios.get(parentIri);
            const parentLevels = parentRes.data?.levels;

            if (Array.isArray(parentLevels) && parentLevels.length > 0) {
              if (typeof parentLevels[0] === 'string') {
                const resolved = await Promise.all(
                  parentLevels.map((iri) => axios.get(iri).then((r) => r.data))
                );
                levels = [...levels, ...resolved];
              } else {
                levels = [...levels, ...parentLevels];
              }
            }
          } catch (error) {
            console.error('Failed to fetch parent levels:', error);
          }
        }

        if (!cancelled) setAvailableLevels(levels);

        // ------ Skills ------
        let skills = [];

        const ownSkills = assessmentData?.skills;
        if (Array.isArray(ownSkills) && ownSkills.length > 0) {
          if (typeof ownSkills[0] === 'string') {
            const resolved = await Promise.all(
              ownSkills.map((iri) => axios.get(iri).then((r) => r.data))
            );
            skills = resolved;
          } else {
            skills = ownSkills;
          }
        }

        if (!cancelled) setAssessmentSkills(skills);
      })
      .catch(() => {
        if (!cancelled) {
          setAvailableLevels([]);
          setAssessmentSkills([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [watchAssessment]);

  // Reset level when assessment changes (unless it's the initial load)
  useEffect(() => {
    if (isEdit && watchAssessment === (fixedAssessmentIri || getAssessmentIri(currentExam?.assessment))) return;
    setValue('level', null);
    setValue('skills', []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchAssessment]);

  // ------ Submit ------

  const onSubmit = handleSubmit(async (data) => {
    try {
      // Level is required if the assessment has levels
      if (availableLevels.length > 0 && !data.level) {
        toast.error(t('level_required'));
        return;
      }

      const payload = {
        label: data.label,
        assessment: data.assessment,
        level: data.level || null,
        isWritten: data.isWritten,
        isOption: data.isOption,
        coeff: data.coeff,
        nbrQuestions: data.nbrQuestions,
        duration: data.duration,
        successScore: data.successScore,
        skills: data.skills || [],
        price: {
          amount: data.priceAmount,
          currency: data.priceCurrency,
          tva: data.priceTva,
        },
      };

      if (isEdit) {
        const examIri = `${endpoints.exam.details}/${currentExam.id}`;
        await axios.patch(examIri, payload, {
          headers: { 'Content-Type': 'application/merge-patch+json' },
        });
      } else if (fixedAssessmentIri) {
        await axios.post(`${fixedAssessmentIri}/exams`, payload);
      } else {
        await axios.post(endpoints.exam.list, payload);
      }

      toast.success(isEdit ? t('edit_success') : t('create_success'));

      await mutate(endpoints.exam.list, undefined, { revalidate: true });
      if (fixedAssessmentIri) {
        await mutate(`${fixedAssessmentIri}/exams`, undefined, { revalidate: true });
      }
      if (isEdit) {
        await mutate(`${endpoints.exam.details}/${currentExam.id}`, undefined, {
          revalidate: true,
        });
      }

      router.push(redirectPath || paths.dashboard.exam.list);
    } catch (error) {
      console.error(error);
      toast.error(
        error?.message || (isEdit ? t('edit_error') : t('create_error'))
      );
    }
  });

  // ------ Assessment options ------

  const assessmentOptions = useMemo(
    () => assessments.map((a) => a['@id'] || `/api/assessments/${a.id}`),
    [assessments]
  );

  const getAssessmentOptionLabel = (option) => {
    const found = assessments.find(
      (a) => (a['@id'] || `/api/assessments/${a.id}`) === option
    );
    return found?.label ?? '';
  };

  // ------ Level options ------

  const levelOptions = useMemo(
    () => availableLevels.map((l) => l['@id'] || `/api/levels/${l.id}`),
    [availableLevels]
  );

  const getLevelOptionLabel = (option) => {
    const found = availableLevels.find(
      (l) => (l['@id'] || `/api/levels/${l.id}`) === option
    );
    return found?.label ?? '';
  };

  // ------ Skill options ------

  const skillOptions = useMemo(
    () => assessmentSkills.map((s) => s['@id'] || `/api/skills/${s.id}`),
    [assessmentSkills]
  );

  const getSkillOptionLabel = (option) => {
    const found = assessmentSkills.find(
      (s) => (s['@id'] || `/api/skills/${s.id}`) === option
    );
    return found?.label ?? '';
  };

  // ------ Render ------

  const renderExamInfo = () => (
    <>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        {t('section_info')}
      </Typography>

      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
        }}
      >
        <Field.Text name="label" label={t('label_label')} sx={{ gridColumn: '1 / -1' }} />

        <Field.Autocomplete
          name="assessment"
          label={t('label_assessment')}
          options={assessmentOptions}
          getOptionLabel={getAssessmentOptionLabel}
          isOptionEqualToValue={(option, value) => option === value}
          disabled={!!fixedAssessmentIri}
        />

        {availableLevels.length > 0 && (
          <Field.Autocomplete
            name="level"
            label={t('label_level')}
            options={levelOptions}
            getOptionLabel={getLevelOptionLabel}
            isOptionEqualToValue={(option, value) => option === value}
          />
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
        <Field.Switch name="isWritten" label={t('switch_written')} />
        <Field.Switch name="isOption" label={t('switch_option')} />
      </Box>
    </>
  );

  const renderSkills = () => (
    <>
      <Divider sx={{ my: 3, borderStyle: 'dashed' }} />

      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        {t('section_skills')}
      </Typography>

      {skillOptions.length > 0 ? (
        <Field.Autocomplete
          name="skills"
          label={t('label_skills')}
          multiple
          options={skillOptions}
          getOptionLabel={getSkillOptionLabel}
          isOptionEqualToValue={(option, value) => option === value}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                {...getTagProps({ index })}
                key={option}
                label={getSkillOptionLabel(option)}
                size="small"
              />
            ))
          }
        />
      ) : (
        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 2 }}>
          {t('no_skills')}
        </Typography>
      )}
    </>
  );

  const renderDetails = () => (
    <>
      <Divider sx={{ my: 3, borderStyle: 'dashed' }} />

      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        {t('section_details')}
      </Typography>

      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
        }}
      >
        <Field.Text name="coeff" label={t('label_coeff')} type="number" />
        <Field.Text name="nbrQuestions" label={t('label_nbr_questions')} type="number" />
        <Field.Text name="duration" label={t('label_duration')} type="number" />
        <Field.Text name="successScore" label={t('label_success_score')} type="number" />
      </Box>
    </>
  );

  const renderPrice = () => (
    <>
      <Divider sx={{ my: 3, borderStyle: 'dashed' }} />

      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        {t('section_price')}
      </Typography>

      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(3, 1fr)' },
        }}
      >
        <Field.Text name="priceAmount" label={t('label_amount')} type="number" />

        <Field.Select name="priceCurrency" label={t('label_currency')}>
          <MenuItem value="EUR">EUR</MenuItem>
          <MenuItem value="USD">USD</MenuItem>
          <MenuItem value="GBP">GBP</MenuItem>
        </Field.Select>

        <Field.Text name="priceTva" label={t('label_tva')} type="number" />
      </Box>
    </>
  );

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Card sx={{ p: 3 }}>
        {renderExamInfo()}
        {renderSkills()}
        {renderDetails()}
        {renderPrice()}

        <Stack alignItems="flex-end" sx={{ mt: 3 }}>
          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            {isEdit ? t('submit_edit') : t('submit_create')}
          </LoadingButton>
        </Stack>
      </Card>
    </Form>
  );
}
