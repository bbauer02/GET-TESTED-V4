'use client';

import { useCallback } from 'react';
import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import axiosInstance from 'src/lib/axios';

import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
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

import { useGetDocumentTypes } from 'src/actions/document-template';

import { DocumentTypeTableRow } from '../document-type-table-row';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'label', label: 'Nom' },
  { id: 'code', label: 'Code' },
  { id: '', width: 88 },
];

// ----------------------------------------------------------------------

export function DocumentTypeListView() {
  const table = useTable();

  const { documentTypes, documentTypesLoading, documentTypesEmpty, documentTypesMutate } =
    useGetDocumentTypes();

  const notFound = !documentTypesLoading && !documentTypes.length;

  const handleDeleteRow = useCallback(
    async (id) => {
      try {
        await axiosInstance.delete(`/api/document-types/${id}`);
        toast.success('Type de document supprime !');
        documentTypesMutate();
        table.onUpdatePageDeleteRow(documentTypes.length);
      } catch (error) {
        console.error(error);
        toast.error(error?.message || 'Erreur lors de la suppression');
      }
    },
    [documentTypes.length, documentTypesMutate, table]
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Types de documents"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Types de documents', href: paths.dashboard.documentType.root },
          { name: 'Liste' },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.documentType.new}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            Nouveau type
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <Box sx={{ position: 'relative' }}>
          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 600 }}>
              <TableHeadCustom
                order={table.order}
                orderBy={table.orderBy}
                headCells={TABLE_HEAD}
                onSort={table.onSort}
              />

              <TableBody>
                {documentTypes
                  .slice(
                    table.page * table.rowsPerPage,
                    table.page * table.rowsPerPage + table.rowsPerPage
                  )
                  .map((row) => (
                    <DocumentTypeTableRow
                      key={row.id}
                      row={row}
                      onDeleteRow={() => handleDeleteRow(row.id)}
                    />
                  ))}

                <TableEmptyRows
                  height={table.dense ? 56 : 56 + 20}
                  emptyRows={emptyRows(table.page, table.rowsPerPage, documentTypes.length)}
                />

                <TableNoData notFound={notFound} />
              </TableBody>
            </Table>
          </Scrollbar>
        </Box>

        <TablePaginationCustom
          page={table.page}
          dense={table.dense}
          count={documentTypes.length}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onChangeDense={table.onChangeDense}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>
    </DashboardContent>
  );
}
