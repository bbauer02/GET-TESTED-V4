'use client';

import { useState, useMemo, useCallback } from 'react';
import { varAlpha } from 'minimal-shared/utils';
import { usePopover } from 'minimal-shared/hooks';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Tooltip from '@mui/material/Tooltip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { fDateTime } from 'src/utils/format-time';

import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { LoadingScreen } from 'src/components/loading-screen';
import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, TableHeadCustom, TablePaginationCustom } from 'src/components/table';
import { CustomPopover } from 'src/components/custom-popover';

import { useCurrentInstitute } from 'src/auth/hooks';

import { useGetInstituteSessions } from 'src/actions/espace-institut';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'assessment', label: 'Assessment' },
  { id: 'level', label: 'Niveau' },
  { id: 'start', label: 'Date debut' },
  { id: 'end', label: 'Date fin' },
  { id: 'enrollments', label: 'Inscrits' },
  { id: 'status', label: 'Statut' },
  { id: '', width: 56 },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'Toutes' },
  { value: 'DRAFT', label: 'Brouillon' },
  { value: 'OPEN', label: 'Ouverte' },
  { value: 'CLOSE', label: 'Fermee' },
  { value: 'CANCELLED', label: 'Annulee' },
];

const STATUS_COLORS = {
  DRAFT: 'default',
  OPEN: 'success',
  CLOSE: 'warning',
  CANCELLED: 'error',
};

const STATUS_LABELS = {
  DRAFT: 'Brouillon',
  OPEN: 'Ouverte',
  CLOSE: 'Fermee',
  CANCELLED: 'Annulee',
};

// ----------------------------------------------------------------------

export function InstituteSessionsView() {
  const table = useTable();
  const router = useRouter();
  const currentInstitute = useCurrentInstitute();
  const { sessions, sessionsLoading } = useGetInstituteSessions(currentInstitute?.id);

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
    const counts = { all: sessions.length, DRAFT: 0, OPEN: 0, CLOSE: 0, CANCELLED: 0 };
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
        heading="Sessions"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Espace Institut' },
          { name: 'Sessions' },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.espaceInstitut.sessionNew}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            Nouvelle session
          </Button>
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
            <InputLabel>Assessment</InputLabel>
            <Select
              value={assessmentFilter}
              label="Assessment"
              onChange={handleAssessmentChange}
            >
              <MenuItem value="all">Tous</MenuItem>
              {assessmentOptions.map((label) => (
                <MenuItem key={label} value={label}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {levelOptions.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Niveau</InputLabel>
              <Select
                value={levelFilter}
                label="Niveau"
                onChange={handleLevelChange}
              >
                <MenuItem value="all">Tous</MenuItem>
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
                      <EmptyContent title="Aucune session" />
                    </TableCell>
                  </TableRow>
                ) : (
                  dataSliced.map((session) => (
                    <SessionTableRow
                      key={session.id || session['@id']}
                      session={session}
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

function SessionTableRow({ session, onView, onEdit }) {
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
            {STATUS_LABELS[status] || status}
          </Label>
        </TableCell>
        <TableCell align="right" sx={{ px: 1 }} onClick={(e) => e.stopPropagation()}>
          <Tooltip title="Actions">
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
            Voir
          </MenuItem>
          <MenuItem
            onClick={() => {
              popover.onClose();
              onEdit();
            }}
          >
            <Iconify icon="solar:pen-bold" />
            Modifier
          </MenuItem>
        </MenuList>
      </CustomPopover>
    </>
  );
}
