'use client';

import { sumBy } from 'es-toolkit';
import { useCallback } from 'react';
import { varAlpha } from 'minimal-shared/utils';
import { useSetState } from 'minimal-shared/hooks';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import TableBody from '@mui/material/TableBody';
import { useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';

import { fIsAfter, fIsBetween } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';
import { useGetInvoices } from 'src/actions/invoice';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  rowInPage,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { InvoiceAnalytic } from '../invoice-analytic';
import { InvoiceTableRow } from '../invoice-table-row';
import { InvoiceTableToolbar } from '../invoice-table-toolbar';
import { InvoiceTableFiltersResult } from '../invoice-table-filters-result';

// ----------------------------------------------------------------------

// TABLE_HEAD moved inside component for i18n

// ----------------------------------------------------------------------

export function InvoiceListView() {
  const { t } = useTranslate('invoice');
  const theme = useTheme();

  const TABLE_HEAD = [
    { id: 'buyer', label: t('table_client') },
    { id: 'invoiceDate', label: t('table_date') },
    { id: 'totalTTC', label: t('table_amount_ttc') },
    { id: 'status', label: t('table_status') },
    { id: 'businessType', label: t('table_type') },
    { id: '', width: 64 },
  ];

  const table = useTable({ defaultOrderBy: 'invoiceDate' });

  const { invoices, invoicesLoading } = useGetInvoices();

  const filters = useSetState({
    name: '',
    status: 'all',
    startDate: null,
    endDate: null,
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const dateError = fIsAfter(currentFilters.startDate, currentFilters.endDate);

  const dataFiltered = applyFilter({
    inputData: invoices,
    comparator: getComparator(table.order, table.orderBy),
    filters: currentFilters,
    dateError,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const canReset =
    !!currentFilters.name ||
    currentFilters.status !== 'all' ||
    (!!currentFilters.startDate && !!currentFilters.endDate);

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const getInvoiceLength = (status) => invoices.filter((item) => item.status === status).length;

  const getTotalAmount = (status) =>
    sumBy(
      invoices.filter((item) => item.status === status),
      (invoice) => invoice.totalTTC || 0
    );

  const getPercentByStatus = (status) =>
    invoices.length ? (getInvoiceLength(status) / invoices.length) * 100 : 0;

  const TABS = [
    { value: 'all', label: t('tab_all'), color: 'default', count: invoices.length },
    { value: 'PAID', label: t('tab_paid'), color: 'success', count: getInvoiceLength('PAID') },
    { value: 'ISSUED', label: t('tab_issued'), color: 'warning', count: getInvoiceLength('ISSUED') },
    { value: 'DRAFT', label: t('tab_draft'), color: 'default', count: getInvoiceLength('DRAFT') },
    { value: 'CANCELLED', label: t('tab_cancelled'), color: 'error', count: getInvoiceLength('CANCELLED') },
  ];

  const handleFilterStatus = useCallback(
    (event, newValue) => {
      table.onResetPage();
      updateFilters({ status: newValue });
    },
    [updateFilters, table]
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('heading')}
        links={[
          { name: t('dashboard'), href: paths.dashboard.root },
          { name: t('heading'), href: paths.dashboard.invoice.root },
          { name: t('breadcrumb_list') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card sx={{ mb: { xs: 3, md: 5 } }}>
        <Scrollbar sx={{ minHeight: 108 }}>
          <Stack
            divider={<Divider orientation="vertical" flexItem sx={{ borderStyle: 'dashed' }} />}
            sx={{ py: 2, flexDirection: 'row' }}
          >
            <InvoiceAnalytic
              title={t('analytic_total')}
              total={invoices.length}
              percent={100}
              price={sumBy(invoices, (inv) => inv.totalTTC || 0)}
              icon="solar:bill-list-bold-duotone"
              color={theme.vars.palette.info.main}
            />

            <InvoiceAnalytic
              title={t('analytic_paid')}
              total={getInvoiceLength('PAID')}
              percent={getPercentByStatus('PAID')}
              price={getTotalAmount('PAID')}
              icon="solar:file-check-bold-duotone"
              color={theme.vars.palette.success.main}
            />

            <InvoiceAnalytic
              title={t('analytic_issued')}
              total={getInvoiceLength('ISSUED')}
              percent={getPercentByStatus('ISSUED')}
              price={getTotalAmount('ISSUED')}
              icon="solar:sort-by-time-bold-duotone"
              color={theme.vars.palette.warning.main}
            />

            <InvoiceAnalytic
              title={t('analytic_cancelled')}
              total={getInvoiceLength('CANCELLED')}
              percent={getPercentByStatus('CANCELLED')}
              price={getTotalAmount('CANCELLED')}
              icon="solar:bell-bing-bold-duotone"
              color={theme.vars.palette.error.main}
            />
          </Stack>
        </Scrollbar>
      </Card>

      <Card>
        <Tabs
          value={currentFilters.status}
          onChange={handleFilterStatus}
          sx={{
            px: { md: 2.5 },
            boxShadow: `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
          }}
        >
          {TABS.map((tab) => (
            <Tab
              key={tab.value}
              value={tab.value}
              label={tab.label}
              iconPosition="end"
              icon={
                <Label
                  variant={
                    ((tab.value === 'all' || tab.value === currentFilters.status) && 'filled') ||
                    'soft'
                  }
                  color={tab.color}
                >
                  {tab.count}
                </Label>
              }
            />
          ))}
        </Tabs>

        <InvoiceTableToolbar
          filters={filters}
          dateError={dateError}
          onResetPage={table.onResetPage}
        />

        {canReset && (
          <InvoiceTableFiltersResult
            filters={filters}
            onResetPage={table.onResetPage}
            totalResults={dataFiltered.length}
            sx={{ p: 2.5, pt: 0 }}
          />
        )}

        <Scrollbar sx={{ minHeight: 444 }}>
          <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 800 }}>
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
                  <InvoiceTableRow
                    key={row.id}
                    row={row}
                    detailsHref={paths.dashboard.invoice.details(row.id)}
                  />
                ))}

              <TableEmptyRows
                height={table.dense ? 56 : 76}
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

// ----------------------------------------------------------------------

function applyFilter({ inputData, comparator, filters, dateError }) {
  const { name, status, startDate, endDate } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index]);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter((invoice) =>
      [invoice.invoiceNumber, invoice.buyer?.name].some((field) =>
        field?.toLowerCase().includes(name.toLowerCase())
      )
    );
  }

  if (status !== 'all') {
    inputData = inputData.filter((invoice) => invoice.status === status);
  }

  if (!dateError && startDate && endDate) {
    inputData = inputData.filter((invoice) =>
      fIsBetween(invoice.invoiceDate, startDate, endDate)
    );
  }

  return inputData;
}
