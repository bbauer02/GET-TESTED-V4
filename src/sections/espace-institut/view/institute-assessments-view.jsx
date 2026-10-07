'use client';

import { useMemo } from 'react';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { useGetInstituteAssessments } from 'src/actions/espace-institut';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { useCurrentInstitute } from 'src/auth/hooks';

// ----------------------------------------------------------------------

// TABLE_HEAD is defined inside the component to use translations

// ----------------------------------------------------------------------

function matchesInstitute(ownership, instituteId) {
  const inst = ownership?.institute;
  if (inst?.id === instituteId) return true;
  const iri = inst?.['@id'] || '';
  return iri === `/api/institutes/${instituteId}` || iri.endsWith(`/${instituteId}`);
}

function getOwnerLabel(assessment, t) {
  if (assessment.internal) return t('platform');
  const owner = (assessment.ownerships || []).find((o) => o.ownershipType === 'OWNER');
  return owner?.institute?.label || '-';
}

function getRelationType(assessment, instituteId, t) {
  if (assessment.internal) return { label: t('internal'), color: 'info' };

  const ownerships = assessment.ownerships || [];
  const match = ownerships.find((o) => matchesInstitute(o, instituteId));

  if (!match) return { label: '-', color: 'default' };
  if (match.ownershipType === 'OWNER') return { label: t('owner_relation'), color: 'success' };
  if (match.ownershipType === 'BUYER') return { label: t('license'), color: 'warning' };
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
  const { t } = useTranslate('institute_space');
  const table = useTable();
  const currentInstitute = useCurrentInstitute();

  const TABLE_HEAD = [
    { id: 'label', label: t('label') },
    { id: 'ref', label: t('reference'), width: 140 },
    { id: 'owner', label: t('owner'), width: 180 },
    { id: 'relation', label: t('relation'), width: 120 },
    { id: 'levels', label: t('levels'), width: 100 },
    { id: '', width: 120 },
  ];
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
        heading={t('assessments')}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: currentInstitute?.label || 'Institut' },
          { name: t('assessments') },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.espaceInstitut.assessmentNew}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            {t('new_assessment')}
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
                      <EmptyContent
                        title={t('no_assessment')}
                        description={t('no_assessment_desc')}
                        action={
                          <Button
                            component={RouterLink}
                            href={paths.dashboard.espaceInstitut.assessmentNew}
                            variant="contained"
                            startIcon={<Iconify icon="mingcute:add-line" />}
                            sx={{ mt: 2 }}
                          >
                            {t('create_assessment')}
                          </Button>
                        }
                      />
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
                    const ownerLabel = getOwnerLabel(assessment, t);
                    const relation = getRelationType(assessment, currentInstitute?.id, t);

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
                          <Tooltip title={t('view')}>
                            <IconButton
                              component={RouterLink}
                              href={paths.dashboard.espaceInstitut.assessmentView(assessment.id)}
                              size="small"
                            >
                              <Iconify icon="solar:eye-bold" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title={t('question_bank')}>
                            <IconButton
                              component={RouterLink}
                              href={`${paths.dashboard.espaceInstitut.assessmentView(assessment.id)}?tab=questions`}
                              size="small"
                              color="info"
                            >
                              <Iconify icon="solar:question-circle-bold" />
                            </IconButton>
                          </Tooltip>

                          {owned && (
                            <>
                              <Tooltip title={t('exams')}>
                                <IconButton
                                  component={RouterLink}
                                  href={`${paths.dashboard.espaceInstitut.assessmentView(assessment.id)}?tab=examens`}
                                  size="small"
                                >
                                  <Iconify icon="solar:clipboard-list-bold" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={t('edit')}>
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
