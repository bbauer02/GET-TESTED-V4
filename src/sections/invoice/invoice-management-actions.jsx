'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { fDateTime } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { useTranslate } from 'src/locales';
import {
  failPayment,
  issueInvoice,
  refundPayment,
  completePayment,
  createInvoicePayment,
} from 'src/actions/invoice';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { getErrorMessage } from 'src/auth/utils';

// ----------------------------------------------------------------------

const PAYMENT_STATUS_COLORS = {
  PENDING: 'warning',
  COMPLETED: 'success',
  FAILED: 'error',
  REFUNDED: 'default',
};

const PAYMENT_METHODS = ['BANK_TRANSFER', 'OTHER', 'STRIPE'];

const round2 = (value) => Math.round(value * 100) / 100;

// ----------------------------------------------------------------------

/**
 * Actions de gestion d'une facture selon son statut (logique portée par l'API) :
 * - DRAFT : émission (PATCH /invoices/{id}/issue)
 * - ISSUED : enregistrement d'un paiement (POST /invoices/{id}/payments puis /payments/{id}/complete)
 * - paiements PENDING : confirmer / marquer en échec ; COMPLETED : rembourser (avoir)
 */
export function InvoiceManagementActions({ invoice, onUpdated, sx }) {
  const { t } = useTranslate('invoice');

  // { kind: 'issue' | 'complete' | 'fail' | 'refund', payment? }
  const [confirm, setConfirm] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');

  if (!invoice) return null;

  const payments = invoice.payments || [];
  const paidAmount = round2(
    payments.filter((p) => p.status === 'COMPLETED').reduce((sum, p) => sum + (p.amount || 0), 0)
  );
  const remaining = Math.max(0, round2((invoice.totalTTC || 0) - paidAmount));

  const isDraft = invoice.status === 'DRAFT';
  const isIssued = invoice.status === 'ISSUED';
  // Un avoir (montant négatif) ne reçoit pas de paiement
  const canRecordPayment = isIssued && invoice.invoiceType !== 'CREDIT_NOTE' && remaining > 0;
  const hasLines = (invoice.lines || []).length > 0;

  const run = async (action, successMessage) => {
    setSubmitting(true);
    try {
      await action();
      toast.success(successMessage);
      await onUpdated?.();
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirm) return;
    const { kind, payment } = confirm;
    const actions = {
      issue: () => issueInvoice(invoice.id),
      complete: () => completePayment(payment.id),
      fail: () => failPayment(payment.id),
      refund: () => refundPayment(payment.id),
    };
    await run(actions[kind], t(`action_${kind}_success`));
    setConfirm(null);
  };

  const handleOpenPayment = () => {
    setPaymentAmount(remaining ? String(remaining) : '');
    setPaymentMethod('BANK_TRANSFER');
    setPaymentOpen(true);
  };

  const amountValue = Number(String(paymentAmount).replace(',', '.'));
  const amountValid = Number.isFinite(amountValue) && amountValue > 0;

  const handleRecordPayment = async () => {
    if (!amountValid) return;
    // Paiement reçu hors Stripe : création puis confirmation immédiate
    const ok = await run(async () => {
      const created = await createInvoicePayment(invoice.id, {
        amount: round2(amountValue),
        paymentMethod,
      });
      await completePayment(created.id);
    }, t('action_payment_success'));
    if (ok) setPaymentOpen(false);
  };

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={!!confirm}
      onClose={() => {
        if (!submitting) setConfirm(null);
      }}
      title={confirm ? t(`action_${confirm.kind}_title`) : ''}
      content={
        confirm
          ? t(`action_${confirm.kind}_confirm`, {
              amount: confirm.payment ? fCurrency(confirm.payment.amount) : '',
              interpolation: { escapeValue: false },
            })
          : ''
      }
      action={
        <Button
          variant="contained"
          color={['fail', 'refund'].includes(confirm?.kind) ? 'error' : 'primary'}
          loading={submitting}
          onClick={handleConfirm}
        >
          {confirm ? t(`action_${confirm.kind}`) : ''}
        </Button>
      }
    />
  );

  const renderPaymentDialog = () => (
    <Dialog
      fullWidth
      maxWidth="xs"
      open={paymentOpen}
      onClose={() => {
        if (!submitting) setPaymentOpen(false);
      }}
    >
      <DialogTitle>{t('action_payment_title')}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
          {t('action_payment_description', {
            remaining: fCurrency(remaining),
            interpolation: { escapeValue: false },
          })}
        </Typography>
        <Stack spacing={2.5}>
          <TextField
            label={t('payment_amount')}
            type="number"
            value={paymentAmount}
            onChange={(event) => setPaymentAmount(event.target.value)}
            error={paymentAmount !== '' && !amountValid}
            slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
          />
          <TextField
            select
            label={t('payment_method')}
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
          >
            {PAYMENT_METHODS.map((method) => (
              <MenuItem key={method} value={method}>
                {t(`payment_method_${method}`)}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          loading={submitting}
          disabled={!amountValid}
          onClick={handleRecordPayment}
        >
          {t('action_payment')}
        </Button>
        <Button variant="outlined" color="inherit" onClick={() => setPaymentOpen(false)}>
          {t('cancel')}
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderPayments = () => (
    <Scrollbar>
      <Table size="small" sx={{ minWidth: 640 }}>
        <TableHead>
          <TableRow>
            <TableCell>{t('payment_date')}</TableCell>
            <TableCell>{t('payment_method')}</TableCell>
            <TableCell align="right">{t('payment_amount')}</TableCell>
            <TableCell>{t('payment_status')}</TableCell>
            <TableCell align="right" />
          </TableRow>
        </TableHead>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>{fDateTime(payment.date) || '-'}</TableCell>
              <TableCell>
                {t(`payment_method_${payment.paymentMethod}`, {
                  defaultValue: payment.paymentMethod,
                })}
              </TableCell>
              <TableCell align="right">{fCurrency(payment.amount)}</TableCell>
              <TableCell>
                <Label variant="soft" color={PAYMENT_STATUS_COLORS[payment.status] || 'default'}>
                  {t(`payment_status_${payment.status}`, { defaultValue: payment.status })}
                </Label>
              </TableCell>
              <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                {payment.status === 'PENDING' && (
                  <>
                    <Button
                      size="small"
                      color="success"
                      onClick={() => setConfirm({ kind: 'complete', payment })}
                    >
                      {t('action_complete')}
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => setConfirm({ kind: 'fail', payment })}
                    >
                      {t('action_fail')}
                    </Button>
                  </>
                )}
                {payment.status === 'COMPLETED' && (
                  <Button
                    size="small"
                    color="error"
                    onClick={() => setConfirm({ kind: 'refund', payment })}
                  >
                    {t('action_refund')}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Scrollbar>
  );

  return (
    <>
      <Card sx={sx}>
        <CardHeader
          title={t('management_title')}
          subheader={
            isIssued || invoice.status === 'PAID'
              ? t('management_paid_summary', {
                  paid: fCurrency(paidAmount),
                  total: fCurrency(invoice.totalTTC),
                  interpolation: { escapeValue: false },
                })
              : undefined
          }
          action={
            <Stack direction="row" spacing={1}>
              {isDraft && (
                <Button
                  variant="contained"
                  disabled={!hasLines}
                  startIcon={<Iconify icon="solar:file-send-bold" />}
                  onClick={() => setConfirm({ kind: 'issue' })}
                >
                  {t('action_issue')}
                </Button>
              )}
              {canRecordPayment && (
                <Button
                  variant="contained"
                  startIcon={<Iconify icon="solar:wallet-money-bold" />}
                  onClick={handleOpenPayment}
                >
                  {t('action_payment')}
                </Button>
              )}
            </Stack>
          }
        />

        <Box sx={{ p: 3, pt: 2 }}>
          {isDraft && !hasLines && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {t('management_no_lines')}
            </Alert>
          )}

          {payments.length ? (
            renderPayments()
          ) : (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {isDraft ? t('management_draft_hint') : t('management_no_payments')}
            </Typography>
          )}
        </Box>
      </Card>

      {renderConfirmDialog()}
      {renderPaymentDialog()}
    </>
  );
}
