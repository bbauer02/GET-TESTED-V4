'use client';

import { useMemo } from 'react';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useGetLevels, useGetAssessmentExams } from 'src/actions/exam';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';
import {
  useTable,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'label', label: 'Label' },
  { id: 'level', label: 'Niveau', width: 160 },
  { id: 'isWritten', label: 'Ecrit', width: 80 },
  { id: 'isOption', label: 'Option', width: 80 },
  { id: 'coeff', label: 'Coeff', width: 80 },
  { id: 'duration', label: 'Duree', width: 100 },
  { id: 'price', label: 'Prix', width: 120 },
  { id: '', width: 60 },
];

function formatPrice(price) {
  if (!price?.amount) return '-';
  return `${price.amount} ${price.currency || 'EUR'}`;
}

// ----------------------------------------------------------------------

export function AssessmentExamList({ assessmentId, canEdit }) {
  const table = useTable();

  const { exams, examsLoading, examsEmpty } = useGetAssessmentExams(assessmentId);
  const { levels } = useGetLevels();

  const levelMap = useMemo(() => {
    const map = {};
    levels.forEach((l) => {
      const iri = l['@id'] || `/api/levels/${l.id}`;
      map[iri] = l.label;
    });
    return map;
  }, [levels]);

  const getLevelLabel = (exam) => {
    if (!exam.level) return '-';
    if (typeof exam.level === 'string') return levelMap[exam.level] || exam.level;
    return exam.level?.label || '-';
  };

  const dataSliced = exams.slice(
    table.page * table.rowsPerPage,
    table.page * table.rowsPerPage + table.rowsPerPage
  );

  return (
    <Card>
      {canEdit && (
        <Stack direction="row" justifyContent="flex-end" sx={{ px: 2.5, pt: 2.5 }}>
          <Button
            component={RouterLink}
            href={paths.dashboard.espaceInstitut.examNew(assessmentId)}
            variant="contained"
            size="small"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            Nouvel exam
          </Button>
        </Stack>
      )}

      <TableContainer>
        <Scrollbar>
          <Table sx={{ minWidth: 720 }}>
            <TableHeadCustom headCells={TABLE_HEAD} />

            <TableBody>
              {examsLoading ? (
                <TableRow>
                  <TableCell colSpan={TABLE_HEAD.length} sx={{ textAlign: 'center', py: 4 }}>
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : examsEmpty ? (
                <TableRow>
                  <TableCell colSpan={TABLE_HEAD.length}>
                    <EmptyContent
                      title="Aucun exam"
                      description="Ajoutez des épreuves pour définir ce test."
                      action={
                        canEdit ? (
                          <Button
                            component={RouterLink}
                            href={paths.dashboard.espaceInstitut.examNew(assessmentId)}
                            variant="contained"
                            startIcon={<Iconify icon="mingcute:add-line" />}
                            sx={{ mt: 2 }}
                          >
                            Creer un exam
                          </Button>
                        ) : null
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                dataSliced.map((exam) => (
                  <TableRow key={exam.id || exam['@id']}>
                    <TableCell sx={{ fontWeight: 'fontWeightSemiBold' }}>
                      {exam.label}
                    </TableCell>
                    <TableCell>{getLevelLabel(exam)}</TableCell>
                    <TableCell>
                      <Label variant="soft" color={exam.isWritten ? 'info' : 'default'}>
                        {exam.isWritten ? 'Oui' : 'Non'}
                      </Label>
                    </TableCell>
                    <TableCell>
                      <Label variant="soft" color={exam.isOption ? 'warning' : 'default'}>
                        {exam.isOption ? 'Oui' : 'Non'}
                      </Label>
                    </TableCell>
                    <TableCell>{exam.coeff ?? '-'}</TableCell>
                    <TableCell>{exam.duration ? `${exam.duration} min` : '-'}</TableCell>
                    <TableCell>{formatPrice(exam.price)}</TableCell>
                    <TableCell>
                      {canEdit && (
                        <Tooltip title="Modifier">
                          <IconButton
                            component={RouterLink}
                            href={paths.dashboard.espaceInstitut.examEdit(assessmentId, exam.id)}
                            size="small"
                          >
                            <Iconify icon="solar:pen-bold" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>

      <TablePaginationCustom
        page={table.page}
        count={exams.length}
        rowsPerPage={table.rowsPerPage}
        onPageChange={table.onChangePage}
        onRowsPerPageChange={table.onChangeRowsPerPage}
      />
    </Card>
  );
}
