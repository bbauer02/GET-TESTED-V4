'use client';

import { toast } from 'sonner';
import { varAlpha } from 'minimal-shared/utils';
import { useBoolean } from 'minimal-shared/hooks';
import { useMemo, useState, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TableContainer from '@mui/material/TableContainer';
import LinearProgress from '@mui/material/LinearProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useGetQuestions } from 'src/actions/questions';
import axiosInstance, { endpoints } from 'src/lib/axios';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useTable, TableHeadCustom, TablePaginationCustom } from 'src/components/table';

import { useCurrentInstitute } from 'src/auth/hooks';

import { QuestionTableRow } from './question-table-row';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'label', label: 'Label' },
  { id: 'type', label: 'Type', width: 140 },
  { id: 'level', label: 'Niveau', width: 120 },
  { id: 'status', label: 'Statut', width: 120 },
  { id: 'points', label: 'Points', width: 80 },
  { id: 'timesAdministered', label: 'Passages', width: 100 },
  { id: 'successRate', label: 'Taux reussite', width: 120 },
  { id: '', width: 56 },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tous' },
  { value: 'DRAFT', label: 'Brouillon' },
  { value: 'PRETESTING', label: 'Pre-test' },
  { value: 'CALIBRATED', label: 'Calibree' },
  { value: 'RETIRED', label: 'Retiree' },
];

const TYPE_OPTIONS = [
  { value: 'all', label: 'Tous' },
  { value: 'mcq', label: 'QCM' },
  { value: 'fill_blank', label: 'Texte a trous' },
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

export function AssessmentQuestionBank({ assessmentId, assessmentLevels }) {
  const table = useTable();
  const router = useRouter();
  const currentInstitute = useCurrentInstitute();

  const isInstituteAdmin =
    currentInstitute?.membershipRole === 'ADMIN' || currentInstitute?.membershipRole === 'STAFF';
  const isTeacher = currentInstitute?.membershipRole === 'TEACHER';
  const canManage = isInstituteAdmin || isTeacher;

  // Filters state
  const [levelTab, setLevelTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // CSV import dialog
  const importDialog = useBoolean();

  // Confirm dialog state
  const confirmRetire = useBoolean();
  const confirmDelete = useBoolean();
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  // Fetch questions for this assessment
  const { questions, questionsLoading, questionsMutate } = useGetQuestions({
    assessment: assessmentId,
  });

  // ------ Level tabs ------

  const levelTabs = useMemo(() => {
    const tabs = [{ value: 'all', label: 'Tous', count: questions.length }];
    (assessmentLevels || []).forEach((level) => {
      const levelId = level.id || level['@id'];
      const levelLabel = level.label || level.ref || '?';
      const count = questions.filter((q) => {
        const qLevelId = q.level?.id || q.level?.['@id'] || q.level;
        return qLevelId === levelId || qLevelId === `/api/levels/${levelId}`;
      }).length;
      tabs.push({ value: levelId, label: levelLabel, count });
    });
    return tabs;
  }, [questions, assessmentLevels]);

  // ------ Stats for selected level ------

  const questionsForLevel = useMemo(() => {
    if (levelTab === 'all') return questions;
    return questions.filter((q) => {
      const qLevelId = q.level?.id || q.level?.['@id'] || q.level;
      return qLevelId === levelTab || qLevelId === `/api/levels/${levelTab}`;
    });
  }, [questions, levelTab]);

  const levelStats = useMemo(
    () => ({
      total: questionsForLevel.length,
      DRAFT: questionsForLevel.filter((q) => (q.status || 'DRAFT') === 'DRAFT').length,
      PRETESTING: questionsForLevel.filter((q) => q.status === 'PRETESTING').length,
      CALIBRATED: questionsForLevel.filter((q) => q.status === 'CALIBRATED').length,
      RETIRED: questionsForLevel.filter((q) => q.status === 'RETIRED').length,
    }),
    [questionsForLevel]
  );

  // ------ Filtered questions (level + status + type) ------

  const filteredQuestions = useMemo(() => {
    let result = questionsForLevel;

    if (statusFilter !== 'all') {
      result = result.filter((q) => (q.status || 'DRAFT') === statusFilter);
    }

    if (typeFilter !== 'all') {
      result = result.filter((q) => (q.type || q.questionType) === typeFilter);
    }

    return result;
  }, [questionsForLevel, statusFilter, typeFilter]);

  const dataSliced = filteredQuestions.slice(
    table.page * table.rowsPerPage,
    table.page * table.rowsPerPage + table.rowsPerPage
  );

  // ------ Resolve current level ID for the "New question" button ------

  const currentLevelId = levelTab !== 'all' ? levelTab : undefined;

  // ------ Handlers ------

  const handleLevelTabChange = useCallback(
    (_, value) => {
      setLevelTab(value);
      table.onChangePage(null, 0);
    },
    [table]
  );

  const handleStatusChange = useCallback(
    (e) => {
      setStatusFilter(e.target.value);
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
  const handleRetire = useCallback(async () => {
    if (!selectedQuestion) return;
    try {
      const qId = selectedQuestion.id || selectedQuestion['@id']?.split('/').pop();
      await axiosInstance.patch(`/api/questions/${qId}`, { status: 'RETIRED' });
      toast.success('Question retiree avec succes');
      questionsMutate();
    } catch (error) {
      toast.error(error.message || 'Erreur lors du retrait');
    } finally {
      confirmRetire.onFalse();
      setSelectedQuestion(null);
    }
  }, [selectedQuestion, questionsMutate, confirmRetire]);

  const handleDelete = useCallback(async () => {
    if (!selectedQuestion) return;
    try {
      const qId = selectedQuestion.id || selectedQuestion['@id']?.split('/').pop();
      await axiosInstance.delete(`/api/questions/${qId}`);
      toast.success('Question supprimee avec succes');
      questionsMutate();
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la suppression');
    } finally {
      confirmDelete.onFalse();
      setSelectedQuestion(null);
    }
  }, [selectedQuestion, questionsMutate, confirmDelete]);

  const handleImportSuccess = useCallback(() => {
    questionsMutate();
  }, [questionsMutate]);

  return (
    <>
      <Card>
        {/* ---- Tabs par niveau ---- */}
        <Tabs
          value={levelTab}
          onChange={handleLevelTabChange}
          sx={{
            px: 2.5,
            boxShadow: (theme) =>
              `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
          }}
        >
          {levelTabs.map((tab) => (
            <Tab
              key={tab.value}
              value={tab.value}
              label={tab.label}
              iconPosition="end"
              icon={
                <Label
                  variant={levelTab === tab.value ? 'filled' : 'soft'}
                  color={levelTab === tab.value ? 'primary' : 'default'}
                >
                  {tab.count}
                </Label>
              }
            />
          ))}
        </Tabs>

        {/* ---- Stats summary ---- */}
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ px: 2.5, py: 1.5, bgcolor: 'background.neutral' }}
          flexWrap="wrap"
        >
          <Chip
            icon={<Iconify icon="solar:document-bold" width={16} />}
            label={`${levelStats.total} questions`}
            size="small"
          />
          <Chip
            label={`${levelStats.CALIBRATED} calibrees`}
            size="small"
            color="success"
            variant="soft"
          />
          <Chip
            label={`${levelStats.PRETESTING} pre-test`}
            size="small"
            color="warning"
            variant="soft"
          />
          <Chip
            label={`${levelStats.DRAFT} brouillons`}
            size="small"
            color="default"
            variant="soft"
          />
          {levelStats.RETIRED > 0 && (
            <Chip
              label={`${levelStats.RETIRED} retirees`}
              size="small"
              color="error"
              variant="soft"
            />
          )}
        </Stack>

        {/* ---- Toolbar : filtres + actions ---- */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          sx={{ px: 2.5, py: 2 }}
          flexWrap="wrap"
        >
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Statut</InputLabel>
            <Select value={statusFilter} label="Statut" onChange={handleStatusChange}>
              {STATUS_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Type</InputLabel>
            <Select value={typeFilter} label="Type" onChange={handleTypeChange}>
              {TYPE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Stack direction="row" spacing={1} sx={{ ml: 'auto' }}>
            {canManage && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<Iconify icon="mdi:file-upload-outline" />}
                onClick={importDialog.onTrue}
              >
                Import CSV
              </Button>
            )}

            {canManage && (
              <Button
                component={RouterLink}
                href={paths.dashboard.espaceInstitut.questionNew(assessmentId, currentLevelId)}
                variant="contained"
                size="small"
                startIcon={<Iconify icon="mingcute:add-line" />}
              >
                Nouvelle question
              </Button>
            )}
          </Stack>
        </Stack>

        {/* ---- Table ---- */}
        <TableContainer>
          <Scrollbar>
            <Table sx={{ minWidth: 800 }}>
              <TableHeadCustom headCells={TABLE_HEAD} />

              <TableBody>
                {questionsLoading ? (
                  <TableRow>
                    <TableCell colSpan={TABLE_HEAD.length} sx={{ textAlign: 'center', py: 4 }}>
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : filteredQuestions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={TABLE_HEAD.length}>
                      <EmptyContent
                        title="Aucune question"
                        description="Ajoutez des questions pour constituer la banque de questions de ce test"
                        action={
                          canManage ? (
                            <Button
                              component={RouterLink}
                              href={paths.dashboard.espaceInstitut.questionNew(
                                assessmentId,
                                currentLevelId
                              )}
                              variant="contained"
                              startIcon={<Iconify icon="mingcute:add-line" />}
                              sx={{ mt: 2 }}
                            >
                              Creer une question
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
        content={`Voulez-vous vraiment retirer la question "${selectedQuestion?.label || ''}" ? Elle ne sera plus utilisee dans les futurs sujets.`}
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
        content={`Voulez-vous vraiment supprimer la question "${selectedQuestion?.label || ''}" ? Cette action est irreversible.`}
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Supprimer
          </Button>
        }
      />

      {/* ---- CSV Import Dialog ---- */}
      <ImportCsvDialog
        open={importDialog.value}
        onClose={importDialog.onFalse}
        assessmentId={assessmentId}
        assessmentLevels={assessmentLevels}
        onSuccess={handleImportSuccess}
      />
    </>
  );
}

// ======================================================================
// CSV Parser Utilities
// ======================================================================

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseCsv(text) {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { rows: [], errors: ["Le fichier est vide ou ne contient que l'en-tete"] };
  }

  const header = parseCSVLine(lines[0]);
  const rows = [];
  const errors = [];

  const VALID_TYPES = ['mcq', 'fill_blank', 'highlight', 'ordering', 'matching'];

  for (let i = 1; i < lines.length; i += 1) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    header.forEach((h, idx) => {
      row[h.trim()] = values[idx]?.trim() || '';
    });

    if (!row.type) errors.push(`Ligne ${i + 1}: type manquant`);
    else if (!VALID_TYPES.includes(row.type))
      errors.push(`Ligne ${i + 1}: type inconnu "${row.type}"`);
    if (!row.label) errors.push(`Ligne ${i + 1}: label manquant`);
    if (!row.text) errors.push(`Ligne ${i + 1}: text manquant`);

    rows.push(row);
  }

  return { rows, errors };
}

function getEndpointForType(type) {
  const map = {
    mcq: endpoints.question.createMcq,
    fill_blank: endpoints.question.createFillBlank,
    highlight: endpoints.question.createHighlight,
    ordering: endpoints.question.createOrdering,
    matching: endpoints.question.createMatching,
  };
  return map[type] || endpoints.question.createMcq;
}

function buildPayload(row, assessmentId, assessmentLevels) {
  const level = (assessmentLevels || []).find(
    (l) => l.label === row.level || l.ref === row.level
  );
  const levelIri = level ? level['@id'] || `/api/levels/${level.id}` : null;

  const base = {
    assessment: `/api/assessments/${assessmentId}`,
    level: levelIri,
    label: row.label,
    text: row.text,
    instruction: row.instruction || null,
    duration: row.duration ? parseInt(row.duration, 10) : null,
    maxPoints: row.maxPoints ? parseFloat(row.maxPoints) : 1,
    skills: [],
  };

  switch (row.type) {
    case 'mcq': {
      const choices = (row.answer_data || '')
        .split(';')
        .map((pair, idx) => {
          const [text, weight] = pair.split(':');
          return { text: text?.trim() || '', weight: parseFloat(weight) || 0, position: idx };
        })
        .filter((c) => c.text);
      return { ...base, isMultipleAnswer: false, shuffleChoices: true, choices };
    }

    case 'fill_blank': {
      const answers = (row.answer_data || '')
        .split(';')
        .map((a) => a.trim())
        .filter(Boolean);
      const blankSlots = answers.map((a, idx) => ({
        position: idx,
        acceptedAnswers: a.split('|').map((x) => x.trim()),
        caseSensitive: false,
        accentSensitive: false,
      }));
      return { ...base, blankSymbol: '___', blankSlots };
    }

    case 'ordering': {
      const items = (row.answer_data || '')
        .split(';')
        .map((text, idx) => ({
          text: text.trim(),
          correctPosition: idx,
        }))
        .filter((it) => it.text);
      return { ...base, shuffleOnDisplay: true, orderingItems: items };
    }

    case 'matching': {
      const pairs = (row.answer_data || '')
        .split(';')
        .map((pair, idx) => {
          const [left, right] = pair.split(':');
          return {
            leftText: left?.trim() || '',
            rightText: right?.trim() || '',
            position: idx,
          };
        })
        .filter((p) => p.leftText && p.rightText);
      return { ...base, shuffleOnDisplay: true, matchingPairs: pairs };
    }

    case 'highlight': {
      const zones = (row.answer_data || '')
        .split(';')
        .map((z) => {
          const [range, correct] = z.split(':');
          const [start, end] = (range || '').split('-');
          return {
            startIndex: parseInt(start, 10) || 0,
            endIndex: parseInt(end, 10) || 0,
            isCorrect: correct?.trim() === 'true',
          };
        });
      return { ...base, highlightZones: zones };
    }

    default:
      return base;
  }
}

function downloadTemplate() {
  const template = `type,label,text,instruction,duration,maxPoints,level,skills,answer_data
mcq,"Exemple QCM","Quelle est la capitale de la France ?","Choisissez la bonne reponse",60,1,B1,"geographie","Paris:1;Lyon:0;Marseille:0;Bordeaux:0"
fill_blank,"Exemple Texte a trous","Le ___ est la capitale de la France.","Completez le texte",30,1,A2,"geographie","Paris|paris"
ordering,"Exemple Ordonnancement","Remettez ces villes dans l'ordre alphabetique","Classez du premier au dernier",45,1,A1,"vocabulaire","Bordeaux;Lyon;Marseille;Paris"
matching,"Exemple Appariement","Associez chaque pays a sa capitale","Reliez les paires",60,2,B1,"geographie","France:Paris;Allemagne:Berlin;Espagne:Madrid"`;

  const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'questions_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ======================================================================
// CSV Import Dialog
// ======================================================================

const TYPE_LABELS_MAP = {
  mcq: 'QCM',
  fill_blank: 'Texte a trous',
  highlight: 'Surlignage',
  ordering: 'Ordonnancement',
  matching: 'Appariement',
};

function ImportCsvDialog({ open, onClose, assessmentId, assessmentLevels, onSuccess }) {
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState([]);
  const [errors, setErrors] = useState([]);
  const [importErrors, setImportErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const handleFileChange = useCallback((event) => {
    const f = event.target.files[0];
    if (!f) return;
    setFile(f);
    setImportErrors([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const result = parseCsv(text);
      setParsed(result.rows);
      setErrors(result.errors);
    };
    reader.readAsText(f);
  }, []);

  const handleImport = useCallback(async () => {
    setImporting(true);
    setProgress({ done: 0, total: parsed.length });
    setImportErrors([]);

    const errs = [];

    for (let i = 0; i < parsed.length; i += 1) {
      try {
        const row = parsed[i];
        const endpoint = getEndpointForType(row.type);
        const payload = buildPayload(row, assessmentId, assessmentLevels);
        await axiosInstance.post(endpoint, payload);
      } catch (err) {
        errs.push({ row: i + 1, error: err?.response?.data?.['hydra:description'] || err.message || 'Erreur inconnue' });
      }
      setProgress({ done: i + 1, total: parsed.length });
    }

    setImporting(false);
    setImportErrors(errs);

    if (errs.length === 0) {
      toast.success(`${parsed.length} questions importees avec succes`);
      onSuccess();
      handleReset();
      onClose();
    } else {
      toast.warning(
        `${parsed.length - errs.length}/${parsed.length} importees. ${errs.length} erreur(s).`
      );
      onSuccess();
    }
  }, [parsed, assessmentId, assessmentLevels, onSuccess, onClose]);

  const handleReset = useCallback(() => {
    setFile(null);
    setParsed([]);
    setErrors([]);
    setImportErrors([]);
    setProgress({ done: 0, total: 0 });
  }, []);

  const handleClose = useCallback(() => {
    if (!importing) {
      handleReset();
      onClose();
    }
  }, [importing, handleReset, onClose]);

  const canImport = parsed.length > 0 && errors.length === 0 && !importing;
  const previewRows = parsed.slice(0, 10);
  const progressPercent = progress.total > 0 ? (progress.done / progress.total) * 100 : 0;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Import CSV de questions</Typography>
          <Button
            variant="text"
            size="small"
            startIcon={<Iconify icon="mdi:download" />}
            onClick={downloadTemplate}
          >
            Telecharger le modele CSV
          </Button>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        {/* File input */}
        <Box sx={{ mb: 3 }}>
          <Button variant="outlined" component="label" startIcon={<Iconify icon="mdi:file-upload-outline" />}>
            {file ? file.name : 'Choisir un fichier CSV'}
            <input
              type="file"
              accept=".csv,text/csv"
              hidden
              onChange={handleFileChange}
              disabled={importing}
            />
          </Button>
        </Box>

        {/* Format help */}
        {!file && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              Format CSV attendu
            </Typography>
            <Typography variant="body2" component="div">
              Colonnes : <code>type, label, text, instruction, duration, maxPoints, level, skills, answer_data</code>
              <br />
              Types supportes : <code>mcq</code>, <code>fill_blank</code>, <code>highlight</code>,{' '}
              <code>ordering</code>, <code>matching</code>
              <br />
              Format answer_data par type :
              <br />
              - QCM : <code>choix1:1;choix2:0;choix3:0</code> (texte:poids)
              <br />
              - Texte a trous : <code>reponse1|alternative1;reponse2</code> (pipe = alternatives, point-virgule = trous)
              <br />
              - Ordonnancement : <code>item1;item2;item3</code> (dans l&apos;ordre correct)
              <br />
              - Appariement : <code>gauche1:droite1;gauche2:droite2</code>
              <br />- Surlignage : <code>debut-fin:true;debut-fin:false</code>
            </Typography>
          </Alert>
        )}

        {/* Validation errors */}
        {errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              Erreurs de validation ({errors.length})
            </Typography>
            {errors.map((err, idx) => (
              <Typography key={idx} variant="body2">
                {err}
              </Typography>
            ))}
          </Alert>
        )}

        {/* Import errors */}
        {importErrors.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              Erreurs d&apos;import ({importErrors.length})
            </Typography>
            {importErrors.map((err, idx) => (
              <Typography key={idx} variant="body2">
                Ligne {err.row} : {err.error}
              </Typography>
            ))}
          </Alert>
        )}

        {/* Progress bar */}
        {importing && (
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
              <Typography variant="body2">Import en cours...</Typography>
              <Typography variant="body2">
                {progress.done}/{progress.total}
              </Typography>
            </Stack>
            <LinearProgress variant="determinate" value={progressPercent} />
          </Box>
        )}

        {/* Preview table */}
        {previewRows.length > 0 && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Apercu ({parsed.length} question{parsed.length > 1 ? 's' : ''})
              {parsed.length > 10 && ` - 10 premieres lignes affichees`}
            </Typography>

            <TableContainer sx={{ maxHeight: 400, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', minWidth: 40 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', minWidth: 100 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', minWidth: 150 }}>Label</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', minWidth: 80 }}>Niveau</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', minWidth: 60 }}>Points</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', minWidth: 200 }}>answer_data</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewRows.map((row, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>
                        <Label variant="soft" color="primary">
                          {TYPE_LABELS_MAP[row.type] || row.type || '-'}
                        </Label>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row.label || '-'}
                      </TableCell>
                      <TableCell>{row.level || '-'}</TableCell>
                      <TableCell>{row.maxPoints || '-'}</TableCell>
                      <TableCell sx={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row.answer_data || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={importing} color="inherit">
          Fermer
        </Button>

        {file && (
          <Button onClick={handleReset} disabled={importing} color="inherit">
            Reinitialiser
          </Button>
        )}

        <Button
          variant="contained"
          onClick={handleImport}
          disabled={!canImport}
          startIcon={<Iconify icon="mdi:file-import-outline" />}
        >
          Importer {parsed.length > 0 ? `(${parsed.length})` : ''}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
