'use client';

import { toast } from 'sonner';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Select from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hooks';

import { fDate } from 'src/utils/format-time';

import axios from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';
import { useGetSession } from 'src/actions/espace-institut';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { getErrorMessage } from 'src/auth/utils/error-message';
import { useAuthContext, useCurrentInstitute } from 'src/auth/hooks';

// ----------------------------------------------------------------------

const SESSION_STATUS_LABELS = {
  DRAFT: 'Brouillon',
  OPEN: 'Ouverte',
  LOCKED: 'Verrouillée',
  VALIDATED: 'Validée',
  CANCELLED: 'Annulée',
};

// La saisie n'est ouverte qu'une fois les inscriptions closes (même règle que l'API)
const SCORABLE_STATUSES = ['LOCKED', 'VALIDATED'];

const EXAM_STATUS_OPTIONS = [
  { value: 'REGISTERED', label: 'Inscrit', color: 'info' },
  { value: 'PASSED', label: 'Réussi', color: 'success' },
  { value: 'FAILED', label: 'Échoué', color: 'error' },
  { value: 'ABSENT', label: 'Absent', color: 'warning' },
];

// ----------------------------------------------------------------------

export function InstituteSessionResultsView() {
  const { id } = useParams();
  const currentInstitute = useCurrentInstitute();
  const { user } = useAuthContext();
  const { session, sessionLoading, sessionMutate } = useGetSession(id);

  const [editedScores, setEditedScores] = useState({});
  const [editedStatuses, setEditedStatuses] = useState({});
  const [saving, setSaving] = useState(false);

  const enrollments = session?.enrollments || [];

  // Determine user permissions: institute ADMIN sees all, TEACHER sees only assigned exams
  const isInstituteAdmin = currentInstitute?.membershipRole === 'ADMIN' || currentInstitute?.membershipRole === 'STAFF';
  const currentUserId = user?.id;

  const allScheduledExams = useMemo(
    () => session?.scheduledExams || session?.scheduled_exams || [],
    [session]
  );

  const scheduledExams = useMemo(() => {
    if (isInstituteAdmin) return allScheduledExams;
    // Filter to only exams where current user is an assigned examinator
    return allScheduledExams.filter((se) =>
      (se.examinators || []).some((ex) => {
        const exId = typeof ex === 'string' ? ex : (ex.id || ex['@id']);
        return exId === currentUserId || exId === `/api/users/${currentUserId}`;
      })
    );
  }, [allScheduledExams, isInstituteAdmin, currentUserId]);

  const hasChanges = Object.keys(editedScores).length > 0 || Object.keys(editedStatuses).length > 0;

  const handleScoreChange = useCallback((enrollmentExamId, value) => {
    setEditedScores((prev) => ({ ...prev, [enrollmentExamId]: value }));
  }, []);

  const handleStatusChange = useCallback((enrollmentExamId, value) => {
    setEditedStatuses((prev) => ({ ...prev, [enrollmentExamId]: value }));
    // Un absent n'a pas de note
    if (value === 'ABSENT') {
      setEditedScores((prev) => ({ ...prev, [enrollmentExamId]: '' }));
    }
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const updates = [];

      Object.entries(editedScores).forEach(([eeId, score]) => {
        updates.push({ id: eeId, finalScore: score === '' ? null : Number(score) });
      });

      Object.entries(editedStatuses).forEach(([eeId, status]) => {
        const existing = updates.find((u) => u.id === eeId);
        if (existing) {
          existing.status = status;
        } else {
          updates.push({ id: eeId, status });
        }
      });

      const results = await Promise.allSettled(
        updates.map((update) =>
          axios.patch(`/api/enrollment-exams/${update.id}/score`, update, {
            headers: { 'Content-Type': 'application/merge-patch+json' },
          })
        )
      );

      // Ne conserver en saisie que les lignes en échec, pour pouvoir les renvoyer
      const failedIds = new Set(
        updates.filter((_, index) => results[index].status === 'rejected').map((update) => update.id)
      );
      const keepFailed = (edited) =>
        Object.fromEntries(Object.entries(edited).filter(([eeId]) => failedIds.has(eeId)));

      setEditedScores(keepFailed);
      setEditedStatuses(keepFailed);
      sessionMutate();

      if (failedIds.size === 0) {
        toast.success('Résultats enregistrés');
      } else {
        const firstError = results.find((result) => result.status === 'rejected');
        toast.error(
          `${failedIds.size} résultat(s) non enregistré(s) sur ${updates.length} : ${getErrorMessage(firstError.reason)}`
        );
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }, [editedScores, editedStatuses, sessionMutate]);

  if (sessionLoading) {
    return (
      <DashboardContent>
        <LoadingScreen />
      </DashboardContent>
    );
  }

  if (!session) {
    return (
      <DashboardContent>
        <EmptyContent title="Session introuvable" />
      </DashboardContent>
    );
  }

  const canScore = SCORABLE_STATUSES.includes(session.status);

  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs
        heading="Saisie des résultats"
        links={[
          { name: 'Dashboard', href: paths.dashboard.espaceInstitut.root },
          { name: 'Sessions', href: paths.dashboard.espaceInstitut.sessions },
          { name: session.assessment?.label || 'Session', href: paths.dashboard.espaceInstitut.sessionView(id) },
          { name: 'Résultats' },
        ]}
        action={
          <LoadingButton
            variant="contained"
            loading={saving}
            disabled={!hasChanges || !canScore}
            onClick={handleSave}
            startIcon={<Iconify icon="solar:diskette-bold" />}
          >
            Enregistrer
          </LoadingButton>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card sx={{ mb: 3, p: 3 }}>
        <Stack direction="row" spacing={3} flexWrap="wrap">
          <InfoChip icon="solar:book-bold" label={session.assessment?.label || '—'} />
          <InfoChip icon="solar:medal-ribbons-star-bold" label={session.level?.label || '—'} />
          <InfoChip icon="solar:calendar-bold" label={session.start ? fDate(session.start) : '—'} />
          <InfoChip icon="solar:users-group-rounded-bold" label={`${enrollments.length} candidat(s)`} />
          <Label variant="filled" color={session.status === 'VALIDATED' ? 'success' : 'warning'}>
            {SESSION_STATUS_LABELS[session.status] || session.status}
          </Label>
        </Stack>
      </Card>

      {!canScore && (
        <Alert severity="info" sx={{ mb: 3 }}>
          La saisie des résultats sera possible une fois les inscriptions clôturées (session verrouillée).
        </Alert>
      )}

      {!isInstituteAdmin && scheduledExams.length === 0 && allScheduledExams.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Vous n&apos;êtes assigné comme examinateur à aucune épreuve de cette session.
        </Alert>
      )}

      {!isInstituteAdmin && scheduledExams.length > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Vous voyez uniquement les épreuves auxquelles vous êtes assigné comme examinateur
          ({scheduledExams.length} / {allScheduledExams.length}).
        </Alert>
      )}

      {enrollments.length > 0 && scheduledExams.length > 0 ? (
        <Card>
          <CardHeader
            title="Notes par candidat"
            subheader="Saisissez les scores et le statut de chaque épreuve"
          />

          <TableContainer sx={{ px: 1, pb: 2 }}>
            <Scrollbar>
              <Table size="small" sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 200 }}>Candidat</TableCell>
                    {scheduledExams.map((se) => {
                      const exam = se.exam || {};
                      return (
                        <TableCell
                          key={se.id || se['@id']}
                          align="center"
                          sx={{ minWidth: 140 }}
                        >
                          <Tooltip title={`${exam.label || 'Épreuve'} ${exam.nbrQuestions ? `(/${exam.nbrQuestions})` : ''} ${exam.coeff ? `coeff. ${exam.coeff}` : ''}`}>
                            <Typography variant="caption" fontWeight={600} noWrap>
                              {exam.label || 'Épreuve'}
                              {exam.isOption && (
                                <Label variant="soft" color="info" sx={{ ml: 0.5, fontSize: 10 }}>
                                  Opt.
                                </Label>
                              )}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {enrollments.map((enrollment) => {
                    const candidate = enrollment.user || {};
                    const fullName = [candidate.firstname, candidate.lastname].filter(Boolean).join(' ') || '—';
                    const enrollmentExams = enrollment.enrollmentExams || [];

                    return (
                      <TableRow key={enrollment.id || enrollment['@id']}>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Avatar alt={fullName} src={candidate.avatar} sx={{ width: 32, height: 32 }}>
                              {fullName.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" noWrap fontWeight={600}>
                                {fullName}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {candidate.email || ''}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>

                        {scheduledExams.map((se) => {
                          const seId = se.id || se['@id'];
                          const seIri = se['@id'] || `/api/scheduled-exams/${se.id}`;
                          const ee = enrollmentExams.find(
                            (item) =>
                              (item.scheduledExam?.id || item.scheduledExam?.['@id']) === seId ||
                              (item.scheduledExam?.['@id'] || '') === seIri
                          );

                          if (!ee) {
                            return (
                              <TableCell key={seId} align="center">
                                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                                  —
                                </Typography>
                              </TableCell>
                            );
                          }

                          const eeId = ee.id || ee['@id']?.split('/').pop();
                          const exam = se.exam || {};
                          const currentScore = editedScores[eeId] ?? ee.finalScore ?? '';
                          const currentStatus = editedStatuses[eeId] ?? ee.status ?? 'REGISTERED';

                          return (
                            <TableCell key={seId} align="center">
                              <Stack spacing={0.5} alignItems="center">
                                <TextField
                                  size="small"
                                  type="number"
                                  disabled={!canScore || currentStatus === 'ABSENT'}
                                  value={currentScore}
                                  onChange={(e) => handleScoreChange(eeId, e.target.value)}
                                  placeholder={exam.nbrQuestions ? `/ ${exam.nbrQuestions}` : 'Score'}
                                  slotProps={{
                                    input: {
                                      sx: { width: 80, textAlign: 'center' },
                                      inputProps: {
                                        min: 0,
                                        max: exam.nbrQuestions || undefined,
                                        style: { textAlign: 'center' },
                                      },
                                    },
                                  }}
                                />
                                <Select
                                  size="small"
                                  disabled={!canScore}
                                  value={currentStatus}
                                  onChange={(e) => handleStatusChange(eeId, e.target.value)}
                                  sx={{ width: 110, fontSize: 12 }}
                                >
                                  {EXAM_STATUS_OPTIONS.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: 12 }}>
                                      {opt.label}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </Stack>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Scrollbar>
          </TableContainer>
        </Card>
      ) : (
        <Card sx={{ p: 3 }}>
          <EmptyContent
            title={scheduledExams.length === 0 ? 'Aucune épreuve à afficher' : 'Aucun inscrit'}
            description={
              scheduledExams.length === 0
                ? "Aucune épreuve ne vous est assignée pour cette session"
                : "Il n'y a pas encore de candidat inscrit à cette session"
            }
          />
        </Card>
      )}
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

function InfoChip({ icon, label }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Iconify icon={icon} width={20} sx={{ color: 'text.secondary' }} />
      <Typography variant="body2">{label}</Typography>
    </Stack>
  );
}
