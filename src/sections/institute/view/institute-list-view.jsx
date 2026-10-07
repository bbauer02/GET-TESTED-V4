'use client';

import { useCallback } from 'react';
import { useBoolean, useSetState } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { deleteInstitute, useGetInstitutes } from 'src/actions/institute';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  rowInPage,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import { getErrorMessage } from 'src/auth/utils';

import { InstituteTableRow } from '../institute-table-row';
import { InstituteTableToolbar } from '../institute-table-toolbar';
import { InstituteTableFiltersResult } from '../institute-table-filters-result';

// ----------------------------------------------------------------------

// TABLE_HEAD moved inside component for i18n

// ----------------------------------------------------------------------

export function InstituteListView() {
  const { t } = useTranslate('institute');

  const TABLE_HEAD = [
    { id: 'label', label: t('table_name') },
    { id: 'city', label: t('table_city'), width: 180 },
    { id: 'siteweb', label: t('table_website'), width: 220 },
    { id: 'siren', label: t('table_siren'), width: 140 },
    { id: 'siret', label: t('table_siret'), width: 160 },
    { id: 'stripe', label: t('table_stripe'), width: 120 },
    { id: '', width: 88 },
  ];

  const table = useTable();

  const confirmDialog = useBoolean();

  const { institutes, institutesLoading, institutesEmpty } = useGetInstitutes();

  const filters = useSetState({ name: '' });
  const { state: currentFilters, setState: updateFilters } = filters;

  const dataFiltered = applyFilter({
    inputData: institutes,
    comparator: getComparator(table.order, table.orderBy),
    filters: currentFilters,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const canReset = !!currentFilters.name;

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleDeleteRow = useCallback(
    async (id) => {
      try {
        await deleteInstitute(id);
        toast.success(t('delete_success'));
        table.onUpdatePageDeleteRow(dataInPage.length);
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    },
    [dataInPage.length, table, t]
  );

  const handleDeleteRows = useCallback(async () => {
    const results = await Promise.allSettled(table.selected.map((id) => deleteInstitute(id)));
    const failures = results.filter((result) => result.status === 'rejected');
    const deletedCount = results.length - failures.length;

    if (deletedCount) {
      toast.success(t('delete_success'));
      table.onUpdatePageDeleteRows(dataInPage.length, dataFiltered.length);
    }
    failures.forEach((failure) => toast.error(getErrorMessage(failure.reason)));
  }, [dataFiltered.length, dataInPage.length, table, t]);

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title={t('delete_title')}
      content={
        <>
          {t('delete_confirm_multiple_prefix')} <strong> {table.selected.length} </strong> {t('delete_confirm_multiple_suffix')}
        </>
      }
      action={
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            handleDeleteRows();
            confirmDialog.onFalse();
          }}
        >
          {t('delete_button')}
        </Button>
      }
    />
  );

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('heading')}
          links={[
            { name: t('dashboard'), href: paths.dashboard.root },
            { name: t('heading'), href: paths.dashboard.institute.root },
            { name: t('breadcrumb_list') },
          ]}
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.institute.new}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              {t('new_button')}
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          <InstituteTableToolbar
            filters={filters}
            onResetPage={table.onResetPage}
          />

          {canReset && (
            <InstituteTableFiltersResult
              filters={filters}
              totalResults={dataFiltered.length}
              onResetPage={table.onResetPage}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          <Box sx={{ position: 'relative' }}>
            <TableSelectedAction
              dense={table.dense}
              numSelected={table.selected.length}
              rowCount={dataFiltered.length}
              onSelectAllRows={(checked) =>
                table.onSelectAllRows(
                  checked,
                  dataFiltered.map((row) => row.id)
                )
              }
              action={
                <Tooltip title={t('delete_button')}>
                  <IconButton color="primary" onClick={confirmDialog.onTrue}>
                    <Iconify icon="solar:trash-bin-trash-bold" />
                  </IconButton>
                </Tooltip>
              }
            />

            <Scrollbar>
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
                <TableHeadCustom
                  order={table.order}
                  orderBy={table.orderBy}
                  headCells={TABLE_HEAD}
                  rowCount={dataFiltered.length}
                  numSelected={table.selected.length}
                  onSort={table.onSort}
                  onSelectAllRows={(checked) =>
                    table.onSelectAllRows(
                      checked,
                      dataFiltered.map((row) => row.id)
                    )
                  }
                />

                <TableBody>
                  {dataFiltered
                    .slice(
                      table.page * table.rowsPerPage,
                      table.page * table.rowsPerPage + table.rowsPerPage
                    )
                    .map((row) => (
                      <InstituteTableRow
                        key={row.id}
                        row={row}
                        selected={table.selected.includes(row.id)}
                        onSelectRow={() => table.onSelectRow(row.id)}
                        onDeleteRow={() => handleDeleteRow(row.id)}
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
          </Box>

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

      {renderConfirmDialog()}
    </>
  );
}

// ----------------------------------------------------------------------

function applyFilter({ inputData, comparator, filters }) {
  const { name } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index]);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter(
      (institute) =>
        institute.label?.toLowerCase().includes(name.toLowerCase()) ||
        institute.address?.city?.toLowerCase().includes(name.toLowerCase()) ||
        institute.siren?.toLowerCase().includes(name.toLowerCase()) ||
        institute.siret?.toLowerCase().includes(name.toLowerCase())
    );
  }

  return inputData;
}
