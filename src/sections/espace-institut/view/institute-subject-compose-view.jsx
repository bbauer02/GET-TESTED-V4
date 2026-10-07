'use client';

import { toast } from 'sonner';
import { varAlpha } from 'minimal-shared/utils';
import { useBoolean } from 'minimal-shared/hooks';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardHeader from '@mui/material/CardHeader';
import InputLabel from '@mui/material/InputLabel';
import LoadingButton from '@mui/lab/LoadingButton';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { useRouter, useParams } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';
import axiosInstance, { endpoints } from 'src/lib/axios';
import { useGetInstituteQuestions, useGetSubjectForScheduledExam } from 'src/actions/questions';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, TableHeadCustom, TablePaginationCustom } from 'src/components/table';

import { useCurrentInstitute } from 'src/auth/hooks';
import { getErrorMessage } from 'src/auth/utils/error-message';

// ----------------------------------------------------------------------

const STATUS_COLORS = {
  DRAFT: 'default',
  LOCKED: 'success',
  ARCHIVED: 'warning',
};

const STATUS_LABELS = {
  DRAFT: 'Brouillon',
  LOCKED: 'Verrouillé',
  ARCHIVED: 'Archivé',
};

const QUESTION_TYPE_LABELS = {
  mcq: 'QCM',
  fill_blank: 'Texte à trous',
  highlight: 'Surlignage',
  ordering: 'Ordonnancement',
  matching: 'Appariement',
};

const QUESTION_TYPE_COLORS = {
  mcq: 'info',
  fill_blank: 'warning',
  highlight: 'secondary',
  ordering: 'primary',
  matching: 'success',
};

// ----------------------------------------------------------------------

export function InstituteSubjectComposeView() {
  const router = useRouter();
  const { scheduledExamId } = useParams();
  const currentInstitute = useCurrentInstitute();

  const {
    subject,
    subjectLoading,
    subjectError,
    subjectMutate,
  } = useGetSubjectForScheduledExam(scheduledExamId);

  const [creating, setCreating] = useState(false);

  const isDraft = subject?.status === 'DRAFT';
  const isLocked = subject?.status === 'LOCKED';
  const isArchived = subject?.status === 'ARCHIVED';
  const isReadOnly = isLocked || isArchived;

  // Inline editable fields
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPassingScore, setEditPassingScore] = useState('');
  const [titleDirty, setTitleDirty] = useState(false);

  // Sync fields when subject loads
  const subjectId = subject?.id;
  const subjectTitle = subject?.title || '';
  const subjectDescription = subject?.description || '';
  const subjectPassingScore = subject?.passingScore ?? '';

  useMemo(() => {
    if (!titleDirty && subjectId) {
      setEditTitle(subjectTitle);
      setEditDescription(subjectDescription);
      setEditPassingScore(subjectPassingScore);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, subjectTitle, subjectDescription, subjectPassingScore]);

  // Dialogs
  const addDialog = useBoolean();
  const lockDialog = useBoolean();

  // Subject questions
  const subjectQuestions = useMemo(() => {
    const items = subject?.subjectQuestions || [];
    return [...items].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }, [subject?.subjectQuestions]);

  // Stats
  const stats = useMemo(() => {
    let totalPoints = 0;
    let totalDuration = 0;
    let seedCount = 0;
    let questionCount = 0;

    subjectQuestions.forEach((sq) => {
      if (sq.isSeed || sq.seed) {
        seedCount += 1;
      } else {
        questionCount += 1;
        totalPoints += sq.pointsOverride ?? sq.question?.points ?? 0;
      }
      totalDuration += sq.question?.duration ?? 0;
    });

    return { totalPoints, totalDuration, seedCount, questionCount };
  }, [subjectQuestions]);

  // ---- Create subject ----
  const handleCreateSubject = useCallback(async () => {
    setCreating(true);
    try {
      await axiosInstance.post('/api/subjects', {
        scheduledExam: `/api/scheduled-exams/${scheduledExamId}`,
        titre: 'Nouveau sujet',
      });
      toast.success('Sujet créé avec succès');
      subjectMutate();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setCreating(false);
    }
  }, [scheduledExamId, subjectMutate]);

  // ---- Save subject metadata ----
  const [saving, setSaving] = useState(false);
  const handleSaveMetadata = useCallback(async () => {
    setSaving(true);
    try {
      await axiosInstance.patch(
        endpoints.subject.details(subject.id),
        {
          title: editTitle,
          description: editDescription,
          passingScore: editPassingScore ? Number(editPassingScore) : null,
        },
        { headers: { 'Content-Type': 'application/merge-patch+json' } }
      );
      toast.success('Sujet mis à jour');
      setTitleDirty(false);
      subjectMutate();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }, [subject?.id, editTitle, editDescription, editPassingScore, subjectMutate]);

  // ---- Remove question ----
  const handleRemoveQuestion = useCallback(
    async (subjectQuestionId) => {
      try {
        await axiosInstance.delete(`/api/subject-questions/${subjectQuestionId}`);
        toast.success('Question retirée du sujet');
        subjectMutate();
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    },
    [subjectMutate]
  );

  // ---- Toggle seed ----
  const handleToggleSeed = useCallback(
    async (subjectQuestion) => {
      try {
        const newSeed = !(subjectQuestion.isSeed || subjectQuestion.seed);
        await axiosInstance.patch(
          `/api/subject-questions/${subjectQuestion.id}`,
          { isSeed: newSeed },
          { headers: { 'Content-Type': 'application/merge-patch+json' } }
        );
        subjectMutate();
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    },
    [subjectMutate]
  );

  // ---- Update points override ----
  const handlePointsOverride = useCallback(
    async (subjectQuestion, value) => {
      try {
        await axiosInstance.patch(
          `/api/subject-questions/${subjectQuestion.id}`,
          { pointsOverride: value ? Number(value) : null },
          { headers: { 'Content-Type': 'application/merge-patch+json' } }
        );
        subjectMutate();
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    },
    [subjectMutate]
  );

  // ---- Move question (reorder) ----
  const handleMoveQuestion = useCallback(
    async (subjectQuestion, direction) => {
      const currentPos = subjectQuestion.position ?? 0;
      const newPos = direction === 'up' ? currentPos - 1 : currentPos + 1;
      if (newPos < 0 || newPos >= subjectQuestions.length) return;

      try {
        await axiosInstance.patch(
          `/api/subject-questions/${subjectQuestion.id}`,
          { position: newPos },
          { headers: { 'Content-Type': 'application/merge-patch+json' } }
        );
        subjectMutate();
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    },
    [subjectQuestions.length, subjectMutate]
  );

  // ---- Lock subject ----
  const [locking, setLocking] = useState(false);
  const handleLockSubject = useCallback(async () => {
    setLocking(true);
    try {
      await axiosInstance.post(endpoints.subject.lock(subject.id), {});
      toast.success('Sujet verrouillé avec succès');
      lockDialog.onFalse();
      subjectMutate();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLocking(false);
    }
  }, [subject?.id, lockDialog, subjectMutate]);

  // ---- Add question callback (from dialog) ----
  const handleQuestionAdded = useCallback(() => {
    subjectMutate();
  }, [subjectMutate]);

  // ---- Loading ----
  if (subjectLoading) {
    return (
      <DashboardContent>
        <LoadingScreen />
      </DashboardContent>
    );
  }

  // ---- No subject yet ----
  if (!subject || subjectError) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Composition du sujet"
          links={[
            { name: 'Tableau de bord', href: paths.dashboard.root },
            { name: currentInstitute?.label || 'Institut', href: paths.dashboard.espaceInstitut.root },
            { name: 'Composition du sujet' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <EmptyContent
          title="Aucun sujet pour cette épreuve"
          description="Créez un sujet pour commencer à composer les questions de l'examen."
          action={
            <LoadingButton
              variant="contained"
              loading={creating}
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={handleCreateSubject}
              sx={{ mt: 2 }}
            >
              Créer le sujet
            </LoadingButton>
          }
        />
      </DashboardContent>
    );
  }

  // ---- Render subject header ----
  const renderHeader = (
    <Card sx={{ mb: 3 }}>
      <CardHeader
        title={
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography variant="h6">
              {subject.title || 'Sujet sans titre'}
            </Typography>
            <Label color={STATUS_COLORS[subject.status] || 'default'}>
              {STATUS_LABELS[subject.status] || subject.status}
            </Label>
            {subject.mode && (
              <Chip label={subject.mode} size="small" variant="outlined" />
            )}
          </Stack>
        }
        action={
          isDraft && (
            <Stack direction="row" spacing={1}>
              <Button
                variant="soft"
                color="primary"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={addDialog.onTrue}
              >
                Ajouter une question
              </Button>
              <Button
                variant="contained"
                color="warning"
                startIcon={<Iconify icon="solar:lock-bold" />}
                onClick={lockDialog.onTrue}
                disabled={subjectQuestions.length === 0}
              >
                Verrouiller
              </Button>
            </Stack>
          )
        }
      />

      {isDraft && (
        <CardContent>
          <Stack spacing={2}>
            <TextField
              label="Titre du sujet"
              value={editTitle}
              onChange={(e) => {
                setEditTitle(e.target.value);
                setTitleDirty(true);
              }}
              fullWidth
              size="small"
            />

            <TextField
              label="Description"
              value={editDescription}
              onChange={(e) => {
                setEditDescription(e.target.value);
                setTitleDirty(true);
              }}
              fullWidth
              size="small"
              multiline
              rows={2}
            />

            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                label="Score de passage"
                value={editPassingScore}
                onChange={(e) => {
                  setEditPassingScore(e.target.value);
                  setTitleDirty(true);
                }}
                size="small"
                type="number"
                sx={{ width: 200 }}
                slotProps={{
                  input: {
                    endAdornment: <InputAdornment position="end">pts</InputAdornment>,
                  },
                }}
              />

              <LoadingButton
                variant="contained"
                size="small"
                loading={saving}
                onClick={handleSaveMetadata}
                disabled={!titleDirty}
              >
                Enregistrer
              </LoadingButton>
            </Stack>
          </Stack>
        </CardContent>
      )}

      {isReadOnly && subject.description && (
        <CardContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {subject.description}
          </Typography>
        </CardContent>
      )}
    </Card>
  );

  // ---- Render stats card ----
  const renderStats = (
    <Card>
      <CardHeader title="Statistiques du sujet" />
      <CardContent>
        <Stack spacing={2}>
          <StatRow
            icon="solar:question-circle-bold"
            label="Questions (hors seed)"
            value={stats.questionCount}
          />
          <StatRow
            icon="solar:test-tube-bold"
            label="Questions seed"
            value={stats.seedCount}
          />
          <StatRow
            icon="solar:star-bold"
            label="Total points"
            value={stats.totalPoints}
          />
          <StatRow
            icon="solar:medal-ribbon-bold"
            label="Score de passage"
            value={subject.passingScore ?? '—'}
          />
          <StatRow
            icon="solar:clock-circle-bold"
            label="Durée estimée"
            value={stats.totalDuration > 0 ? `${stats.totalDuration} min` : '—'}
          />
        </Stack>
      </CardContent>
    </Card>
  );

  // ---- Render questions list ----
  const renderQuestions = (
    <Card>
      <CardHeader
        title={`Questions du sujet (${subjectQuestions.length})`}
      />

      {subjectQuestions.length === 0 ? (
        <CardContent>
          <EmptyContent
            title="Aucune question"
            description="Ajoutez des questions depuis la banque de questions."
            action={
              isDraft ? (
                <Button
                  variant="contained"
                  startIcon={<Iconify icon="mingcute:add-line" />}
                  onClick={addDialog.onTrue}
                  sx={{ mt: 2 }}
                >
                  Ajouter une question
                </Button>
              ) : null
            }
          />
        </CardContent>
      ) : (
        <Stack spacing={0} divider={<Divider />}>
          {subjectQuestions.map((sq, index) => {
            const question = sq.question || {};
            const qType = question.type || question.questionType || '—';
            const isSeed = sq.isSeed || sq.seed;
            const points = sq.pointsOverride ?? question.points ?? 0;

            return (
              <Stack
                key={sq.id || sq['@id']}
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{
                  px: 3,
                  py: 1.5,
                  bgcolor: isSeed
                    ? (theme) => varAlpha(theme.vars.palette.info.mainChannel, 0.04)
                    : 'transparent',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                {/* Position & drag */}
                {isDraft && (
                  <Stack spacing={0}>
                    <IconButton
                      size="small"
                      disabled={index === 0}
                      onClick={() => handleMoveQuestion(sq, 'up')}
                    >
                      <Iconify icon="solar:alt-arrow-up-bold" width={16} />
                    </IconButton>
                    <IconButton
                      size="small"
                      disabled={index === subjectQuestions.length - 1}
                      onClick={() => handleMoveQuestion(sq, 'down')}
                    >
                      <Iconify icon="solar:alt-arrow-down-bold" width={16} />
                    </IconButton>
                  </Stack>
                )}

                {/* Position number */}
                <Typography
                  variant="subtitle2"
                  sx={{
                    width: 32,
                    textAlign: 'center',
                    color: 'text.secondary',
                    flexShrink: 0,
                  }}
                >
                  {(sq.position ?? index) + 1}
                </Typography>

                {/* Question info */}
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" noWrap>
                    {question.label || 'Question sans titre'}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                    <Label
                      color={QUESTION_TYPE_COLORS[qType] || 'default'}
                      variant="soft"
                    >
                      {QUESTION_TYPE_LABELS[qType] || qType}
                    </Label>
                    {question.level && (
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {typeof question.level === 'object' ? question.level.label : question.level}
                      </Typography>
                    )}
                    {isSeed && (
                      <Label color="info" variant="soft">
                        Seed
                      </Label>
                    )}
                  </Stack>
                </Box>

                {/* Points */}
                {isDraft ? (
                  <TextField
                    size="small"
                    type="number"
                    value={sq.pointsOverride ?? ''}
                    placeholder={String(question.points ?? 0)}
                    onChange={(e) => handlePointsOverride(sq, e.target.value)}
                    sx={{ width: 80 }}
                    slotProps={{
                      input: {
                        endAdornment: <InputAdornment position="end">pt</InputAdornment>,
                      },
                    }}
                  />
                ) : (
                  <Typography variant="subtitle2" sx={{ flexShrink: 0 }}>
                    {points} pt{points > 1 ? 's' : ''}
                  </Typography>
                )}

                {/* Seed toggle */}
                {isDraft && (
                  <Tooltip title={isSeed ? 'Désactiver seed' : 'Activer seed'}>
                    <Switch
                      size="small"
                      checked={!!isSeed}
                      onChange={() => handleToggleSeed(sq)}
                    />
                  </Tooltip>
                )}

                {/* Remove */}
                {isDraft && (
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemoveQuestion(sq.id)}
                  >
                    <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                  </IconButton>
                )}
              </Stack>
            );
          })}
        </Stack>
      )}
    </Card>
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Composition du sujet"
        links={[
          { name: 'Tableau de bord', href: paths.dashboard.root },
          { name: currentInstitute?.label || 'Institut', href: paths.dashboard.espaceInstitut.root },
          { name: 'Sessions', href: paths.dashboard.espaceInstitut.sessions },
          { name: 'Composition du sujet' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {renderHeader}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          {renderQuestions}
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          {renderStats}
        </Grid>
      </Grid>

      {/* ---- Add question dialog ---- */}
      {addDialog.value && subject && (
        <AddQuestionDialog
          open
          onClose={addDialog.onFalse}
          subject={subject}
          subjectQuestions={subjectQuestions}
          instituteId={currentInstitute?.id}
          onSuccess={handleQuestionAdded}
        />
      )}

      {/* ---- Confirm lock ---- */}
      <ConfirmDialog
        open={lockDialog.value}
        onClose={lockDialog.onFalse}
        title="Verrouiller le sujet"
        content="Une fois verrouillé, le sujet ne pourra plus être modifié. Les questions seront figées. Voulez-vous continuer ?"
        action={
          <LoadingButton
            variant="contained"
            color="warning"
            loading={locking}
            onClick={handleLockSubject}
          >
            Verrouiller
          </LoadingButton>
        }
      />
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

function StatRow({ icon, label, value }) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <Stack direction="row" alignItems="center" spacing={1}>
        <Iconify icon={icon} width={20} sx={{ color: 'text.secondary' }} />
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {label}
        </Typography>
      </Stack>
      <Typography variant="subtitle2">{value}</Typography>
    </Stack>
  );
}

// ----------------------------------------------------------------------

const ADD_TABLE_HEAD = [
  { id: 'label', label: 'Question' },
  { id: 'type', label: 'Type', width: 140 },
  { id: 'level', label: 'Niveau', width: 120 },
  { id: 'points', label: 'Points', width: 80 },
  { id: 'duration', label: 'Durée', width: 80 },
  { id: '', width: 56 },
];

function AddQuestionDialog({ open, onClose, subject, subjectQuestions, instituteId, onSuccess }) {
  const table = useTable({ defaultRowsPerPage: 10 });

  // Filters
  const [searchText, setSearchText] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Fetch questions for this institute
  const { questions, questionsLoading } = useGetInstituteQuestions(instituteId);

  // Already added question IDs
  const addedQuestionIds = useMemo(() => {
    const ids = new Set();
    subjectQuestions.forEach((sq) => {
      const qId = sq.question?.id || sq.question?.['@id'];
      if (qId) ids.add(qId);
      // Also store IRI form
      if (sq.question?.id) ids.add(`/api/questions/${sq.question.id}`);
    });
    return ids;
  }, [subjectQuestions]);

  // Get assessment from subject/scheduledExam for filtering
  const subjectAssessmentId = subject?.scheduledExam?.exam?.assessment?.id
    || subject?.scheduledExam?.exam?.assessment?.['@id']
    || null;

  // Filter questions
  const filteredQuestions = useMemo(() => {
    let result = questions.filter((q) => {
      const qId = q.id || q['@id'];
      const qIri = q['@id'] || `/api/questions/${q.id}`;
      return !addedQuestionIds.has(qId) && !addedQuestionIds.has(qIri);
    });

    // Only show CALIBRATED or PRETESTING questions
    result = result.filter(
      (q) => q.status === 'CALIBRATED' || q.status === 'PRETESTING'
    );

    // Filter by assessment if known
    if (subjectAssessmentId) {
      result = result.filter((q) => {
        const aId = q.assessment?.id || q.assessment?.['@id'];
        return aId === subjectAssessmentId;
      });
    }

    if (searchText) {
      const lower = searchText.toLowerCase();
      result = result.filter((q) => (q.label || '').toLowerCase().includes(lower));
    }

    if (levelFilter !== 'all') {
      result = result.filter((q) => {
        const lId = q.level?.id || q.level?.['@id'];
        return lId === levelFilter;
      });
    }

    if (typeFilter !== 'all') {
      result = result.filter((q) => (q.type || q.questionType) === typeFilter);
    }

    return result;
  }, [questions, addedQuestionIds, subjectAssessmentId, searchText, levelFilter, typeFilter]);

  const dataSliced = filteredQuestions.slice(
    table.page * table.rowsPerPage,
    table.page * table.rowsPerPage + table.rowsPerPage
  );

  // Level options from available questions
  const levelOptions = useMemo(() => {
    const map = new Map();
    questions.forEach((q) => {
      const level = q.level;
      if (level && typeof level === 'object') {
        const key = level.id || level['@id'];
        if (key && !map.has(key)) {
          map.set(key, level.label || key);
        }
      }
    });
    return Array.from(map, ([value, label]) => ({ value, label }));
  }, [questions]);

  // Add question
  const [adding, setAdding] = useState(null);
  const handleAddQuestion = useCallback(
    async (question) => {
      const questionId = question.id;
      setAdding(questionId);
      try {
        await axiosInstance.post(endpoints.subject.questions(subject.id), {
          question: `/api/questions/${questionId}`,
        });
        toast.success('Question ajoutée au sujet');
        onSuccess();
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setAdding(null);
      }
    },
    [subject.id, onSuccess]
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Ajouter une question au sujet</DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {/* Filters */}
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          sx={{ px: 2.5, py: 2 }}
          flexWrap="wrap"
        >
          <TextField
            size="small"
            placeholder="Rechercher..."
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              table.onChangePage(null, 0);
            }}
            sx={{ minWidth: 200 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              },
            }}
          />

          {levelOptions.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Niveau</InputLabel>
              <Select
                value={levelFilter}
                label="Niveau"
                onChange={(e) => {
                  setLevelFilter(e.target.value);
                  table.onChangePage(null, 0);
                }}
              >
                <MenuItem value="all">Tous</MenuItem>
                {levelOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={typeFilter}
              label="Type"
              onChange={(e) => {
                setTypeFilter(e.target.value);
                table.onChangePage(null, 0);
              }}
            >
              <MenuItem value="all">Tous</MenuItem>
              <MenuItem value="mcq">QCM</MenuItem>
              <MenuItem value="fill_blank">Texte à trous</MenuItem>
              <MenuItem value="highlight">Surlignage</MenuItem>
              <MenuItem value="ordering">Ordonnancement</MenuItem>
              <MenuItem value="matching">Appariement</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {/* Table */}
        <TableContainer>
          <Scrollbar sx={{ maxHeight: 400 }}>
            <Table sx={{ minWidth: 600 }}>
              <TableHeadCustom headCells={ADD_TABLE_HEAD} />
              <TableBody>
                {questionsLoading ? (
                  <TableRow>
                    <TableCell colSpan={ADD_TABLE_HEAD.length} align="center" sx={{ py: 4 }}>
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : filteredQuestions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={ADD_TABLE_HEAD.length}>
                      <EmptyContent title="Aucune question disponible" />
                    </TableCell>
                  </TableRow>
                ) : (
                  dataSliced.map((q) => {
                    const qType = q.type || q.questionType || '—';
                    return (
                      <TableRow key={q.id || q['@id']} hover>
                        <TableCell>
                          <Typography variant="subtitle2" noWrap>
                            {q.label}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Label
                            color={QUESTION_TYPE_COLORS[qType] || 'default'}
                            variant="soft"
                          >
                            {QUESTION_TYPE_LABELS[qType] || qType}
                          </Label>
                        </TableCell>
                        <TableCell>
                          {typeof q.level === 'object' ? q.level?.label : q.level || '—'}
                        </TableCell>
                        <TableCell>{q.points ?? '—'}</TableCell>
                        <TableCell>{q.duration ? `${q.duration}m` : '—'}</TableCell>
                        <TableCell>
                          <LoadingButton
                            size="small"
                            variant="soft"
                            color="primary"
                            loading={adding === q.id}
                            onClick={() => handleAddQuestion(q)}
                            startIcon={<Iconify icon="mingcute:add-line" />}
                          >
                            Ajouter
                          </LoadingButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>

        <TablePaginationCustom
          page={table.page}
          count={filteredQuestions.length}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
}
