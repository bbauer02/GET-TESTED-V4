'use client';

import { toast } from 'sonner';
import { useState, useEffect, useCallback } from 'react';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import LinearProgress from '@mui/material/LinearProgress';

import { fCurrency } from 'src/utils/format-number';

import { useTranslate } from 'src/locales';
import { deleteEnrollmentSession, getEnrollmentRefundPreview } from 'src/actions/session-management';

import { ConfirmDialog } from 'src/components/custom-dialog';

import { getErrorMessage } from 'src/auth/utils/error-message';

import { getEnrollmentDisplayName } from './session-enrollment-utils';

// ----------------------------------------------------------------------

export function SessionEnrollmentDeleteDialog({ open, onClose, enrollment, onDeleted }) {
  const { t } = useTranslate('session_management');

  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const enrollmentId = enrollment?.id || enrollment?.['@id'];

  useEffect(() => {
    if (!open || !enrollmentId) return undefined;

    let cancelled = false;
    setPreview(null);
    setPreviewError(false);
    setPreviewLoading(true);

    getEnrollmentRefundPreview(enrollmentId)
      .then((data) => {
        if (!cancelled) setPreview(data || null);
      })
      .catch(() => {
        if (!cancelled) setPreviewError(true);
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, enrollmentId]);

  const handleConfirm = useCallback(async () => {
    if (!enrollmentId) return;
    setDeleting(true);
    try {
      await deleteEnrollmentSession(enrollmentId);
      toast.success(t('enrollment_deleted'));
      onDeleted?.(enrollment);
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  }, [enrollmentId, enrollment, onDeleted, onClose, t]);

  const paidAmount = Number(preview?.paidAmount || 0);
  const hasPayment = paidAmount > 0 || Number(preview?.paymentCount || 0) > 0;

  const renderPreview = () => {
    if (previewLoading) return <LinearProgress />;
    if (previewError) {
      return <Alert severity="warning">{t('delete_enrollment_preview_unavailable')}</Alert>;
    }
    if (!preview) return null;
    if (hasPayment) {
      return (
        <Alert severity="warning" icon={false}>
          {t('delete_enrollment_paid', { amount: fCurrency(paidAmount) })}
        </Alert>
      );
    }
    return <Alert severity="info">{t('delete_enrollment_unpaid')}</Alert>;
  };

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      title={t('delete_enrollment_title')}
      content={
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          <Typography variant="body2">
            {t('delete_enrollment_desc', { name: getEnrollmentDisplayName(enrollment) })}
          </Typography>
          {renderPreview()}
        </Stack>
      }
      action={
        <LoadingButton variant="contained" color="error" loading={deleting} onClick={handleConfirm}>
          {t('confirm_delete')}
        </LoadingButton>
      }
    />
  );
}
