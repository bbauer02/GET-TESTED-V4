'use client';

import { mutate } from 'swr';
import { varAlpha } from 'minimal-shared/utils';
import { useMemo, useState, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import TableContainer from '@mui/material/TableContainer';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';

import { fDate } from 'src/utils/format-time';
import { exportToCsv } from 'src/utils/export-csv';
import { getEnrollmentPayment, PAYMENT_STATE_COLORS } from 'src/utils/enrollment-payment';

import { endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';
import { useGetInstituteSessions, useGetInstituteEnrollments } from 'src/actions/espace-institut';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';
import { LoadErrorContent } from 'src/components/load-error';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, TableHeadCustom, TablePaginationCustom } from 'src/components/table';

import { useCurrentInstitute } from 'src/auth/hooks';

import { InstituteCandidateDetailsDrawer } from '../institute-candidate-details-drawer';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'referenceNumber', label: 'N° Dossier' },
  { id: 'candidate', label: 'Candidat' },
  { id: 'session', label: 'Session' },
  { id: 'enrolledAt', label: "Date d'inscription" },
  { id: 'payment', label: 'Paiement' },
];

// Les inscriptions n'ont pas de statut propre : on filtre sur l'état du paiement (facture candidat)
const PAYMENT_LABELS = {
  paid: 'Payé',
  to_pay: 'À payer',
  not_invoiced: 'Non facturé',
  cancelled: 'Facture annulée',
  enrollment_cancelled: 'Inscription annulée',
};

const ROW_STATE_COLORS = { ...PAYMENT_STATE_COLORS, enrollment_cancelled: 'error' };

// Une inscription annulée est conservée pour l'historique : elle a son propre onglet
const getRowState = (enrollment) =>
  enrollment.status === 'CANCELLED' ? 'enrollment_cancelled' : getEnrollmentPayment(enrollment).state;

const STATUS_TABS = [
  { value: 'all', label: 'Tous' },
  { value: 'to_pay', label: 'À payer' },
  { value: 'paid', label: 'Payés' },
  { value: 'not_invoiced', label: 'Non facturés' },
  { value: 'enrollment_cancelled', label: 'Annulées' },
];

// ----------------------------------------------------------------------

export function InstituteCandidatsView() {
  const table = useTable({ defaultRowsPerPage: 10 });
  const currentInstitute = useCurrentInstitute();

  const { enrollments, enrollmentsLoading, enrollmentsError, enrollmentsMutate } =
    useGetInstituteEnrollments(currentInstitute?.id);
  const { sessions } = useGetInstituteSessions(currentInstitute?.id);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sessionFilter, setSessionFilter] = useState('all');
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);

  const isInstituteAdmin =
    currentInstitute?.membershipRole === 'ADMIN' || currentInstitute?.membershipRole === 'STAFF';

  const handleOpenDetails = useCallback((enrollment) => {
    setSelectedEnrollment(enrollment);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelectedEnrollment(null);
  }, []);

  const handleEnrollmentChanged = useCallback(() => {
    if (currentInstitute?.id) {
      mutate(endpoints.institute.sessions(currentInstitute.id));
      mutate(endpoints.enrollment.instituteEnrollments(currentInstitute.id));
    }
  }, [currentInstitute?.id]);

  const handleSearch = useCallback((event) => {
    setSearch(event.target.value);
    table.onChangePage(null, 0);
  }, [table]);

  const handleFilterStatus = useCallback(
    (event, newValue) => {
      setStatusFilter(newValue);
      table.onChangePage(null, 0);
    },
    [table]
  );

  const handleFilterSession = useCallback(
    (event) => {
      setSessionFilter(event.target.value);
      table.onChangePage(null, 0);
    },
    [table]
  );

  // Build session options for dropdown
  const sessionOptions = useMemo(() => {
    const opts = [{ value: 'all', label: 'Toutes les sessions' }];
    (sessions || []).forEach((s) => {
      const label = `${s.assessment?.label || 'Session'} — ${s.start ? fDate(s.start) : 'N/A'}`;
      opts.push({ value: s.id || s['@id'], label });
    });
    return opts;
  }, [sessions]);

  const filteredEnrollments = useMemo(() => {
    let data = enrollments || [];

    if (statusFilter !== 'all') {
      data = data.filter((e) => getRowState(e) === statusFilter);
    }

    if (sessionFilter !== 'all') {
      data = data.filter((e) => {
        const sid = e.session?.id || e.session?.['@id'];
        return sid === sessionFilter;
      });
    }

    if (search) {
      const q = search.toLowerCase();
      data = data.filter((e) => {
        const name = `${e.user?.firstname || e.user?.firstName || ''} ${e.user?.lastname || e.user?.lastName || ''}`.toLowerCase();
        const email = (e.user?.email || '').toLowerCase();
        const assessment = (e.session?.assessment?.label || '').toLowerCase();
        const candidateNumber = (e.user?.candidateNumber || '').toLowerCase();
        const referenceNumber = (e.referenceNumber || '').toLowerCase();
        return (
          name.includes(q) ||
          email.includes(q) ||
          assessment.includes(q) ||
          candidateNumber.includes(q) ||
          referenceNumber.includes(q)
        );
      });
    }

    return data;
  }, [enrollments, statusFilter, sessionFilter, search]);

  const paginatedData = useMemo(
    () =>
      filteredEnrollments.slice(
        table.page * table.rowsPerPage,
        table.page * table.rowsPerPage + table.rowsPerPage
      ),
    [filteredEnrollments, table.page, table.rowsPerPage]
  );

  const statusCounts = useMemo(() => {
    const counts = { all: (enrollments || []).length };
    (enrollments || []).forEach((e) => {
      const state = getRowState(e);
      counts[state] = (counts[state] || 0) + 1;
    });
    return counts;
  }, [enrollments]);

  if (enrollmentsError) {
    return (
      <DashboardContent>
        <LoadErrorContent error={enrollmentsError} onRetry={enrollmentsMutate} />
      </DashboardContent>
    );
  }

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
        heading="Candidats"
        links={[
          { name: 'Tableau de bord', href: paths.dashboard.espaceInstitut.root },
          { name: 'Candidats' },
        ]}
        action={
          <Button
            variant="soft"
            color="inherit"
            startIcon={<Iconify icon="solar:export-bold" />}
            onClick={() =>
              exportToCsv(
                filteredEnrollments,
                [
                  { key: (r) => r.referenceNumber || '', label: 'N° Dossier' },
                  { key: (r) => r.user?.candidateNumber || '', label: 'N° Candidat' },
                  { key: (r) => `${r.user?.firstname || r.user?.firstName || ''} ${r.user?.lastname || r.user?.lastName || ''}`, label: 'Candidat' },
                  { key: (r) => r.user?.email || '', label: 'Email' },
                  { key: (r) => r.session?.assessment?.label || '', label: 'Test' },
                  { key: (r) => r.session?.start || '', label: 'Date session' },
                  { key: (r) => PAYMENT_LABELS[getRowState(r)], label: 'Paiement' },
                  { key: (r) => r.registrationDate || '', label: "Date d'inscription" },
                ],
                'candidats'
              )
            }
          >
            Exporter CSV
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <Tabs
          value={statusFilter}
          onChange={handleFilterStatus}
          sx={{
            px: 2.5,
            boxShadow: (theme) =>
              `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
          }}
        >
          {STATUS_TABS.map((tab) => (
            <Tab
              key={tab.value}
              value={tab.value}
              label={tab.label}
              iconPosition="end"
              icon={
                <Label
                  variant={statusFilter === tab.value ? 'filled' : 'soft'}
                  color={ROW_STATE_COLORS[tab.value] || 'default'}
                >
                  {statusCounts[tab.value] || 0}
                </Label>
              }
            />
          ))}
        </Tabs>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" sx={{ p: 2.5 }}>
          <TextField
            fullWidth
            value={search}
            onChange={handleSearch}
            placeholder="Rechercher par nom, email, n° candidat ou n° dossier..."
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

          <FormControl sx={{ minWidth: 240 }}>
            <InputLabel>Session</InputLabel>
            <Select
              value={sessionFilter}
              onChange={handleFilterSession}
              label="Session"
              size="medium"
            >
              {sessionOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <TableContainer>
          <Scrollbar>
            <Table size="medium" sx={{ minWidth: 720 }}>
              <TableHeadCustom headCells={TABLE_HEAD} />

              <TableBody>
                {paginatedData.map((enrollment) => {
                  const user = enrollment.user || {};
                  const session = enrollment.session || {};
                  const paymentState = getRowState(enrollment);

                  return (
                    <TableRow
                      key={enrollment.id || enrollment['@id']}
                      hover
                      onClick={() => handleOpenDetails(enrollment)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ fontWeight: 'fontWeightMedium' }}>
                          {enrollment.referenceNumber || '—'}
                        </Typography>
                        {user.candidateNumber && (
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {user.candidateNumber}
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar
                            alt={`${user.firstname || user.firstName || ''} ${user.lastname || user.lastName || ''}`}
                            src={user.avatar}
                            sx={{ width: 36, height: 36 }}
                          />
                          <Stack>
                            <Typography variant="body2" noWrap>
                              {user.firstname || user.firstName || ''} {user.lastname || user.lastName || ''}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
                              {user.email || ''}
                            </Typography>
                          </Stack>
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {session.assessment?.label || '—'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {session.start ? fDate(session.start) : ''}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        {fDate(enrollment.registrationDate || enrollment.createdAt || enrollment.enrolledAt)}
                      </TableCell>

                      <TableCell>
                        <Label variant="soft" color={ROW_STATE_COLORS[paymentState] || 'default'}>
                          {PAYMENT_LABELS[paymentState]}
                        </Label>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {!paginatedData.length && (
                  <TableRow>
                    <TableCell colSpan={TABLE_HEAD.length}>
                      <EmptyContent title="Aucun candidat trouvé" />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>

        <TablePaginationCustom
          page={table.page}
          count={filteredEnrollments.length}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>

      <InstituteCandidateDetailsDrawer
        open={!!selectedEnrollment}
        onClose={handleCloseDetails}
        enrollment={selectedEnrollment}
        session={selectedEnrollment?.session}
        instituteId={currentInstitute?.id}
        canManage={isInstituteAdmin && selectedEnrollment?.session?.status !== 'CANCELLED'}
        onUpdated={handleEnrollmentChanged}
        onDeleted={handleEnrollmentChanged}
      />
    </DashboardContent>
  );
}
