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

// Identifiant d'une question dans l'épreuve (renvoyé par l'API)
const questionKey = (question) => question?.subjectQuestionId || question?.id;

const SAVE_RETRY_DELAY_MS = 3000;

// Ces endpoints renvoient des objets simples : en JSON-LD, API Platform les transformerait en collection
const JSON_REQUEST = { headers: { Accept: 'application/json' } };

// ----------------------------------------------------------------------

export function ExamSessionView({ enrollmentExamId }) {
  const router = useRouter();
  const theme = useTheme();

  const [examData, setExamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  // État de sauvegarde par question : 'saving' | 'saved' | 'error'
  const [saveStatus, setSaveStatus] = useState({});
  const questionStartTimeRef = useRef(0);
  const answersRef = useRef({});
  const saveTimersRef = useRef({});

  // Échéance calée sur l'horloge du serveur (décalage = heure serveur - heure locale)
  const [endsAtMs, setEndsAtMs] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [showGridDialog, setShowGridDialog] = useState(false);
  const finishingRef = useRef(false);

  // ------ Load exam data (démarrage ou reprise) ------

  useEffect(() => {
    let cancelled = false;

    async function loadExam() {
      try {
        const res = await axiosInstance.get(endpoints.examSession.start(enrollmentExamId), JSON_REQUEST);
        if (cancelled) return;

        const data = res.data;
        questionStartTimeRef.current = Date.now();
        setExamData(data);

        const saved = data.savedAnswers || {};
        answersRef.current = saved;
        setAnswers(saved);
        setSaveStatus(Object.fromEntries(Object.keys(saved).map((key) => [key, 'saved'])));

        if (data.endsAt) {
          const offset = new Date(data.serverNow).getTime() - Date.now();
          setEndsAtMs(new Date(data.endsAt).getTime() - offset);
        }
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Impossible de charger l'épreuve.");
          setLoading(false);
        }
      }
    }

    loadExam();
    return () => {
      cancelled = true;
    };
  }, [enrollmentExamId]);

  // ------ Timer (recalculé depuis l'échéance : insensible aux onglets en veille) ------

  useEffect(() => {
    if (!endsAtMs) return undefined;

    const tick = () => setTimeLeft(Math.max(0, Math.round((endsAtMs - Date.now()) / 1000)));
    tick();
    const interval = setInterval(tick, 1000);

    return () => clearInterval(interval);
  }, [endsAtMs]);

  // ------ Derived data ------

  const questions = useMemo(() => examData?.questions || [], [examData]);
  const currentQuestion = questions[currentIndex] || null;
  const currentKey = questionKey(currentQuestion);
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const unsavedKeys = Object.keys(answers).filter((key) => saveStatus[key] !== 'saved');
  const progress = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;

  // ------ Sauvegarde d'une réponse (avec nouvel essai automatique) ------

  const saveAnswer = useCallback(
    async (key) => {
      const answerData = answersRef.current[key];
      if (!answerData) return true;

      clearTimeout(saveTimersRef.current[key]);
      setSaveStatus((prev) => ({ ...prev, [key]: 'saving' }));

      try {
        await axiosInstance.post(endpoints.examSession.answer(enrollmentExamId), {
          subjectQuestionId: key,
          givenAnswer: answerData,
          responseTimeMs: Date.now() - questionStartTimeRef.current,
        }, JSON_REQUEST);
        // Une modification a pu arriver pendant l'envoi : ne marquer « enregistrée » que si inchangée
        setSaveStatus((prev) => ({
          ...prev,
          [key]: answersRef.current[key] === answerData ? 'saved' : prev[key],
        }));
        return true;
      } catch (err) {
        setSaveStatus((prev) => ({ ...prev, [key]: 'error' }));
        if (/écoulé/i.test(err.message || '')) {
          return false;
        }
        saveTimersRef.current[key] = setTimeout(() => saveAnswer(key), SAVE_RETRY_DELAY_MS);
        return false;
      }
    },
    [enrollmentExamId]
  );

  useEffect(() => () => Object.values(saveTimersRef.current).forEach(clearTimeout), []);

  // ------ Answer handler : la réponse est enregistrée dès qu'elle change ------

  const handleAnswer = useCallback(
    (answerData) => {
      if (!currentKey) return;
      answersRef.current = { ...answersRef.current, [currentKey]: answerData };
      setAnswers(answersRef.current);
      setSaveStatus((prev) => ({ ...prev, [currentKey]: 'saving' }));

      clearTimeout(saveTimersRef.current[currentKey]);
      saveTimersRef.current[currentKey] = setTimeout(() => saveAnswer(currentKey), 600);
    },
    [currentKey, saveAnswer]
  );

  // ------ Navigation ------

  const handleNavigate = useCallback(
    (newIndex) => {
      if (currentKey && answersRef.current[currentKey] && saveStatus[currentKey] !== 'saved') {
        saveAnswer(currentKey);
      }
      setCurrentIndex(newIndex);
      questionStartTimeRef.current = Date.now();
    },
    [currentKey, saveStatus, saveAnswer]
  );

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) handleNavigate(currentIndex - 1);
  }, [currentIndex, handleNavigate]);

  const handleNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) handleNavigate(currentIndex + 1);
  }, [currentIndex, totalQuestions, handleNavigate]);

  const handleGoToQuestion = useCallback(
    (index) => {
      handleNavigate(index);
      setShowGridDialog(false);
    },
    [handleNavigate]
  );

  // ------ Finish exam ------

  const handleFinishExam = useCallback(async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setIsSubmitting(true);
    setShowFinishDialog(false);

    try {
      // Dernière tentative d'enregistrement des réponses en attente
      const pending = Object.keys(answersRef.current);
      await Promise.all(pending.map((key) => saveAnswer(key)));

      const { data: result } = await axiosInstance.post(endpoints.examSession.finish(enrollmentExamId), {}, JSON_REQUEST);

      // Détail par compétence affiché sur la page de résultats (non stocké côté API)
      try {
        sessionStorage.setItem(`exam_result_${enrollmentExamId}`, JSON.stringify(result));
      } catch {
        // stockage indisponible : la page de résultats affichera la note seule
      }

      toast.success('Épreuve terminée !');
      router.push(paths.dashboard.examSession.results(enrollmentExamId));
    } catch (err) {
      finishingRef.current = false;
      toast.error(err.message || "Erreur lors de la finalisation de l'épreuve.");
      setIsSubmitting(false);
    }
  }, [enrollmentExamId, saveAnswer, router]);

  // Soumission automatique à la fin du temps
  useEffect(() => {
    if (timeLeft === 0 && examData) {
      toast.info('Temps écoulé : vos réponses sont envoyées.');
      handleFinishExam();
    }
  }, [timeLeft, examData, handleFinishExam]);

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

        <Tooltip
          title={
            unsavedKeys.length
              ? 'Certaines réponses ne sont pas encore enregistrées : nouvel essai automatique en cours.'
              : 'Toutes vos réponses sont enregistrées.'
          }
        >
          <Chip
            size="small"
            variant="soft"
            color={unsavedKeys.some((key) => saveStatus[key] === 'error') ? 'error' : unsavedKeys.length ? 'warning' : 'success'}
            icon={<Iconify icon={unsavedKeys.length ? 'solar:cloud-upload-bold' : 'solar:cloud-check-bold'} />}
            label={unsavedKeys.length ? `${unsavedKeys.length} non enregistrée(s)` : 'Enregistré'}
          />
        </Tooltip>

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

          </Stack>

          <ExamQuestionRenderer
            question={currentQuestion}
            answer={answers[currentKey] || null}
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

      {/* Dernière question : « Terminer » ouvre la confirmation de fin d'épreuve */}
      {currentIndex === totalQuestions - 1 ? (
        <Button
          variant="contained"
          color="error"
          endIcon={<Iconify icon="solar:check-circle-bold" />}
          onClick={() => setShowFinishDialog(true)}
          disabled={isSubmitting}
        >
          Terminer
        </Button>
      ) : (
        <Button
          variant="contained"
          endIcon={<Iconify icon="solar:arrow-right-line-duotone" />}
          onClick={handleNext}
          disabled={isSubmitting}
        >
          Suivant
        </Button>
      )}
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
        {unsavedKeys.length > 0 && (
          <Typography variant="body2" color="error.main" sx={{ mt: 1 }}>
            {unsavedKeys.length} réponse(s) pas encore enregistrée(s) : elles seront renvoyées avant la fin.
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
            const isAnswered = !!answers[questionKey(q)];
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
                key={questionKey(q)}
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
