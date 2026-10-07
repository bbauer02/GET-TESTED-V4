'use client';

import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { useRouter, useParams, usePathname, useSearchParams } from 'src/routes/hooks';

import { fCurrency } from 'src/utils/format-number';
import { fDate, fDateTime } from 'src/utils/format-time';
import { PAYMENT_STATE_ICONS, getEnrollmentPayment, PAYMENT_STATE_COLORS } from 'src/utils/enrollment-payment';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { useGetMyEnrollment } from 'src/actions/mes-inscriptions';
import { useGetEnrollmentDocuments } from 'src/actions/session-management';
import { waitForInvoicePayment, redirectToInvoiceCheckout } from 'src/actions/payment';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { getErrorMessage } from 'src/auth/utils';

import { MesInscriptionsDocumentDialog } from '../mes-inscriptions-document-dialog';

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

// ----------------------------------------------------------------------

export function MesInscriptionsDetailsView() {
  const { t } = useTranslate('inscriptions');
  const { t: tm } = useTranslate('session_management');
  const { enrollmentId } = useParams();
  const { enrollment, enrollmentLoading, enrollmentMutate } = useGetMyEnrollment(enrollmentId);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const paymentResult = searchParams.get('payment');
  const returnedInvoiceId = searchParams.get('invoice');

  const [payLoading, setPayLoading] = useState(false);
  const [paymentCheck, setPaymentCheck] = useState(null); // 'checking' | 'pending'

  // Retour de Stripe : confirmer le paiement auprès de l'API avant d'annoncer quoi que ce soit
  const handledPaymentReturn = useRef(false);

  useEffect(() => {
    if (!paymentResult || handledPaymentReturn.current) return;
    handledPaymentReturn.current = true;

    router.replace(pathname);

    if (paymentResult === 'cancel') {
      toast.info(t('payment_cancelled'));
      return;
    }

    if (paymentResult === 'success' && returnedInvoiceId) {
      setPaymentCheck('checking');
      waitForInvoicePayment(returnedInvoiceId).then((result) => {
        enrollmentMutate();
        if (result === 'paid') {
          setPaymentCheck(null);
          toast.success(t('payment_confirmed'));
        } else {
          setPaymentCheck('pending');
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentResult]);

  const handlePay = useCallback(async (invoiceId) => {
    setPayLoading(true);
    try {
      await redirectToInvoiceCheckout(invoiceId, `${window.location.origin}${pathname}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
      setPayLoading(false);
    }
  }, [pathname]);
  const { documents: apiDocuments, documentsError } = useGetEnrollmentDocuments(enrollmentId);

  const [docDialogOpen, setDocDialogOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Documents with availability (API), fallback on the session publications when unavailable
  const documents = useMemo(() => {
    if (!documentsError && apiDocuments.length > 0) {
      return apiDocuments.map((doc) => ({
        key: doc.documentType?.id || doc.documentType?.code || doc.publication?.id,
        documentType: doc.documentType || {},
        template: doc.template || null,
        available: !!doc.availability?.available,
        reason: doc.availability?.reason || '',
        availableFrom: doc.availability?.availableFrom || null,
      }));
    }
    return (enrollment?.session?.documentPublications || []).map((pub) => ({
      key: pub.id || pub['@id'],
      documentType: pub.documentType || {},
      template: null,
      available: !!pub.availability?.available,
      reason: pub.availability?.reason || '',
      availableFrom: pub.availability?.availableFrom || null,
    }));
  }, [apiDocuments, documentsError, enrollment?.session?.documentPublications]);

  const availableCount = documents.filter((d) => d.available).length;

  const STATUS_LABELS = {
    DRAFT: t('status_draft'),
    OPEN: t('status_open'),
    LOCKED: t('status_locked'),
    VALIDATED: t('status_validated'),
    CANCELLED: t('status_cancelled'),
  };

  const ENROLLMENT_EXAM_STATUS_LABELS = {
    REGISTERED: t('exam_status_registered'),
    PASSED: t('exam_status_passed'),
    FAILED: t('exam_status_failed'),
    ABSENT: t('exam_status_absent'),
  };

  const handleOpenDocument = useCallback((doc) => {
    if (!doc.available) return;
    setSelectedDocType(doc.documentType);
    setSelectedTemplate(doc.template);
    setDocDialogOpen(true);
  }, []);

  const formatReason = (reason) => {
    if (!reason) return '';
    if (/^[A-Z0-9_]+$/.test(reason)) {
      return tm(`reason_${reason}`, { defaultValue: reason.toLowerCase().replace(/_/g, ' ') });
    }
    return reason;
  };

  if (enrollmentLoading) {
    return (
      <DashboardContent>
        <LoadingScreen />
      </DashboardContent>
    );
  }

  if (!enrollment) {
    return (
      <DashboardContent>
        <EmptyContent title={t('enrollment_not_found')} />
      </DashboardContent>
    );
  }

  const session = enrollment.session || {};
  const status = session.status || 'DRAFT';
  const enrollmentExams = enrollment.enrollmentExams || [];

  const { invoice: enrollmentInvoice, state: paymentState } = getEnrollmentPayment(enrollment);
  const canPay = paymentState === 'to_pay' && ['OPEN', 'LOCKED', 'VALIDATED'].includes(status);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('enrollment_details')}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: t('my_enrollments'), href: paths.dashboard.mesInscriptions.root },
          { name: session.assessment?.label || t('enrollment_details') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Grid container spacing={3}>
        {/* ---- Session info ---- */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={3}>
            <Card>
              <CardHeader
                title={t('session')}
                action={
                  <Label color={STATUS_COLORS[status]} variant="filled">
                    {STATUS_LABELS[status] || status}
                  </Label>
                }
              />

              <Box sx={{ p: 3, gap: 2, display: 'flex', flexDirection: 'column', typography: 'body2' }}>
                <InfoRow icon="solar:book-bold" label={t('assessment_label')} value={session.assessment?.label} />
                <InfoRow icon="solar:medal-ribbons-star-bold" label={t('level_label')} value={session.level?.label} />
                <InfoRow icon="solar:buildings-2-bold" label={t('institute_label')} value={session.institute?.label} />
                <InfoRow icon="solar:calendar-bold" label={t('start_label')} value={fDateTime(session.start)} />
                <InfoRow icon="solar:calendar-bold" label={t('end_label')} value={fDateTime(session.end)} />
                <InfoRow
                  icon="solar:calendar-date-bold"
                  label={t('registration_date_label')}
                  value={enrollment.registrationDate ? fDate(enrollment.registrationDate) : '—'}
                />

                <Box sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
                  <Iconify
                    width={24}
                    icon={PAYMENT_STATE_ICONS[paymentState]}
                    sx={{ color: 'text.secondary' }}
                  />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                      {t('payment_label')}
                    </Typography>
                    <Label color={PAYMENT_STATE_COLORS[paymentState]} variant="soft">
                      {t(`payment_state_${paymentState}`)}
                    </Label>
                  </Box>
                  {enrollmentInvoice?.totalTTC != null && (
                    <Typography variant="subtitle2">{fCurrency(enrollmentInvoice.totalTTC)}</Typography>
                  )}
                </Box>

                {paymentCheck === 'checking' && (
                  <Alert severity="info">{t('payment_checking')}</Alert>
                )}

                {paymentCheck === 'pending' && (
                  <Alert severity="warning">{t('payment_pending_confirmation')}</Alert>
                )}

                {canPay && !paymentCheck && (
                  <Stack spacing={1.5}>
                    <Alert severity="warning">{t('payment_to_pay_hint')}</Alert>
                    <LoadingButton
                      fullWidth
                      size="large"
                      variant="contained"
                      loading={payLoading}
                      loadingPosition="start"
                      startIcon={<Iconify icon="solar:card-bold" />}
                      onClick={() => handlePay(enrollmentInvoice.id)}
                    >
                      {payLoading
                        ? t('pay_redirecting')
                        : t('pay_now_button', { amount: fCurrency(enrollmentInvoice.totalTTC) })}
                    </LoadingButton>
                  </Stack>
                )}
              </Box>
            </Card>

            {/* ---- Documents ---- */}
            {documents.length > 0 && (
              <Card>
                <CardHeader
                  title={t('my_documents')}
                  subheader={tm('docs_available', { available: availableCount, total: documents.length })}
                />

                <List disablePadding>
                  {documents.map((doc) => {
                    const docType = doc.documentType;
                    const reason = formatReason(doc.reason);
                    const availableFrom = doc.availableFrom
                      ? tm('available_from', { date: fDate(doc.availableFrom) })
                      : '';
                    const secondary = doc.available
                      ? docType.code
                      : [tm('availability_unavailable'), reason, availableFrom]
                          .filter(Boolean)
                          .join(' — ');

                    return (
                      <Tooltip key={doc.key} title={doc.available ? '' : secondary} placement="left" arrow>
                        <span>
                          <ListItemButton
                            onClick={() => handleOpenDocument(doc)}
                            disabled={!doc.available}
                            sx={{ px: 3, opacity: doc.available ? 1 : 0.6 }}
                          >
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <Iconify
                                icon={
                                  doc.available
                                    ? 'solar:document-bold'
                                    : 'solar:lock-keyhole-minimalistic-bold'
                                }
                                width={22}
                                sx={{ color: doc.available ? 'primary.main' : 'text.disabled' }}
                              />
                            </ListItemIcon>
                            <ListItemText
                              primary={docType.label || docType.code || t('document_label')}
                              secondary={secondary}
                              slotProps={{
                                primary: { variant: 'subtitle2' },
                                secondary: { variant: 'caption' },
                              }}
                            />
                            <Iconify
                              icon={doc.available ? 'solar:eye-bold' : 'solar:clock-circle-bold'}
                              width={20}
                              sx={{ color: doc.available ? 'text.secondary' : 'text.disabled' }}
                            />
                          </ListItemButton>
                        </span>
                      </Tooltip>
                    );
                  })}
                </List>
              </Card>
            )}
          </Stack>
        </Grid>

        {/* ---- Exams ---- */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardHeader
              title={t('my_exams')}
              subheader={t('exams_subheader', { count: enrollmentExams.length })}
            />

            {enrollmentExams.length > 0 ? (
              <TableContainer sx={{ px: 1, pb: 2 }}>
                <Scrollbar>
                  <Table size="small" sx={{ minWidth: 400 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('exam_column')}</TableCell>
                        <TableCell>{t('date_column')}</TableCell>
                        <TableCell align="center">{t('status_column')}</TableCell>
                        <TableCell align="center">{t('score_column')}</TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {enrollmentExams.map((ee) => {
                        const scheduledExam = ee.scheduledExam || {};
                        const exam = scheduledExam.exam || ee.exam || {};

                        return (
                          <TableRow key={ee.id || ee['@id']}>
                            <TableCell>
                              <Typography variant="subtitle2">
                                {exam.label || '—'}
                              </Typography>
                              {exam.duration && (
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  {exam.duration} min
                                </Typography>
                              )}
                            </TableCell>

                            <TableCell>
                              {scheduledExam.startDate ? fDateTime(scheduledExam.startDate) : '—'}
                            </TableCell>

                            <TableCell align="center">
                              <Label
                                color={ENROLLMENT_EXAM_STATUS_COLORS[ee.status] || 'default'}
                                variant="soft"
                              >
                                {ENROLLMENT_EXAM_STATUS_LABELS[ee.status] || ee.status || '—'}
                              </Label>
                            </TableCell>

                            <TableCell align="center">
                              {ee.finalScore != null ? (
                                <Typography variant="subtitle2">
                                  {ee.finalScore}
                                  {exam.nbrQuestions ? `/${exam.nbrQuestions}` : ''}
                                </Typography>
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
                <EmptyContent title={t('no_exam')} />
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* ---- Document preview dialog ---- */}
      <MesInscriptionsDocumentDialog
        open={docDialogOpen}
        onClose={() => setDocDialogOpen(false)}
        enrollment={enrollment}
        documentType={selectedDocType}
        template={selectedTemplate}
      />
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
