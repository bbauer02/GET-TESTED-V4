'use client';

import { toast } from 'sonner';
import { useBoolean } from 'minimal-shared/hooks';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import LinearProgress from '@mui/material/LinearProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fCurrency } from 'src/utils/format-number';
import { fDate, fDateTime } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';
import { useGetInstituteEnrollment } from 'src/actions/espace-institut';
import { updateEnrollmentInformation } from 'src/actions/session-management';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';

import { getErrorMessage } from 'src/auth/utils/error-message';

import { SessionEnrollmentSmsDialog } from './session-enrollment-sms-dialog';
import { SessionEnrollmentDeleteDialog } from './session-enrollment-delete-dialog';
import { SessionEnrollmentTransferDialog } from './session-enrollment-transfer-dialog';
import {
  toEntityId,
  buildWhatsAppUrl,
  getEnrollmentPhoneE164,
  isEnrollmentPhoneVerified,
} from './session-enrollment-utils';

// ----------------------------------------------------------------------

const ENROLLMENT_STATUS = {
  REGISTERED: { label: 'Inscrit', color: 'info' },
  CONFIRMED: { label: 'Confirmé', color: 'success' },
  CANCELLED: { label: 'Annulé', color: 'error' },
  PENDING: { label: 'En attente', color: 'warning' },
  COMPLETED: { label: 'Terminé', color: 'default' },
};

const INVOICE_STATUS = {
  PAID: { label: 'Payée', color: 'success' },
  ISSUED: { label: 'Émise', color: 'warning' },
  DRAFT: { label: 'Brouillon', color: 'default' },
  CANCELLED: { label: 'Annulée', color: 'error' },
};

const EXAM_STATUS = {
  REGISTERED: { label: 'Inscrit', color: 'info' },
  PASSED: { label: 'Réussi', color: 'success' },
  FAILED: { label: 'Échoué', color: 'error' },
  ABSENT: { label: 'Absent', color: 'warning' },
};

const INVOICE_TYPE_LABELS = {
  ENROLLMENT: 'Inscription',
  PLATFORM_COMMISSION: 'Commission plateforme',
};

// ----------------------------------------------------------------------

/**
 * Candidate details drawer (shared by the session details page and the candidates page).
 *
 * @param {object}   enrollment    Enrollment object (may be partial: the drawer fetches the details)
 * @param {string}   enrollmentId  Alternative to `enrollment`
 * @param {object}   session       Session of the enrollment (fallback: enrollment.session)
 * @param {string}   instituteId   Institute id (used for the transfer dialog)
 * @param {boolean}  canManage     Show management actions (comment, SMS, transfer, delete)
 * @param {function} onUpdated     Called after a comment update / transfer with the updated enrollment
 * @param {function} onDeleted     Called after the enrollment is deleted
 */
export function InstituteCandidateDetailsDrawer({
  open,
  onClose,
  enrollment: initialEnrollment,
  enrollmentId: enrollmentIdProp,
  session,
  instituteId,
  canManage = false,
  onUpdated,
  onDeleted,
}) {
  const { t } = useTranslate('session_management');

  const enrollmentId = enrollmentIdProp || toEntityId(initialEnrollment);
  const { enrollment: fetched, enrollmentLoading, enrollmentMutate } = useGetInstituteEnrollment(
    open ? enrollmentId : null
  );

  // Prefer the fetched details, fall back on the data passed by the caller
  const enrollment = fetched
    ? { ...initialEnrollment, ...fetched, session: fetched.session || initialEnrollment?.session || session }
    : initialEnrollment || null;

  const resolvedSession = session || enrollment?.session || {};
  const resolvedInstituteId = instituteId || toEntityId(resolvedSession?.institute);

  const smsDialog = useBoolean();
  const deleteDialog = useBoolean();
  const transferDialog = useBoolean();

  const handleCommentSaved = useCallback(
    (updated) => {
      enrollmentMutate();
      onUpdated?.(updated);
    },
    [enrollmentMutate, onUpdated]
  );

  const handleDeleted = useCallback(
    (deleted) => {
      onDeleted?.(deleted);
      onClose();
    },
    [onDeleted, onClose]
  );

  const handleTransferred = useCallback(
    (updated, targetSessionId) => {
      enrollmentMutate();
      onUpdated?.(updated, { transferredTo: targetSessionId });
      onClose();
    },
    [enrollmentMutate, onUpdated, onClose]
  );

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        slotProps={{
          backdrop: { invisible: false },
          paper: { sx: { width: { xs: 1, sm: 480 } } },
        }}
      >
        <DrawerHeader title={t('candidate_sheet')} onClose={onClose} />

        {enrollmentLoading && !enrollment && <LinearProgress />}

        {!enrollmentLoading && !enrollment && (
          <Box sx={{ p: 3 }}>
            <EmptyContent title={t('detail_not_found')} />
          </Box>
        )}

        {enrollment && (
          <Scrollbar fillContent>
            <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <CandidateHeader enrollment={enrollment} session={resolvedSession} t={t} />

              {canManage && (
                <>
                  <Divider />
                  <ActionsSection
                    enrollment={enrollment}
                    t={t}
                    onSms={smsDialog.onTrue}
                    onTransfer={transferDialog.onTrue}
                    onDelete={deleteDialog.onTrue}
                  />
                </>
              )}

              <Divider />
              <CommentSection
                enrollment={enrollment}
                editable={canManage}
                t={t}
                onSaved={handleCommentSaved}
              />

              <Divider />
              <PaymentSection enrollment={enrollment} />
              <Divider />
              <ExamsSection enrollment={enrollment} />
            </Box>
          </Scrollbar>
        )}
      </Drawer>

      {canManage && enrollment && (
        <>
          <SessionEnrollmentSmsDialog
            open={smsDialog.value}
            onClose={smsDialog.onFalse}
            enrollment={enrollment}
            session={resolvedSession}
          />
          <SessionEnrollmentDeleteDialog
            open={deleteDialog.value}
            onClose={deleteDialog.onFalse}
            enrollment={enrollment}
            onDeleted={handleDeleted}
          />
          <SessionEnrollmentTransferDialog
            open={transferDialog.value}
            onClose={transferDialog.onFalse}
            enrollment={enrollment}
            session={resolvedSession}
            instituteId={resolvedInstituteId}
            onTransferred={handleTransferred}
          />
        </>
      )}
    </>
  );
}

// ----------------------------------------------------------------------

function DrawerHeader({ title, onClose }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{ p: 2, borderBottom: (theme) => `solid 1px ${theme.vars.palette.divider}` }}
    >
      <Typography variant="h6">{title}</Typography>
      <IconButton onClick={onClose}>
        <Iconify icon="mingcute:close-line" />
      </IconButton>
    </Stack>
  );
}

// ----------------------------------------------------------------------

function CandidateHeader({ enrollment, session, t }) {
  const user = enrollment.user || {};
  const status = enrollment.status || 'REGISTERED';
  const statusMeta = ENROLLMENT_STATUS[status] || { label: status, color: 'default' };

  const fullName = `${user.firstname || user.firstName || ''} ${user.lastname || user.lastName || ''}`.trim();
  const phone = getEnrollmentPhoneE164(enrollment);
  const phoneVerified = isEnrollmentPhoneVerified(enrollment);

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar src={user.avatar} sx={{ width: 56, height: 56 }}>
          {fullName.charAt(0).toUpperCase()}
        </Avatar>
        <Stack sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" noWrap>
            {fullName || '—'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
            {user.email || ''}
          </Typography>
          <Box sx={{ mt: 0.5 }}>
            <Label variant="soft" color={statusMeta.color}>
              {statusMeta.label}
            </Label>
          </Box>
        </Stack>
      </Stack>

      <Stack spacing={1.25}>
        <InfoRow icon="solar:document-text-bold" label="N° Dossier" value={enrollment.referenceNumber} />
        <InfoRow icon="solar:user-id-bold" label="N° Candidat" value={user.candidateNumber} />
        <InfoRow
          icon="solar:phone-bold"
          label="Téléphone"
          value={
            phone ? (
              <Stack direction="row" alignItems="center" spacing={1}>
                <span>{phone}</span>
                <Tooltip title={phoneVerified ? t('phone_verified') : t('phone_unverified')}>
                  <Iconify
                    icon={phoneVerified ? 'solar:verified-check-bold' : 'solar:shield-warning-bold'}
                    width={16}
                    sx={{ color: phoneVerified ? 'success.main' : 'text.disabled' }}
                  />
                </Tooltip>
              </Stack>
            ) : null
          }
        />
        <InfoRow
          icon="solar:calendar-date-bold"
          label="Inscrit le"
          value={
            enrollment.registrationDate || enrollment.createdAt
              ? fDate(enrollment.registrationDate || enrollment.createdAt)
              : null
          }
        />
        <InfoRow icon="solar:book-bold" label="Test" value={session?.assessment?.label} />
        <InfoRow
          icon="solar:calendar-bold"
          label="Session"
          value={session?.start ? fDateTime(session.start) : null}
        />
      </Stack>
    </Stack>
  );
}

// ----------------------------------------------------------------------

function ActionsSection({ enrollment, t, onSms, onTransfer, onDelete }) {
  const phone = getEnrollmentPhoneE164(enrollment);
  const whatsAppUrl = buildWhatsAppUrl(enrollment, '');
  const isCancelled = enrollment.status === 'CANCELLED';

  return (
    <Stack spacing={1.5}>
      <SectionTitle icon="solar:settings-bold" title={t('actions')} />
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Tooltip title={phone ? '' : t('no_phone')}>
          <span>
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              disabled={!phone}
              onClick={onSms}
              startIcon={<Iconify icon="solar:chat-round-dots-bold" />}
            >
              {t('sms')}
            </Button>
          </span>
        </Tooltip>

        <Tooltip title={phone ? '' : t('no_phone')}>
          <span>
            <Button
              size="small"
              variant="outlined"
              color="success"
              component="a"
              href={whatsAppUrl || undefined}
              target="_blank"
              rel="noopener noreferrer"
              disabled={!whatsAppUrl}
              startIcon={<Iconify icon="ic:baseline-whatsapp" />}
            >
              {t('whatsapp')}
            </Button>
          </span>
        </Tooltip>

        <Button
          size="small"
          variant="outlined"
          color="inherit"
          disabled={isCancelled}
          onClick={onTransfer}
          startIcon={<Iconify icon="solar:transfer-horizontal-bold" />}
        >
          {t('transfer')}
        </Button>

        <Button
          size="small"
          variant="soft"
          color="error"
          onClick={onDelete}
          startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
        >
          {t('delete_enrollment')}
        </Button>
      </Stack>
    </Stack>
  );
}

// ----------------------------------------------------------------------

function CommentSection({ enrollment, editable, t, onSaved }) {
  const [value, setValue] = useState(enrollment.information || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(enrollment.information || '');
  }, [enrollment.information, enrollment.id]);

  const dirty = (value || '') !== (enrollment.information || '');

  const handleSave = useCallback(async () => {
    const enrollmentId = toEntityId(enrollment);
    if (!enrollmentId) return;
    setSaving(true);
    try {
      const updated = await updateEnrollmentInformation(enrollmentId, value.trim());
      toast.success(t('comment_saved'));
      onSaved?.(updated || { ...enrollment, information: value.trim() });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }, [enrollment, value, onSaved, t]);

  if (!editable) {
    if (!enrollment.information) return null;
    return (
      <Stack spacing={1.5}>
        <SectionTitle icon="solar:chat-round-line-bold" title={t('comment')} />
        <Box
          sx={{
            p: 1.5,
            borderRadius: 1,
            bgcolor: 'background.neutral',
            typography: 'body2',
            whiteSpace: 'pre-wrap',
          }}
        >
          {enrollment.information}
        </Box>
      </Stack>
    );
  }

  return (
    <Stack spacing={1.5}>
      <SectionTitle icon="solar:chat-round-line-bold" title={t('comment_label')} />
      <TextField
        fullWidth
        multiline
        minRows={3}
        size="small"
        placeholder={t('comment_placeholder')}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <Stack direction="row" justifyContent="flex-end">
        <LoadingButton
          size="small"
          variant="contained"
          loading={saving}
          disabled={!dirty}
          onClick={handleSave}
          startIcon={<Iconify icon="solar:check-circle-bold" width={16} />}
        >
          {t('save')}
        </LoadingButton>
      </Stack>
    </Stack>
  );
}

// ----------------------------------------------------------------------

function PaymentSection({ enrollment }) {
  const invoices = enrollment.invoices || [];
  const enrollmentInvoices = invoices.filter((inv) => inv.businessType !== 'PLATFORM_COMMISSION');

  return (
    <Stack spacing={1.5}>
      <SectionTitle icon="solar:wallet-bold" title="Paiements" count={enrollmentInvoices.length} />

      {enrollmentInvoices.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
          Aucune facture liée à cette inscription
        </Typography>
      ) : (
        <Stack spacing={1.25}>
          {enrollmentInvoices.map((invoice) => (
            <InvoiceRow key={invoice.id || invoice['@id']} invoice={invoice} />
          ))}
        </Stack>
      )}
    </Stack>
  );
}

function InvoiceRow({ invoice }) {
  const statusMeta = INVOICE_STATUS[invoice.status] || { label: invoice.status || '—', color: 'default' };
  const typeLabel = INVOICE_TYPE_LABELS[invoice.businessType] || invoice.businessType || '';
  const invoiceId = invoice.id || (invoice['@id'] || '').split('/').pop();
  const href = invoiceId ? paths.dashboard.espaceInstitut.invoiceDetails(invoiceId) : null;

  return (
    <Box
      component={href ? RouterLink : 'div'}
      href={href || undefined}
      sx={{
        p: 1.5,
        borderRadius: 1,
        border: (theme) => `solid 1px ${theme.vars.palette.divider}`,
        textDecoration: 'none',
        color: 'inherit',
        display: 'block',
        transition: (theme) => theme.transitions.create(['background-color', 'border-color']),
        ...(href && {
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: 'action.hover',
            borderColor: 'primary.main',
          },
        }),
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
        <Stack sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Typography variant="subtitle2" noWrap>
              {invoice.invoiceNumber || 'Brouillon'}
            </Typography>
            {href && (
              <Iconify icon="solar:arrow-right-up-linear" width={14} sx={{ color: 'text.disabled' }} />
            )}
          </Stack>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {typeLabel}
            {invoice.invoiceDate ? ` • ${fDate(invoice.invoiceDate)}` : ''}
          </Typography>
        </Stack>
        <Stack alignItems="flex-end" spacing={0.5}>
          <Typography variant="subtitle2">{fCurrency(invoice.totalTTC)}</Typography>
          <Label variant="soft" color={statusMeta.color}>
            {statusMeta.label}
          </Label>
        </Stack>
      </Stack>
    </Box>
  );
}

// ----------------------------------------------------------------------

function ExamsSection({ enrollment }) {
  const enrollmentExams = enrollment.enrollmentExams || [];

  return (
    <Stack spacing={1.5}>
      <SectionTitle icon="solar:document-medicine-bold" title="Épreuves" count={enrollmentExams.length} />

      {enrollmentExams.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
          Aucune épreuve programmée
        </Typography>
      ) : (
        <Stack spacing={1.25}>
          {enrollmentExams.map((ee) => (
            <ExamRow key={ee.id || ee['@id']} enrollmentExam={ee} />
          ))}
        </Stack>
      )}
    </Stack>
  );
}

function ExamRow({ enrollmentExam }) {
  const scheduledExam = enrollmentExam.scheduledExam || {};
  const exam = scheduledExam.exam || enrollmentExam.exam || {};
  const statusMeta = EXAM_STATUS[enrollmentExam.status] || {
    label: enrollmentExam.status || '—',
    color: 'default',
  };

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 1,
        border: (theme) => `solid 1px ${theme.vars.palette.divider}`,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
        <Stack sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="subtitle2" noWrap>
              {exam.label || '—'}
            </Typography>
            {(exam.isOption ?? exam.option) && (
              <Label variant="soft" color="info">
                Option
              </Label>
            )}
          </Stack>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {scheduledExam.startDate ? fDateTime(scheduledExam.startDate) : 'Date non définie'}
            {exam.duration ? ` • ${exam.duration} min` : ''}
            {exam.coeff ? ` • Coeff. ${exam.coeff}` : ''}
          </Typography>
        </Stack>
        <Stack alignItems="flex-end" spacing={0.5}>
          {enrollmentExam.finalScore != null && (
            <Typography variant="subtitle2">
              {enrollmentExam.finalScore}
              {exam.nbrQuestions ? `/${exam.nbrQuestions}` : ''}
            </Typography>
          )}
          <Label variant="soft" color={statusMeta.color}>
            {statusMeta.label}
          </Label>
        </Stack>
      </Stack>
    </Box>
  );
}

// ----------------------------------------------------------------------

function SectionTitle({ icon, title, count }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Iconify icon={icon} width={20} sx={{ color: 'text.secondary' }} />
      <Typography variant="overline" sx={{ color: 'text.secondary' }}>
        {title}
      </Typography>
      {count != null && (
        <Label variant="soft" color="default">
          {count}
        </Label>
      )}
    </Stack>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1.5}>
      <Iconify icon={icon} width={18} sx={{ color: 'text.disabled', flexShrink: 0 }} />
      <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 90 }}>
        {label}
      </Typography>
      {typeof value === 'string' || value == null ? (
        <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }} noWrap>
          {value || '—'}
        </Typography>
      ) : (
        <Box sx={{ flex: 1, minWidth: 0, typography: 'body2' }}>{value}</Box>
      )}
    </Stack>
  );
}
