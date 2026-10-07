'use client';

import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fDateTime } from 'src/utils/format-time';
import { PAYMENT_STATE_ICONS, getEnrollmentPayment } from 'src/utils/enrollment-payment';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { useGetMyEnrollments } from 'src/actions/mes-inscriptions';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

const STATUS_COLORS = {
  DRAFT: 'default',
  OPEN: 'success',
  LOCKED: 'default',
  VALIDATED: 'info',
  CANCELLED: 'error',
};

// ----------------------------------------------------------------------

export function MesInscriptionsListView() {
  const { t } = useTranslate('inscriptions');
  const router = useRouter();
  const { enrollments, enrollmentsLoading, enrollmentsEmpty } = useGetMyEnrollments();

  const STATUS_LABELS = {
    DRAFT: t('status_draft'),
    OPEN: t('status_open'),
    LOCKED: t('status_locked'),
    VALIDATED: t('status_validated'),
    CANCELLED: t('status_cancelled'),
  };

  if (enrollmentsLoading) {
    return (
      <DashboardContent>
        <LoadingScreen />
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('my_enrollments')}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: t('my_enrollments') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {enrollmentsEmpty ? (
        <EmptyContent
          title={t('no_enrollment')}
          description={t('no_enrollment_desc')}
        />
      ) : (
        <Grid container spacing={3}>
          {enrollments.map((enrollment) => (
            <Grid key={enrollment.id || enrollment['@id']} size={{ xs: 12, sm: 6, md: 4 }}>
              <EnrollmentCard
                enrollment={enrollment}
                t={t}
                statusLabels={STATUS_LABELS}
                onClick={() => {
                  const enrollmentId = enrollment.id || enrollment['@id']?.split('/').pop();
                  router.push(paths.dashboard.mesInscriptions.details(enrollmentId));
                }}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

function EnrollmentCard({ enrollment, onClick, t, statusLabels }) {
  const session = enrollment.session || {};
  const status = session.status || 'DRAFT';
  const enrollmentExams = enrollment.enrollmentExams || [];
  const { state: paymentState } = getEnrollmentPayment(enrollment);

  // Count published documents
  const docCount = session.documentPublications?.length || 0;

  return (
    <Card>
      <CardActionArea onClick={onClick}>
        <CardContent>
          <Stack spacing={2}>
            {/* Header: assessment + status */}
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle1" noWrap sx={{ flexGrow: 1, mr: 1 }}>
                {session.assessment?.label || t('session')}
              </Typography>
              <Label color={STATUS_COLORS[status]} variant="soft">
                {statusLabels[status] || status}
              </Label>
            </Stack>

            {/* Institute */}
            {session.institute?.label && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <Iconify icon="solar:buildings-2-bold" width={18} sx={{ color: 'text.secondary' }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {session.institute.label}
                </Typography>
              </Stack>
            )}

            {/* Level */}
            {session.level?.label && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <Iconify icon="solar:medal-ribbons-star-bold" width={18} sx={{ color: 'text.secondary' }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {session.level.label}
                </Typography>
              </Stack>
            )}

            {/* Date */}
            <Stack direction="row" alignItems="center" spacing={1}>
              <Iconify icon="solar:calendar-bold" width={18} sx={{ color: 'text.secondary' }} />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {fDateTime(session.start)}
              </Typography>
            </Stack>

            {/* Bottom row: payment + exams + documents */}
            <Stack direction="row" alignItems="center" spacing={2} sx={{ pt: 1, borderTop: '1px dashed', borderColor: 'divider' }}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Iconify
                  icon={PAYMENT_STATE_ICONS[paymentState]}
                  width={18}
                  sx={{ color: paymentState === 'paid' ? 'success.main' : paymentState === 'to_pay' ? 'warning.main' : 'text.disabled' }}
                />
                <Typography variant="caption">
                  {t(`payment_state_${paymentState}`)}
                </Typography>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Iconify icon="solar:notebook-bold" width={18} sx={{ color: 'text.secondary' }} />
                <Typography variant="caption">
                  {t('exams_count', { count: enrollmentExams.length })}
                </Typography>
              </Stack>

              {docCount > 0 && (
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Iconify icon="solar:document-bold" width={18} sx={{ color: 'info.main' }} />
                  <Typography variant="caption">
                    {t('docs_count', { count: docCount })}
                  </Typography>
                </Stack>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
