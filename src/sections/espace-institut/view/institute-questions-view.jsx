'use client';

import { toast } from 'sonner';
import { varAlpha } from 'minimal-shared/utils';
import { useBoolean } from 'minimal-shared/hooks';
import { useMemo, useState, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import axiosInstance from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';
import { useGetInstituteQuestions } from 'src/actions/questions';
import { useGetInstituteAssessments } from 'src/actions/espace-institut';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, TableHeadCustom, TablePaginationCustom } from 'src/components/table';

import { useAuthContext, useCurrentInstitute } from 'src/auth/hooks';

import { QuestionTableRow } from '../question-table-row';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'label', label: 'Label' },
  { id: 'type', label: 'Type', width: 140 },
  { id: 'assessment', label: 'Test', width: 160 },
  { id: 'level', label: 'Niveau', width: 120 },
  { id: 'status', label: 'Statut', width: 120 },
  { id: 'points', label: 'Points', width: 80 },
  { id: 'timesAdministered', label: 'Passages', width: 100 },
  { id: 'successRate', label: 'Taux réussite', width: 120 },
  { id: '', width: 56 },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'Toutes' },
  { value: 'DRAFT', label: 'Brouillon' },
  { value: 'PRETESTING', label: 'Pre-test' },
  { value: 'CALIBRATED', label: 'Calibrée' },
  { value: 'RETIRED', label: 'Retirée' },
];

const TYPE_OPTIONS = [
  { value: 'all', label: 'Tous' },
  { value: 'mcq', label: 'QCM' },
  { value: 'fill_blank', label: 'Texte à trous' },
  { value: 'highlight', label: 'Surlignage' },
  { value: 'ordering', label: 'Ordonnancement' },
  { value: 'matching', label: 'Appariement' },
];

const STATUS_COLORS = {
  DRAFT: 'default',
  PRETESTING: 'warning',
  CALIBRATED: 'success',
  RETIRED: 'error',
};

// ----------------------------------------------------------------------

export function InstituteQuestionsView() {
  const table = useTable();
  const router = useRouter();
  const currentInstitute = useCurrentInstitute();
  const { user } = useAuthContext();

  const { questions, questionsLoading, questionsMutate } = useGetInstituteQuestions(
    currentInstitute?.id
  );
  const { assessments } = useGetInstituteAssessments(currentInstitute?.id);

  const isInstituteAdmin =
    currentInstitute?.membershipRole === 'ADMIN' || currentInstitute?.membershipRole === 'STAFF';
  const isTeacher = currentInstitute?.membershipRole === 'TEACHER';
  const canManage = isInstituteAdmin || isTeacher;

  // Filters state
  const [statusTab, setStatusTab] = useState('all');
  const [assessmentFilter, setAssessmentFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Confirm dialog state
  const confirmRetire = useBoolean();
  const confirmDelete = useBoolean();
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  // Assessment options from fetched data
  const assessmentOptions = useMemo(
    () =>
      assessments.map((a) => ({
        value: a.id || a['@id'],
        label: a.label,
      })),
    [assessments]
  );

  // Level options — cascading from selected assessment
  const levelOptions = useMemo(() => {
    if (assessmentFilter === 'all') {
      // Gather all unique levels from all assessments
      const levels = [];
      assessments.forEach((a) => {
        (a.levels || []).forEach((l) => {
          const levelObj = typeof l === 'object' ? l : null;
          if (levelObj && !levels.find((x) => x.value === (levelObj.id || levelObj['@id']))) {
            levels.push({ value: levelObj.id || levelObj['@id'], label: levelObj.label });
          }
        });
      });
      return levels;
    }

    const selected = assessments.find(
      (a) => a.id === assessmentFilter || a['@id'] === assessmentFilter
    );
    if (!selected) return [];

    return (selected.levels || [])
      .map((l) => {
        const levelObj = typeof l === 'object' ? l : null;
        return levelObj ? { value: levelObj.id || levelObj['@id'], label: levelObj.label } : null;
      })
      .filter(Boolean);
  }, [assessments, assessmentFilter]);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts = { all: questions.length, DRAFT: 0, PRETESTING: 0, CALIBRATED: 0, RETIRED: 0 };
    questions.forEach((q) => {
      const st = q.status || 'DRAFT';
      if (counts[st] !== undefined) counts[st] += 1;
    });
    return counts;
  }, [questions]);

  // Filter questions
  const filteredQuestions = useMemo(() => {
    let result = questions;

    if (statusTab !== 'all') {
      result = result.filter((q) => (q.status || 'DRAFT') === statusTab);
    }

    if (assessmentFilter !== 'all') {
      result = result.filter((q) => {
        const qAssessmentId = q.assessment?.id || q.assessment?.['@id'];
        return qAssessmentId === assessmentFilter;
      });
    }

    if (levelFilter !== 'all') {
      result = result.filter((q) => {
        const qLevelId = q.level?.id || q.level?.['@id'];
        return qLevelId === levelFilter;
      });
    }

    if (typeFilter !== 'all') {
      result = result.filter(
        (q) => (q.type || q.questionType) === typeFilter
      );
    }

    return result;
  }, [questions, statusTab, assessmentFilter, levelFilter, typeFilter]);

  const dataSliced = filteredQuestions.slice(
    table.page * table.rowsPerPage,
    table.page * table.rowsPerPage + table.rowsPerPage
  );

  // Filter handlers
  const handleStatusChange = useCallback(
    (_, value) => {
      setStatusTab(value);
      table.onChangePage(null, 0);
    },
    [table]
  );

  const handleAssessmentChange = useCallback(
    (e) => {
      setAssessmentFilter(e.target.value);
      setLevelFilter('all');
      table.onChangePage(null, 0);
    },
    [table]
  );

  const handleLevelChange = useCallback(
    (e) => {
      setLevelFilter(e.target.value);
      table.onChangePage(null, 0);
    },
    [table]
  );

  const handleTypeChange = useCallback(
    (e) => {
      setTypeFilter(e.target.value);
      table.onChangePage(null, 0);
    },
    [table]
  );

  // Actions
  const handleRetire = useCallback(
    async () => {
      if (!selectedQuestion) return;
      try {
        const id = selectedQuestion.id || selectedQuestion['@id']?.split('/').pop();
        await axiosInstance.patch(`/api/questions/${id}`, { status: 'RETIRED' });
        toast.success('Question retirée avec succès');
        questionsMutate();
      } catch (error) {
        toast.error(error.message || 'Erreur lors du retrait');
      } finally {
        confirmRetire.onFalse();
        setSelectedQuestion(null);
      }
    },
    [selectedQuestion, questionsMutate, confirmRetire]
  );

  const handleDelete = useCallback(
    async () => {
      if (!selectedQuestion) return;
      try {
        const id = selectedQuestion.id || selectedQuestion['@id']?.split('/').pop();
        await axiosInstance.delete(`/api/questions/${id}`);
        toast.success('Question supprimée avec succès');
        questionsMutate();
      } catch (error) {
        toast.error(error.message || 'Erreur lors de la suppression');
      } finally {
        confirmDelete.onFalse();
        setSelectedQuestion(null);
      }
    },
    [selectedQuestion, questionsMutate, confirmDelete]
  );

  // Loading
  if (questionsLoading) {
    return (
      <DashboardContent>
        <LoadingScreen />
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Banque de questions"
        links={[
          { name: 'Tableau de bord', href: paths.dashboard.root },
          { name: currentInstitute?.label || 'Institut' },
          { name: 'Banque de questions' },
        ]}
        action={
          canManage ? (
            <Stack direction="row" spacing={1}>
              <Button
                component={RouterLink}
                href={paths.dashboard.espaceInstitut.questionImport}
                variant="outlined"
                startIcon={<Iconify icon="mingcute:upload-2-line" />}
              >
                Import CSV
              </Button>
              <Button
                component={RouterLink}
                href={paths.dashboard.espaceInstitut.questionNew()}
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
              >
                Nouvelle question
              </Button>
            </Stack>
          ) : null
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        {/* ---- Tabs par statut ---- */}
        <Tabs
          value={statusTab}
          onChange={handleStatusChange}
          sx={{
            px: 2.5,
            boxShadow: (theme) =>
              `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
          }}
        >
          {STATUS_OPTIONS.map((tab) => (
            <Tab
              key={tab.value}
              value={tab.value}
              label={tab.label}
              iconPosition="end"
              icon={
                <Label
                  variant={statusTab === tab.value ? 'filled' : 'soft'}
                  color={STATUS_COLORS[tab.value] || 'default'}
                >
                  {statusCounts[tab.value] || 0}
                </Label>
              }
            />
          ))}
        </Tabs>

        {/* ---- Toolbar : filtres ---- */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          sx={{ px: 2.5, py: 2 }}
          flexWrap="wrap"
        >
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Test</InputLabel>
            <Select
              value={assessmentFilter}
              label="Test"
              onChange={handleAssessmentChange}
            >
              <MenuItem value="all">Tous</MenuItem>
              {assessmentOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {levelOptions.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Niveau</InputLabel>
              <Select
                value={levelFilter}
                label="Niveau"
                onChange={handleLevelChange}
              >
                <MenuItem value="all">Tous</MenuItem>
                {levelOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={typeFilter}
              label="Type"
              onChange={handleTypeChange}
            >
              {TYPE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {/* ---- Table ---- */}
        <TableContainer>
          <Scrollbar>
            <Table sx={{ minWidth: 960 }}>
              <TableHeadCustom headCells={TABLE_HEAD} />

              <TableBody>
                {filteredQuestions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={TABLE_HEAD.length}>
                      <EmptyContent
                        title="Aucune question"
                        description="Ajoutez des questions pour constituer votre banque de questions"
                        action={
                          canManage ? (
                            <Button
                              component={RouterLink}
                              href={paths.dashboard.espaceInstitut.questionNew()}
                              variant="contained"
                              startIcon={<Iconify icon="mingcute:add-line" />}
                              sx={{ mt: 2 }}
                            >
                              Créer une question
                            </Button>
                          ) : null
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  dataSliced.map((question) => (
                    <QuestionTableRow
                      key={question.id || question['@id']}
                      question={question}
                      canEdit={canManage}
                      onView={() =>
                        router.push(paths.dashboard.espaceInstitut.questionView(question.id))
                      }
                      onEdit={() =>
                        router.push(paths.dashboard.espaceInstitut.questionEdit(question.id))
                      }
                      onRetire={() => {
                        setSelectedQuestion(question);
                        confirmRetire.onTrue();
                      }}
                      onDelete={() => {
                        setSelectedQuestion(question);
                        confirmDelete.onTrue();
                      }}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>

        <TablePaginationCustom
          page={table.page}
          count={filteredQuestions.length}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>

      {/* ---- Confirm Retire ---- */}
      <ConfirmDialog
        open={confirmRetire.value}
        onClose={confirmRetire.onFalse}
        title="Retirer la question"
        content={`Voulez-vous vraiment retirer la question "${selectedQuestion?.label || ''}" ? Elle ne sera plus utilisée dans les futurs sujets.`}
        action={
          <Button variant="contained" color="warning" onClick={handleRetire}>
            Retirer
          </Button>
        }
      />

      {/* ---- Confirm Delete ---- */}
      <ConfirmDialog
        open={confirmDelete.value}
        onClose={confirmDelete.onFalse}
        title="Supprimer la question"
        content={`Voulez-vous vraiment supprimer la question "${selectedQuestion?.label || ''}" ? Cette action est irréversible.`}
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Supprimer
          </Button>
        }
      />
    </DashboardContent>
  );
}
