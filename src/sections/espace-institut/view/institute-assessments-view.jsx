'use client';

import { useMemo } from 'react';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { Label } from 'src/components/label';
import { Scrollbar } from 'src/components/scrollbar';
import { LoadingScreen } from 'src/components/loading-screen';
import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import { useCurrentInstitute } from 'src/auth/hooks';

import { useGetInstituteAssessments } from 'src/actions/espace-institut';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'label', label: 'Label' },
  { id: 'ref', label: 'Reference', width: 140 },
  { id: 'owner', label: 'Proprietaire', width: 180 },
  { id: 'relation', label: 'Relation', width: 120 },
  { id: 'levels', label: 'Niveaux', width: 100 },
  { id: '', width: 120 },
];

// ----------------------------------------------------------------------

function matchesInstitute(ownership, instituteId) {
  const inst = ownership?.institute;
  if (inst?.id === instituteId) return true;
  const iri = inst?.['@id'] || '';
  return iri === `/api/institutes/${instituteId}` || iri.endsWith(`/${instituteId}`);
}

function getOwnerLabel(assessment) {
  if (assessment.internal) return 'Plateforme';
  const owner = (assessment.ownerships || []).find((o) => o.ownershipType === 'OWNER');
  return owner?.institute?.label || '-';
}

function getRelationType(assessment, instituteId) {
  if (assessment.internal) return { label: 'Interne', color: 'info' };

  const ownerships = assessment.ownerships || [];
  const match = ownerships.find((o) => matchesInstitute(o, instituteId));

  if (!match) return { label: '-', color: 'default' };
  if (match.ownershipType === 'OWNER') return { label: 'Proprietaire', color: 'success' };
  if (match.ownershipType === 'BUYER') return { label: 'Licence', color: 'warning' };
  return { label: match.ownershipType, color: 'default' };
}

function isOwner(assessment, instituteId) {
  const ownerships = assessment.ownerships || [];
  return ownerships.some(
    (o) => o.ownershipType === 'OWNER' && matchesInstitute(o, instituteId)
  );
}

// ----------------------------------------------------------------------

export function InstituteAssessmentsView() {
  const table = useTable();
  const currentInstitute = useCurrentInstitute();
  const { assessments, assessmentsLoading, assessmentsEmpty } = useGetInstituteAssessments(
    currentInstitute?.id
  );

  const levelsCountMap = useMemo(() => {
    const map = {};
    assessments.forEach((a) => {
      const key = a['@id'] || `/api/assessments/${a.id}`;
      map[key] = Array.isArray(a.levels) ? a.levels.length : 0;
    });
    return map;
  }, [assessments]);

  if (assessmentsLoading) {
    return (
      <DashboardContent>
        <LoadingScreen />
      </DashboardContent>
    );
  }

  const dataSliced = assessments.slice(
    table.page * table.rowsPerPage,
    table.page * table.rowsPerPage + table.rowsPerPage
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Assessments"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Espace Institut' },
          { name: 'Assessments' },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.espaceInstitut.assessmentNew}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            Nouvel assessment
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <TableContainer>
          <Scrollbar>
            <Table sx={{ minWidth: 640 }}>
              <TableHeadCustom headCells={TABLE_HEAD} />

              <TableBody>
                {assessmentsEmpty ? (
                  <TableRow>
                    <TableCell colSpan={TABLE_HEAD.length}>
                      <EmptyContent title="Aucun assessment" />
                    </TableCell>
                  </TableRow>
                ) : (
                  dataSliced.map((assessment) => {
                    const ownLevels = Array.isArray(assessment.levels) ? assessment.levels.length : 0;
                    const parentIri = assessment.parent
                      ? (typeof assessment.parent === 'string'
                          ? assessment.parent
                          : assessment.parent['@id'] || `/api/assessments/${assessment.parent.id}`)
                      : null;
                    const parentLevels = parentIri ? (levelsCountMap[parentIri] || 0) : 0;
                    const totalLevels = ownLevels + parentLevels;

                    const owned = isOwner(assessment, currentInstitute?.id);
                    const ownerLabel = getOwnerLabel(assessment);
                    const relation = getRelationType(assessment, currentInstitute?.id);

                    return (
                      <TableRow key={assessment.id || assessment['@id']}>
                        <TableCell sx={{ fontWeight: 'fontWeightSemiBold' }}>
                          {assessment.label}
                        </TableCell>
                        <TableCell>{assessment.ref || '-'}</TableCell>
                        <TableCell>{ownerLabel}</TableCell>
                        <TableCell>
                          <Label variant="soft" color={relation.color}>
                            {relation.label}
                          </Label>
                        </TableCell>
                        <TableCell>{totalLevels}</TableCell>
                        <TableCell sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Voir">
                            <IconButton
                              component={RouterLink}
                              href={paths.dashboard.espaceInstitut.assessmentView(assessment.id)}
                              size="small"
                            >
                              <Iconify icon="solar:eye-bold" />
                            </IconButton>
                          </Tooltip>

                          {owned && (
                            <>
                              <Tooltip title="Exams">
                                <IconButton
                                  component={RouterLink}
                                  href={paths.dashboard.espaceInstitut.exams(assessment.id)}
                                  size="small"
                                >
                                  <Iconify icon="solar:clipboard-list-bold" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Modifier">
                                <IconButton
                                  component={RouterLink}
                                  href={paths.dashboard.espaceInstitut.assessmentEdit(assessment.id)}
                                  size="small"
                                >
                                  <Iconify icon="solar:pen-bold" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>

        <TablePaginationCustom
          page={table.page}
          count={assessments.length}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>
    </DashboardContent>
  );
}
