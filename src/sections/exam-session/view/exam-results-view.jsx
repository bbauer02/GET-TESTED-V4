'use client';

import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import LinearProgress from '@mui/material/LinearProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import axiosInstance from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';
import { LoadingScreen } from 'src/components/loading-screen';

// ----------------------------------------------------------------------

export function ExamResultsView({ enrollmentExamId }) {
  const router = useRouter();
  const theme = useTheme();

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadResults() {
      try {
        // Fetch the enrollment-exam details which should contain results after finish
        const res = await axiosInstance.get(`/api/enrollment-exams/${enrollmentExamId}`);
        if (!cancelled) {
          // Statistiques de la fin d'épreuve (si disponibles) + état enregistré de l'épreuve
          let stats = {};
          try {
            stats = JSON.parse(sessionStorage.getItem(`exam_result_${enrollmentExamId}`) || '{}') || {};
          } catch {
            stats = {};
          }
          setResults({ ...stats, ...res.data });
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Impossible de charger les résultats.');
          setLoading(false);
        }
      }
    }

    loadResults();
    return () => { cancelled = true; };
  }, [enrollmentExamId]);

  // Résultat de la fin d'épreuve (détail par compétence), conservé juste après la soumission
  const finishResult = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem(`exam_result_${enrollmentExamId}`) || 'null');
    } catch {
      return null;
    }
  }, [enrollmentExamId]);

  const score = results?.finalScore ?? finishResult?.totalScore ?? 0;
  const maxScore = results?.maxScore ?? finishResult?.maxScore ?? 0;
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const passed = results?.status ? results.status === 'PASSED' : !!finishResult?.passed;
  const skillBreakdown = useMemo(
    () =>
      Object.entries(finishResult?.skillBreakdown || {}).map(([name, ratio]) => ({
        name,
        score: Math.round(ratio * 100),
        maxScore: 100,
      })),
    [finishResult]
  );

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

  const renderScoreCard = (
    <Card sx={{ textAlign: 'center' }}>
      <CardContent sx={{ py: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Iconify
            icon={passed ? 'solar:check-circle-bold' : 'solar:close-circle-bold'}
            width={80}
            sx={{ color: passed ? 'success.main' : 'error.main' }}
          />
        </Box>

        <Chip
          label={passed ? 'RÉUSSI' : 'NON RÉUSSI'}
          color={passed ? 'success' : 'error'}
          size="medium"
          sx={{ mb: 2, fontSize: '1rem', fontWeight: 'bold', px: 2, py: 0.5 }}
        />

        <Typography variant="h2" sx={{ mb: 0.5 }}>
          {score} / {maxScore}
        </Typography>

        <Typography variant="h5" color="text.secondary" sx={{ mb: 3 }}>
          {percentage}%
        </Typography>

        <Box sx={{ maxWidth: 300, mx: 'auto' }}>
          <LinearProgress
            variant="determinate"
            value={percentage}
            color={passed ? 'success' : 'error'}
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Box>

        {results?.examName && (
          <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 3 }}>
            {results.examName}
          </Typography>
        )}

        {results?.assessmentName && (
          <Typography variant="body2" color="text.secondary">
            {results.assessmentName}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  const renderSkillBreakdown = skillBreakdown.length > 0 && (
    <Card>
      <CardHeader title="Détail par compétence" />
      <CardContent>
        <Stack spacing={2}>
          {skillBreakdown.map((skill, index) => {
            const skillScore = skill.score ?? 0;
            const skillMax = skill.maxScore ?? 0;
            const skillPct = skillMax > 0 ? Math.round((skillScore / skillMax) * 100) : 0;

            return (
              <Box key={skill.id || skill.name || index}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="body2" fontWeight="bold">
                    {skill.name || skill.label || `Compétence ${index + 1}`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {skillScore} / {skillMax} ({skillPct}%)
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={skillPct}
                  color={skillPct >= 50 ? 'success' : 'error'}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );

  // Masqué si les statistiques ne sont plus disponibles (ex. résultat consulté plus tard)
  const renderStats = results?.totalQuestions != null && (
    <Card>
      <CardHeader title="Statistiques" />
      <CardContent>
        <Stack spacing={2} divider={<Divider />}>
          {results?.totalQuestions != null && (
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Nombre de questions</Typography>
              <Typography variant="body2" fontWeight="bold">{results.totalQuestions}</Typography>
            </Stack>
          )}
          {results?.answeredQuestions != null && (
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Questions répondues</Typography>
              <Typography variant="body2" fontWeight="bold">{results.answeredQuestions}</Typography>
            </Stack>
          )}
          {results?.correctAnswers != null && (
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Réponses correctes</Typography>
              <Typography variant="body2" fontWeight="bold" color="success.main">{results.correctAnswers}</Typography>
            </Stack>
          )}
          {results?.wrongAnswers != null && (
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Réponses incorrectes</Typography>
              <Typography variant="body2" fontWeight="bold" color="error.main">{results.wrongAnswers}</Typography>
            </Stack>
          )}
          {results?.totalDurationSeconds != null && (
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Durée totale</Typography>
              <Typography variant="body2" fontWeight="bold">
                {Math.floor(results.totalDurationSeconds / 60)} min {results.totalDurationSeconds % 60} s
              </Typography>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <Box
        sx={{
          px: 3,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${theme.vars.palette.divider}`,
          bgcolor: 'background.paper',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify icon="solar:chart-bold" width={28} sx={{ color: 'primary.main' }} />
          <Typography variant="h6">Résultats de l&apos;examen</Typography>
        </Stack>

        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:arrow-left-line-duotone" />}
          onClick={() => router.push(paths.dashboard.mesInscriptions.root)}
        >
          Mes inscriptions
        </Button>
      </Box>

      {/* Content */}
      <Box sx={{ maxWidth: 720, mx: 'auto', p: 3 }}>
        <Stack spacing={3}>
          {renderScoreCard}
          {renderSkillBreakdown}
          {renderStats}

          <Box sx={{ textAlign: 'center' }}>
            <Button
              variant="outlined"
              size="large"
              startIcon={<Iconify icon="solar:home-2-bold" />}
              onClick={() => router.push(paths.dashboard.root)}
            >
              Retour au tableau de bord
            </Button>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
