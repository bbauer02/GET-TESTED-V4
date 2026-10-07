'use client';

import { sumBy } from 'es-toolkit';
import { useMemo, useCallback } from 'react';
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
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useSearchParams } from 'src/routes/hooks';

import { fIsAfter, fIsBetween } from 'src/utils/format-time';

import { DashboardContent } from 'src/layouts/dashboard';
import { useGetInstituteInvoices } from 'src/actions/invoice';

import { Label } from 'src/components/label';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { InvoiceAnalytic } from 'src/sections/invoice/invoice-analytic';
import { InvoiceTableRow } from 'src/sections/invoice/invoice-table-row';
import { InvoiceTableToolbar } from 'src/sections/invoice/invoice-table-toolbar';
import { InvoiceTableFiltersResult } from 'src/sections/invoice/invoice-table-filters-result';

import { useCurrentInstitute } from 'src/auth/hooks/use-current-institute';

// ----------------------------------------------------------------------

const TABLE_HEAD_EMISES = [
  { id: 'buyer', label: 'Client' },
  { id: 'invoiceDate', label: 'Date' },
  { id: 'totalTTC', label: 'Montant TTC' },
  { id: 'status', label: 'Statut' },
  { id: '', width: 64 },
];

const TABLE_HEAD_RECUES = [
  { id: 'seller', label: 'Émetteur' },
  { id: 'invoiceDate', label: 'Date' },
  { id: 'totalTTC', label: 'Montant TTC' },
  { id: 'status', label: 'Statut' },
  { id: '', width: 64 },
];

// ----------------------------------------------------------------------

export function InstituteInvoicesView() {
  const theme = useTheme();
  const currentInstitute = useCurrentInstitute();
  const searchParams = useSearchParams();

  const initialSection = searchParams.get('section') === 'recues' ? 'recues' : 'emises';
  const initialStatus = ['PAID', 'ISSUED'].includes(searchParams.get('status'))
    ? searchParams.get('status')
    : 'all';

  const tableEmises = useTable({ defaultOrderBy: 'invoiceDate' });
  const tableRecues = useTable({ defaultOrderBy: 'invoiceDate' });

  const { invoices, invoicesLoading } = useGetInstituteInvoices(currentInstitute?.id);

  // Séparer factures émises (ENROLLMENT = CA) et reçues (COMMISSION = charges)
  const { emises, recues } = useMemo(() => {
    const e = [];
    const r = [];
    (invoices || []).forEach((inv) => {
      if (inv.businessType === 'PLATFORM_COMMISSION') {
        r.push(inv);
      } else {
        e.push(inv);
      }
    });
    return { emises: e, recues: r };
  }, [invoices]);

  // --- Section active : émises ou reçues ---
  const { state: section, setState: setSection } = useSetState({ value: initialSection });

  const handleChangeSection = useCallback(
    (event, newValue) => {
      setSection({ value: newValue });
      tableEmises.onResetPage();
      tableRecues.onResetPage();
    },
    [setSection, tableEmises, tableRecues]
  );

  const currentData = section.value === 'emises' ? emises : recues;
  const currentTable = section.value === 'emises' ? tableEmises : tableRecues;
  const currentHead = section.value === 'emises' ? TABLE_HEAD_EMISES : TABLE_HEAD_RECUES;

  // --- Filtres ---
  const filters = useSetState({
    name: '',
    status: initialStatus,
    startDate: null,
    endDate: null,
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const dateError = fIsAfter(currentFilters.startDate, currentFilters.endDate);

  const dataFiltered = applyFilter({
    inputData: currentData,
    comparator: getComparator(currentTable.order, currentTable.orderBy),
    filters: currentFilters,
    dateError,
  });

  const canReset =
    !!currentFilters.name ||
    currentFilters.status !== 'all' ||
    (!!currentFilters.startDate && !!currentFilters.endDate);

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  // --- Helpers analytics ---
  const getLength = (data, status) => data.filter((item) => item.status === status).length;
  const getTotal = (data, status) =>
    sumBy(
      data.filter((item) => item.status === status),
      (inv) => inv.totalTTC || 0
    );
  const getPercent = (data, status) =>
    data.length ? (getLength(data, status) / data.length) * 100 : 0;

  // --- Onglets statut ---
  const STATUS_TABS = [
    { value: 'all', label: 'Toutes', color: 'default', count: currentData.length },
    { value: 'PAID', label: 'Payées', color: 'success', count: getLength(currentData, 'PAID') },
    {
      value: 'ISSUED',
      label: 'Émises',
      color: 'warning',
      count: getLength(currentData, 'ISSUED'),
    },
  ];

  const handleFilterStatus = useCallback(
    (event, newValue) => {
      currentTable.onResetPage();
      updateFilters({ status: newValue });
    },
    [updateFilters, currentTable]
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Factures"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: currentInstitute?.label || 'Institut', href: paths.dashboard.espaceInstitut.root },
          { name: 'Factures' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {/* Sélecteur Émises / Reçues */}
      <Tabs
        value={section.value}
        onChange={handleChangeSection}
        sx={{ mb: 3 }}
      >
        <Tab
          value="emises"
          label="Factures émises"
          iconPosition="end"
          icon={
            <Label variant="filled" color="info">
              {emises.length}
            </Label>
          }
        />
        <Tab
          value="recues"
          label="Factures reçues"
          iconPosition="end"
          icon={
            <Label variant="filled" color="secondary">
              {recues.length}
            </Label>
          }
        />
      </Tabs>

      {section.value === 'emises' && (
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          Factures adressées à vos candidats (chiffre d&apos;affaires)
        </Typography>
      )}

      {section.value === 'recues' && (
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          Factures de commission reçues de la plateforme GetTested (charges)
        </Typography>
      )}

      {/* Analytics */}
      <Card sx={{ mb: { xs: 3, md: 5 } }}>
        <Scrollbar sx={{ minHeight: 108 }}>
          <Stack
            divider={<Divider orientation="vertical" flexItem sx={{ borderStyle: 'dashed' }} />}
            sx={{ py: 2, flexDirection: 'row' }}
          >
            <InvoiceAnalytic
              title="Total"
              total={currentData.length}
              percent={100}
              price={sumBy(currentData, (inv) => inv.totalTTC || 0)}
              icon="solar:bill-list-bold-duotone"
              color={theme.vars.palette.info.main}
            />
            <InvoiceAnalytic
              title="Payées"
              total={getLength(currentData, 'PAID')}
              percent={getPercent(currentData, 'PAID')}
              price={getTotal(currentData, 'PAID')}
              icon="solar:file-check-bold-duotone"
              color={theme.vars.palette.success.main}
            />
            <InvoiceAnalytic
              title="En attente"
              total={getLength(currentData, 'ISSUED')}
              percent={getPercent(currentData, 'ISSUED')}
              price={getTotal(currentData, 'ISSUED')}
              icon="solar:sort-by-time-bold-duotone"
              color={theme.vars.palette.warning.main}
            />
          </Stack>
        </Scrollbar>
      </Card>

      {/* Table */}
      <Card>
        <Tabs
          value={currentFilters.status}
          onChange={handleFilterStatus}
          sx={{
            px: { md: 2.5 },
            boxShadow: `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
          }}
        >
          {STATUS_TABS.map((tab) => (
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
          onResetPage={currentTable.onResetPage}
        />

        {canReset && (
          <InvoiceTableFiltersResult
            filters={filters}
            onResetPage={currentTable.onResetPage}
            totalResults={dataFiltered.length}
            sx={{ p: 2.5, pt: 0 }}
          />
        )}

        <Scrollbar sx={{ minHeight: 444 }}>
          <Table size={currentTable.dense ? 'small' : 'medium'} sx={{ minWidth: 800 }}>
            <TableHeadCustom
              order={currentTable.order}
              orderBy={currentTable.orderBy}
              headCells={currentHead}
              onSort={currentTable.onSort}
            />

            <TableBody>
              {dataFiltered
                .slice(
                  currentTable.page * currentTable.rowsPerPage,
                  currentTable.page * currentTable.rowsPerPage + currentTable.rowsPerPage
                )
                .map((row) => (
                  <InvoiceTableRow
                    key={row.id}
                    row={row}
                    detailsHref={paths.dashboard.espaceInstitut.invoiceDetails(row.id)}
                    showSeller={section.value === 'recues'}
                    hideType
                  />
                ))}

              <TableEmptyRows
                height={currentTable.dense ? 56 : 76}
                emptyRows={emptyRows(
                  currentTable.page,
                  currentTable.rowsPerPage,
                  dataFiltered.length
                )}
              />

              <TableNoData notFound={notFound} />
            </TableBody>
          </Table>
        </Scrollbar>

        <TablePaginationCustom
          page={currentTable.page}
          dense={currentTable.dense}
          count={dataFiltered.length}
          rowsPerPage={currentTable.rowsPerPage}
          onPageChange={currentTable.onChangePage}
          onChangeDense={currentTable.onChangeDense}
          onRowsPerPageChange={currentTable.onChangeRowsPerPage}
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
      [invoice.invoiceNumber, invoice.buyer?.name, invoice.seller?.name].some((field) =>
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
