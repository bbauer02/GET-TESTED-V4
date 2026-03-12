'use client';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';

import { fDateTime } from 'src/utils/format-time';

import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { Scrollbar } from 'src/components/scrollbar';
import { LoadingScreen } from 'src/components/loading-screen';
import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, TableHeadCustom, TablePaginationCustom } from 'src/components/table';

import { useCurrentInstitute } from 'src/auth/hooks';

import { useGetInstituteMembres } from 'src/actions/espace-institut';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'name', label: 'Nom' },
  { id: 'email', label: 'Email' },
  { id: 'role', label: 'Role' },
  { id: 'since', label: 'Depuis' },
];

// ----------------------------------------------------------------------

export function InstituteMembresView() {
  const table = useTable();
  const currentInstitute = useCurrentInstitute();
  const { membres, membresLoading, membresEmpty } = useGetInstituteMembres(currentInstitute?.id);

  if (membresLoading) {
    return (
      <DashboardContent>
        <LoadingScreen />
      </DashboardContent>
    );
  }

  const dataSliced = membres.slice(
    table.page * table.rowsPerPage,
    table.page * table.rowsPerPage + table.rowsPerPage
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Membres"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Espace Institut' },
          { name: 'Membres' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <TableContainer>
          <Scrollbar>
            <Table sx={{ minWidth: 640 }}>
              <TableHeadCustom headCells={TABLE_HEAD} />

              <TableBody>
                {membresEmpty ? (
                  <TableRow>
                    <TableCell colSpan={TABLE_HEAD.length}>
                      <EmptyContent title="Aucun membre" />
                    </TableCell>
                  </TableRow>
                ) : (
                  dataSliced.map((membre) => (
                    <TableRow key={membre.id}>
                      <TableCell>
                        {membre.user?.firstname} {membre.user?.lastname}
                      </TableCell>
                      <TableCell>{membre.user?.email}</TableCell>
                      <TableCell>
                        <Label
                          variant="soft"
                          color={membre.role === 'ADMIN' ? 'primary' : 'default'}
                        >
                          {membre.role}
                        </Label>
                      </TableCell>
                      <TableCell>{fDateTime(membre.since)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>

        <TablePaginationCustom
          page={table.page}
          count={membres.length}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>
    </DashboardContent>
  );
}
