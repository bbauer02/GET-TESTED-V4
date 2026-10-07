'use client';

import { toast } from 'sonner';
import { useMemo, useState, useCallback } from 'react';
import { usePopover, useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Step from '@mui/material/Step';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Stepper from '@mui/material/Stepper';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import StepLabel from '@mui/material/StepLabel';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import TableContainer from '@mui/material/TableContainer';
import InputAdornment from '@mui/material/InputAdornment';
import LinearProgress from '@mui/material/LinearProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter, useParams } from 'src/routes/hooks';

import { fCurrency } from 'src/utils/format-number';
import { fDate, fDateTime } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { useGetAssessmentExams } from 'src/actions/exam';
import { useGetSession, useGetInstituteMembres } from 'src/actions/espace-institut';
import { transitionSession, deleteDraftSession, getSessionCancelPreview } from 'src/actions/session-management';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomPopover } from 'src/components/custom-popover';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useCurrentInstitute } from 'src/auth/hooks';
import { getErrorMessage } from 'src/auth/utils/error-message';

import { SessionScheduledExams } from '../session-scheduled-exams';
import { getEnrollmentPhoneE164 } from '../session-enrollment-utils';
import { SessionTransitionDialog } from '../session-transition-dialog';
import { SessionEnrollmentSmsDialog } from '../session-enrollment-sms-dialog';
import { SessionDocumentPublications } from '../session-document-publications';
import { SessionEnrollmentDeleteDialog } from '../session-enrollment-delete-dialog';
import { SessionEnrollmentCommentDialog } from '../session-enrollment-comment-dialog';
import { InstituteCandidateDetailsDrawer } from '../institute-candidate-details-drawer';
import { SessionEnrollmentTransferDialog } from '../session-enrollment-transfer-dialog';

// ----------------------------------------------------------------------

const STATUS_COLORS = {
  DRAFT: 'default',
  OPEN: 'success',
  LOCKED: 'default',
  VALIDATED: 'info',
  CANCELLED: 'error',
};

const ENROLLMENT_EXAM_STATUS_COLORS = {
  REGISTERED: 'info',
  PASSED: 'success',
  FAILED: 'error',
  ABSENT: 'warning',
};

// Ordre du cycle de vie d'une session (CANCELLED est un état à part)
const LIFECYCLE_ORDER = ['DRAFT', 'OPEN', 'LOCKED', 'VALIDATED'];

// Transitions possibles par statut actuel → statut cible
const TRANSITIONS_MAP = {
  DRAFT: [
    { transition: 'open', targetStatus: 'OPEN' },
    { transition: 'cancel_from_draft', targetStatus: 'CANCELLED' },
  ],
  OPEN: [
    { transition: 'lock', targetStatus: 'LOCKED' },
    { transition: 'cancel_from_open', targetStatus: 'CANCELLED' },
  ],
  LOCKED: [
    { transition: 'validate', targetStatus: 'VALIDATED' },
    { transition: 'reopen_from_locked', targetStatus: 'OPEN' },
    { transition: 'cancel_from_locked', targetStatus: 'CANCELLED' },
  ],
  VALIDATED: [],
  CANCELLED: [{ transition: 'reopen', targetStatus: 'DRAFT' }],
};

// ----------------------------------------------------------------------

export function InstituteSessionDetailsView() {
  const { t } = useTranslate('institute_space');
  const { t: tm } = useTranslate('session_management');
  const { id } = useParams();
  const currentInstitute = useCurrentInstitute();

  const STATUS_LABELS = {
    DRAFT: t('status_draft'),
    OPEN: t('status_open'),
    LOCKED: t('status_locked'),
    VALIDATED: t('status_validated'),
    CANCELLED: t('status_cancelled'),
  };

  const { session, sessionLoading, sessionMutate } = useGetSession(id);
  const { membres } = useGetInstituteMembres(currentInstitute?.id);
  const { exams: assessmentExams } = useGetAssessmentExams(session?.assessment?.id);

  const isInstituteAdmin =
    currentInstitute?.membershipRole === 'ADMIN' || currentInstitute?.membershipRole === 'STAFF';

  const statusPopover = usePopover();
  const router = useRouter();
  const confirmCancel = useBoolean();
  const confirmTransition = useBoolean();
  const confirmDeleteDraft = useBoolean();
  const [deletingDraft, setDeletingDraft] = useState(false);
  const [pendingTransition, setPendingTransition] = useState(null);
  const [transitioning, setTransitioning] = useState(false);

  // Cancel preview (loaded before confirming a cancellation)
  const [cancelPreview, setCancelPreview] = useState(null);
  const [cancelPreviewLoading, setCancelPreviewLoading] = useState(false);
  const [cancelPreviewError, setCancelPreviewError] = useState(false);

  // Active tab
  const [currentTab, setCurrentTab] = useState('info');

  // Search & candidate drawer
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const drawerOpen = useBoolean();

  // Enrollment dialogs (opened from the row menu)
  const commentDialog = useBoolean();
  const smsDialog = useBoolean();
  const transferDialog = useBoolean();
  const deleteDialog = useBoolean();
  const [actionEnrollment, setActionEnrollment] = useState(null);

  const handleOpenDrawer = useCallback(
    (enrollment) => {
      setSelectedEnrollment(enrollment);
      drawerOpen.onTrue();
    },
    [drawerOpen]
  );

  const handleCloseDrawer = useCallback(() => {
    drawerOpen.onFalse();
    setSelectedEnrollment(null);
  }, [drawerOpen]);

  const openEnrollmentDialog = useCallback((enrollment, dialog) => {
    setActionEnrollment(enrollment);
    dialog.onTrue();
  }, []);

  const handleEnrollmentChanged = useCallback(() => {
    sessionMutate();
  }, [sessionMutate]);

  // Check if all required exams are scheduled
  const scheduledExamIds = new Set(
    (session?.scheduledExams || []).map((se) => se.exam?.id || se.exam?.['@id']).filter(Boolean)
  );
  const requiredExams = assessmentExams.filter((e) => !e.isOption);
  const hasMissingExams = requiredExams.some((exam) => {
    const examId = exam.id || exam['@id'];
    const examIri = exam['@id'] || `/api/exams/${exam.id}`;
    return !scheduledExamIds.has(examId) && !scheduledExamIds.has(examIri);
  });

  const executeTransition = useCallback(
    async (targetStatus, extra = {}) => {
      const currentStatus = session?.status || 'DRAFT';
      const transitions = TRANSITIONS_MAP[currentStatus] || [];
      const transitionMatch = transitions.find((tr) => tr.targetStatus === targetStatus);
      if (!transitionMatch) return;

      setTransitioning(true);
      try {
        const result = await transitionSession(id, transitionMatch.transition, extra);
        toast.success(t('status_updated'));

        const refundErrors = result?.refundErrors;
        if (Array.isArray(refundErrors) && refundErrors.length > 0) {
          toast.warning(tm('refund_errors_warning', { count: refundErrors.length }), {
            duration: 8000,
          });
        }
        sessionMutate();
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setTransitioning(false);
      }
    },
    [id, session?.status, sessionMutate, t, tm]
  );

  const loadCancelPreview = useCallback(async () => {
    setCancelPreview(null);
    setCancelPreviewError(false);
    setCancelPreviewLoading(true);
    try {
      const data = await getSessionCancelPreview(id);
      setCancelPreview(data || null);
    } catch {
      setCancelPreviewError(true);
    } finally {
      setCancelPreviewLoading(false);
    }
  }, [id]);

  const handleTransition = useCallback(
    (targetStatus) => {
      statusPopover.onClose();

      // Block opening if required exams are missing
      if (targetStatus === 'OPEN' && hasMissingExams) {
        toast.error(t('missing_exams_error'));
        return;
      }

      // Require confirmation (with impact preview) for cancel actions
      if (targetStatus === 'CANCELLED') {
        setPendingTransition(targetStatus);
        confirmCancel.onTrue();
        loadCancelPreview();
        return;
      }

      // Toute autre transition est confirmée (conséquences expliquées, date limite pour une réouverture)
      setPendingTransition(targetStatus);
      confirmTransition.onTrue();
    },
    [hasMissingExams, statusPopover, confirmCancel, confirmTransition, loadCancelPreview, t]
  );

  const handleConfirmOtherTransition = useCallback(
    async (extra) => {
      if (!pendingTransition) return;
      await executeTransition(pendingTransition, extra);
      setPendingTransition(null);
      confirmTransition.onFalse();
    },
    [pendingTransition, executeTransition, confirmTransition]
  );

  const handleDeleteDraft = useCallback(async () => {
    setDeletingDraft(true);
    try {
      await deleteDraftSession(id);
      toast.success(tm('delete_draft_success'));
      router.push(paths.dashboard.espaceInstitut.sessions);
    } catch (error) {
      toast.error(getErrorMessage(error));
      setDeletingDraft(false);
    }
  }, [id, router, tm]);

  const handleConfirmTransition = useCallback(async () => {
    if (pendingTransition) {
      await executeTransition(pendingTransition);
      setPendingTransition(null);
      confirmCancel.onFalse();
    }
  }, [pendingTransition, executeTransition, confirmCancel]);

  // Filter enrollments by search
  const enrollments = session?.enrollments || [];

  const filteredEnrollments = useMemo(() => {
    if (!searchQuery) return enrollments;
    const q = searchQuery.toLowerCase();
    return enrollments.filter((enrollment) => {
      const user = enrollment.user || {};
      const fullName = [user.firstname, user.lastname].filter(Boolean).join(' ').toLowerCase();
      const email = (user.email || '').toLowerCase();
      return fullName.includes(q) || email.includes(q);
    });
  }, [enrollments, searchQuery]);

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
        <EmptyContent title={t('session_not_found')} />
      </DashboardContent>
    );
  }

  const status = session.status || 'DRAFT';
  const availableTransitions = TRANSITIONS_MAP[status] || [];
  const isCancelled = status === 'CANCELLED';
  const activeStep = LIFECYCLE_ORDER.indexOf(status);
  const canManageEnrollments = isInstituteAdmin && !isCancelled;
  // Mêmes règles que l'API : édition en DRAFT/OPEN, désinscription pendant la période d'inscription
  const canEdit = isInstituteAdmin && ['DRAFT', 'OPEN'].includes(status);
  const canDeleteEnrollments =
    status === 'OPEN' && (!session.limitDateSubscribe || new Date(session.limitDateSubscribe) > new Date());
  const pendingTransitionMatch = availableTransitions.find((tr) => tr.targetStatus === pendingTransition);

  const renderCancelPreview = () => {
    if (cancelPreviewLoading) {
      return (
        <Stack spacing={1}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {tm('cancel_preview_loading')}
          </Typography>
          <LinearProgress />
        </Stack>
      );
    }
    if (cancelPreviewError) {
      return <Alert severity="warning">{tm('cancel_preview_unavailable')}</Alert>;
    }
    if (!cancelPreview) return null;
    return (
      <Alert severity="warning" icon={<Iconify icon="solar:card-recive-bold" />}>
        {tm('cancel_preview_summary', {
          enrollments: cancelPreview.enrollmentCount ?? 0,
          payments: cancelPreview.paidEnrollmentCount ?? 0,
          total: fCurrency(cancelPreview.refundTotal ?? 0),
          invoices: cancelPreview.invoicesToCancel ?? 0,
        })}
      </Alert>
    );
  };

  const renderStatusHelp = () => (
    <Stack spacing={1} alignItems="center" sx={{ mt: 2 }}>
      {session.autoLocked && status === 'LOCKED' && (
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <Iconify icon="solar:lock-keyhole-minimalistic-bold" width={16} sx={{ color: 'warning.main' }} />
          <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 'fontWeightMedium' }}>
            {tm('auto_locked_notice')}
          </Typography>
        </Stack>
      )}

      <Tooltip
        arrow
        title={
          <Stack spacing={0.5} sx={{ p: 0.5 }}>
            <Typography variant="caption">{tm('status_help_locked')}</Typography>
            <Typography variant="caption">{tm('status_help_validated')}</Typography>
          </Stack>
        }
      >
        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ cursor: 'help' }}>
          <Iconify icon="solar:question-circle-bold" width={16} sx={{ color: 'text.disabled' }} />
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            {tm('status_help_title')}
          </Typography>
        </Stack>
      </Tooltip>
    </Stack>
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('session_details')}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: currentInstitute?.label || 'Institut' },
          { name: t('sessions'), href: paths.dashboard.espaceInstitut.sessions },
          { name: session.assessment?.label || 'Session' },
        ]}
        action={
          <Stack direction="row" spacing={1}>
            <Button
              component={RouterLink}
              href={paths.dashboard.espaceInstitut.sessionResults(id)}
              variant="soft"
              color="info"
              startIcon={<Iconify icon="solar:clipboard-check-bold" />}
            >
              {t('results')}
            </Button>
            {isInstituteAdmin && status === 'DRAFT' && (
              <Button
                variant="soft"
                color="error"
                startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                onClick={confirmDeleteDraft.onTrue}
              >
                {tm('delete_draft')}
              </Button>
            )}
            {canEdit && (
              <Button
                component={RouterLink}
                href={paths.dashboard.espaceInstitut.sessionEdit(id)}
                variant="contained"
                startIcon={<Iconify icon="solar:pen-bold" />}
              >
                {t('edit')}
              </Button>
            )}
          </Stack>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {/* ---- Cycle de vie (stepper) ---- */}
      <Card sx={{ p: 3, mb: 3 }}>
        {isCancelled ? (
          <Alert severity="error">{STATUS_LABELS.CANCELLED}</Alert>
        ) : (
          <Stepper activeStep={activeStep} alternativeLabel>
            {LIFECYCLE_ORDER.map((s, i) => (
              <Step key={s} completed={activeStep > i}>
                <StepLabel>{STATUS_LABELS[s] || s}</StepLabel>
              </Step>
            ))}
          </Stepper>
        )}

        {!isCancelled && renderStatusHelp()}

        {isInstituteAdmin && availableTransitions.length > 0 && (
          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            justifyContent="center"
            sx={{ mt: isCancelled ? 2 : 3 }}
          >
            {availableTransitions.map((tr) => {
              const color = STATUS_COLORS[tr.targetStatus];
              return (
                <Button
                  key={tr.transition}
                  size="small"
                  variant={tr.targetStatus === 'CANCELLED' ? 'outlined' : 'contained'}
                  color={!color || color === 'default' ? 'inherit' : color}
                  disabled={transitioning}
                  startIcon={<Iconify icon="solar:arrow-right-bold" width={16} />}
                  onClick={() => handleTransition(tr.targetStatus)}
                >
                  {STATUS_LABELS[tr.targetStatus]}
                </Button>
              );
            })}
          </Stack>
        )}
      </Card>

      {/* ---- Tabs ---- */}
      <Tabs value={currentTab} onChange={(_, v) => setCurrentTab(v)} sx={{ mb: 3 }}>
        <Tab
          value="info"
          iconPosition="start"
          icon={<Iconify icon="solar:info-circle-bold" />}
          label={t('information')}
        />
        <Tab
          value="enrolled"
          iconPosition="start"
          icon={<Iconify icon="solar:users-group-rounded-bold" />}
          label={`${t('enrolled_list')} (${enrollments.length})`}
        />
        <Tab
          value="exams"
          iconPosition="start"
          icon={<Iconify icon="solar:document-medicine-bold" />}
          label={t('scheduled_exams')}
        />
        <Tab
          value="documents"
          iconPosition="start"
          icon={<Iconify icon="solar:folder-bold" />}
          label={t('documents')}
        />
      </Tabs>

      {/* ---- Tab: Informations ---- */}
      {currentTab === 'info' && (
        <Card>
          <Box
            sx={{
              p: 3,
              rowGap: 2,
              columnGap: 4,
              display: 'grid',
              typography: 'body2',
              gridTemplateColumns: {
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              },
            }}
          >
            <InfoRow icon="solar:book-bold" label={t('assessment')} value={session.assessment?.label} />
            <InfoRow icon="solar:medal-ribbons-star-bold" label={t('level')} value={session.level?.label} />
            <InfoRow icon="solar:calendar-bold" label={t('start_date')} value={fDateTime(session.start)} />
            <InfoRow icon="solar:calendar-bold" label={t('end_date')} value={fDateTime(session.end)} />
            <InfoRow
              icon="solar:clock-circle-bold"
              label={t('limit_date')}
              value={session.limitDateSubscribe ? fDate(session.limitDateSubscribe) : '—'}
            />
            <InfoRow
              icon="solar:users-group-rounded-bold"
              label={t('places')}
              value={
                session.placesAvailable
                  ? `${enrollments.length} / ${session.placesAvailable}`
                  : t('enrolled_count', { count: enrollments.length })
              }
            />
          </Box>
        </Card>
      )}

      {/* ---- Tab: Épreuves ---- */}
      {currentTab === 'exams' && (
        <SessionScheduledExams session={session} membres={membres} onMutate={sessionMutate} />
      )}

      {/* ---- Tab: Documents ---- */}
      {currentTab === 'documents' && (
        <SessionDocumentPublications session={session} onMutate={sessionMutate} />
      )}

      {/* ---- Tab: Inscrits ---- */}
      {currentTab === 'enrolled' && (
        <Card>
          <CardHeader
            title={t('enrolled_list')}
            subheader={t('enrollments_count', { count: enrollments.length })}
          />

          {enrollments.length > 0 && (
            <Stack sx={{ px: 2, pt: 2, pb: 1 }}>
              <TextField
                size="small"
                fullWidth
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search_candidate')}
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
            </Stack>
          )}

          {filteredEnrollments.length > 0 ? (
            <TableContainer sx={{ px: 1, pb: 2 }}>
              <Scrollbar>
                <Table size="small" sx={{ minWidth: 560 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('candidate_label')}</TableCell>
                      <TableCell>{t('registration_date')}</TableCell>
                      <TableCell align="center">{t('payment')}</TableCell>
                      <TableCell>{t('results')}</TableCell>
                      <TableCell align="right" sx={{ width: 96 }} />
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {filteredEnrollments.map((enrollment) => (
                      <EnrollmentRow
                        key={enrollment.id || enrollment['@id']}
                        enrollment={enrollment}
                        canManage={canManageEnrollments}
                        canDelete={canDeleteEnrollments}
                        onView={() => handleOpenDrawer(enrollment)}
                        onComment={() => openEnrollmentDialog(enrollment, commentDialog)}
                        onSms={() => openEnrollmentDialog(enrollment, smsDialog)}
                        onTransfer={() => openEnrollmentDialog(enrollment, transferDialog)}
                        onDelete={() => openEnrollmentDialog(enrollment, deleteDialog)}
                      />
                    ))}
                  </TableBody>
                </Table>
              </Scrollbar>
            </TableContainer>
          ) : (
            <Box sx={{ p: 3 }}>
              <EmptyContent title={searchQuery ? t('no_result') : t('no_enrolled')} />
            </Box>
          )}
        </Card>
      )}

      {/* ---- Candidate Detail Drawer ---- */}
      <InstituteCandidateDetailsDrawer
        open={drawerOpen.value}
        onClose={handleCloseDrawer}
        enrollment={selectedEnrollment}
        session={session}
        instituteId={currentInstitute?.id}
        canManage={canManageEnrollments}
        onUpdated={handleEnrollmentChanged}
        onDeleted={handleEnrollmentChanged}
      />

      {/* ---- Enrollment dialogs (row menu) ---- */}
      <SessionEnrollmentCommentDialog
        open={commentDialog.value}
        onClose={commentDialog.onFalse}
        enrollment={actionEnrollment}
        onSaved={handleEnrollmentChanged}
      />
      <SessionEnrollmentSmsDialog
        open={smsDialog.value}
        onClose={smsDialog.onFalse}
        enrollment={actionEnrollment}
        session={session}
      />
      <SessionEnrollmentTransferDialog
        open={transferDialog.value}
        onClose={transferDialog.onFalse}
        enrollment={actionEnrollment}
        session={session}
        instituteId={currentInstitute?.id}
        onTransferred={handleEnrollmentChanged}
      />
      <SessionEnrollmentDeleteDialog
        open={deleteDialog.value}
        onClose={deleteDialog.onFalse}
        enrollment={actionEnrollment}
        onDeleted={handleEnrollmentChanged}
      />

      {/* ---- Other transitions confirmation ---- */}
      <SessionTransitionDialog
        open={confirmTransition.value}
        onClose={() => {
          confirmTransition.onFalse();
          setPendingTransition(null);
        }}
        transition={pendingTransitionMatch}
        session={session}
        loading={transitioning}
        onConfirm={handleConfirmOtherTransition}
      />

      {/* ---- Delete draft confirmation ---- */}
      <ConfirmDialog
        open={confirmDeleteDraft.value}
        onClose={confirmDeleteDraft.onFalse}
        title={tm('delete_draft_title')}
        content={tm('delete_draft_desc')}
        action={
          <LoadingButton variant="contained" color="error" loading={deletingDraft} onClick={handleDeleteDraft}>
            {tm('delete_draft')}
          </LoadingButton>
        }
      />

      {/* ---- Cancel session confirmation ---- */}
      <ConfirmDialog
        open={confirmCancel.value}
        onClose={() => {
          confirmCancel.onFalse();
          setPendingTransition(null);
        }}
        title={t('cancel_session_title')}
        content={
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Typography variant="body2">{t('cancel_session_desc')}</Typography>
            {renderCancelPreview()}
          </Stack>
        }
        action={
          <LoadingButton
            variant="contained"
            color="error"
            loading={transitioning}
            disabled={cancelPreviewLoading}
            onClick={handleConfirmTransition}
          >
            {t('confirm_cancel')}
          </LoadingButton>
        }
      />
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

function EnrollmentRow({ enrollment, canManage, canDelete, onView, onComment, onSms, onTransfer, onDelete }) {
  const { t } = useTranslate('institute_space');
  const { t: tm } = useTranslate('session_management');
  const popover = usePopover();

  const user = enrollment.user || {};
  const fullName = [user.firstname, user.lastname].filter(Boolean).join(' ') || '—';
  const enrollmentExams = enrollment.enrollmentExams || [];
  const hasPhone = !!getEnrollmentPhoneE164(enrollment);

  const handleMenu = (callback) => () => {
    popover.onClose();
    callback();
  };

  return (
    <TableRow hover>
      <TableCell>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar alt={fullName} src={user.avatar} sx={{ width: 32, height: 32 }}>
            {fullName.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Typography variant="subtitle2" noWrap>
                {fullName}
              </Typography>
              {enrollment.information && (
                <Tooltip title={enrollment.information} arrow>
                  <Iconify
                    icon="solar:chat-round-dots-bold"
                    width={16}
                    sx={{ color: 'info.main', flexShrink: 0, cursor: 'help' }}
                  />
                </Tooltip>
              )}
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center">
              {enrollment.referenceNumber && (
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', fontWeight: 'fontWeightMedium' }}
                >
                  {enrollment.referenceNumber}
                </Typography>
              )}
              {enrollment.referenceNumber && user.email && (
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  ·
                </Typography>
              )}
              {user.email && (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {user.email}
                </Typography>
              )}
            </Stack>
          </Box>
        </Stack>
      </TableCell>

      <TableCell>{enrollment.registrationDate ? fDate(enrollment.registrationDate) : '—'}</TableCell>

      <TableCell align="center">
        <PaymentStatusIcon invoices={enrollment.invoices} />
      </TableCell>

      <TableCell>
        <EnrollmentExamResults enrollmentExams={enrollmentExams} />
      </TableCell>

      <TableCell align="right">
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Tooltip title={t('candidate_sheet')}>
            <IconButton size="small" onClick={onView}>
              <Iconify icon="solar:eye-bold" width={20} />
            </IconButton>
          </Tooltip>
          {canManage && (
            <IconButton size="small" onClick={popover.onOpen}>
              <Iconify icon="eva:more-vertical-fill" width={20} />
            </IconButton>
          )}
        </Stack>

        <CustomPopover open={popover.open} anchorEl={popover.anchorEl} onClose={popover.onClose}>
          <MenuList>
            <MenuItem onClick={handleMenu(onView)}>
              <Iconify icon="solar:eye-bold" />
              {t('candidate_sheet')}
            </MenuItem>
            <MenuItem onClick={handleMenu(onComment)}>
              <Iconify icon="solar:chat-round-line-bold" />
              {tm('comment')}
            </MenuItem>
            <Tooltip title={hasPhone ? '' : tm('no_phone')} placement="left">
              <span>
                <MenuItem onClick={handleMenu(onSms)} disabled={!hasPhone}>
                  <Iconify icon="solar:chat-round-dots-bold" />
                  {tm('sms')}
                </MenuItem>
              </span>
            </Tooltip>
            <MenuItem onClick={handleMenu(onTransfer)}>
              <Iconify icon="solar:transfer-horizontal-bold" />
              {tm('transfer')}
            </MenuItem>
            <Divider sx={{ borderStyle: 'dashed' }} />
            <Tooltip title={canDelete ? '' : tm('delete_enrollment_disabled')} placement="left">
              <span>
                <MenuItem onClick={handleMenu(onDelete)} disabled={!canDelete} sx={{ color: 'error.main' }}>
                  <Iconify icon="solar:trash-bin-trash-bold" />
                  {tm('delete_enrollment')}
                </MenuItem>
              </span>
            </Tooltip>
          </MenuList>
        </CustomPopover>
      </TableCell>
    </TableRow>
  );
}

// ----------------------------------------------------------------------

function EnrollmentExamResults({ enrollmentExams }) {
  const { t } = useTranslate('institute_space');

  if (!enrollmentExams.length) return '—';

  const hasAnyScore = enrollmentExams.some((ee) => ee.finalScore != null);
  if (!hasAnyScore) {
    return (
      <Label color="default" variant="soft">
        {t('not_evaluated')}
      </Label>
    );
  }

  return (
    <Stack direction="row" spacing={0.5} flexWrap="wrap">
      {enrollmentExams.map((ee) => {
        const exam = ee.scheduledExam?.exam;
        const examLabel = exam?.label || '';
        const total = exam?.nbrQuestions;
        const coeff = exam?.coeff;
        const display = total ? `${ee.finalScore ?? '—'}/${total}` : `${ee.finalScore ?? '—'}`;
        const tooltipText = [examLabel, coeff ? `coeff. ${coeff}` : ''].filter(Boolean).join(' — ');

        return (
          <Tooltip key={ee.id || ee['@id']} title={tooltipText} arrow>
            <span>
              <Label color={ENROLLMENT_EXAM_STATUS_COLORS[ee.status] || 'default'} variant="soft">
                {display}
              </Label>
            </span>
          </Tooltip>
        );
      })}
    </Stack>
  );
}

// ----------------------------------------------------------------------

function PaymentStatusIcon({ invoices }) {
  const { t } = useTranslate('institute_space');
  // Find the ENROLLMENT invoice (not commission)
  const enrollmentInvoice = (invoices || []).find((inv) => inv.businessType !== 'PLATFORM_COMMISSION');

  if (!enrollmentInvoice) {
    return (
      <Tooltip title={t('no_invoice')}>
        <Iconify icon="solar:bill-cross-bold" width={22} sx={{ color: 'text.disabled' }} />
      </Tooltip>
    );
  }

  const statusConfig = {
    PAID: { icon: 'solar:check-circle-bold', color: 'success.main', label: t('invoice_paid') },
    ISSUED: { icon: 'solar:clock-circle-bold', color: 'warning.main', label: t('invoice_pending') },
    DRAFT: { icon: 'solar:file-text-bold', color: 'text.disabled', label: t('invoice_draft') },
    CANCELLED: { icon: 'solar:close-circle-bold', color: 'error.main', label: t('invoice_cancelled') },
  };

  const config = statusConfig[enrollmentInvoice.status] || statusConfig.DRAFT;

  return (
    <Tooltip title={config.label}>
      <Iconify icon={config.icon} width={22} sx={{ color: config.color }} />
    </Tooltip>
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
