'use client';

import dayjs from 'dayjs';
import { useMemo, useCallback } from 'react';
import { varAlpha } from 'minimal-shared/utils';
import { useDebounce, useSetState } from 'minimal-shared/hooks';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import TableBody from '@mui/material/TableBody';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { usePaginatedCollection } from 'src/hooks/use-paginated-collection';

import { fIsAfter } from 'src/utils/format-time';

import { endpoints } from 'src/lib/axios';
import { useTranslate } from 'src/locales';
import { useGetAdminStats } from 'src/actions/admin';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { Scrollbar } from 'src/components/scrollbar';
import { LoadErrorContent } from 'src/components/load-error';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  TableNoData,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { InvoiceAnalytic } from '../invoice-analytic';
import { InvoiceTableRow } from '../invoice-table-row';
import { InvoiceTableToolbar } from '../invoice-table-toolbar';
import { InvoiceTableFiltersResult } from '../invoice-table-filters-result';

// ----------------------------------------------------------------------

// Périmètres de la liste -> filtres API. Le périmètre « ENROLLMENT » correspond à celui des
// compteurs de GET /api/admin/stats (factures d'inscription, hors commissions et avoirs).
const SCOPE_FILTERS = {
  ENROLLMENT: { businessType: 'ENROLLMENT', invoiceType: 'INVOICE' },
  CREDIT_NOTE: { invoiceType: 'CREDIT_NOTE' },
  PLATFORM_COMMISSION: { businessType: 'PLATFORM_COMMISSION' },
  all: {},
};

const STATS_SCOPE = 'ENROLLMENT';

// Colonnes triables côté serveur (OrderFilter de l'API)
const SORTABLE_COLUMNS = ['invoiceDate', 'totalTTC', 'status'];

// Date complète uniquement : pendant la saisie au clavier, le DatePicker émet des dates
// invalides ou partielles (ex. année « 0202 ») qu'il ne faut pas envoyer à l'API.
const toApiDate = (date, addDays = 0) => {
  const value = date ? dayjs(date) : null;
  if (!value?.isValid() || value.year() < 1900) return undefined;
  return value.add(addDays, 'day').format('YYYY-MM-DD');
};

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
  ].map((cell) => ({ ...cell, sortable: SORTABLE_COLUMNS.includes(cell.id) }));

  const SCOPE_OPTIONS = [
    { value: 'ENROLLMENT', label: t('scope_enrollment') },
    { value: 'CREDIT_NOTE', label: t('scope_credit_note') },
    { value: 'PLATFORM_COMMISSION', label: t('scope_commission') },
    { value: 'all', label: t('scope_all') },
  ];

  const table = useTable({
    defaultOrderBy: 'invoiceDate',
    defaultOrder: 'desc',
    defaultRowsPerPage: 10,
  });

  const filters = useSetState({
    name: '',
    status: 'all',
    scope: STATS_SCOPE,
    startDate: null,
    endDate: null,
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const dateError = fIsAfter(currentFilters.startDate, currentFilters.endDate);

  // Pagination, tri, recherche et filtres côté serveur (l'API pagine par 30)
  const debouncedSearch = useDebounce(currentFilters.name, 400);

  const { status, scope, startDate, endDate } = currentFilters;

  const apiFilters = useMemo(
    () => ({
      ...SCOPE_FILTERS[scope],
      q: debouncedSearch,
      status,
      // DateFilter : « before » sur une date seule s'arrête à minuit ; on borne donc
      // strictement avant le lendemain pour inclure toute la journée de fin.
      'invoiceDate[after]': dateError ? undefined : toApiDate(startDate),
      'invoiceDate[strictly_before]': dateError ? undefined : toApiDate(endDate, 1),
    }),
    [debouncedSearch, status, scope, startDate, endDate, dateError]
  );

  const {
    items: invoices,
    totalItems,
    loading,
    validating,
    error,
    mutate,
  } = usePaginatedCollection(endpoints.invoice.list, {
    page: table.page,
    rowsPerPage: table.rowsPerPage,
    orderBy: SORTABLE_COLUMNS.includes(table.orderBy) ? table.orderBy : undefined,
    order: table.order,
    filters: apiFilters,
  });

  // Compteurs et montants par statut : calculés en base par l'API
  const { stats } = useGetAdminStats();

  const statsTotal = stats?.invoices ?? 0;
  const byStatus = stats?.invoicesByStatus ?? {};

  const getInvoiceLength = (key) => byStatus[key]?.count ?? 0;
  const getTotalAmount = (key) => byStatus[key]?.amount ?? 0;
  const getPercentByStatus = (key) => (statsTotal ? (getInvoiceLength(key) / statsTotal) * 100 : 0);
  const totalAmount = Object.values(byStatus).reduce((sum, item) => sum + (item?.amount ?? 0), 0);

  // Les compteurs des onglets ne valent que pour le périmètre des statistiques
  const showTabCounts = !!stats && scope === STATS_SCOPE;

  const TABS = [
    { value: 'all', label: t('tab_all'), color: 'default', count: statsTotal },
    { value: 'PAID', label: t('tab_paid'), color: 'success', count: getInvoiceLength('PAID') },
    { value: 'ISSUED', label: t('tab_issued'), color: 'warning', count: getInvoiceLength('ISSUED') },
    { value: 'DRAFT', label: t('tab_draft'), color: 'default', count: getInvoiceLength('DRAFT') },
    {
      value: 'CANCELLED',
      label: t('tab_cancelled'),
      color: 'error',
      count: getInvoiceLength('CANCELLED'),
    },
  ];

  const canReset =
    !!currentFilters.name ||
    currentFilters.status !== 'all' ||
    !!currentFilters.startDate ||
    !!currentFilters.endDate;

  const notFound = !loading && !invoices.length;

  const handleFilterStatus = useCallback(
    (event, newValue) => {
      table.onResetPage();
      updateFilters({ status: newValue });
    },
    [updateFilters, table]
  );

  const handleSort = useCallback(
    (id) => {
      table.onSort(id);
      table.onResetPage();
    },
    [table]
  );

  const renderAnalytics = () => (
    <Card sx={{ mb: { xs: 3, md: 5 } }}>
      <Scrollbar sx={{ minHeight: 108 }}>
        <Stack
          divider={<Divider orientation="vertical" flexItem sx={{ borderStyle: 'dashed' }} />}
          sx={{ py: 2, flexDirection: 'row' }}
        >
          <InvoiceAnalytic
            title={t('analytic_total')}
            total={statsTotal}
            percent={100}
            price={totalAmount}
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

      <Typography
        variant="caption"
        component="p"
        sx={{ px: 2.5, pb: 1.5, color: 'text.disabled' }}
      >
        {t('analytic_scope_hint')}
      </Typography>
    </Card>
  );

  const renderTable = () => (
    <Scrollbar sx={{ minHeight: 444 }}>
      <Table
        size={table.dense ? 'small' : 'medium'}
        sx={{ minWidth: 800, opacity: validating && !loading ? 0.6 : 1 }}
      >
        <TableHeadCustom
          order={table.order}
          orderBy={table.orderBy}
          headCells={TABLE_HEAD}
          onSort={handleSort}
        />

        <TableBody>
          {invoices.map((row) => (
            <InvoiceTableRow
              key={row.id}
              row={row}
              detailsHref={paths.dashboard.invoice.details(row.id)}
            />
          ))}

          <TableEmptyRows
            height={table.dense ? 56 : 76}
            emptyRows={emptyRows(table.page, table.rowsPerPage, totalItems)}
          />

          <TableNoData notFound={notFound} />
        </TableBody>
      </Table>
    </Scrollbar>
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

      {renderAnalytics()}

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
                showTabCounts ? (
                  <Label
                    variant={
                      ((tab.value === 'all' || tab.value === currentFilters.status) &&
                        'filled') ||
                      'soft'
                    }
                    color={tab.color}
                  >
                    {tab.count}
                  </Label>
                ) : undefined
              }
            />
          ))}
        </Tabs>

        <InvoiceTableToolbar
          filters={filters}
          options={{ scopes: SCOPE_OPTIONS }}
          dateError={dateError}
          onResetPage={table.onResetPage}
        />

        {canReset && (
          <InvoiceTableFiltersResult
            filters={filters}
            onResetPage={table.onResetPage}
            totalResults={totalItems}
            allowPartialDates
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
          onPageChange={table.onChangePage}
          onChangeDense={table.onChangeDense}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>
    </DashboardContent>
  );
}
