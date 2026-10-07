'use client';

import Papa from 'papaparse';
import { toast } from 'sonner';
import { mutate as globalMutate } from 'swr';
import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Step from '@mui/material/Step';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Stepper from '@mui/material/Stepper';
import TableRow from '@mui/material/TableRow';
import StepLabel from '@mui/material/StepLabel';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import TableContainer from '@mui/material/TableContainer';
import LinearProgress from '@mui/material/LinearProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import axiosInstance, { endpoints } from 'src/lib/axios';
import { useGetInstituteAssessments } from 'src/actions/espace-institut';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { useCurrentInstitute } from 'src/auth/hooks';

// ----------------------------------------------------------------------

const STEPS = ['Téléchargement du fichier', 'Vérification et preview', 'Import'];

const TYPE_ENDPOINTS = {
  mcq: endpoints.question.createMcq,
  fill_blank: endpoints.question.createFillBlank,
  ordering: endpoints.question.createOrdering,
  matching: endpoints.question.createMatching,
};

const SUPPORTED_TYPES = ['mcq', 'fill_blank', 'ordering', 'matching'];

const TYPE_LABELS = {
  mcq: 'QCM',
  fill_blank: 'Texte a trous',
  ordering: 'Ordonnancement',
  matching: 'Appariement',
};

// Required columns for base question
const BASE_COLUMNS = ['type', 'assessment_ref', 'level_label', 'label', 'text'];

// ----------------------------------------------------------------------

function parseChoices(row) {
  const choices = [];
  for (let i = 1; i <= 10; i += 1) {
    const text = row[`choice_${i}`]?.trim();
    if (!text) break;
    const weight = parseFloat(row[`choice_${i}_weight`] || '0');
    const feedback = row[`choice_${i}_feedback`]?.trim() || null;
    choices.push({ text, weight: Number.isNaN(weight) ? 0 : weight, feedback });
  }
  return choices;
}

function parseBlankSlots(row) {
  const slots = [];
  for (let i = 1; i <= 10; i += 1) {
    const answers = row[`blank_${i}_answers`]?.trim();
    if (!answers) break;
    slots.push({
      acceptedAnswers: answers.split('|').map((a) => a.trim()).filter(Boolean),
      caseSensitive: row[`blank_${i}_case_sensitive`]?.toLowerCase() === 'true',
      accentSensitive: row[`blank_${i}_accent_sensitive`]?.toLowerCase() === 'true',
    });
  }
  return slots;
}

function parseOrderingItems(row) {
  const items = [];
  for (let i = 1; i <= 20; i += 1) {
    const text = row[`item_${i}`]?.trim();
    if (!text) break;
    items.push({ text, correctPosition: i });
  }
  return items;
}

function parseMatchingPairs(row) {
  const pairs = [];
  for (let i = 1; i <= 20; i += 1) {
    const left = row[`pair_${i}_left`]?.trim();
    const right = row[`pair_${i}_right`]?.trim();
    if (!left || !right) break;
    pairs.push({ leftText: left, rightText: right });
  }
  return pairs;
}

function validateRow(row, index, assessmentMap, levelMap) {
  const errors = [];
  const rowNum = index + 2; // +2 because header = row 1, index starts at 0

  if (!row.type || !SUPPORTED_TYPES.includes(row.type.trim().toLowerCase())) {
    errors.push(`Ligne ${rowNum}: Type "${row.type}" invalide. Types supportés: ${SUPPORTED_TYPES.join(', ')}`);
  }

  if (!row.assessment_ref?.trim()) {
    errors.push(`Ligne ${rowNum}: assessment_ref manquant`);
  } else {
    const aRef = row.assessment_ref.trim();
    if (!assessmentMap[aRef] && !assessmentMap[aRef.toLowerCase()]) {
      errors.push(`Ligne ${rowNum}: Test "${aRef}" introuvable`);
    }
  }

  if (row.level_label?.trim() && Object.keys(levelMap).length > 0) {
    const lLabel = row.level_label.trim();
    if (!levelMap[lLabel] && !levelMap[lLabel.toLowerCase()]) {
      errors.push(`Ligne ${rowNum}: Niveau "${lLabel}" introuvable. Valeurs possibles: ${[...new Set(Object.keys(levelMap).filter((k) => k === k.toLowerCase()))].join(', ')}`);
    }
  }

  if (!row.label?.trim()) {
    errors.push(`Ligne ${rowNum}: label manquant`);
  }

  if (!row.text?.trim()) {
    errors.push(`Ligne ${rowNum}: text manquant`);
  }

  const type = row.type?.trim().toLowerCase();

  if (type === 'mcq') {
    const choices = parseChoices(row);
    if (choices.length < 2) {
      errors.push(`Ligne ${rowNum}: QCM doit avoir au moins 2 choix`);
    }
    const hasCorrect = choices.some((c) => c.weight > 0);
    if (!hasCorrect) {
      errors.push(`Ligne ${rowNum}: QCM doit avoir au moins un choix correct (weight > 0)`);
    }
  }

  if (type === 'fill_blank') {
    const slots = parseBlankSlots(row);
    if (slots.length === 0) {
      errors.push(`Ligne ${rowNum}: Texte à trous doit avoir au moins un blank_1_answers`);
    }
  }

  if (type === 'ordering') {
    const items = parseOrderingItems(row);
    if (items.length < 2) {
      errors.push(`Ligne ${rowNum}: Ordonnancement doit avoir au moins 2 items`);
    }
  }

  if (type === 'matching') {
    const pairs = parseMatchingPairs(row);
    if (pairs.length < 2) {
      errors.push(`Ligne ${rowNum}: Appariement doit avoir au moins 2 paires`);
    }
  }

  return errors;
}

function buildPayload(row, assessmentMap, levelMap) {
  const type = row.type.trim().toLowerCase();
  const aRef = row.assessment_ref.trim();
  const assessmentIri = assessmentMap[aRef] || assessmentMap[aRef.toLowerCase()];
  const lLabel = row.level_label?.trim();
  const levelIri = lLabel ? (levelMap[lLabel] || levelMap[lLabel.toLowerCase()]) : null;

  const base = {
    assessment: assessmentIri,
    level: levelIri,
    skills: [],
    label: row.label.trim(),
    text: row.text.trim(),
    instruction: row.instruction?.trim() || null,
    duration: row.duration ? Number(row.duration) : null,
    maxPoints: row.max_points ? Number(row.max_points) : null,
  };

  switch (type) {
    case 'mcq': {
      const isMultiple = row.is_multiple_answer?.toLowerCase() === 'true';
      return {
        ...base,
        isMultipleAnswer: isMultiple,
        shuffleChoices: row.shuffle_choices?.toLowerCase() !== 'false',
        choices: parseChoices(row),
      };
    }
    case 'fill_blank':
      return {
        ...base,
        blankSymbol: row.blank_symbol?.trim() || '___',
        blankSlots: parseBlankSlots(row),
      };
    case 'ordering':
      return {
        ...base,
        shuffleOnDisplay: row.shuffle_on_display?.toLowerCase() !== 'false',
        orderingItems: parseOrderingItems(row),
      };
    case 'matching':
      return {
        ...base,
        shuffleOnDisplay: row.shuffle_on_display?.toLowerCase() !== 'false',
        matchingPairs: parseMatchingPairs(row),
      };
    default:
      return null;
  }
}

// ======================================================================

export function QuestionImportForm() {
  const router = useRouter();
  const currentInstitute = useCurrentInstitute();
  const { assessments } = useGetInstituteAssessments(currentInstitute?.id);

  const [activeStep, setActiveStep] = useState(0);
  const [parsedRows, setParsedRows] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [fileName, setFileName] = useState('');

  // Import state
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState(null);

  // Build lookup maps from assessments
  const { assessmentMap, levelMap } = (() => {
    const aMap = {};
    const lMap = {};
    assessments.forEach((a) => {
      const ref = a.ref || a.label;
      const iri = a['@id'] || `/api/assessments/${a.id}`;
      // Index by ref AND label (case-insensitive)
      aMap[ref] = iri;
      aMap[ref.toLowerCase()] = iri;
      if (a.label && a.label !== ref) {
        aMap[a.label] = iri;
        aMap[a.label.toLowerCase()] = iri;
      }
      (a.levels || []).forEach((l) => {
        if (typeof l === 'object' && l.label) {
          const lIri = l['@id'] || `/api/levels/${l.id}`;
          lMap[l.label] = lIri;
          lMap[l.label.toLowerCase()] = lIri;
          // Also index by ref if available
          if (l.ref) {
            lMap[l.ref] = lIri;
            lMap[l.ref.toLowerCase()] = lIri;
          }
        }
      });
    });
    return { assessmentMap: aMap, levelMap: lMap };
  })();

  // Step 1 — file upload + parse
  const handleFileUpload = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setFileName(file.name);

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        encoding: 'UTF-8',
        complete: (results) => {
          const rows = results.data;

          if (!rows.length) {
            setValidationErrors(['Le fichier est vide']);
            setParsedRows([]);
            return;
          }

          // Check required columns
          const headers = Object.keys(rows[0]);
          const missingCols = BASE_COLUMNS.filter((c) => !headers.includes(c));
          if (missingCols.length > 0) {
            setValidationErrors([
              `Colonnes manquantes: ${missingCols.join(', ')}. Colonnes trouvées: ${headers.join(', ')}`,
            ]);
            setParsedRows([]);
            return;
          }

          // Validate rows
          const errors = [];
          rows.forEach((row, idx) => {
            errors.push(...validateRow(row, idx, assessmentMap, levelMap));
          });

          setParsedRows(rows);
          setValidationErrors(errors);
          setActiveStep(1);
        },
        error: (err) => {
          setValidationErrors([`Erreur de parsing CSV: ${err.message}`]);
          setParsedRows([]);
        },
      });
    },
    [assessmentMap, levelMap]
  );

  // Step 3 — import
  const handleImport = useCallback(async () => {
    setImporting(true);
    setImportProgress(0);
    setActiveStep(2);

    const results = { success: 0, errors: [] };
    const total = parsedRows.length;

    for (let i = 0; i < total; i += 1) {
      const row = parsedRows[i];
      const type = row.type.trim().toLowerCase();
      const payload = buildPayload(row, assessmentMap, levelMap);
      const endpoint = TYPE_ENDPOINTS[type];

      try {
         
        await axiosInstance.post(endpoint, payload);
        results.success += 1;
      } catch (error) {
        const msg = error?.response?.data?.['hydra:description']
          || error?.response?.data?.detail
          || error.message
          || 'Erreur inconnue';
        results.errors.push({ row: i + 2, label: row.label, error: msg });
      }

      setImportProgress(Math.round(((i + 1) / total) * 100));
    }

    setImportResults(results);
    setImporting(false);

    // Invalidate SWR cache so the questions list refreshes
    globalMutate((key) => typeof key === 'string' && key.includes('/api/questions'), undefined, { revalidate: true });

    if (results.errors.length === 0) {
      toast.success(`${results.success} questions importées avec succès !`);
    } else {
      toast.warning(`${results.success} importées, ${results.errors.length} erreurs`);
    }
  }, [parsedRows, assessmentMap, levelMap]);

  // ------ Renders ------

  const renderStep0 = () => (
    <Card>
      <CardContent>
        <Stack spacing={3}>
          <Typography variant="h6">Télécharger un fichier CSV</Typography>

          <Alert severity="info" sx={{ whiteSpace: 'pre-line' }}>
            {`Format attendu : fichier CSV (séparateur virgule ou point-virgule, encodage UTF-8).

Colonnes obligatoires : type, assessment_ref, level_label, label, text
Colonnes optionnelles : instruction, duration, max_points

Pour les QCM : choice_1, choice_1_weight, choice_1_feedback, choice_2, choice_2_weight, ... (jusqu'à 10)
  - weight = 1 pour réponse correcte, 0 pour incorrecte, 0.5 pour partielle
  - is_multiple_answer (true/false), shuffle_choices (true/false)

Pour Texte à trous : blank_symbol, blank_1_answers (séparées par |), blank_1_case_sensitive, blank_1_accent_sensitive

Pour Ordonnancement : item_1, item_2, ... (l'ordre dans le CSV = ordre correct)
  - shuffle_on_display (true/false)

Pour Appariement : pair_1_left, pair_1_right, pair_2_left, pair_2_right, ...
  - shuffle_on_display (true/false)`}
          </Alert>

          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              component="label"
              variant="contained"
              startIcon={<Iconify icon="mingcute:upload-2-line" />}
            >
              Choisir un fichier CSV
              <input
                type="file"
                accept=".csv"
                hidden
                onChange={handleFileUpload}
              />
            </Button>

            <Button
              variant="outlined"
              startIcon={<Iconify icon="mingcute:download-2-line" />}
              onClick={() => downloadTemplate()}
            >
              Télécharger le modèle CSV
            </Button>

            {fileName && (
              <Chip label={fileName} onDelete={() => { setFileName(''); setParsedRows([]); setValidationErrors([]); }} />
            )}
          </Stack>

          {/* Available assessments & levels */}
          <Alert severity="success" icon={false}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Tests disponibles (valeurs pour assessment_ref) :</Typography>
            {assessments.length === 0 ? (
              <Typography variant="body2">Aucun test. Créez-en un d&apos;abord.</Typography>
            ) : (
              <Stack spacing={1}>
                {assessments.map((a) => {
                  const levels = (a.levels || []).filter((l) => typeof l === 'object');
                  return (
                    <Box key={a.id || a['@id']}>
                      <Chip label={a.ref || a.label} size="small" color="primary" variant="outlined" />
                      {levels.length > 0 && (
                        <Typography variant="caption" sx={{ ml: 1 }}>
                          Niveaux : {levels.map((l) => l.ref || l.label).join(', ')}
                        </Typography>
                      )}
                    </Box>
                  );
                })}
              </Stack>
            )}
            {Object.keys(levelMap).length === 0 && assessments.length > 0 && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                Aucun niveau détecté sur vos assessments. La colonne level_label sera ignorée.
              </Alert>
            )}
          </Alert>
        </Stack>
      </CardContent>
    </Card>
  );

  const renderStep1 = () => (
    <Card>
      <CardContent>
        <Stack spacing={3}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">
              Preview — {parsedRows.length} question{parsedRows.length > 1 ? 's' : ''} détectée{parsedRows.length > 1 ? 's' : ''}
            </Typography>

            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                onClick={() => { setActiveStep(0); setParsedRows([]); setValidationErrors([]); setFileName(''); }}
              >
                Retour
              </Button>

              <Button
                variant="contained"
                color="primary"
                disabled={validationErrors.length > 0}
                startIcon={<Iconify icon="mingcute:upload-2-line" />}
                onClick={handleImport}
              >
                Lancer l&apos;import ({parsedRows.length} questions)
              </Button>
            </Stack>
          </Stack>

          {validationErrors.length > 0 && (
            <Alert severity="error">
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {validationErrors.length} erreur{validationErrors.length > 1 ? 's' : ''} — corrigez le CSV et re-uploadez
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                {validationErrors.slice(0, 20).map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
                {validationErrors.length > 20 && (
                  <li>... et {validationErrors.length - 20} autres erreurs</li>
                )}
              </Box>
            </Alert>
          )}

          {validationErrors.length === 0 && (
            <Alert severity="success">
              Toutes les lignes sont valides. Vous pouvez lancer l&apos;import.
            </Alert>
          )}

          <TableContainer>
            <Scrollbar>
              <Table size="small" sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Test</TableCell>
                    <TableCell>Niveau</TableCell>
                    <TableCell>Label</TableCell>
                    <TableCell>Détails</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {parsedRows.slice(0, 50).map((row, idx) => {
                    const type = row.type?.trim().toLowerCase();
                    return (
                      <TableRow key={idx}>
                        <TableCell>{idx + 2}</TableCell>
                        <TableCell>
                          <Chip label={TYPE_LABELS[type] || type} size="small" variant="soft" />
                        </TableCell>
                        <TableCell>{row.assessment_ref}</TableCell>
                        <TableCell>{row.level_label || '—'}</TableCell>
                        <TableCell sx={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row.label}
                        </TableCell>
                        <TableCell>
                          {type === 'mcq' && `${parseChoices(row).length} choix`}
                          {type === 'fill_blank' && `${parseBlankSlots(row).length} trou(s)`}
                          {type === 'ordering' && `${parseOrderingItems(row).length} items`}
                          {type === 'matching' && `${parseMatchingPairs(row).length} paires`}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {parsedRows.length > 50 && (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', fontStyle: 'italic' }}>
                        ... et {parsedRows.length - 50} autres lignes
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Scrollbar>
          </TableContainer>
        </Stack>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card>
      <CardContent>
        <Stack spacing={3}>
          <Typography variant="h6">
            {importing ? 'Import en cours...' : 'Import terminé'}
          </Typography>

          <Box>
            <LinearProgress
              variant="determinate"
              value={importProgress}
              sx={{ height: 10, borderRadius: 1 }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {importProgress}% — {importing ? 'Veuillez patienter...' : 'Terminé'}
            </Typography>
          </Box>

          {importResults && (
            <>
              <Alert severity={importResults.errors.length === 0 ? 'success' : 'warning'}>
                {importResults.success} question{importResults.success > 1 ? 's' : ''} importée{importResults.success > 1 ? 's' : ''} avec succès
                {importResults.errors.length > 0 &&
                  `, ${importResults.errors.length} erreur${importResults.errors.length > 1 ? 's' : ''}`}
              </Alert>

              {importResults.errors.length > 0 && (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Ligne</TableCell>
                        <TableCell>Label</TableCell>
                        <TableCell>Erreur</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {importResults.errors.map((err, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{err.row}</TableCell>
                          <TableCell>{err.label}</TableCell>
                          <TableCell sx={{ color: 'error.main' }}>{err.error}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  onClick={() => router.push(paths.dashboard.espaceInstitut.questions)}
                >
                  Voir la banque de questions
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setActiveStep(0);
                    setParsedRows([]);
                    setValidationErrors([]);
                    setFileName('');
                    setImportResults(null);
                    setImportProgress(0);
                  }}
                >
                  Nouvel import
                </Button>
              </Stack>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <Stack spacing={3}>
      <Stepper activeStep={activeStep} alternativeLabel>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {activeStep === 0 && renderStep0()}
      {activeStep === 1 && renderStep1()}
      {activeStep === 2 && renderStep2()}
    </Stack>
  );
}

// ----------------------------------------------------------------------

function downloadTemplate() {
  const headers = [
    'type', 'assessment_ref', 'level_label', 'label', 'text', 'instruction', 'duration', 'max_points',
    'is_multiple_answer', 'shuffle_choices',
    'choice_1', 'choice_1_weight', 'choice_1_feedback',
    'choice_2', 'choice_2_weight', 'choice_2_feedback',
    'choice_3', 'choice_3_weight', 'choice_3_feedback',
    'choice_4', 'choice_4_weight', 'choice_4_feedback',
    'blank_symbol', 'blank_1_answers', 'blank_1_case_sensitive', 'blank_1_accent_sensitive',
    'shuffle_on_display',
    'item_1', 'item_2', 'item_3', 'item_4',
    'pair_1_left', 'pair_1_right', 'pair_2_left', 'pair_2_right',
  ];

  const exampleRows = [
    ['mcq', 'TOEIC', 'B2', 'Vocabulaire - synonyme de "happy"', 'What is a synonym of "happy"?', '', '60', '1', 'false', 'true', 'Joyful', '1', '', 'Sad', '0', '', 'Angry', '0', '', 'Tired', '0', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['mcq', 'TOEIC', 'B1', 'Grammaire - past simple', 'She ___ to the store yesterday.', '', '30', '1', 'false', 'true', 'went', '1', '', 'go', '0', '', 'goes', '0', '', 'going', '0', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['fill_blank', 'TOEIC', 'A2', 'Conjugaison - present simple', 'She ___ to school every day.', '', '30', '1', '', '', '', '', '', '', '', '', '', '', '', '', '___', 'goes|goes to', 'false', 'false', '', '', '', '', '', '', '', '', ''],
    ['ordering', 'TOEIC', 'B1', 'Remettre la phrase en ordre', 'Remettez les mots dans le bon ordre', '', '45', '1', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'true', 'The', 'cat', 'sat', 'on', '', '', '', ''],
    ['matching', 'TOEIC', 'A2', 'Associer les contraires', 'Associez chaque mot a son contraire', '', '60', '2', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'true', '', '', '', '', 'hot', 'cold', 'big', 'small'],
  ];

  const csvContent = [
    headers.join(','),
    ...exampleRows.map((row) =>
      row.map((cell) => {
        if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'questions-import-template.csv';
  link.click();
  URL.revokeObjectURL(url);
}
