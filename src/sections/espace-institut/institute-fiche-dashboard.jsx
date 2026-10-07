'use client';

import dayjs from 'dayjs';
import { useMemo } from 'react';
import { sumBy } from 'es-toolkit';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import { alpha, useTheme } from '@mui/material/styles';
import TableContainer from '@mui/material/TableContainer';
import LinearProgress from '@mui/material/LinearProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { useGetInstituteInvoices } from 'src/actions/invoice';
import { useGetInstituteEnrollments } from 'src/actions/espace-institut';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';

import { useCurrentInstitute } from 'src/auth/hooks';

// ----------------------------------------------------------------------

const PENDING_INVOICES_HREF = `${paths.dashboard.espaceInstitut.invoices}?section=emises&status=ISSUED`;

// ----------------------------------------------------------------------

function KpiCard({ title, value, icon, color, href }) {
  const theme = useTheme();

  return (
    <Card
      component={href ? RouterLink : 'div'}
      href={href}
      sx={{
        p: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        textDecoration: 'none',
        color: 'inherit',
        ...(href && {
          cursor: 'pointer',
          transition: theme.transitions.create(['box-shadow']),
          '&:hover': { boxShadow: theme.customShadows?.z16 || theme.shadows[16] },
        }),
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          display: 'flex',
          borderRadius: '50%',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: alpha(theme.palette[color]?.main || theme.palette.primary.main, 0.12),
          color: `${color}.main`,
        }}
      >
        <Iconify icon={icon} width={28} />
      </Box>

      <Stack sx={{ flexGrow: 1 }}>
        <Typography variant="h3">{value}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {title}
        </Typography>
      </Stack>
    </Card>
  );
}

// ----------------------------------------------------------------------

const SESSION_STATUS_MAP = {
  OPEN: { label: 'Ouverte', color: 'success' },
  CLOSED: { label: 'Fermée', color: 'warning' },
  CANCELLED: { label: 'Annulée', color: 'error' },
  COMPLETED: { label: 'Terminée', color: 'default' },
  DRAFT: { label: 'Brouillon', color: 'info' },
  LOCKED: { label: 'Verrouillée', color: 'default' },
  VALIDATED: { label: 'Validée', color: 'info' },
};

// ----------------------------------------------------------------------

export function InstituteFicheDashboard({ sessions, memberships, instituteId, sx, ...other }) {
  const theme = useTheme();
  const currentInstitute = useCurrentInstitute();
  const canEditFiche = currentInstitute?.membershipRole === 'ADMIN';
  const { invoices, invoicesLoading } = useGetInstituteInvoices(instituteId);
  const { enrollments } = useGetInstituteEnrollments(instituteId);

  // Only count ENROLLMENT invoices as revenue (not PLATFORM_COMMISSION)
  const enrollmentInvoices = useMemo(
    () => (invoices || []).filter((inv) => inv.businessType !== 'PLATFORM_COMMISSION'),
    [invoices]
  );

  const stats = useMemo(() => {
    const now = dayjs();
    const openSessions = (sessions || []).filter((s) => s.status === 'OPEN');
    const totalEnrollments = (sessions || []).reduce(
      (acc, s) => acc + (s.enrollmentsCount ?? s.enrollments?.length ?? 0),
      0
    );
    const paidInvoices = enrollmentInvoices.filter((inv) => inv.status === 'PAID');
    const pendingInvoices = enrollmentInvoices.filter(
      (inv) => inv.status === 'ISSUED' || inv.status === 'PENDING' || inv.status === 'DRAFT'
    );
    const revenue = sumBy(paidInvoices, (inv) => inv.totalTTC || 0);
    const pendingAmount = sumBy(pendingInvoices, (inv) => inv.totalTTC || 0);

    return {
      openSessions: openSessions.length,
      totalEnrollments,
      totalMembers: (memberships || []).length,
      pendingInvoices: pendingInvoices.length,
      revenue,
      pendingAmount,
    };
  }, [sessions, memberships, enrollmentInvoices]);

  const nextSessions = useMemo(() => {
    const now = dayjs();
    return (sessions || [])
      .filter((s) => s.start && dayjs(s.start).isAfter(now))
      .sort((a, b) => dayjs(a.start).valueOf() - dayjs(b.start).valueOf())
      .slice(0, 5);
  }, [sessions]);

  const recentInvoices = useMemo(
    () =>
      enrollmentInvoices
        .sort((a, b) => dayjs(b.invoiceDate || b.createdAt).valueOf() - dayjs(a.invoiceDate || a.createdAt).valueOf())
        .slice(0, 5),
    [enrollmentInvoices]
  );

  const recentEnrollments = useMemo(() => {
    const threshold = dayjs().subtract(7, 'day');
    return (enrollments || [])
      .filter((e) => e.status !== 'CANCELLED')
      .filter((e) => {
        const registered = e.registrationDate || e.createdAt;
        return registered && dayjs(registered).isAfter(threshold);
      })
      .sort(
        (a, b) =>
          dayjs(b.registrationDate || b.createdAt).valueOf() -
          dayjs(a.registrationDate || a.createdAt).valueOf()
      )
      .slice(0, 5);
  }, [enrollments]);

  const renderKpis = () => (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <KpiCard
          title="Sessions ouvertes"
          value={stats.openSessions}
          icon="solar:calendar-bold-duotone"
          color="primary"
          href={paths.dashboard.espaceInstitut.sessions}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <KpiCard
          title="Inscriptions totales"
          value={stats.totalEnrollments}
          icon="solar:users-group-rounded-bold-duotone"
          color="info"
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <KpiCard
          title="Factures en attente"
          value={stats.pendingInvoices}
          icon="solar:bill-list-bold-duotone"
          color="warning"
          href={PENDING_INVOICES_HREF}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <KpiCard
          title="CA encaissé"
          value={fCurrency(stats.revenue)}
          icon="solar:wallet-money-bold-duotone"
          color="success"
        />
      </Grid>
    </Grid>
  );

  const renderUpcomingSessions = () => (
    <Card>
      <CardHeader
        title="Prochaines sessions"
        action={
          <Button
            size="small"
            color="inherit"
            component={RouterLink}
            href={paths.dashboard.espaceInstitut.sessions}
            endIcon={<Iconify icon="eva:arrow-ios-forward-fill" />}
          >
            Tout voir
          </Button>
        }
      />

      {nextSessions.length > 0 ? (
        <TableContainer sx={{ px: 1, pb: 2 }}>
          <Scrollbar>
            <Table size="small" sx={{ minWidth: 480 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Test</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="center">Places</TableCell>
                  <TableCell>Statut</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {nextSessions.map((session) => {
                  const statusInfo = SESSION_STATUS_MAP[session.status] || { label: session.status, color: 'default' };
                  const enrolled = session.enrollmentsCount ?? session.enrollments?.length ?? 0;
                  const capacity = session.placesAvailable ?? 0;
                  const fillRate = capacity > 0 ? Math.min((enrolled / capacity) * 100, 100) : 0;

                  return (
                    <TableRow
                      key={session.id || session['@id']}
                      sx={{ '&:last-child td': { borderBottom: 0 } }}
                    >
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {session.assessment?.label || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap>
                          {session.start ? fDate(session.start) : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Stack spacing={0.5} alignItems="center">
                          <Typography variant="body2">
                            {enrolled}/{capacity || '∞'}
                          </Typography>
                          {capacity > 0 && (
                            <LinearProgress
                              variant="determinate"
                              value={fillRate}
                              color={fillRate >= 90 ? 'error' : fillRate >= 60 ? 'warning' : 'primary'}
                              sx={{ width: 60, height: 6, borderRadius: 1 }}
                            />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Label variant="soft" color={statusInfo.color}>
                          {statusInfo.label}
                        </Label>
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
          <EmptyContent
            title="Aucune session à venir"
            description="Créez une nouvelle session pour commencer"
            action={
              <Button
                component={RouterLink}
                href={paths.dashboard.espaceInstitut.sessionNew}
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
                sx={{ mt: 2 }}
              >
                Créer une session
              </Button>
            }
          />
        </Box>
      )}
    </Card>
  );

  const renderRecentEnrollments = () => (
    <Card>
      <CardHeader
        title="Derniers dossiers inscrits"
        subheader="Sur les 7 derniers jours"
        action={
          <Button
            size="small"
            color="inherit"
            component={RouterLink}
            href={paths.dashboard.espaceInstitut.candidats}
            endIcon={<Iconify icon="eva:arrow-ios-forward-fill" />}
          >
            Tout voir
          </Button>
        }
      />

      {recentEnrollments.length > 0 ? (
        <TableContainer sx={{ px: 1, pb: 2 }}>
          <Scrollbar>
            <Table size="small" sx={{ minWidth: 480 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Candidat</TableCell>
                  <TableCell>N° Dossier</TableCell>
                  <TableCell>Session</TableCell>
                  <TableCell>Inscrit le</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {recentEnrollments.map((enrollment) => {
                  const user = enrollment.user || {};
                  const session = enrollment.session || {};
                  const fullName = `${user.firstname || user.firstName || ''} ${user.lastname || user.lastName || ''}`.trim();

                  return (
                    <TableRow
                      key={enrollment.id || enrollment['@id']}
                      sx={{ '&:last-child td': { borderBottom: 0 } }}
                    >
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar src={user.avatar} sx={{ width: 32, height: 32 }}>
                            {fullName.charAt(0).toUpperCase()}
                          </Avatar>
                          <Stack sx={{ minWidth: 0 }}>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>
                              {fullName || '—'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
                              {user.email || ''}
                            </Typography>
                          </Stack>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ fontWeight: 'fontWeightMedium' }}>
                          {enrollment.referenceNumber || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>
                          {session.assessment?.label || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap>
                          {fDate(enrollment.registrationDate || enrollment.createdAt)}
                        </Typography>
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
          <EmptyContent title="Aucune inscription récente" />
        </Box>
      )}
    </Card>
  );

  const renderRecentInvoices = () => (
    <Card>
      <CardHeader
        title="Dernières factures émises"
        action={
          <Button
            size="small"
            color="inherit"
            component={RouterLink}
            href={paths.dashboard.espaceInstitut.invoices}
            endIcon={<Iconify icon="eva:arrow-ios-forward-fill" />}
          >
            Tout voir
          </Button>
        }
      />

      {recentInvoices.length > 0 ? (
        <TableContainer sx={{ px: 1, pb: 2 }}>
          <Scrollbar>
            <Table size="small" sx={{ minWidth: 360 }}>
              <TableHead>
                <TableRow>
                  <TableCell>N°</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Montant TTC</TableCell>
                  <TableCell>Statut</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {recentInvoices.map((inv) => {
                  const statusColor =
                    inv.status === 'PAID'
                      ? 'success'
                      : inv.status === 'ISSUED'
                        ? 'warning'
                        : inv.status === 'OVERDUE'
                          ? 'error'
                          : 'default';

                  return (
                    <TableRow
                      key={inv.id || inv['@id']}
                      sx={{ '&:last-child td': { borderBottom: 0 } }}
                    >
                      <TableCell>
                        <Typography variant="body2" noWrap>
                          {inv.invoiceNumber || inv.reference || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {fDate(inv.invoiceDate || inv.createdAt)}
                      </TableCell>
                      <TableCell align="right">
                        {fCurrency(inv.totalTTC)}
                      </TableCell>
                      <TableCell>
                        <Label variant="soft" color={statusColor}>
                          {inv.status}
                        </Label>
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
          <EmptyContent title="Aucune facture" />
        </Box>
      )}
    </Card>
  );

  const renderQuickActions = () => (
    <Card>
      <CardHeader title="Actions rapides" />
      <Stack spacing={1.5} sx={{ p: 3 }}>
        <Button
          component={RouterLink}
          href={paths.dashboard.espaceInstitut.sessionNew}
          variant="soft"
          color="primary"
          startIcon={<Iconify icon="solar:calendar-add-bold" />}
          sx={{ justifyContent: 'flex-start' }}
        >
          Créer une session
        </Button>

        <Button
          component={RouterLink}
          href={paths.dashboard.espaceInstitut.candidats}
          variant="soft"
          color="info"
          startIcon={<Iconify icon="solar:magnifer-bold" />}
          sx={{ justifyContent: 'flex-start' }}
        >
          Rechercher un dossier
        </Button>

        {canEditFiche && (
        <Button
          component={RouterLink}
          href={paths.dashboard.espaceInstitut.ficheEdit}
          variant="soft"
          color="secondary"
          startIcon={<Iconify icon="solar:pen-bold" />}
          sx={{ justifyContent: 'flex-start' }}
        >
          Modifier la fiche
        </Button>
        )}
      </Stack>
    </Card>
  );

  return (
    <Stack spacing={4} sx={sx} {...other}>
      {renderKpis()}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={3}>
            {renderUpcomingSessions()}
            {renderRecentEnrollments()}
            {renderRecentInvoices()}
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={3}>
            {renderQuickActions()}

            {stats.pendingAmount > 0 && (
              <Card
                component={RouterLink}
                href={PENDING_INVOICES_HREF}
                sx={{
                  p: 3,
                  bgcolor: alpha(theme.palette.warning.main, 0.08),
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'block',
                  transition: theme.transitions.create(['background-color', 'transform']),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.warning.main, 0.16),
                    cursor: 'pointer',
                  },
                }}
              >
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Iconify icon="solar:danger-triangle-bold" width={32} sx={{ color: 'warning.main' }} />
                  <Stack sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2">
                      {fCurrency(stats.pendingAmount)} en attente
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {stats.pendingInvoices} facture{stats.pendingInvoices > 1 ? 's' : ''} non payée{stats.pendingInvoices > 1 ? 's' : ''}
                    </Typography>
                  </Stack>
                  <Iconify icon="eva:arrow-ios-forward-fill" width={20} sx={{ color: 'warning.main' }} />
                </Stack>
              </Card>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
