'use client';

import { useState, useEffect, useCallback } from 'react';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import LinearProgress from '@mui/material/LinearProgress';

import { fDateTime } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { useTranslate } from 'src/locales';
import { deleteEnrollmentSession, getEnrollmentRefundPreview } from 'src/actions/session-management';

import { toast } from 'src/components/snackbar';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { getErrorMessage } from 'src/auth/utils';

// ----------------------------------------------------------------------

/**
 * Annulation d'une inscription par le candidat, avec l'aperçu du remboursement.
 * L'API rembourse le paiement Stripe, annule la facture (avoir) et envoie un email de confirmation.
 */
export function MesInscriptionsCancelDialog({ open, onClose, enrollment, onCancelled }) {
  const { t } = useTranslate('inscriptions');

  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const enrollmentId = enrollment?.id || enrollment?.['@id'];
  const limitDate = enrollment?.session?.limitDateSubscribe;

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
    setCancelling(true);
    try {
      await deleteEnrollmentSession(enrollmentId);
      toast.success(t('cancel_success'));
      onCancelled?.();
    } catch (error) {
      toast.error(getErrorMessage(error));
      setCancelling(false);
    }
  }, [enrollmentId, onCancelled, t]);

  const paidAmount = Number(preview?.paidAmount || 0);

  const renderRefund = () => {
    if (previewLoading) return <LinearProgress />;
    if (previewError) return <Alert severity="warning">{t('cancel_preview_unavailable')}</Alert>;
    if (!preview) return null;

    return paidAmount > 0 ? (
      <Alert severity="info">{t('cancel_refund_info', { amount: fCurrency(paidAmount) })}</Alert>
    ) : (
      <Alert severity="info">{t('cancel_no_payment')}</Alert>
    );
  };

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      title={t('cancel_title')}
      content={
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          <Typography variant="body2">{t('cancel_description')}</Typography>
          {renderRefund()}
          {limitDate && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t('cancel_deadline', { date: fDateTime(limitDate) })}
            </Typography>
          )}
        </Stack>
      }
      action={
        <LoadingButton
          variant="contained"
          color="error"
          loading={cancelling}
          disabled={previewLoading}
          onClick={handleConfirm}
        >
          {t('cancel_confirm')}
        </LoadingButton>
      }
    />
  );
}
