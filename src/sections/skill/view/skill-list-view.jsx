'use client';

import useSWR, { mutate } from 'swr';
import { useMemo, useState, useCallback } from 'react';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { useGetSkills } from 'src/actions/skill';
import { DashboardContent } from 'src/layouts/dashboard';
import { useGetAssessments } from 'src/actions/assessment';
import { useGetExams, useGetLevels } from 'src/actions/exam';
import axios, { fetcher, endpoints, extractMembers } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { SkillTableRow } from '../skill-table-row';
import { SkillTableToolbar } from '../skill-table-toolbar';

// ----------------------------------------------------------------------

// TABLE_HEAD moved inside component for i18n

const swrOptions = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

// ----------------------------------------------------------------------

export function SkillListView() {
  const { t } = useTranslate('skill');

  const TABLE_HEAD = [
    { id: 'label', label: t('table_label') },
    { id: 'parent', label: t('table_parent'), width: 180 },
    { id: 'assessment', label: t('table_assessment'), width: 160 },
    { id: 'level', label: t('table_level'), width: 160 },
    { id: 'description', label: t('table_description'), width: 250 },
    { id: '', width: 100 },
  ];

  const table = useTable();
  const { skills, skillsLoading } = useGetSkills();
  const { assessments } = useGetAssessments();
  const { exams: allExams } = useGetExams();
  const { levels: allLevels } = useGetLevels();

  const [filterAssessment, setFilterAssessment] = useState(null);
  const [filterExam, setFilterExam] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Build reverse maps: skillId → assessment labels, skillId → level labels
  const skillAssessmentMap = useMemo(() => {
    const map = new Map();
    assessments.forEach((a) => {
      (a.skills || []).forEach((skill) => {
        const skillId = typeof skill === 'string' ? skill.split('/').pop() : skill?.id;
        if (!skillId) return;
        if (!map.has(skillId)) map.set(skillId, new Set());
        map.get(skillId).add(a.label);
      });
    });
    return map;
  }, [assessments]);

  // Build a lookup for level IRIs → label
  const levelLookup = useMemo(() => {
    const lookup = new Map();
    (allLevels || []).forEach((lvl) => {
      if (lvl.id) lookup.set(lvl.id, lvl.label);
      if (lvl['@id']) lookup.set(lvl['@id'], lvl.label);
    });
    return lookup;
  }, [allLevels]);

  const skillLevelMap = useMemo(() => {
    const map = new Map();
    (allExams || []).forEach((exam) => {
      let levelLabel = null;
      if (typeof exam.level === 'string') {
        // IRI string — resolve via lookup
        levelLabel = levelLookup.get(exam.level) || levelLookup.get(exam.level.split('/').pop());
      } else {
        levelLabel = exam.level?.label;
      }
      if (!levelLabel) return;
      (exam.skills || []).forEach((skill) => {
        const skillId = typeof skill === 'string' ? skill.split('/').pop() : skill?.id;
        if (!skillId) return;
        if (!map.has(skillId)) map.set(skillId, new Set());
        map.get(skillId).add(levelLabel);
      });
    });
    return map;
  }, [allExams, levelLookup]);

  // Fetch filtered skills by assessment
  const assessmentSkillsUrl = filterAssessment
    ? `/api/assessments/${filterAssessment.id}/skills`
    : '';
  const { data: assessmentSkillsData } = useSWR(assessmentSkillsUrl, fetcher, swrOptions);
  const assessmentSkillIds = useMemo(() => {
    if (!assessmentSkillsUrl) return null;
    return new Set(extractMembers(assessmentSkillsData).map((s) => s.id));
  }, [assessmentSkillsData, assessmentSkillsUrl]);

  // Fetch filtered skills by exam
  const examSkillsUrl = filterExam ? `/api/exams/${filterExam.id}/skills` : '';
  const { data: examSkillsData } = useSWR(examSkillsUrl, fetcher, swrOptions);
  const examSkillIds = useMemo(() => {
    if (!examSkillsUrl) return null;
    return new Set(extractMembers(examSkillsData).map((s) => s.id));
  }, [examSkillsData, examSkillsUrl]);

  // Filter exams by selected assessment
  const filteredExams = useMemo(() => {
    if (!filterAssessment) return allExams;
    return allExams.filter((exam) => {
      const assessmentIri = exam.assessment;
      if (typeof assessmentIri === 'string') {
        return assessmentIri.includes(filterAssessment.id);
      }
      return assessmentIri?.id === filterAssessment.id;
    });
  }, [allExams, filterAssessment]);

  // Apply filters
  const filteredSkills = useMemo(() => {
    let result = skills;
    if (assessmentSkillIds) {
      result = result.filter((s) => assessmentSkillIds.has(s.id));
    }
    if (examSkillIds) {
      result = result.filter((s) => examSkillIds.has(s.id));
    }
    return result;
  }, [skills, assessmentSkillIds, examSkillIds]);

  const handleFilterAssessment = useCallback(
    (newValue) => {
      setFilterAssessment(newValue);
      setFilterExam(null);
      table.onChangePage(null, 0);
    },
    [table]
  );

  const handleFilterExam = useCallback(
    (newValue) => {
      setFilterExam(newValue);
      table.onChangePage(null, 0);
    },
    [table]
  );

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`${endpoints.skill.details}/${deleteId}`);
      toast.success(t('delete_success'));
      await mutate(endpoints.skill.list, undefined, { revalidate: true });
    } catch (error) {
      console.error(error);
      toast.error(error?.message || t('delete_error'));
    } finally {
      setDeleteId(null);
    }
  }, [deleteId]);

  if (skillsLoading) {
    return (
      <DashboardContent>
        <LoadingScreen />
      </DashboardContent>
    );
  }

  const dataSliced = filteredSkills.slice(
    table.page * table.rowsPerPage,
    table.page * table.rowsPerPage + table.rowsPerPage
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('heading')}
        links={[
          { name: t('dashboard'), href: paths.dashboard.root },
          { name: t('heading') },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.skill.new}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            {t('new_button')}
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <SkillTableToolbar
          assessments={assessments}
          exams={filteredExams}
          filterAssessment={filterAssessment}
          filterExam={filterExam}
          onFilterAssessment={handleFilterAssessment}
          onFilterExam={handleFilterExam}
        />

        <TableContainer>
          <Scrollbar>
            <Table sx={{ minWidth: 640 }}>
              <TableHeadCustom headCells={TABLE_HEAD} />

              <TableBody>
                {!filteredSkills.length ? (
                  <TableRow>
                    <TableCell colSpan={TABLE_HEAD.length}>
                      <EmptyContent title={t('empty_title')} />
                    </TableCell>
                  </TableRow>
                ) : (
                  dataSliced.map((skill) => (
                    <SkillTableRow
                      key={skill.id || skill['@id']}
                      row={skill}
                      assessmentLabels={skillAssessmentMap.get(skill.id)}
                      levelLabels={skillLevelMap.get(skill.id)}
                      editHref={paths.dashboard.skill.edit(skill.id)}
                      onDelete={() => setDeleteId(skill.id)}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>

        <TablePaginationCustom
          page={table.page}
          count={filteredSkills.length}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title={t('delete_title')}
        content={t('delete_confirm')}
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            {t('delete_button')}
          </Button>
        }
      />
    </DashboardContent>
  );
}
