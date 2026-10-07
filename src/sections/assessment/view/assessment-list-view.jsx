'use client';

import { useMemo } from 'react';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { useGetAssessments } from 'src/actions/assessment';

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

import { AssessmentTableRow } from '../assessment-table-row';

// ----------------------------------------------------------------------

// TABLE_HEAD moved inside component for i18n

// ----------------------------------------------------------------------

export function AssessmentListView() {
  const { t } = useTranslate('assessment');

  const TABLE_HEAD = [
    { id: 'label', label: t('table_label') },
    { id: 'ref', label: t('table_ref'), width: 160 },
    { id: 'isInternal', label: t('table_type'), width: 120 },
    { id: 'owner', label: t('table_owner'), width: 200 },
    { id: 'levels', label: t('table_levels'), width: 100 },
    { id: '', width: 88 },
  ];

  const table = useTable();

  const { assessments, assessmentsLoading, assessmentsEmpty } = useGetAssessments();

  // Build a lookup: assessment IRI/id → own levels count
  const levelsCountMap = useMemo(() => {
    const map = {};
    assessments.forEach((a) => {
      const key = a['@id'] || `/api/assessments/${a.id}`;
      map[key] = Array.isArray(a.levels) ? a.levels.length : 0;
    });
    return map;
  }, [assessments]);

  const dataFiltered = assessments;

  const notFound = !dataFiltered.length;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('heading')}
        links={[
          { name: t('dashboard'), href: paths.dashboard.root },
          { name: t('heading'), href: paths.dashboard.assessment.root },
          { name: t('breadcrumb_list') },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.assessment.new}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            {t('new_button')}
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <Scrollbar>
          <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 720 }}>
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
                  <AssessmentTableRow key={row.id} row={row} levelsCountMap={levelsCountMap} />
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
