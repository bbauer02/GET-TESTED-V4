'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import LoadingButton from '@mui/lab/LoadingButton';

import { fDateTime } from 'src/utils/format-time';

import axios from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { CustomPopover } from 'src/components/custom-popover';

import { useGetAssessmentExams } from 'src/actions/exam';
import { getErrorMessage } from 'src/auth/utils/error-message';

// ----------------------------------------------------------------------

export function SessionScheduledExams({ session, membres, onMutate }) {
  const scheduledExams = session.scheduledExams || [];
  const canEdit = session.status === 'DRAFT' || session.status === 'OPEN';
  const canDelete = session.status === 'DRAFT';

  // Fetch assessment exams to detect missing scheduled exams
  const { exams: assessmentExams } = useGetAssessmentExams(session.assessment?.id);

  // Find required exams (non-option) that are not yet scheduled
  const scheduledExamIds = new Set(
    scheduledExams.map((se) => {
      const exam = se.exam;
      if (!exam) return null;
      return exam.id || exam['@id'];
    }).filter(Boolean)
  );

  const missingExams = assessmentExams.filter((exam) => {
    const examId = exam.id || exam['@id'];
    const examIri = exam['@id'] || `/api/exams/${exam.id}`;
    return !scheduledExamIds.has(examId) && !scheduledExamIds.has(examIri) && !exam.isOption;
  });

  const requiredExams = assessmentExams.filter((e) => !e.isOption);
  const totalRequired = requiredExams.length;
  const scheduledCount = totalRequired - missingExams.length;

  const formDialog = useBoolean();
  const [editingExam, setEditingExam] = useState(null);
  const [preselectedExam, setPreselectedExam] = useState(null);

  const handleAdd = useCallback((exam = null) => {
    setEditingExam(null);
    setPreselectedExam(exam);
    formDialog.onTrue();
  }, [formDialog]);

  const handleEdit = useCallback(
    (se) => {
      setEditingExam(se);
      formDialog.onTrue();
    },
    [formDialog]
  );

  const handleDelete = useCallback(
    async (scheduledExamId) => {
      try {
        await axios.delete(`/api/scheduled-exams/${scheduledExamId}`);
        toast.success('Épreuve supprimée');
        onMutate();
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    },
    [onMutate]
  );

  const handleFormSuccess = useCallback(() => {
    formDialog.onFalse();
    setEditingExam(null);
    setPreselectedExam(null);
    onMutate();
  }, [formDialog, onMutate]);

  return (
    <>
      <Card>
        <CardHeader
          title="Épreuves planifiées"
          subheader={
            totalRequired > 0
              ? `${scheduledCount} / ${totalRequired} obligatoire(s) planifiée(s)`
              : `${scheduledExams.length} épreuve(s)`
          }
          action={
            canEdit && (
              <Tooltip title="Ajouter une épreuve">
                <IconButton color="primary" onClick={() => handleAdd()}>
                  <Iconify icon="mingcute:add-line" />
                </IconButton>
              </Tooltip>
            )
          }
        />

        <Stack spacing={2} sx={{ p: 3 }}>
          {/* Scheduled exams */}
          {scheduledExams.map((se) => (
            <ScheduledExamCard
              key={se.id || se['@id']}
              scheduledExam={se}
              canEdit={canEdit}
              canDelete={canDelete}
              onEdit={() => handleEdit(se)}
              onDelete={() => handleDelete(se.id)}
            />
          ))}

          {/* Empty slots for missing required exams */}
          {missingExams.map((exam) => (
            <Box
              key={exam.id || exam['@id']}
              onClick={canEdit ? () => handleAdd(exam) : undefined}
              sx={{
                p: 2,
                borderRadius: 1.5,
                border: '2px dashed',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: canEdit ? 'pointer' : 'default',
                transition: (theme) => theme.transitions.create(['border-color', 'background-color']),
                '&:hover': canEdit
                  ? { borderColor: 'primary.main', bgcolor: 'action.hover' }
                  : {},
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Iconify
                  icon="solar:add-circle-bold-duotone"
                  width={24}
                  sx={{ color: 'text.disabled' }}
                />
                <Box>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                    {exam.label}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    {[
                      exam.duration && `${exam.duration} min`,
                      exam.isWritten && 'Écrit',
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'Non planifiée'}
                  </Typography>
                </Box>
              </Stack>

              {canEdit && (
                <Chip label="A planifier" size="small" color="warning" variant="soft" />
              )}
            </Box>
          ))}

          {/* Empty state when no exams at all */}
          {scheduledExams.length === 0 && missingExams.length === 0 && (
            <EmptyContent
              title="Aucune épreuve planifiée"
              description={canEdit ? 'Ajoutez des épreuves pour organiser cette session' : undefined}
            />
          )}
        </Stack>
      </Card>

      {formDialog.value && (
        <ScheduledExamFormDialog
          open
          onClose={() => {
            formDialog.onFalse();
            setEditingExam(null);
            setPreselectedExam(null);
          }}
          session={session}
          scheduledExam={editingExam}
          preselectedExam={preselectedExam}
          scheduledExamIds={scheduledExamIds}
          membres={membres}
          onSuccess={handleFormSuccess}
        />
      )}
    </>
  );
}

// ----------------------------------------------------------------------

function ScheduledExamCard({ scheduledExam, canEdit, canDelete, onEdit, onDelete }) {
  const popover = usePopover();
  const se = scheduledExam;

  const addressParts = [
    se.address?.address1,
    se.address?.address2,
    [se.address?.zipcode, se.address?.city].filter(Boolean).join(' '),
  ].filter(Boolean);

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 1.5,
        bgcolor: 'background.neutral',
        position: 'relative',
      }}
    >
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle2">{se.exam?.label || '—'}</Typography>

          <Stack spacing={0.5} sx={{ mt: 1 }}>
            {se.startDate && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <Iconify icon="solar:calendar-bold" width={16} sx={{ color: 'text.secondary' }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {fDateTime(se.startDate)}
                </Typography>
              </Stack>
            )}

            {se.room && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <Iconify icon="solar:home-bold" width={16} sx={{ color: 'text.secondary' }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Salle {se.room}
                </Typography>
              </Stack>
            )}

            {addressParts.length > 0 && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <Iconify icon="mingcute:location-fill" width={16} sx={{ color: 'text.secondary' }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {addressParts.join(', ')}
                </Typography>
              </Stack>
            )}

            {se.exam?.duration && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <Iconify icon="solar:clock-circle-bold" width={16} sx={{ color: 'text.secondary' }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {se.exam.duration} min
                </Typography>
              </Stack>
            )}
          </Stack>

          {se.examinators?.length > 0 && (
            <Stack direction="row" spacing={0.5} sx={{ mt: 1.5 }} flexWrap="wrap">
              {se.examinators.map((examinator) => {
                const name =
                  typeof examinator === 'string'
                    ? examinator
                    : [examinator.firstname, examinator.lastname].filter(Boolean).join(' ') || '?';
                return (
                  <Chip
                    key={examinator.id || examinator}
                    label={name}
                    size="small"
                    variant="outlined"
                    icon={<Iconify icon="solar:user-bold" width={14} />}
                  />
                );
              })}
            </Stack>
          )}
        </Box>

        {(canEdit || canDelete) && (
          <IconButton size="small" onClick={popover.onOpen} sx={{ mt: -0.5, mr: -0.5 }}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        )}
      </Stack>

      <CustomPopover open={popover.open} anchorEl={popover.anchorEl} onClose={popover.onClose}>
        <MenuList>
          {canEdit && (
            <MenuItem
              onClick={() => {
                popover.onClose();
                onEdit();
              }}
            >
              <Iconify icon="solar:pen-bold" />
              Modifier
            </MenuItem>
          )}
          {canDelete && (
            <MenuItem
              onClick={() => {
                popover.onClose();
                onDelete();
              }}
              sx={{ color: 'error.main' }}
            >
              <Iconify icon="solar:trash-bin-trash-bold" />
              Supprimer
            </MenuItem>
          )}
        </MenuList>
      </CustomPopover>
    </Box>
  );
}

// ----------------------------------------------------------------------

function ScheduledExamFormDialog({ open, onClose, session, scheduledExam, preselectedExam, scheduledExamIds, membres, onSuccess }) {
  const isEdit = !!scheduledExam;

  const { exams: allExams, examsLoading } = useGetAssessmentExams(session.assessment?.id);

  // Filter out already-scheduled exams (except current one when editing)
  const exams = allExams.filter((exam) => {
    const examId = exam.id || exam['@id'];
    const examIri = exam['@id'] || `/api/exams/${exam.id}`;
    if (isEdit && (scheduledExam.exam?.id === exam.id)) return true;
    return !scheduledExamIds.has(examId) && !scheduledExamIds.has(examIri);
  });

  // Form state — preselect exam if provided (from empty slot click)
  const [selectedExam, setSelectedExam] = useState(
    isEdit ? (scheduledExam.exam || null) : (preselectedExam || null)
  );
  const [startDate, setStartDate] = useState(
    isEdit && scheduledExam.startDate
      ? scheduledExam.startDate.slice(0, 16) // format for datetime-local input
      : ''
  );
  const [room, setRoom] = useState(isEdit ? scheduledExam.room || '' : '');
  const [address1, setAddress1] = useState(isEdit ? scheduledExam.address?.address1 || '' : '');
  const [address2, setAddress2] = useState(isEdit ? scheduledExam.address?.address2 || '' : '');
  const [zipcode, setZipcode] = useState(isEdit ? scheduledExam.address?.zipcode || '' : '');
  const [city, setCity] = useState(isEdit ? scheduledExam.address?.city || '' : '');
  const [selectedExaminators, setSelectedExaminators] = useState(() => {
    if (!isEdit || !scheduledExam.examinators?.length) return [];
    return scheduledExam.examinators.map((e) =>
      typeof e === 'string' ? e : e
    );
  });
  const [submitting, setSubmitting] = useState(false);

  // Membres qui peuvent être examinateurs (TEACHER, ADMIN)
  const examinatorOptions = (membres || []).filter(
    (m) => m.role === 'ADMIN' || m.role === 'TEACHER'
  );

  const handleSubmit = useCallback(async () => {
    if (!selectedExam || !startDate) {
      toast.error('L\'épreuve et la date sont requises');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        exam: `/api/exams/${selectedExam.id}`,
        startDate: new Date(startDate).toISOString(),
        room: room || null,
        address: {
          address1: address1 || null,
          address2: address2 || null,
          zipcode: zipcode || null,
          city: city || null,
        },
        examinators: selectedExaminators.map((e) => `/api/users/${e.user?.id || e.id}`),
      };

      if (isEdit) {
        await axios.patch(`/api/scheduled-exams/${scheduledExam.id}`, payload, {
          headers: { 'Content-Type': 'application/merge-patch+json' },
        });
        toast.success('Épreuve modifiée');
      } else {
        await axios.post(`/api/sessions/${session.id}/scheduled-exams`, payload);
        toast.success('Épreuve ajoutée');
      }
      onSuccess();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }, [selectedExam, startDate, room, address1, address2, zipcode, city, selectedExaminators, isEdit, scheduledExam, session.id, onSuccess]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Modifier l\'épreuve' : 'Ajouter une épreuve'}</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {/* Épreuve */}
          <Autocomplete
            options={exams}
            loading={examsLoading}
            getOptionLabel={(option) => option.label || ''}
            value={selectedExam}
            onChange={(_, value) => setSelectedExam(value)}
            isOptionEqualToValue={(option, value) => option.id === value?.id}
            renderInput={(params) => (
              <TextField {...params} label="Épreuve *" placeholder="Sélectionner une épreuve" />
            )}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <Box>
                  <Typography variant="subtitle2">{option.label}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {[
                      option.duration && `${option.duration} min`,
                      option.isWritten && 'Écrit',
                      option.isOption && 'Option',
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Typography>
                </Box>
              </li>
            )}
          />

          {/* Date */}
          <TextField
            label="Date et heure *"
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          {/* Salle */}
          <TextField
            label="Salle"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="Ex: A101"
          />

          {/* Adresse */}
          <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
            Adresse (optionnel)
          </Typography>

          <TextField
            label="Adresse"
            value={address1}
            onChange={(e) => setAddress1(e.target.value)}
            placeholder="123 Rue de la Paix"
          />

          <TextField
            label="Complément"
            value={address2}
            onChange={(e) => setAddress2(e.target.value)}
            placeholder="Bâtiment B, Étage 2"
          />

          <Stack direction="row" spacing={2}>
            <TextField
              label="Code postal"
              value={zipcode}
              onChange={(e) => setZipcode(e.target.value)}
              sx={{ flex: 1 }}
            />
            <TextField
              label="Ville"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              sx={{ flex: 2 }}
            />
          </Stack>

          {/* Examinateurs */}
          <Autocomplete
            multiple
            options={examinatorOptions}
            getOptionLabel={(option) => {
              const u = option.user || option;
              return [u.firstname, u.lastname].filter(Boolean).join(' ') || u.email || '—';
            }}
            value={selectedExaminators}
            onChange={(_, value) => setSelectedExaminators(value)}
            isOptionEqualToValue={(option, value) => {
              const oId = option.user?.id || option.id;
              const vId = value.user?.id || value.id;
              return oId === vId;
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Examinateurs"
                placeholder="Sélectionner des examinateurs"
              />
            )}
            renderOption={(props, option) => {
              const u = option.user || option;
              const name = [u.firstname, u.lastname].filter(Boolean).join(' ') || '—';
              return (
                <li {...props} key={option.id || option['@id']}>
                  <Box>
                    <Typography variant="subtitle2">{name}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {option.role} {u.email && `· ${u.email}`}
                    </Typography>
                  </Box>
                </li>
              );
            }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const u = option.user || option;
                const name = [u.firstname, u.lastname].filter(Boolean).join(' ') || '—';
                return (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.id || option['@id']}
                    label={name}
                    size="small"
                  />
                );
              })
            }
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          Annuler
        </Button>
        <LoadingButton variant="contained" loading={submitting} onClick={handleSubmit}>
          {isEdit ? 'Enregistrer' : 'Ajouter'}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
