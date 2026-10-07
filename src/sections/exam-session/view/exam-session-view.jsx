'use client';

import { toast } from 'sonner';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import LinearProgress from '@mui/material/LinearProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import axiosInstance, { endpoints } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';
import { LoadingScreen } from 'src/components/loading-screen';

import { ExamQuestionRenderer } from '../exam-question-renderer';

// ----------------------------------------------------------------------

function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ----------------------------------------------------------------------

export function ExamSessionView({ enrollmentExamId }) {
  const router = useRouter();
  const theme = useTheme();

  const [examData, setExamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const questionStartTimeRef = useRef(Date.now());

  const [timeLeft, setTimeLeft] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [showGridDialog, setShowGridDialog] = useState(false);

  // ------ Load exam data ------

  useEffect(() => {
    let cancelled = false;

    async function loadExam() {
      try {
        const res = await axiosInstance.get(endpoints.examSession.start(enrollmentExamId));
        if (!cancelled) {
          setExamData(res.data);
          if (res.data.durationMinutes) {
            setTimeLeft(res.data.durationMinutes * 60);
          }
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Impossible de charger l\'examen.');
          setLoading(false);
        }
      }
    }

    loadExam();
    return () => { cancelled = true; };
  }, [enrollmentExamId]);

  // ------ Timer ------

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return undefined;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeLeft === 0 && examData) {
      handleFinishExam();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  // ------ Derived data ------

  const questions = useMemo(() => examData?.questions || [], [examData]);
  const currentQuestion = questions[currentIndex] || null;
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const progress = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;

  // ------ Submit answer to API ------

  const submitAnswer = useCallback(async (questionId, answerData) => {
    if (!answerData) return;

    const responseTimeMs = Date.now() - questionStartTimeRef.current;

    try {
      await axiosInstance.post(endpoints.examSession.answer(enrollmentExamId), {
        subjectQuestionId: questionId,
        givenAnswer: answerData,
        responseTimeMs,
      });
    } catch (err) {
      console.error('Failed to submit answer:', err);
    }
  }, [enrollmentExamId]);

  // ------ Answer handler ------

  const handleAnswer = useCallback((answerData) => {
    if (!currentQuestion) return;
    const questionId = currentQuestion.id;
    setAnswers((prev) => ({ ...prev, [questionId]: answerData }));
  }, [currentQuestion]);

  // ------ Navigation ------

  const handleNavigate = useCallback(async (newIndex) => {
    if (!currentQuestion) {
      setCurrentIndex(newIndex);
      return;
    }

    const questionId = currentQuestion.id;
    const currentAnswer = answers[questionId];

    // Submit current answer before navigating
    if (currentAnswer) {
      await submitAnswer(questionId, currentAnswer);
    }

    setCurrentIndex(newIndex);
    questionStartTimeRef.current = Date.now();
  }, [currentQuestion, answers, submitAnswer]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) handleNavigate(currentIndex - 1);
  }, [currentIndex, handleNavigate]);

  const handleNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) handleNavigate(currentIndex + 1);
  }, [currentIndex, totalQuestions, handleNavigate]);

  const handleGoToQuestion = useCallback((index) => {
    handleNavigate(index);
    setShowGridDialog(false);
  }, [handleNavigate]);

  // ------ Finish exam ------

  const handleFinishExam = useCallback(async () => {
    setIsSubmitting(true);
    setShowFinishDialog(false);

    try {
      // Submit current answer if any
      if (currentQuestion && answers[currentQuestion.id]) {
        await submitAnswer(currentQuestion.id, answers[currentQuestion.id]);
      }

      const res = await axiosInstance.post(endpoints.examSession.finish(enrollmentExamId));

      toast.success('Examen terminé !');
      router.push(paths.dashboard.examSession.results(enrollmentExamId));
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la finalisation de l\'examen.');
      setIsSubmitting(false);
    }
  }, [enrollmentExamId, currentQuestion, answers, submitAnswer, router]);

  // ------ Loading / Error states ------

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 2, p: 3 }}>
        <Iconify icon="solar:danger-triangle-bold" width={64} sx={{ color: 'error.main' }} />
        <Typography variant="h5">Erreur</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 400 }}>
          {error}
        </Typography>
        <Button variant="contained" onClick={() => router.push(paths.dashboard.root)}>
          Retour au tableau de bord
        </Button>
      </Box>
    );
  }

  if (!currentQuestion) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Typography>Aucune question dans cet examen.</Typography>
      </Box>
    );
  }

  // ------ Render ------

  const timerColor = timeLeft !== null && timeLeft < 60 ? 'error.main' : timeLeft !== null && timeLeft < 300 ? 'warning.main' : 'text.primary';

  const renderHeader = (
    <Box
      sx={{
        px: 3,
        py: 1.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${theme.vars.palette.divider}`,
        bgcolor: 'background.paper',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={2}>
        <Iconify icon="solar:document-text-bold" width={28} sx={{ color: 'primary.main' }} />
        <Box>
          <Typography variant="subtitle1" noWrap>
            {examData?.examName || 'Examen'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {examData?.assessmentName || ''}
          </Typography>
        </Box>
      </Stack>

      <Stack direction="row" alignItems="center" spacing={2}>
        {timeLeft !== null && (
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Iconify icon="solar:clock-circle-bold" width={20} sx={{ color: timerColor }} />
            <Typography variant="subtitle2" sx={{ color: timerColor, fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(timeLeft)}
            </Typography>
          </Stack>
        )}

        <Chip
          label={`${answeredCount} / ${totalQuestions} répondu(s)`}
          size="small"
          color={answeredCount === totalQuestions ? 'success' : 'default'}
          variant="outlined"
        />

        <Tooltip title="Grille de questions">
          <IconButton onClick={() => setShowGridDialog(true)}>
            <Iconify icon="solar:widget-5-bold" width={22} />
          </IconButton>
        </Tooltip>

        <Button
          variant="contained"
          color="error"
          size="small"
          onClick={() => setShowFinishDialog(true)}
          disabled={isSubmitting}
          startIcon={<Iconify icon="solar:check-circle-bold" />}
        >
          Terminer
        </Button>
      </Stack>
    </Box>
  );

  const renderProgress = (
    <Box sx={{ px: 3, py: 1 }}>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          Question {currentIndex + 1} sur {totalQuestions}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {Math.round(progress)}%
        </Typography>
      </Stack>
      <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 3 }} />
    </Box>
  );

  const renderQuestion = (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', px: 3, py: 2 }}>
      <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Chip
              label={`Q${currentIndex + 1}`}
              color="primary"
              size="small"
            />
            {currentQuestion.points && (
              <Chip
                label={`${currentQuestion.points} pt(s)`}
                variant="outlined"
                size="small"
              />
            )}
            {currentQuestion.type && (
              <Chip
                label={currentQuestion.type}
                variant="soft"
                size="small"
                color="info"
              />
            )}
          </Stack>

          <ExamQuestionRenderer
            question={currentQuestion}
            answer={answers[currentQuestion.id] || null}
            onAnswer={handleAnswer}
          />
        </CardContent>
      </Card>
    </Box>
  );

  const renderNavigation = (
    <Box
      sx={{
        px: 3,
        py: 2,
        display: 'flex',
        justifyContent: 'space-between',
        borderTop: `1px solid ${theme.vars.palette.divider}`,
        bgcolor: 'background.paper',
      }}
    >
      <Button
        variant="outlined"
        startIcon={<Iconify icon="solar:arrow-left-line-duotone" />}
        onClick={handlePrevious}
        disabled={currentIndex === 0 || isSubmitting}
      >
        Précédent
      </Button>

      <Button
        variant="outlined"
        onClick={() => setShowGridDialog(true)}
      >
        {currentIndex + 1} / {totalQuestions}
      </Button>

      <Button
        variant="contained"
        endIcon={<Iconify icon="solar:arrow-right-line-duotone" />}
        onClick={handleNext}
        disabled={currentIndex === totalQuestions - 1 || isSubmitting}
      >
        Suivant
      </Button>
    </Box>
  );

  const renderFinishDialog = (
    <Dialog open={showFinishDialog} onClose={() => setShowFinishDialog(false)} maxWidth="xs" fullWidth>
      <DialogTitle>Terminer l&apos;examen ?</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Vous avez répondu à <strong>{answeredCount}</strong> question(s) sur <strong>{totalQuestions}</strong>.
        </Typography>
        {answeredCount < totalQuestions && (
          <Typography variant="body2" color="warning.main">
            Attention : {totalQuestions - answeredCount} question(s) sans réponse.
          </Typography>
        )}
        <Typography variant="body2" sx={{ mt: 1 }}>
          Cette action est irréversible. Voulez-vous continuer ?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowFinishDialog(false)} color="inherit">
          Annuler
        </Button>
        <Button onClick={handleFinishExam} variant="contained" color="error" disabled={isSubmitting}>
          Confirmer
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderGridDialog = (
    <Dialog open={showGridDialog} onClose={() => setShowGridDialog(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Grille de questions</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))',
            gap: 1,
            pt: 1,
          }}
        >
          {questions.map((q, index) => {
            const isAnswered = !!answers[q.id];
            const isCurrent = index === currentIndex;

            let bgcolor = 'grey.200';
            let color = 'text.secondary';

            if (isCurrent) {
              bgcolor = 'primary.main';
              color = 'primary.contrastText';
            } else if (isAnswered) {
              bgcolor = 'success.main';
              color = 'success.contrastText';
            }

            return (
              <Button
                key={q.id}
                variant="contained"
                size="small"
                onClick={() => handleGoToQuestion(index)}
                sx={{
                  minWidth: 0,
                  width: 48,
                  height: 48,
                  bgcolor,
                  color,
                  fontWeight: 'bold',
                  '&:hover': {
                    bgcolor: isCurrent ? 'primary.dark' : isAnswered ? 'success.dark' : 'grey.400',
                  },
                }}
              >
                {index + 1}
              </Button>
            );
          })}
        </Box>

        <Stack direction="row" spacing={2} sx={{ mt: 2, justifyContent: 'center' }}>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'primary.main' }} />
            <Typography variant="caption">Actuelle</Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'success.main' }} />
            <Typography variant="caption">Répondue</Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'grey.300' }} />
            <Typography variant="caption">Sans réponse</Typography>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowGridDialog(false)}>Fermer</Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      {renderHeader}
      {renderProgress}
      {renderQuestion}
      {renderNavigation}
      {renderFinishDialog}
      {renderGridDialog}
    </Box>
  );
}
