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
  LOCKED: 'warning',
  VALIDATED: 'info',
  CANCELLED: 'error',
};

const STATUS_LABELS = {
  DRAFT: 'Brouillon',
  OPEN: 'Ouverte',
  LOCKED: 'Verrouillée',
  VALIDATED: 'Validée',
  CANCELLED: 'Annulée',
};

// ----------------------------------------------------------------------

export function MesInscriptionsListView() {
  const router = useRouter();
  const { enrollments, enrollmentsLoading, enrollmentsEmpty } = useGetMyEnrollments();

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
        heading="Mes inscriptions"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Mes inscriptions' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {enrollmentsEmpty ? (
        <EmptyContent
          title="Aucune inscription"
          description="Vous n'êtes inscrit à aucune session pour le moment."
        />
      ) : (
        <Grid container spacing={3}>
          {enrollments.map((enrollment) => (
            <Grid key={enrollment.id || enrollment['@id']} size={{ xs: 12, sm: 6, md: 4 }}>
              <EnrollmentCard
                enrollment={enrollment}
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

function EnrollmentCard({ enrollment, onClick }) {
  const session = enrollment.session || {};
  const status = session.status || 'DRAFT';
  const enrollmentExams = enrollment.enrollmentExams || [];
  const invoices = enrollment.invoices || [];

  // Payment status
  const enrollmentInvoice = invoices.find((inv) => inv.businessType !== 'PLATFORM_COMMISSION');
  const isPaid = enrollmentInvoice?.status === 'PAID';

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
                {session.assessment?.label || 'Session'}
              </Typography>
              <Label color={STATUS_COLORS[status]} variant="soft">
                {STATUS_LABELS[status] || status}
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
                  icon={isPaid ? 'solar:check-circle-bold' : 'solar:clock-circle-bold'}
                  width={18}
                  sx={{ color: isPaid ? 'success.main' : 'warning.main' }}
                />
                <Typography variant="caption">
                  {isPaid ? 'Payé' : 'En attente'}
                </Typography>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Iconify icon="solar:notebook-bold" width={18} sx={{ color: 'text.secondary' }} />
                <Typography variant="caption">
                  {enrollmentExams.length} épreuve(s)
                </Typography>
              </Stack>

              {docCount > 0 && (
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Iconify icon="solar:document-bold" width={18} sx={{ color: 'info.main' }} />
                  <Typography variant="caption">
                    {docCount} doc(s)
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
