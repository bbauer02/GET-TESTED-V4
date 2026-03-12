'use client';

import { useMemo } from 'react';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  TableNoData,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { useGetExams, useGetLevels } from 'src/actions/exam';
import { useGetAssessments } from 'src/actions/assessment';

import { ExamTableRow } from '../exam-table-row';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'label', label: 'Label' },
  { id: 'assessment', label: 'Assessment', width: 200 },
  { id: 'level', label: 'Level', width: 160 },
  { id: 'isWritten', label: 'Ecrit', width: 100 },
  { id: 'isOption', label: 'Option', width: 100 },
  { id: 'coeff', label: 'Coeff', width: 80 },
  { id: 'price', label: 'Prix', width: 120 },
  { id: '', width: 88 },
];

// ----------------------------------------------------------------------

export function ExamListView() {
  const table = useTable();

  const { exams, examsLoading, examsEmpty } = useGetExams();
  const { assessments } = useGetAssessments();
  const { levels } = useGetLevels();

  // Build lookup maps: IRI → label
  const assessmentMap = useMemo(() => {
    const map = {};
    assessments.forEach((a) => {
      const iri = a['@id'] || `/api/assessments/${a.id}`;
      map[iri] = a.label;
    });
    return map;
  }, [assessments]);

  const levelMap = useMemo(() => {
    const map = {};
    levels.forEach((l) => {
      const iri = l['@id'] || `/api/levels/${l.id}`;
      map[iri] = l.label;
    });
    return map;
  }, [levels]);

  const getAssessmentLabel = (exam) => {
    if (!exam.assessment) return '';
    if (typeof exam.assessment === 'string') return assessmentMap[exam.assessment] || '';
    return exam.assessment?.label || '';
  };

  const getLevelLabel = (exam) => {
    if (!exam.level) return '';
    if (typeof exam.level === 'string') return levelMap[exam.level] || '';
    return exam.level?.label || '';
  };

  const dataFiltered = exams;
  const notFound = !dataFiltered.length;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Exams"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Exams', href: paths.dashboard.exam.root },
          { name: 'Liste' },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.exam.new}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            Nouvel exam
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <Scrollbar>
          <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
            <TableHeadCustom
              order={table.order}
              orderBy={table.orderBy}
              headCells={TABLE_HEAD}
              onSort={table.onSort}
            />

            <TableBody>
              {dataFiltered
                .slice(
                  table.page * table.rowsPerPage,
                  table.page * table.rowsPerPage + table.rowsPerPage
                )
                .map((row) => (
                  <ExamTableRow
                    key={row.id}
                    row={row}
                    assessmentLabel={getAssessmentLabel(row)}
                    levelLabel={getLevelLabel(row)}
                  />
                ))}

              <TableEmptyRows
                height={table.dense ? 56 : 56 + 20}
                emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
              />

              <TableNoData notFound={notFound} />
            </TableBody>
          </Table>
        </Scrollbar>

        <TablePaginationCustom
          page={table.page}
          dense={table.dense}
          count={dataFiltered.length}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onChangeDense={table.onChangeDense}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>
    </DashboardContent>
  );
}
