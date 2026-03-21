'use client';

import { useMemo } from 'react';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hooks';
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

import { useCurrentInstitute } from 'src/auth/hooks';

import { useGetAssessment } from 'src/actions/assessment';
import { useGetAssessmentExams, useGetLevels } from 'src/actions/exam';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'label', label: 'Label' },
  { id: 'level', label: 'Niveau', width: 160 },
  { id: 'isWritten', label: 'Ecrit', width: 80 },
  { id: 'isOption', label: 'Option', width: 80 },
  { id: 'coeff', label: 'Coeff', width: 80 },
  { id: 'duration', label: 'Duree', width: 100 },
  { id: 'price', label: 'Prix', width: 120 },
  { id: '', width: 60 },
];

// ----------------------------------------------------------------------

function formatPrice(price) {
  if (!price?.amount) return '-';
  return `${price.amount} ${price.currency || 'EUR'}`;
}

// ----------------------------------------------------------------------

export function InstituteExamListView() {
  const table = useTable();
  const { id: assessmentId } = useParams();
  const currentInstitute = useCurrentInstitute();

  const { assessment, assessmentLoading } = useGetAssessment(assessmentId);
  const { exams, examsLoading, examsEmpty } = useGetAssessmentExams(assessmentId);
  const { levels } = useGetLevels();

  const levelMap = useMemo(() => {
    const map = {};
    levels.forEach((l) => {
      const iri = l['@id'] || `/api/levels/${l.id}`;
      map[iri] = l.label;
    });
    return map;
  }, [levels]);

  const getLevelLabel = (exam) => {
    if (!exam.level) return '-';
    if (typeof exam.level === 'string') return levelMap[exam.level] || exam.level;
    return exam.level?.label || '-';
  };

  if (assessmentLoading || examsLoading) {
    return (
      <DashboardContent>
        <LoadingScreen />
      </DashboardContent>
    );
  }

  const dataSliced = exams.slice(
    table.page * table.rowsPerPage,
    table.page * table.rowsPerPage + table.rowsPerPage
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={`Exams — ${assessment?.label || ''}`}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: currentInstitute?.label || 'Institut' },
          { name: 'Assessments', href: paths.dashboard.espaceInstitut.assessments },
          { name: assessment?.label || '', href: paths.dashboard.espaceInstitut.assessmentView(assessmentId) },
          { name: 'Exams' },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.espaceInstitut.examNew(assessmentId)}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            Nouvel exam
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <TableContainer>
          <Scrollbar>
            <Table sx={{ minWidth: 720 }}>
              <TableHeadCustom headCells={TABLE_HEAD} />

              <TableBody>
                {examsEmpty ? (
                  <TableRow>
                    <TableCell colSpan={TABLE_HEAD.length}>
                      <EmptyContent title="Aucun exam" />
                    </TableCell>
                  </TableRow>
                ) : (
                  dataSliced.map((exam) => (
                    <TableRow key={exam.id || exam['@id']}>
                      <TableCell sx={{ fontWeight: 'fontWeightSemiBold' }}>
                        {exam.label}
                      </TableCell>
                      <TableCell>{getLevelLabel(exam)}</TableCell>
                      <TableCell>
                        <Label variant="soft" color={exam.isWritten ? 'info' : 'default'}>
                          {exam.isWritten ? 'Oui' : 'Non'}
                        </Label>
                      </TableCell>
                      <TableCell>
                        <Label variant="soft" color={exam.isOption ? 'warning' : 'default'}>
                          {exam.isOption ? 'Oui' : 'Non'}
                        </Label>
                      </TableCell>
                      <TableCell>{exam.coeff ?? '-'}</TableCell>
                      <TableCell>{exam.duration ? `${exam.duration} min` : '-'}</TableCell>
                      <TableCell>{formatPrice(exam.price)}</TableCell>
                      <TableCell>
                        <Tooltip title="Modifier">
                          <IconButton
                            component={RouterLink}
                            href={paths.dashboard.espaceInstitut.examEdit(assessmentId, exam.id)}
                            size="small"
                          >
                            <Iconify icon="solar:pen-bold" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>

        <TablePaginationCustom
          page={table.page}
          count={exams.length}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>
    </DashboardContent>
  );
}
