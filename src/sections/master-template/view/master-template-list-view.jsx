'use client';

import { toast } from 'sonner';
import { useCallback } from 'react';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import axiosInstance from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';
import { useGetMasterTemplates } from 'src/actions/document-template';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, TableHeadCustom, TablePaginationCustom } from 'src/components/table';

import { getErrorMessage } from 'src/auth/utils/error-message';

import { MasterTemplateTableRow } from '../master-template-table-row';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'label', label: 'Nom' },
  { id: 'type', label: 'Type' },
  { id: '', width: 88 },
];

// ----------------------------------------------------------------------

export function MasterTemplateListView() {
  const table = useTable();
  const router = useRouter();
  const { templates, templatesLoading, templatesEmpty, templatesMutate } =
    useGetMasterTemplates();

  const handleEdit = useCallback(
    (id) => {
      router.push(paths.dashboard.masterTemplate.edit(id));
    },
    [router]
  );

  const handleDelete = useCallback(
    async (id) => {
      try {
        await axiosInstance.delete(`/api/document-templates/${id}`);
        toast.success('Modele supprime !');
        templatesMutate();
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    },
    [templatesMutate]
  );

  if (templatesLoading) {
    return <LoadingScreen />;
  }

  const dataSlice = templates.slice(
    table.page * table.rowsPerPage,
    table.page * table.rowsPerPage + table.rowsPerPage
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Modeles maitre"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Modeles maitre' },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.masterTemplate.new}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            Nouveau modele
          </Button>
        }
      />

      <Card>
        {templatesEmpty ? (
          <EmptyContent
            title="Aucun modele maitre"
            description="Les modeles maitre sont automatiquement copies aux nouveaux instituts."
            sx={{ py: 10 }}
          />
        ) : (
          <>
            <TableContainer>
              <Scrollbar>
                <Table sx={{ minWidth: 600 }}>
                  <TableHeadCustom headCells={TABLE_HEAD} />
                  <TableBody>
                    {dataSlice.map((row) => (
                      <MasterTemplateTableRow
                        key={row.id}
                        row={row}
                        onEdit={() => handleEdit(row.id)}
                        onDelete={() => handleDelete(row.id)}
                      />
                    ))}
                  </TableBody>
                </Table>
              </Scrollbar>
            </TableContainer>

            <TablePaginationCustom
              page={table.page}
              count={templates.length}
              rowsPerPage={table.rowsPerPage}
              onPageChange={table.onChangePage}
              onRowsPerPageChange={table.onChangeRowsPerPage}
            />
          </>
        )}
      </Card>
    </DashboardContent>
  );
}
