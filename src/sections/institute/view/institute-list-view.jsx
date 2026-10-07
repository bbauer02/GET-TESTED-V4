'use client';

import { useMemo, useCallback } from 'react';
import { useBoolean, useDebounce, useSetState } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { usePaginatedCollection } from 'src/hooks/use-paginated-collection';

import { endpoints } from 'src/lib/axios';
import { useTranslate } from 'src/locales';
import { deleteInstitute } from 'src/actions/institute';
import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { LoadErrorContent } from 'src/components/load-error';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  TableNoData,
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

// Colonnes triables côté serveur (OrderFilter de l'API) : id de colonne -> champ API
const SORT_FIELDS = {
  label: 'label',
  city: 'address.city',
};

// ----------------------------------------------------------------------

export function InstituteListView() {
  const { t } = useTranslate('institute');

  const TABLE_HEAD = [
    { id: 'label', label: t('table_name') },
    { id: 'city', label: t('table_city'), width: 180 },
    { id: 'siteweb', label: t('table_website'), width: 220, sortable: false },
    { id: 'siren', label: t('table_siren'), width: 140, sortable: false },
    { id: 'siret', label: t('table_siret'), width: 160, sortable: false },
    { id: 'stripe', label: t('table_stripe'), width: 120, sortable: false },
    { id: '', width: 88, sortable: false },
  ];

  const table = useTable({ defaultOrderBy: 'label', defaultRowsPerPage: 10 });

  const confirmDialog = useBoolean();

  const filters = useSetState({ name: '' });
  const { state: currentFilters } = filters;

  // Pagination, tri et recherche côté serveur (l'API pagine par 30)
  const debouncedSearch = useDebounce(currentFilters.name, 400);
  const apiFilters = useMemo(() => ({ q: debouncedSearch }), [debouncedSearch]);

  const {
    items: institutes,
    totalItems,
    loading,
    validating,
    error,
    mutate,
  } = usePaginatedCollection(endpoints.institute.list, {
    page: table.page,
    rowsPerPage: table.rowsPerPage,
    orderBy: SORT_FIELDS[table.orderBy],
    order: table.order,
    filters: apiFilters,
  });

  const canReset = !!currentFilters.name;

  const notFound = !loading && !institutes.length;

  // La sélection ne porte que sur la page affichée : elle est vidée à chaque
  // changement de page, de tri ou de filtre.
  const { setSelected } = table;

  const handleResetPage = useCallback(() => {
    setSelected([]);
    table.onResetPage();
  }, [setSelected, table]);

  const handleChangePage = useCallback(
    (event, newPage) => {
      setSelected([]);
      table.onChangePage(event, newPage);
    },
    [setSelected, table]
  );

  const handleChangeRowsPerPage = useCallback(
    (event) => {
      setSelected([]);
      table.onChangeRowsPerPage(event);
    },
    [setSelected, table]
  );

  const handleSort = useCallback(
    (id) => {
      setSelected([]);
      table.onSort(id);
      table.onResetPage();
    },
    [setSelected, table]
  );

  const handleSelectAllRows = useCallback(
    (checked) =>
      table.onSelectAllRows(
        checked,
        institutes.map((row) => row.id)
      ),
    [institutes, table]
  );

  const handleDeleteRow = useCallback(
    async (id) => {
      try {
        await deleteInstitute(id);
        toast.success(t('delete_success'));
        table.onUpdatePageDeleteRow(institutes.length);
        mutate();
      } catch (deleteError) {
        toast.error(getErrorMessage(deleteError));
      }
    },
    [institutes.length, mutate, table, t]
  );

  const handleDeleteRows = useCallback(async () => {
    const results = await Promise.allSettled(table.selected.map((id) => deleteInstitute(id)));
    const failures = results.filter((result) => result.status === 'rejected');
    const deletedCount = results.length - failures.length;

    if (deletedCount) {
      toast.success(t('delete_success'));
      table.onUpdatePageDeleteRows(institutes.length, totalItems);
    }
    failures.forEach((failure) => toast.error(getErrorMessage(failure.reason)));
    mutate();
  }, [institutes.length, mutate, table, t, totalItems]);

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title={t('delete_title')}
      content={
        <>
          {t('delete_confirm_multiple_prefix')} <strong> {table.selected.length} </strong>{' '}
          {t('delete_confirm_multiple_suffix')}
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

  const renderTable = () => (
    <Box sx={{ position: 'relative' }}>
      <TableSelectedAction
        dense={table.dense}
        numSelected={table.selected.length}
        rowCount={institutes.length}
        onSelectAllRows={handleSelectAllRows}
        action={
          <Tooltip title={t('delete_button')}>
            <IconButton color="primary" onClick={confirmDialog.onTrue}>
              <Iconify icon="solar:trash-bin-trash-bold" />
            </IconButton>
          </Tooltip>
        }
      />

      <Scrollbar>
        <Table
          size={table.dense ? 'small' : 'medium'}
          sx={{ minWidth: 960, opacity: validating && !loading ? 0.6 : 1 }}
        >
          <TableHeadCustom
            order={table.order}
            orderBy={table.orderBy}
            headCells={TABLE_HEAD}
            rowCount={institutes.length}
            numSelected={table.selected.length}
            onSort={handleSort}
            onSelectAllRows={handleSelectAllRows}
          />

          <TableBody>
            {institutes.map((row) => (
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
              emptyRows={emptyRows(table.page, table.rowsPerPage, totalItems)}
            />

            <TableNoData notFound={notFound} />
          </TableBody>
        </Table>
      </Scrollbar>
    </Box>
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
          <InstituteTableToolbar filters={filters} onResetPage={handleResetPage} />

          {canReset && (
            <InstituteTableFiltersResult
              filters={filters}
              totalResults={totalItems}
              onResetPage={handleResetPage}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          {error ? <LoadErrorContent error={error} onRetry={mutate} /> : renderTable()}

          <TablePaginationCustom
            page={table.page}
            dense={table.dense}
            count={totalItems}
            rowsPerPage={table.rowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
            onPageChange={handleChangePage}
            onChangeDense={table.onChangeDense}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Card>
      </DashboardContent>

      {renderConfirmDialog()}
    </>
  );
}
