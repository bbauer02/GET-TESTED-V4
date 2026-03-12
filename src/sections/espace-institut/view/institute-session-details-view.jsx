'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { usePopover } from 'minimal-shared/hooks';

import { useParams } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableContainer from '@mui/material/TableContainer';
import Avatar from '@mui/material/Avatar';

import { fDateTime, fDate } from 'src/utils/format-time';

import axios from 'src/lib/axios';

import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { LoadingScreen } from 'src/components/loading-screen';
import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { CustomPopover } from 'src/components/custom-popover';

import { useCurrentInstitute } from 'src/auth/hooks';

import { useGetSession, useGetInstituteMembres } from 'src/actions/espace-institut';
import { useGetAssessmentExams } from 'src/actions/exam';
import { getErrorMessage } from 'src/auth/utils/error-message';

import { SessionScheduledExams } from '../session-scheduled-exams';

// ----------------------------------------------------------------------

const STATUS_COLORS = {
  DRAFT: 'default',
  OPEN: 'success',
  CLOSE: 'warning',
  CANCELLED: 'error',
};

const STATUS_LABELS = {
  DRAFT: 'Brouillon',
  OPEN: 'Ouverte',
  CLOSE: 'Fermée',
  CANCELLED: 'Annulée',
};

const ENROLLMENT_EXAM_STATUS_COLORS = {
  REGISTERED: 'info',
  PASSED: 'success',
  FAILED: 'error',
};

// Transitions possibles par statut actuel → statut cible
const TRANSITIONS_MAP = {
  DRAFT: [
    { transition: 'open', targetStatus: 'OPEN' },
    { transition: 'cancel_from_draft', targetStatus: 'CANCELLED' },
  ],
  OPEN: [
    { transition: 'close', targetStatus: 'CLOSE' },
    { transition: 'cancel_from_open', targetStatus: 'CANCELLED' },
  ],
  CLOSE: [
    { transition: 'cancel_from_close', targetStatus: 'CANCELLED' },
  ],
  CANCELLED: [
    { transition: 'reopen', targetStatus: 'DRAFT' },
  ],
};

// ----------------------------------------------------------------------

export function InstituteSessionDetailsView() {
  const { id } = useParams();
  const currentInstitute = useCurrentInstitute();
  const { session, sessionLoading, sessionMutate } = useGetSession(id);
  const { membres } = useGetInstituteMembres(currentInstitute?.id);
  const { exams: assessmentExams } = useGetAssessmentExams(session?.assessment?.id);

  const statusPopover = usePopover();

  // Check if all required exams are scheduled
  const scheduledExamIds = new Set(
    (session?.scheduledExams || [])
      .map((se) => se.exam?.id || se.exam?.['@id'])
      .filter(Boolean)
  );
  const requiredExams = assessmentExams.filter((e) => !e.isOption);
  const hasMissingExams = requiredExams.some((exam) => {
    const examId = exam.id || exam['@id'];
    const examIri = exam['@id'] || `/api/exams/${exam.id}`;
    return !scheduledExamIds.has(examId) && !scheduledExamIds.has(examIri);
  });

  const handleTransition = useCallback(
    async (targetStatus) => {
      statusPopover.onClose();
      const currentStatus = session?.status || 'DRAFT';

      // Block opening if required exams are missing
      if (targetStatus === 'OPEN' && hasMissingExams) {
        toast.error('Toutes les épreuves obligatoires doivent être planifiées avant d\'ouvrir les inscriptions.');
        return;
      }

      const transitions = TRANSITIONS_MAP[currentStatus] || [];
      const match = transitions.find((t) => t.targetStatus === targetStatus);
      if (!match) return;

      try {
        await axios.patch(`/api/sessions/${id}/transition`, { transition: match.transition }, {
          headers: { 'Content-Type': 'application/merge-patch+json' },
        });
        toast.success('Statut mis à jour');
        sessionMutate();
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    },
    [id, session?.status, hasMissingExams, sessionMutate, statusPopover]
  );

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

  const status = session.status || 'DRAFT';
  const enrollments = session.enrollments || [];
  const availableTransitions = TRANSITIONS_MAP[status] || [];

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Détail de la session"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Espace Institut' },
          { name: 'Sessions', href: paths.dashboard.espaceInstitut.sessions },
          { name: session.assessment?.label || 'Session' },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.espaceInstitut.sessionEdit(id)}
            variant="contained"
            startIcon={<Iconify icon="solar:pen-bold" />}
          >
            Modifier
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Grid container spacing={3}>
        {/* ---- Infos générales ---- */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={3}>
            <Card>
              <CardHeader
                title="Informations"
                action={
                  <>
                    <ButtonBase
                      onClick={availableTransitions.length > 0 ? statusPopover.onOpen : undefined}
                      sx={{
                        borderRadius: 1,
                        cursor: availableTransitions.length > 0 ? 'pointer' : 'default',
                      }}
                    >
                      <Label
                        color={STATUS_COLORS[status] || 'default'}
                        variant="filled"
                        endIcon={
                          availableTransitions.length > 0
                            ? <Iconify icon="eva:chevron-down-fill" width={16} />
                            : undefined
                        }
                      >
                        {STATUS_LABELS[status] || status}
                      </Label>
                    </ButtonBase>

                    <CustomPopover
                      open={statusPopover.open}
                      anchorEl={statusPopover.anchorEl}
                      onClose={statusPopover.onClose}
                      slotProps={{ arrow: { placement: 'top-right' } }}
                    >
                      <MenuList>
                        {availableTransitions.map((t) => (
                          <MenuItem key={t.transition} onClick={() => handleTransition(t.targetStatus)}>
                            <Box
                              sx={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                bgcolor: `${STATUS_COLORS[t.targetStatus]}.main`,
                                mr: 1.5,
                                flexShrink: 0,
                              }}
                            />
                            {STATUS_LABELS[t.targetStatus]}
                          </MenuItem>
                        ))}
                      </MenuList>
                    </CustomPopover>
                  </>
                }
              />

              <Box sx={{ p: 3, gap: 2, display: 'flex', flexDirection: 'column', typography: 'body2' }}>
                <InfoRow icon="solar:book-bold" label="Assessment" value={session.assessment?.label} />
                <InfoRow icon="solar:medal-ribbons-star-bold" label="Niveau" value={session.level?.label} />
                <InfoRow icon="solar:calendar-bold" label="Début" value={fDateTime(session.start)} />
                <InfoRow icon="solar:calendar-bold" label="Fin" value={fDateTime(session.end)} />
                <InfoRow
                  icon="solar:clock-circle-bold"
                  label="Limite inscription"
                  value={session.limitDateSubscribe ? fDate(session.limitDateSubscribe) : '—'}
                />
                <InfoRow
                  icon="solar:users-group-rounded-bold"
                  label="Places"
                  value={
                    session.placesAvailable
                      ? `${enrollments.length} / ${session.placesAvailable}`
                      : `${enrollments.length} inscrit(s)`
                  }
                />
              </Box>

            </Card>

            <SessionScheduledExams
              session={session}
              membres={membres}
              onMutate={sessionMutate}
            />
          </Stack>
        </Grid>

        {/* ---- Inscrits ---- */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardHeader
              title="Inscrits"
              subheader={`${enrollments.length} inscription(s)`}
            />

            {enrollments.length > 0 ? (
              <TableContainer sx={{ px: 1, pb: 2 }}>
                <Scrollbar>
                  <Table size="small" sx={{ minWidth: 500 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Candidat</TableCell>
                        <TableCell>Date inscription</TableCell>
                        <TableCell>Résultats</TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {enrollments.map((enrollment) => {
                        const user = enrollment.user || {};
                        const fullName = [user.firstname, user.lastname].filter(Boolean).join(' ') || '—';
                        const enrollmentExams = enrollment.enrollmentExams || [];

                        return (
                          <TableRow key={enrollment.id || enrollment['@id']}>
                            <TableCell>
                              <Stack direction="row" alignItems="center" spacing={1.5}>
                                <Avatar alt={fullName} src={user.avatar} sx={{ width: 32, height: 32 }}>
                                  {fullName.charAt(0).toUpperCase()}
                                </Avatar>
                                <Box>
                                  <Typography variant="subtitle2" noWrap>
                                    {fullName}
                                  </Typography>
                                  {user.email && (
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                      {user.email}
                                    </Typography>
                                  )}
                                </Box>
                              </Stack>
                            </TableCell>

                            <TableCell>
                              {enrollment.registrationDate ? fDate(enrollment.registrationDate) : '—'}
                            </TableCell>

                            <TableCell>
                              {enrollmentExams.length > 0 ? (
                                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                  {enrollmentExams.map((ee) => (
                                    <Label
                                      key={ee.id || ee['@id']}
                                      color={ENROLLMENT_EXAM_STATUS_COLORS[ee.status] || 'default'}
                                      variant="soft"
                                    >
                                      {ee.finalScore != null ? `${ee.finalScore}` : ee.status || '—'}
                                    </Label>
                                  ))}
                                </Stack>
                              ) : (
                                '—'
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Scrollbar>
              </TableContainer>
            ) : (
              <Box sx={{ p: 3 }}>
                <EmptyContent title="Aucun inscrit" />
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

function InfoRow({ icon, label, value }) {
  return (
    <Box sx={{ gap: 2, display: 'flex', alignItems: 'flex-start', lineHeight: '24px' }}>
      <Iconify width={24} icon={icon} sx={{ color: 'text.secondary', mt: 0.25 }} />
      <Box>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
          {label}
        </Typography>
        <Typography variant="subtitle2">{value || '—'}</Typography>
      </Box>
    </Box>
  );
}
