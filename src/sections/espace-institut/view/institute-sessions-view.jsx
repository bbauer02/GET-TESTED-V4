'use client';

import { varAlpha } from 'minimal-shared/utils';
import { usePopover } from 'minimal-shared/hooks';
import { useMemo, useState, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { fDateTime } from 'src/utils/format-time';
import { exportToCsv } from 'src/utils/export-csv';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { useGetInstituteSessions } from 'src/actions/espace-institut';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomPopover } from 'src/components/custom-popover';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, TableHeadCustom, TablePaginationCustom } from 'src/components/table';

import { useAuthContext, useCurrentInstitute } from 'src/auth/hooks';

// ----------------------------------------------------------------------

const STATUS_COLORS = {
  DRAFT: 'default',
  OPEN: 'success',
  LOCKED: 'default',
  VALIDATED: 'info',
  CANCELLED: 'error',
};

// ----------------------------------------------------------------------

export function InstituteSessionsView() {
  const { t } = useTranslate('institute_space');
  const table = useTable();
  const router = useRouter();
  const currentInstitute = useCurrentInstitute();
  const { user } = useAuthContext();
  const { sessions: allSessions, sessionsLoading } = useGetInstituteSessions(currentInstitute?.id);

  const STATUS_LABELS = {
    DRAFT: t('status_draft'),
    OPEN: t('status_open'),
    LOCKED: t('status_locked'),
    VALIDATED: t('status_validated'),
    CANCELLED: t('status_cancelled'),
  };

  const STATUS_OPTIONS = [
    { value: 'all', label: t('all') },
    { value: 'DRAFT', label: t('status_draft') },
    { value: 'OPEN', label: t('status_open') },
    { value: 'LOCKED', label: t('status_locked') },
    { value: 'VALIDATED', label: t('status_validated') },
    { value: 'CANCELLED', label: t('status_cancelled') },
  ];

  const TABLE_HEAD = [
    { id: 'assessment', label: t('assessment') },
    { id: 'level', label: t('level') },
    { id: 'start', label: t('start_date') },
    { id: 'end', label: t('end_date') },
    { id: 'enrollments', label: t('enrolled') },
    { id: 'status', label: t('status') },
    { id: '', width: 56 },
  ];

  const isInstituteAdmin = currentInstitute?.membershipRole === 'ADMIN' || currentInstitute?.membershipRole === 'STAFF';
  const currentUserId = user?.id;

  // TEACHER only sees sessions where they are an examinator
  const sessions = useMemo(() => {
    if (isInstituteAdmin) return allSessions;
    return allSessions.filter((s) =>
      (s.scheduledExams || s.scheduled_exams || []).some((se) =>
        (se.examinators || []).some((ex) => {
          const exId = typeof ex === 'string' ? ex : (ex.id || ex['@id']);
          return exId === currentUserId || exId === `/api/users/${currentUserId}`;
        })
      )
    );
  }, [allSessions, isInstituteAdmin, currentUserId]);

  const [statusTab, setStatusTab] = useState('all');
  const [assessmentFilter, setAssessmentFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  // Extract unique assessment labels
  const assessmentOptions = useMemo(
    () => [...new Set(sessions.map((s) => s.assessment?.label).filter(Boolean))],
    [sessions]
  );

  // Extract unique level labels (from filtered sessions)
  const levelOptions = useMemo(() => {
    const levels = sessions
      .filter((s) => assessmentFilter === 'all' || s.assessment?.label === assessmentFilter)
      .map((s) => s.level?.label)
      .filter(Boolean);
    return [...new Set(levels)];
  }, [sessions, assessmentFilter]);

  // Count per status
  const statusCounts = useMemo(() => {
    const counts = { all: sessions.length, DRAFT: 0, OPEN: 0, LOCKED: 0, VALIDATED: 0, CANCELLED: 0 };
    sessions.forEach((s) => {
      const st = s.status || 'DRAFT';
      if (counts[st] !== undefined) counts[st] += 1;
    });
    return counts;
  }, [sessions]);

  // Filter sessions
  const filteredSessions = useMemo(() => {
    let result = sessions;

    if (statusTab !== 'all') {
      result = result.filter((s) => (s.status || 'DRAFT') === statusTab);
    }

    if (assessmentFilter !== 'all') {
      result = result.filter((s) => s.assessment?.label === assessmentFilter);
    }

    if (levelFilter !== 'all') {
      result = result.filter((s) => s.level?.label === levelFilter);
    }

    return result;
  }, [sessions, statusTab, assessmentFilter, levelFilter]);

  const dataSliced = filteredSessions.slice(
    table.page * table.rowsPerPage,
    table.page * table.rowsPerPage + table.rowsPerPage
  );

  // Reset page when filters change
  const handleStatusChange = useCallback(
    (_, value) => {
      setStatusTab(value);
      table.onChangePage(null, 0);
    },
    [table]
  );

  const handleAssessmentChange = useCallback(
    (e) => {
      setAssessmentFilter(e.target.value);
      setLevelFilter('all');
      table.onChangePage(null, 0);
    },
    [table]
  );

  const handleLevelChange = useCallback(
    (e) => {
      setLevelFilter(e.target.value);
      table.onChangePage(null, 0);
    },
    [table]
  );

  if (sessionsLoading) {
    return (
      <DashboardContent>
        <LoadingScreen />
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('sessions')}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: currentInstitute?.label || 'Institut' },
          { name: t('sessions') },
        ]}
        action={
          isInstituteAdmin ? (
            <Stack direction="row" spacing={1}>
              <Button
                variant="soft"
                color="inherit"
                startIcon={<Iconify icon="solar:export-bold" />}
                onClick={() =>
                  exportToCsv(
                    filteredSessions,
                    [
                      { key: (r) => r.assessment?.label || '', label: t('assessment') },
                      { key: (r) => r.level?.label || '', label: t('level') },
                      { key: 'start', label: t('start_date') },
                      { key: 'end', label: t('end_date') },
                      { key: 'status', label: t('status') },
                      { key: 'placesAvailable', label: t('places') },
                      { key: (r) => r.enrollmentsCount ?? r.enrollments?.length ?? 0, label: t('enrolled') },
                    ],
                    'sessions'
                  )
                }
              >
                {t('export')}
              </Button>
              <Button
                component={RouterLink}
                href={paths.dashboard.espaceInstitut.sessionNew}
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
              >
                {t('new_session')}
              </Button>
            </Stack>
          ) : null
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        {/* ---- Tabs par statut ---- */}
        <Tabs
          value={statusTab}
          onChange={handleStatusChange}
          sx={{
            px: 2.5,
            boxShadow: (theme) =>
              `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
          }}
        >
          {STATUS_OPTIONS.map((tab) => (
            <Tab
              key={tab.value}
              value={tab.value}
              label={tab.label}
              iconPosition="end"
              icon={
                <Label
                  variant={statusTab === tab.value ? 'filled' : 'soft'}
                  color={STATUS_COLORS[tab.value] || 'default'}
                >
                  {statusCounts[tab.value] || 0}
                </Label>
              }
            />
          ))}
        </Tabs>

        {/* ---- Toolbar : filtres ---- */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          sx={{ px: 2.5, py: 2 }}
          flexWrap="wrap"
        >
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>{t('assessment')}</InputLabel>
            <Select
              value={assessmentFilter}
              label={t('assessment')}
              onChange={handleAssessmentChange}
            >
              <MenuItem value="all">{t('filter_all')}</MenuItem>
              {assessmentOptions.map((label) => (
                <MenuItem key={label} value={label}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {levelOptions.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>{t('level')}</InputLabel>
              <Select
                value={levelFilter}
                label={t('level')}
                onChange={handleLevelChange}
              >
                <MenuItem value="all">{t('filter_all')}</MenuItem>
                {levelOptions.map((label) => (
                  <MenuItem key={label} value={label}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

        </Stack>

        {/* ---- Table ---- */}
        <TableContainer>
          <Scrollbar>
            <Table sx={{ minWidth: 800 }}>
              <TableHeadCustom headCells={TABLE_HEAD} />

              <TableBody>
                {filteredSessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={TABLE_HEAD.length}>
                      <EmptyContent
                        title={t('no_session')}
                        description={t('no_session_desc')}
                        action={
                          <Button
                            component={RouterLink}
                            href={paths.dashboard.espaceInstitut.sessionNew}
                            variant="contained"
                            startIcon={<Iconify icon="mingcute:add-line" />}
                            sx={{ mt: 2 }}
                          >
                            {t('create_session')}
                          </Button>
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  dataSliced.map((session) => (
                    <SessionTableRow
                      key={session.id || session['@id']}
                      session={session}
                      canEdit={isInstituteAdmin}
                      statusLabels={STATUS_LABELS}
                      t={t}
                      onView={() =>
                        router.push(paths.dashboard.espaceInstitut.sessionView(session.id))
                      }
                      onEdit={() =>
                        router.push(paths.dashboard.espaceInstitut.sessionEdit(session.id))
                      }
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>

        <TablePaginationCustom
          page={table.page}
          count={filteredSessions.length}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

function SessionTableRow({ session, canEdit, statusLabels, t, onView, onEdit }) {
  const popover = usePopover();

  const status = session.status || 'DRAFT';

  return (
    <>
      <TableRow hover sx={{ cursor: 'pointer' }} onClick={onView}>
        <TableCell>{session.assessment?.label || '-'}</TableCell>
        <TableCell>{session.level?.label || '-'}</TableCell>
        <TableCell>{fDateTime(session.start)}</TableCell>
        <TableCell>{fDateTime(session.end)}</TableCell>
        <TableCell>
          {session.enrollments?.length ?? 0}
          {session.placesAvailable ? ` / ${session.placesAvailable}` : ''}
        </TableCell>
        <TableCell>
          <Label color={STATUS_COLORS[status] || 'default'}>
            {statusLabels[status] || status}
          </Label>
        </TableCell>
        <TableCell align="right" sx={{ px: 1 }} onClick={(e) => e.stopPropagation()}>
          <Tooltip title={t('actions')}>
            <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
      >
        <MenuList>
          <MenuItem
            onClick={() => {
              popover.onClose();
              onView();
            }}
          >
            <Iconify icon="solar:eye-bold" />
            {t('view')}
          </MenuItem>
          {canEdit && (
            <MenuItem
              onClick={() => {
                popover.onClose();
                onEdit();
              }}
            >
              <Iconify icon="solar:pen-bold" />
              {t('edit')}
            </MenuItem>
          )}
        </MenuList>
      </CustomPopover>
    </>
  );
}
