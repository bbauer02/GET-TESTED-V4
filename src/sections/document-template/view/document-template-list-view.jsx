'use client';

import { useCallback } from 'react';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { LoadingScreen } from 'src/components/loading-screen';
import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, TableHeadCustom, TablePaginationCustom } from 'src/components/table';

import { useCurrentInstitute } from 'src/auth/hooks';
import { useGetDocumentTemplates } from 'src/actions/document-template';

import { DocumentTemplateTableRow } from '../document-template-table-row';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'label', label: 'Nom' },
  { id: 'type', label: 'Type' },
  { id: '', width: 88 },
];

// ----------------------------------------------------------------------

export function DocumentTemplateListView() {
  const table = useTable();
  const router = useRouter();
  const institute = useCurrentInstitute();
  const { templates, templatesLoading, templatesEmpty } =
    useGetDocumentTemplates(institute?.id);

  const handleEdit = useCallback(
    (id) => {
      router.push(paths.dashboard.espaceInstitut.documentEdit(id));
    },
    [router]
  );

  const handleGenerate = useCallback(
    (id) => {
      router.push(paths.dashboard.espaceInstitut.documentGenerate(id));
    },
    [router]
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
        heading="Modeles de documents"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Espace Institut', href: paths.dashboard.espaceInstitut.root },
          { name: 'Documents' },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.espaceInstitut.documentNew}
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
            title="Aucun modele"
            description="Creez votre premier modele de document pour generer des convocations, attestations, etc."
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
                      <DocumentTemplateTableRow
                        key={row.id}
                        row={row}
                        onEdit={() => handleEdit(row.id)}
                        onGenerate={() => handleGenerate(row.id)}
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
