'use client';

import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ButtonBase from '@mui/material/ButtonBase';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import axios, { endpoints } from 'src/lib/axios';
import { useGetSkills } from 'src/actions/skill';
import { useGetInstituteAssessments } from 'src/actions/espace-institut';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { useCurrentInstitute } from 'src/auth/hooks/use-current-institute';

// ----------------------------------------------------------------------

const QUESTION_TYPES = [
  { value: 'scu', label: 'QCU', icon: 'mdi:radiobox-marked', description: 'Question a choix unique' },
  { value: 'mcq', label: 'QCM', icon: 'mdi:checkbox-multiple-marked-outline', description: 'Question a choix multiples' },
  { value: 'fill_blank', label: 'Texte a trous', icon: 'mdi:form-textbox', description: 'Completer les espaces vides' },
  { value: 'highlight', label: 'Surlignage', icon: 'mdi:marker', description: 'Selectionner des zones de texte' },
  { value: 'ordering', label: 'Ordonnancement', icon: 'mdi:sort-variant', description: 'Remettre dans le bon ordre' },
  { value: 'matching', label: 'Appariement', icon: 'mdi:link-variant', description: 'Associer des elements entre eux' },
];

// ----------------------------------------------------------------------
// Zod schemas
// ----------------------------------------------------------------------

const McqChoiceSchema = z.object({
  text: z.string().min(1, { message: 'Le texte du choix est requis' }),
  weight: z.number().min(0).max(1),
  feedback: z.string().optional(),
});

const BlankSlotSchema = z.object({
  acceptedAnswers: z.string().min(1, { message: 'Au moins une reponse acceptee est requise' }),
  caseSensitive: z.boolean(),
  accentSensitive: z.boolean(),
});

const HighlightZoneSchema = z.object({
  startIndex: z.number().min(0, { message: "L'index de debut est requis" }),
  endIndex: z.number().min(1, { message: "L'index de fin est requis" }),
  isCorrect: z.boolean(),
});

const OrderingItemSchema = z.object({
  text: z.string().min(1, { message: "Le texte de l'element est requis" }),
});

const MatchingPairSchema = z.object({
  leftText: z.string().min(1, { message: "Le texte de gauche est requis" }),
  rightText: z.string().min(1, { message: "Le texte de droite est requis" }),
});

const BaseQuestionSchema = z.object({
  type: z.string().min(1, { message: 'Le type de question est requis' }),
  assessment: z.string().min(1, { message: 'Le test est requis' }),
  level: z.string().nullable(),
  skills: z.array(z.string()),
  label: z.string().min(1, { message: "L'intitule est requis" }),
  text: z.string().min(1, { message: "L'enonce est requis" }),
  instruction: z.string().optional(),
  duration: z.number().min(0).nullable(),
  maxPoints: z.number().min(0).nullable(),
  // MCQ
  isMultipleAnswer: z.boolean(),
  shuffleChoices: z.boolean(),
  choices: z.array(McqChoiceSchema),
  // FillBlank
  blankSymbol: z.string(),
  blankSlots: z.array(BlankSlotSchema),
  // Highlight
  highlightZones: z.array(HighlightZoneSchema),
  // Ordering
  shuffleOnDisplay: z.boolean(),
  orderingItems: z.array(OrderingItemSchema),
  // Matching
  matchingPairs: z.array(MatchingPairSchema),
});

// Refinement: validate type-specific arrays have at least one entry
const QuestionSchema = BaseQuestionSchema.superRefine((data, ctx) => {
  if ((data.type === 'mcq' || data.type === 'scu') && data.choices.length < 2) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Il faut au moins 2 choix',
      path: ['choices'],
    });
  }
  if (data.type === 'scu') {
    const correct = data.choices.filter((c) => Number(c.weight) >= 1).length;
    if (correct !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Un QCU doit avoir exactement une bonne reponse',
        path: ['choices'],
      });
    }
  }
  if (data.type === 'fill_blank' && data.blankSlots.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Il faut au moins un trou dans le texte',
      path: ['blankSlots'],
    });
  }
  if (data.type === 'ordering' && data.orderingItems.length < 2) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Il faut au moins 2 elements a ordonner',
      path: ['orderingItems'],
    });
  }
  if (data.type === 'matching' && data.matchingPairs.length < 2) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Il faut au moins 2 paires',
      path: ['matchingPairs'],
    });
  }
});

// ----------------------------------------------------------------------
// Helpers
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

function getSkillIri(skill) {
  if (!skill) return '';
  if (typeof skill === 'string') return skill;
  return skill['@id'] || `/api/skills/${skill.id}`;
}

function getEndpointForType(type) {
  switch (type) {
    case 'scu':
    case 'mcq':
      return endpoints.question.createMcq;
    case 'fill_blank':
      return endpoints.question.createFillBlank;
    case 'highlight':
      return endpoints.question.createHighlight;
    case 'ordering':
      return endpoints.question.createOrdering;
    case 'matching':
      return endpoints.question.createMatching;
    default:
      return endpoints.question.list;
  }
}

function getDiscriminatorType(type) {
  switch (type) {
    case 'mcq': return 'mcq';
    case 'fill_blank': return 'fill_blank';
    case 'highlight': return 'highlight';
    case 'ordering': return 'ordering';
    case 'matching': return 'matching';
    default: return type;
  }
}

// Detect question type from API data
function detectQuestionType(question) {
  if (!question) return '';
  const isMcq =
    question.type === 'mcq' ||
    question['@type']?.toLowerCase().includes('mcq') ||
    Array.isArray(question.choices);
  // A single-choice MCQ is surfaced as QCU (scu) in the UI
  if (isMcq) return question.isMultipleAnswer === false ? 'scu' : 'mcq';
  if (question.type) return question.type;
  if (question['@type']?.toLowerCase().includes('mcq') || question.choices) return 'mcq';
  if (question['@type']?.toLowerCase().includes('fillblank') || question.blankSlots) return 'fill_blank';
  if (question['@type']?.toLowerCase().includes('highlight') || question.highlightZones) return 'highlight';
  if (question['@type']?.toLowerCase().includes('ordering') || question.orderingItems) return 'ordering';
  if (question['@type']?.toLowerCase().includes('matching') || question.matchingPairs) return 'matching';
  return '';
}

// ----------------------------------------------------------------------
// Main Form Component
// ----------------------------------------------------------------------

export function QuestionCreateEditForm({ currentQuestion }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEdit = !!currentQuestion;

  const assessmentFromUrl = searchParams.get('assessment') || '';
  const levelFromUrl = searchParams.get('level') || '';

  const currentInstitute = useCurrentInstitute();
  const { assessments } = useGetInstituteAssessments(currentInstitute?.id);
  const { skills } = useGetSkills();

  // Resolve levels from selected assessment
  const [levelOptions, setLevelOptions] = useState([]);
  const [skillOptions, setSkillOptions] = useState([]);

  // Build skill options
  useEffect(() => {
    if (skills.length > 0) {
      setSkillOptions(
        skills.map((s) => ({
          iri: getSkillIri(s),
          label: s.label || s.name || '',
        }))
      );
    }
  }, [skills]);

  // Default values
  const defaultValues = useMemo(() => {
    const detectedType = detectQuestionType(currentQuestion);

    return {
      type: detectedType,
      assessment: getAssessmentIri(currentQuestion?.assessment) || (assessmentFromUrl ? `/api/assessments/${assessmentFromUrl}` : ''),
      level: getLevelIri(currentQuestion?.level) || (levelFromUrl ? `/api/levels/${levelFromUrl}` : null),
      skills: (currentQuestion?.skills || []).map((s) => getSkillIri(s)),
      label: currentQuestion?.label || '',
      text: currentQuestion?.text || '',
      instruction: currentQuestion?.instruction || '',
      duration: currentQuestion?.duration ?? null,
      maxPoints: currentQuestion?.maxPoints ?? null,
      // MCQ
      isMultipleAnswer: currentQuestion?.isMultipleAnswer ?? false,
      shuffleChoices: currentQuestion?.shuffleChoices ?? false,
      choices: currentQuestion?.choices?.length > 0
        ? currentQuestion.choices.map((c) => ({
            text: c.text || '',
            weight: c.weight ?? 0,
            feedback: c.feedback || '',
          }))
        : [
            { text: '', weight: 1, feedback: '' },
            { text: '', weight: 0, feedback: '' },
          ],
      // FillBlank
      blankSymbol: currentQuestion?.blankSymbol || '___',
      blankSlots: currentQuestion?.blankSlots?.length > 0
        ? currentQuestion.blankSlots.map((s) => ({
            acceptedAnswers: Array.isArray(s.acceptedAnswers) ? s.acceptedAnswers.join(', ') : (s.acceptedAnswers || ''),
            caseSensitive: s.caseSensitive ?? false,
            accentSensitive: s.accentSensitive ?? false,
          }))
        : [],
      // Highlight
      highlightZones: currentQuestion?.highlightZones?.length > 0
        ? currentQuestion.highlightZones.map((zone) => ({
            startIndex: zone.startIndex ?? 0,
            endIndex: zone.endIndex ?? 0,
            isCorrect: zone.isCorrect ?? true,
          }))
        : [{ startIndex: 0, endIndex: 0, isCorrect: true }],
      // Ordering
      shuffleOnDisplay: currentQuestion?.shuffleOnDisplay ?? true,
      orderingItems: currentQuestion?.orderingItems?.length > 0
        ? currentQuestion.orderingItems.map((item) => ({
            text: item.text || '',
          }))
        : [{ text: '' }, { text: '' }],
      // Matching
      matchingPairs: currentQuestion?.matchingPairs?.length > 0
        ? currentQuestion.matchingPairs.map((p) => ({
            leftText: p.leftText || '',
            rightText: p.rightText || '',
          }))
        : [
            { leftText: '', rightText: '' },
            { leftText: '', rightText: '' },
          ],
    };
  }, [currentQuestion, assessmentFromUrl, levelFromUrl]);

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(QuestionSchema),
    defaultValues,
  });

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const watchType = watch('type');
  const watchAssessment = watch('assessment');
  const watchText = watch('text');
  const watchBlankSymbol = watch('blankSymbol');

  // Resolve levels for selected assessment
  const selectedAssessment = useMemo(
    () => assessments.find((a) => getAssessmentIri(a) === watchAssessment),
    [assessments, watchAssessment]
  );

  useEffect(() => {
    const levels = selectedAssessment?.levels;
    if (!Array.isArray(levels) || levels.length === 0) {
      setLevelOptions([]);
      return undefined;
    }

    if (typeof levels[0] !== 'string') {
      setLevelOptions(
        levels.map((l) => ({
          iri: l['@id'] || `/api/levels/${l.id}`,
          label: l.label || '',
        }))
      );
      return undefined;
    }

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

  // Auto-detect blank slots from text
  useEffect(() => {
    if (watchType !== 'fill_blank' || !watchBlankSymbol) return;

    const symbol = watchBlankSymbol;
    const count = watchText.split(symbol).length - 1;
    const currentSlots = methods.getValues('blankSlots');

    if (count > currentSlots.length) {
      const newSlots = [...currentSlots];
      for (let i = currentSlots.length; i < count; i += 1) {
        newSlots.push({ acceptedAnswers: '', caseSensitive: false, accentSensitive: false });
      }
      setValue('blankSlots', newSlots);
    } else if (count < currentSlots.length) {
      setValue('blankSlots', currentSlots.slice(0, Math.max(count, 0)));
    }
  }, [watchText, watchBlankSymbol, watchType, setValue, methods]);

  // ------ Submit ------

  const onSubmit = handleSubmit(async (data) => {
    try {
      const basePayload = {
        assessment: data.assessment,
        level: data.level || null,
        skills: data.skills,
        label: data.label,
        text: data.text,
        instruction: data.instruction || null,
        duration: data.duration ? Number(data.duration) : null,
        maxPoints: data.maxPoints ? Number(data.maxPoints) : null,
      };

      let payload;

      switch (data.type) {
        case 'scu':
        case 'mcq':
          payload = {
            ...basePayload,
            // QCU (scu) = single-choice MCQ
            isMultipleAnswer: data.type === 'scu' ? false : data.isMultipleAnswer,
            shuffleChoices: data.shuffleChoices,
            choices: data.choices.map((c) => ({
              text: c.text,
              weight: Number(c.weight),
              feedback: c.feedback || null,
            })),
          };
          break;

        case 'fill_blank':
          payload = {
            ...basePayload,
            blankSymbol: data.blankSymbol,
            blankSlots: data.blankSlots.map((s) => ({
              acceptedAnswers: s.acceptedAnswers.split(',').map((a) => a.trim()).filter(Boolean),
              caseSensitive: s.caseSensitive,
              accentSensitive: s.accentSensitive,
            })),
          };
          break;

        case 'highlight':
          payload = {
            ...basePayload,
            highlightZones: data.highlightZones.map((hz) => ({
              startIndex: Number(hz.startIndex),
              endIndex: Number(hz.endIndex),
              isCorrect: hz.isCorrect,
            })),
          };
          break;

        case 'ordering':
          payload = {
            ...basePayload,
            shuffleOnDisplay: data.shuffleOnDisplay,
            orderingItems: data.orderingItems.map((item, index) => ({
              text: item.text,
              correctPosition: index + 1,
            })),
          };
          break;

        case 'matching':
          payload = {
            ...basePayload,
            shuffleOnDisplay: data.shuffleOnDisplay,
            matchingPairs: data.matchingPairs.map((p) => ({
              leftText: p.leftText,
              rightText: p.rightText,
            })),
          };
          break;

        default:
          throw new Error('Type de question non supporte');
      }

      if (isEdit) {
        await axios.patch(endpoints.question.details(currentQuestion.id), payload, {
          headers: { 'Content-Type': 'application/merge-patch+json' },
        });
        toast.success('Question modifiee avec succes !', { duration: 4000 });
      } else {
        const endpoint = getEndpointForType(data.type);
        await axios.post(endpoint, payload);
        toast.success('Question creee avec succes !', { duration: 4000 });
      }

      router.push(paths.dashboard.espaceInstitut.questions);
    } catch (error) {
      console.error('Save error:', error?.response?.status, error?.response?.data || error.message);
      const msg = error?.response?.data?.['hydra:description']
        || error?.response?.data?.detail
        || error?.message
        || 'Erreur lors de la sauvegarde de la question';
      toast.error(msg, { duration: 6000 });
    }
  });

  // ------ Type selection step ------

  const renderTypeSelector = () => (
    <Card sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Type de question
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: 'repeat(1, 1fr)',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(5, 1fr)',
          },
        }}
      >
        {QUESTION_TYPES.map((qt) => (
          <ButtonBase
            key={qt.value}
            onClick={() => setValue('type', qt.value, { shouldValidate: true })}
            sx={{
              p: 2.5,
              borderRadius: 2,
              textAlign: 'center',
              flexDirection: 'column',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              border: (theme) => `1px solid ${theme.vars.palette.divider}`,
              ...(watchType === qt.value && {
                borderColor: 'primary.main',
                bgcolor: 'primary.lighter',
                boxShadow: (theme) => `0 0 0 1px ${theme.vars.palette.primary.main}`,
              }),
              '&:hover': {
                bgcolor: watchType === qt.value ? 'primary.lighter' : 'action.hover',
              },
            }}
          >
            <Iconify icon={qt.icon} width={36} />
            <Typography variant="subtitle2">{qt.label}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {qt.description}
            </Typography>
          </ButtonBase>
        ))}
      </Box>

      {methods.formState.errors.type && (
        <Typography variant="caption" color="error" sx={{ mt: 1 }}>
          {methods.formState.errors.type.message}
        </Typography>
      )}
    </Card>
  );

  // ------ Common fields ------

  const renderCommonFields = () => (
    <Card sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Informations generales
      </Typography>

      <Box
        sx={{
          rowGap: 3,
          columnGap: 2,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
        }}
      >
        <Field.Select
          name="type"
          label="Type de question"
          disabled={isEdit}
          sx={{ gridColumn: '1 / -1' }}
        >
          {QUESTION_TYPES.map((qt) => (
            <MenuItem key={qt.value} value={qt.value}>
              {qt.label}
            </MenuItem>
          ))}
        </Field.Select>

        <Field.Autocomplete
          name="assessment"
          label="Test"
          options={assessments.map((a) => getAssessmentIri(a))}
          getOptionLabel={(option) => {
            const found = assessments.find((a) => getAssessmentIri(a) === option);
            return found?.label ?? '';
          }}
          isOptionEqualToValue={(option, value) => option === value}
          disabled={!!assessmentFromUrl && !isEdit}
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
          />
        )}

        <Field.Autocomplete
          name="skills"
          label="Competences"
          multiple
          options={skillOptions.map((s) => s.iri)}
          getOptionLabel={(option) => {
            const found = skillOptions.find((s) => s.iri === option);
            return found?.label ?? '';
          }}
          isOptionEqualToValue={(option, value) => option === value}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const found = skillOptions.find((s) => s.iri === option);
              return (
                <Chip
                  {...getTagProps({ index })}
                  key={option}
                  label={found?.label ?? option}
                  size="small"
                  variant="soft"
                />
              );
            })
          }
          sx={{ gridColumn: '1 / -1' }}
        />

        <Field.Text name="label" label="Intitule" sx={{ gridColumn: '1 / -1' }} />

        <Field.Text
          name="text"
          label="Enonce de la question"
          multiline
          rows={4}
          sx={{ gridColumn: '1 / -1' }}
        />

        <Field.Text
          name="instruction"
          label="Instruction (optionnel)"
          multiline
          rows={2}
          sx={{ gridColumn: '1 / -1' }}
        />

        <Field.Text
          name="duration"
          label="Duree (secondes)"
          type="number"
          slotProps={{ htmlInput: { min: 0 } }}
        />

        <Field.Text
          name="maxPoints"
          label="Points maximum"
          type="number"
          slotProps={{ htmlInput: { min: 0, step: 0.5 } }}
        />
      </Box>
    </Card>
  );

  // ------ MCQ fields ------

  const renderMcqFields = () => <McqFieldsSection />;

  // ------ FillBlank fields ------

  const renderFillBlankFields = () => <FillBlankFieldsSection />;

  // ------ Highlight fields ------

  const renderHighlightFields = () => <HighlightFieldsSection />;

  // ------ Ordering fields ------

  const renderOrderingFields = () => <OrderingFieldsSection />;

  // ------ Matching fields ------

  const renderMatchingFields = () => <MatchingFieldsSection />;

  // ------ Type-specific section ------

  const renderTypeSpecificFields = () => {
    switch (watchType) {
      case 'scu':
      case 'mcq':
        return renderMcqFields();
      case 'fill_blank':
        return renderFillBlankFields();
      case 'highlight':
        return renderHighlightFields();
      case 'ordering':
        return renderOrderingFields();
      case 'matching':
        return renderMatchingFields();
      default:
        return null;
    }
  };

  // ------ Render ------

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      {!isEdit && renderTypeSelector()}

      {watchType && (
        <>
          {renderCommonFields()}
          {renderTypeSpecificFields()}

          <Stack alignItems="flex-end" sx={{ mt: 3 }}>
            <LoadingButton type="submit" variant="contained" size="large" loading={isSubmitting}>
              {isEdit ? 'Modifier la question' : 'Creer la question'}
            </LoadingButton>
          </Stack>
        </>
      )}
    </Form>
  );
}

// ======================================================================
// MCQ Fields Sub-component
// ======================================================================

function McqFieldsSection() {
  const { control, watch } = useFormContext();
  const isScu = watch('type') === 'scu';

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'choices',
  });

  return (
    <Card sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        {isScu ? 'Options du QCU' : 'Options du QCM'}
      </Typography>

      <Stack spacing={2} sx={{ mb: 3 }}>
        {!isScu && <Field.Switch name="isMultipleAnswer" label="Reponses multiples" />}
        <Field.Switch name="shuffleChoices" label="Melanger les choix" />
      </Stack>

      {isScu && (
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
          Une seule bonne reponse : mettez le poids 1 sur la bonne reponse et 0 sur les autres.
        </Typography>
      )}

      <Divider sx={{ mb: 3 }} />

      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Choix de reponse
      </Typography>

      <Stack spacing={2}>
        {fields.map((field, index) => (
          <Box
            key={field.id}
            sx={{
              p: 2,
              borderRadius: 1.5,
              border: (theme) => `1px solid ${theme.vars.palette.divider}`,
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              alignItems: { sm: 'center' },
            }}
          >
            <Box sx={{ flex: 1, display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' } }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: 30 }}>
                {index + 1}.
              </Typography>

              <Field.Text
                name={`choices.${index}.text`}
                label="Texte du choix"
                size="small"
                sx={{ flex: 1 }}
              />

              <Field.Select
                name={`choices.${index}.weight`}
                label="Poids"
                size="small"
                sx={{ minWidth: 100 }}
              >
                <MenuItem value={0}>0</MenuItem>
                <MenuItem value={0.5}>0.5</MenuItem>
                <MenuItem value={1}>1</MenuItem>
              </Field.Select>

              <Field.Text
                name={`choices.${index}.feedback`}
                label="Feedback"
                size="small"
                sx={{ flex: 1 }}
              />
            </Box>

            <IconButton
              color="error"
              onClick={() => remove(index)}
              disabled={fields.length <= 2}
              sx={{ alignSelf: { xs: 'flex-end', sm: 'center' } }}
            >
              <Iconify icon="solar:trash-bin-trash-bold" />
            </IconButton>
          </Box>
        ))}
      </Stack>

      <Button
        variant="outlined"
        startIcon={<Iconify icon="mingcute:add-line" />}
        onClick={() => append({ text: '', weight: 0, feedback: '' })}
        sx={{ mt: 2 }}
      >
        Ajouter un choix
      </Button>
    </Card>
  );
}

// ======================================================================
// FillBlank Fields Sub-component
// ======================================================================

function FillBlankFieldsSection() {
  const { control, watch } = useFormContext();

  const blankSlots = watch('blankSlots');
  const blankSymbol = watch('blankSymbol');
  const text = watch('text');

  const blankCount = text ? text.split(blankSymbol).length - 1 : 0;

  return (
    <Card sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Options du texte a trous
      </Typography>

      <Field.Text
        name="blankSymbol"
        label="Symbole de trou"
        helperText={`Utilisez ce symbole dans l'enonce pour indiquer les trous. Trous detectes : ${blankCount}`}
        sx={{ mb: 3, maxWidth: 300 }}
      />

      {blankCount === 0 && (
        <Typography variant="body2" sx={{ color: 'warning.main', mb: 2 }}>
          Aucun trou detecte dans l&apos;enonce. Ajoutez &quot;{blankSymbol}&quot; dans le texte de la question pour creer des trous.
        </Typography>
      )}

      {blankSlots.length > 0 && (
        <>
          <Divider sx={{ mb: 3 }} />

          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Configuration des trous
          </Typography>

          <Stack spacing={2}>
            {blankSlots.map((slot, index) => (
              <Box
                key={index}
                sx={{
                  p: 2,
                  borderRadius: 1.5,
                  border: (theme) => `1px solid ${theme.vars.palette.divider}`,
                }}
              >
                <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                  Trou {index + 1}
                </Typography>

                <Box
                  sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: { xs: '1fr', sm: '1fr auto auto' },
                    alignItems: 'center',
                  }}
                >
                  <Field.Text
                    name={`blankSlots.${index}.acceptedAnswers`}
                    label="Reponses acceptees (separees par des virgules)"
                    size="small"
                  />

                  <Field.Switch
                    name={`blankSlots.${index}.caseSensitive`}
                    label="Casse"
                  />

                  <Field.Switch
                    name={`blankSlots.${index}.accentSensitive`}
                    label="Accents"
                  />
                </Box>
              </Box>
            ))}
          </Stack>
        </>
      )}
    </Card>
  );
}

// ======================================================================
// Highlight Fields Sub-component
// ======================================================================

function HighlightFieldsSection() {
  const { control } = useFormContext();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'highlightZones',
  });

  return (
    <Card sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Zones de surlignage
      </Typography>

      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Definissez les zones de surlignage en indiquant les indices de debut et de fin dans le texte de l&apos;enonce. Les indices commencent a 0.
      </Typography>

      <Stack spacing={2}>
        {fields.map((field, index) => (
          <Box
            key={field.id}
            sx={{
              p: 2,
              borderRadius: 1.5,
              border: (theme) => `1px solid ${theme.vars.palette.divider}`,
              display: 'flex',
              gap: 2,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: 60 }}>
              Zone {index + 1}
            </Typography>

            <Field.Text
              name={`highlightZones.${index}.startIndex`}
              label="Index debut"
              type="number"
              size="small"
              slotProps={{ htmlInput: { min: 0 } }}
              sx={{ width: 130 }}
            />

            <Field.Text
              name={`highlightZones.${index}.endIndex`}
              label="Index fin"
              type="number"
              size="small"
              slotProps={{ htmlInput: { min: 0 } }}
              sx={{ width: 130 }}
            />

            <Field.Switch
              name={`highlightZones.${index}.isCorrect`}
              label="Correcte"
            />

            <IconButton
              color="error"
              onClick={() => remove(index)}
              disabled={fields.length <= 1}
            >
              <Iconify icon="solar:trash-bin-trash-bold" />
            </IconButton>
          </Box>
        ))}
      </Stack>

      <Button
        variant="outlined"
        startIcon={<Iconify icon="mingcute:add-line" />}
        onClick={() => append({ startIndex: 0, endIndex: 0, isCorrect: true })}
        sx={{ mt: 2 }}
      >
        Ajouter une zone
      </Button>
    </Card>
  );
}

// ======================================================================
// Ordering Fields Sub-component
// ======================================================================

function OrderingFieldsSection() {
  const { control } = useFormContext();

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'orderingItems',
  });

  const handleMoveUp = useCallback(
    (index) => {
      if (index > 0) move(index, index - 1);
    },
    [move]
  );

  const handleMoveDown = useCallback(
    (index) => {
      if (index < fields.length - 1) move(index, index + 1);
    },
    [move, fields.length]
  );

  return (
    <Card sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Options d&apos;ordonnancement
      </Typography>

      <Field.Switch name="shuffleOnDisplay" label="Melanger a l'affichage" sx={{ mb: 3 }} />

      <Divider sx={{ mb: 3 }} />

      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Elements a ordonner
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
        L&apos;ordre ci-dessous correspond a l&apos;ordre correct. Utilisez les fleches pour reordonner.
      </Typography>

      <Stack spacing={2}>
        {fields.map((field, index) => (
          <Box
            key={field.id}
            sx={{
              p: 2,
              borderRadius: 1.5,
              border: (theme) => `1px solid ${theme.vars.palette.divider}`,
              display: 'flex',
              gap: 2,
              alignItems: 'center',
            }}
          >
            <Stack>
              <IconButton size="small" onClick={() => handleMoveUp(index)} disabled={index === 0}>
                <Iconify icon="mdi:chevron-up" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleMoveDown(index)}
                disabled={index === fields.length - 1}
              >
                <Iconify icon="mdi:chevron-down" />
              </IconButton>
            </Stack>

            <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: 30 }}>
              {index + 1}.
            </Typography>

            <Field.Text
              name={`orderingItems.${index}.text`}
              label={`Element ${index + 1}`}
              size="small"
              sx={{ flex: 1 }}
            />

            <IconButton
              color="error"
              onClick={() => remove(index)}
              disabled={fields.length <= 2}
            >
              <Iconify icon="solar:trash-bin-trash-bold" />
            </IconButton>
          </Box>
        ))}
      </Stack>

      <Button
        variant="outlined"
        startIcon={<Iconify icon="mingcute:add-line" />}
        onClick={() => append({ text: '' })}
        sx={{ mt: 2 }}
      >
        Ajouter un element
      </Button>
    </Card>
  );
}

// ======================================================================
// Matching Fields Sub-component
// ======================================================================

function MatchingFieldsSection() {
  const { control } = useFormContext();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'matchingPairs',
  });

  return (
    <Card sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Options d&apos;appariement
      </Typography>

      <Field.Switch name="shuffleOnDisplay" label="Melanger a l'affichage" sx={{ mb: 3 }} />

      <Divider sx={{ mb: 3 }} />

      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Paires
      </Typography>

      <Stack spacing={2}>
        {fields.map((field, index) => (
          <Box
            key={field.id}
            sx={{
              p: 2,
              borderRadius: 1.5,
              border: (theme) => `1px solid ${theme.vars.palette.divider}`,
              display: 'flex',
              gap: 2,
              alignItems: 'center',
              flexDirection: { xs: 'column', sm: 'row' },
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: 30 }}>
              {index + 1}.
            </Typography>

            <Field.Text
              name={`matchingPairs.${index}.leftText`}
              label="Element gauche"
              size="small"
              sx={{ flex: 1 }}
            />

            <Iconify icon="mdi:arrow-right" width={24} sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }} />
            <Iconify icon="mdi:arrow-down" width={24} sx={{ color: 'text.secondary', display: { xs: 'block', sm: 'none' } }} />

            <Field.Text
              name={`matchingPairs.${index}.rightText`}
              label="Element droite"
              size="small"
              sx={{ flex: 1 }}
            />

            <IconButton
              color="error"
              onClick={() => remove(index)}
              disabled={fields.length <= 2}
              sx={{ alignSelf: { xs: 'flex-end', sm: 'center' } }}
            >
              <Iconify icon="solar:trash-bin-trash-bold" />
            </IconButton>
          </Box>
        ))}
      </Stack>

      <Button
        variant="outlined"
        startIcon={<Iconify icon="mingcute:add-line" />}
        onClick={() => append({ leftText: '', rightText: '' })}
        sx={{ mt: 2 }}
      >
        Ajouter une paire
      </Button>
    </Card>
  );
}
