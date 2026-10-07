'use client';

import dayjs from 'dayjs';
import { toast } from 'sonner';
import { varAlpha } from 'minimal-shared/utils';
import { useMemo, useState, useCallback } from 'react';
import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import TextField from '@mui/material/TextField';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fDateTime } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';
import axios, { normalizeExam } from 'src/lib/axios';
import { useGetAssessmentExams } from 'src/actions/exam';
import { useGetInstituteFiche } from 'src/actions/espace-institut';
import { getExamCenterIri, useGetExamCenters, deleteScheduledExam } from 'src/actions/session-management';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomPopover } from 'src/components/custom-popover';

import { useCurrentInstitute } from 'src/auth/hooks';
import { getErrorMessage } from 'src/auth/utils/error-message';

import { ExamCenterDialog } from './exam-center-dialog';

// ----------------------------------------------------------------------

const ADDRESS_MODE_INSTITUTE = 'institute';
const ADDRESS_MODE_OTHER = 'other';

function toId(value) {
  if (!value) return null;
  if (typeof value === 'object') return value.id || toId(value['@id']);
  return String(value).split('/').pop();
}

function examKey(exam) {
  return toId(exam);
}

function formatAddress(address) {
  if (!address) return '';
  return [
    address.address1,
    address.address2,
    [address.zipcode, address.city].filter(Boolean).join(' '),
  ]
    .filter(Boolean)
    .join(', ');
}

function isSameAddress(a, b) {
  if (!a || !b) return false;
  return ['address1', 'address2', 'zipcode', 'city'].every(
    (key) => (a[key] || '') === (b[key] || '')
  );
}

function isDayInRange(day, start, end) {
  if (!day) return false;
  if (start && day.isBefore(start, 'day')) return false;
  if (end && day.isAfter(end, 'day')) return false;
  return true;
}

// ----------------------------------------------------------------------

export function SessionScheduledExams({ session, membres, onMutate }) {
  const { t } = useTranslate('institute_space');
  const { t: tm } = useTranslate('session_management');
  const currentInstitute = useCurrentInstitute();

  const scheduledExams = session.scheduledExams || [];
  const canEdit = session.status === 'DRAFT' || session.status === 'OPEN';
  const canEditExaminators = session.status !== 'CANCELLED';
  const canDelete = session.status === 'DRAFT';

  const instituteId = toId(session.institute) || currentInstitute?.id;
  const { institute } = useGetInstituteFiche(instituteId);
  const instituteAddress = session.institute?.address || institute?.address || null;

  // Exams of the test: API list, fallback on the (enriched) session payload
  const { exams: fetchedExams } = useGetAssessmentExams(session.assessment?.id);
  const assessmentExams = useMemo(() => {
    if (fetchedExams.length) return fetchedExams;
    return (session.assessment?.exams || []).map(normalizeExam);
  }, [fetchedExams, session.assessment?.exams]);

  const scheduledExamIds = useMemo(
    () => new Set(scheduledExams.map((se) => examKey(se.exam)).filter(Boolean)),
    [scheduledExams]
  );

  const { missingRequiredExams, availableOptionalExams, totalRequired } = useMemo(() => {
    const required = assessmentExams.filter((e) => !e.isOption);
    const optional = assessmentExams.filter((e) => e.isOption);
    return {
      totalRequired: required.length,
      missingRequiredExams: required.filter((e) => !scheduledExamIds.has(examKey(e))),
      availableOptionalExams: optional.filter((e) => !scheduledExamIds.has(examKey(e))),
    };
  }, [assessmentExams, scheduledExamIds]);

  const scheduledCount = totalRequired - missingRequiredExams.length;

  // Form dialog
  const formDialog = useBoolean();
  const [editingExam, setEditingExam] = useState(null);
  const [preselectedExam, setPreselectedExam] = useState(null);

  const handleAdd = useCallback(
    (exam = null) => {
      setEditingExam(null);
      setPreselectedExam(exam);
      formDialog.onTrue();
    },
    [formDialog]
  );

  const handleEdit = useCallback(
    (se) => {
      setEditingExam(se);
      formDialog.onTrue();
    },
    [formDialog]
  );

  const handleFormSuccess = useCallback(() => {
    formDialog.onFalse();
    setEditingExam(null);
    setPreselectedExam(null);
    onMutate();
  }, [formDialog, onMutate]);

  // Delete flow
  const confirmDelete = useBoolean();
  const [examToDelete, setExamToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const countEnrolledOnExam = useCallback(
    (se) => {
      const seId = toId(se);
      return (session.enrollments || []).filter((enrollment) =>
        (enrollment.enrollmentExams || []).some((ee) => toId(ee.scheduledExam) === seId)
      ).length;
    },
    [session.enrollments]
  );

  const handleAskDelete = useCallback(
    (se) => {
      if (countEnrolledOnExam(se) > 0) {
        toast.error(tm('exam_delete_conflict'));
        return;
      }
      setExamToDelete(se);
      confirmDelete.onTrue();
    },
    [confirmDelete, countEnrolledOnExam, tm]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!examToDelete) return;
    setDeleting(true);
    try {
      await deleteScheduledExam(toId(examToDelete));
      toast.success(tm('exam_deleted'));
      confirmDelete.onFalse();
      setExamToDelete(null);
      onMutate();
    } catch (error) {
      const message = getErrorMessage(error) || '';
      if (/409|conflict|inscrit|enrol/i.test(message)) {
        toast.error(tm('exam_delete_conflict'));
      } else {
        toast.error(message);
      }
    } finally {
      setDeleting(false);
    }
  }, [examToDelete, confirmDelete, onMutate, tm]);

  const showPlanningCard =
    missingRequiredExams.length > 0 || (canEdit && availableOptionalExams.length > 0);

  const renderExamToSchedule = (exam, isOptional) => (
    <Stack
      key={examKey(exam)}
      direction="row"
      alignItems="center"
      spacing={1.5}
      sx={{
        p: 1.5,
        borderRadius: 1.5,
        bgcolor: 'background.paper',
        border: (theme) => `solid 1px ${theme.vars.palette.divider}`,
      }}
    >
      <Iconify
        icon={isOptional ? 'solar:star-bold-duotone' : 'solar:danger-triangle-bold-duotone'}
        width={22}
        sx={{ color: isOptional ? 'info.main' : 'warning.main', flexShrink: 0 }}
      />
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" noWrap>
          {exam.label}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {[
            exam.duration && tm('duration_min', { count: exam.duration }),
            exam.isWritten != null && (exam.isWritten ? tm('written') : tm('oral')),
            isOptional ? tm('optional') : tm('mandatory'),
          ]
            .filter(Boolean)
            .join(' · ')}
        </Typography>
      </Box>
      {canEdit && (
        <Button
          size="small"
          variant={isOptional ? 'outlined' : 'contained'}
          color={isOptional ? 'inherit' : 'warning'}
          startIcon={<Iconify icon="solar:calendar-add-bold" width={16} />}
          onClick={() => handleAdd(exam)}
        >
          {tm('schedule')}
        </Button>
      )}
    </Stack>
  );

  return (
    <>
      {showPlanningCard && (
        <Card
          sx={{
            mb: 3,
            borderLeft: (theme) =>
              `4px solid ${
                missingRequiredExams.length ? theme.vars.palette.warning.main : theme.vars.palette.info.main
              }`,
          }}
        >
          {missingRequiredExams.length > 0 && (
            <Box sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                <Iconify icon="solar:clock-circle-bold" width={22} sx={{ color: 'warning.main' }} />
                <Typography variant="h6">{tm('exams_to_schedule_title')}</Typography>
                <Label color="warning" variant="soft">
                  {missingRequiredExams.length}
                </Label>
              </Stack>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                {tm('exams_to_schedule_desc')}
              </Typography>
              <Stack spacing={1.5}>
                {missingRequiredExams.map((exam) => renderExamToSchedule(exam, false))}
              </Stack>
            </Box>
          )}

          {missingRequiredExams.length > 0 && canEdit && availableOptionalExams.length > 0 && (
            <Divider />
          )}

          {canEdit && availableOptionalExams.length > 0 && (
            <Box sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                <Iconify icon="solar:star-bold" width={22} sx={{ color: 'info.main' }} />
                <Typography variant="h6">{tm('optional_exams_title')}</Typography>
                <Label color="info" variant="soft">
                  {availableOptionalExams.length}
                </Label>
              </Stack>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                {tm('optional_exams_desc')}
              </Typography>
              <Stack spacing={1.5}>
                {availableOptionalExams.map((exam) => renderExamToSchedule(exam, true))}
              </Stack>
            </Box>
          )}
        </Card>
      )}

      <Card>
        <CardHeader
          title={t('scheduled_exams')}
          subheader={
            totalRequired > 0
              ? t('mandatory_scheduled', { scheduled: scheduledCount, total: totalRequired })
              : t('exams_count_simple', { count: scheduledExams.length })
          }
          action={
            canEdit && (
              <Tooltip title={t('add_exam')}>
                <IconButton color="primary" onClick={() => handleAdd()}>
                  <Iconify icon="mingcute:add-line" />
                </IconButton>
              </Tooltip>
            )
          }
        />

        <Stack spacing={2} sx={{ p: 3 }}>
          {scheduledExams.map((se) => (
            <ScheduledExamCard
              key={se.id || se['@id']}
              scheduledExam={se}
              canEdit={canEdit}
              canEditExaminators={canEditExaminators}
              canDelete={canDelete}
              onEdit={() => handleEdit(se)}
              onDelete={() => handleAskDelete(se)}
            />
          ))}

          {scheduledExams.length === 0 && (
            <EmptyContent
              title={t('no_scheduled_exam')}
              description={canEdit ? t('no_scheduled_exam_desc') : undefined}
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
          instituteId={instituteId}
          instituteAddress={instituteAddress}
          assessmentExams={assessmentExams}
          scheduledExam={editingExam}
          preselectedExam={preselectedExam}
          scheduledExamIds={scheduledExamIds}
          membres={membres}
          onSuccess={handleFormSuccess}
        />
      )}

      <ConfirmDialog
        open={confirmDelete.value}
        onClose={() => {
          confirmDelete.onFalse();
          setExamToDelete(null);
        }}
        title={t('delete')}
        content={examToDelete?.exam?.label || ''}
        action={
          <LoadingButton
            variant="contained"
            color="error"
            loading={deleting}
            onClick={handleConfirmDelete}
          >
            {t('delete')}
          </LoadingButton>
        }
      />
    </>
  );
}

// ----------------------------------------------------------------------

function ScheduledExamCard({ scheduledExam, canEdit, canEditExaminators, canDelete, onEdit, onDelete }) {
  const { t } = useTranslate('institute_space');
  const popover = usePopover();
  const router = useRouter();
  const se = scheduledExam;
  const showMenu = canEdit || canDelete || (!canEdit && canEditExaminators);

  const addressText = formatAddress(se.address || se.examCenter?.address);

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
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="subtitle2">{se.exam?.label || '—'}</Typography>
            {se.exam?.isOption && (
              <Label color="info" variant="soft">
                {t('option')}
              </Label>
            )}
          </Stack>

          <Stack spacing={0.5} sx={{ mt: 1 }}>
            {se.startDate && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <Iconify icon="solar:calendar-bold" width={16} sx={{ color: 'text.secondary' }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {fDateTime(se.startDate)}
                </Typography>
              </Stack>
            )}

            {se.examCenter?.label && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <Iconify icon="solar:buildings-2-bold" width={16} sx={{ color: 'text.secondary' }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {se.examCenter.label}
                </Typography>
              </Stack>
            )}

            {se.room && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <Iconify icon="solar:home-bold" width={16} sx={{ color: 'text.secondary' }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {t('room_label', { room: se.room })}
                </Typography>
              </Stack>
            )}

            {addressText && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <Iconify icon="mingcute:location-fill" width={16} sx={{ color: 'text.secondary' }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {addressText}
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

        {showMenu && (
          <IconButton size="small" onClick={popover.onOpen} sx={{ mt: -0.5, mr: -0.5 }}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        )}
      </Stack>

      <CustomPopover open={popover.open} anchorEl={popover.anchorEl} onClose={popover.onClose}>
        <MenuList>
          <MenuItem
            onClick={() => {
              popover.onClose();
              router.push(paths.dashboard.espaceInstitut.subjectCompose(se.id));
            }}
          >
            <Iconify icon="solar:document-add-bold" />
            {t('compose_subject')}
          </MenuItem>
          {(canEdit || canEditExaminators) && (
            <MenuItem
              onClick={() => {
                popover.onClose();
                onEdit();
              }}
            >
              <Iconify icon={canEdit ? 'solar:pen-bold' : 'solar:user-plus-bold'} />
              {canEdit ? t('edit') : t('examinators')}
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
              {t('delete')}
            </MenuItem>
          )}
        </MenuList>
      </CustomPopover>
    </Box>
  );
}

// ----------------------------------------------------------------------

/**
 * Custom day for the DateTimePicker: days within the session interval are highlighted in green.
 */
function SessionRangeDay({ sessionStart, sessionEnd, day, outsideCurrentMonth, sx, ...other }) {
  const inRange = !outsideCurrentMonth && isDayInRange(day, sessionStart, sessionEnd);

  return (
    <PickersDay
      {...other}
      day={day}
      outsideCurrentMonth={outsideCurrentMonth}
      sx={[
        inRange && {
          bgcolor: (theme) => varAlpha(theme.vars.palette.success.mainChannel, 0.16),
          color: 'success.darker',
          fontWeight: 'fontWeightSemiBold',
          '&:hover': {
            bgcolor: (theme) => varAlpha(theme.vars.palette.success.mainChannel, 0.32),
          },
          '&.Mui-selected': {
            bgcolor: 'success.main',
            color: 'success.contrastText',
          },
          '&.Mui-selected:hover, &.Mui-selected:focus': {
            bgcolor: 'success.dark',
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    />
  );
}

// ----------------------------------------------------------------------

function ScheduledExamFormDialog({
  open,
  onClose,
  session,
  instituteId,
  instituteAddress,
  assessmentExams,
  scheduledExam,
  preselectedExam,
  scheduledExamIds,
  membres,
  onSuccess,
}) {
  const { t } = useTranslate('institute_space');
  const { t: tm } = useTranslate('session_management');
  const isEdit = !!scheduledExam;
  const canEditFields = session.status === 'DRAFT' || session.status === 'OPEN';
  const examinatorsOnly = isEdit && !canEditFields;

  const { examCenters, examCentersError, examCentersMutate } = useGetExamCenters(instituteId);

  // Filter out already-scheduled exams (except current one when editing)
  const exams = assessmentExams.filter((exam) => {
    if (isEdit && examKey(scheduledExam.exam) === examKey(exam)) return true;
    return !scheduledExamIds.has(examKey(exam));
  });

  // Form state — preselect exam if provided (from the planning card)
  const [selectedExam, setSelectedExam] = useState(
    isEdit ? scheduledExam.exam || null : preselectedExam || null
  );
  const [startDate, setStartDate] = useState(
    isEdit && scheduledExam.startDate ? dayjs(scheduledExam.startDate) : null
  );

  // Bound the date picker to the session interval
  const sessionStart = session.start ? dayjs(session.start) : null;
  const sessionEnd = session.end ? dayjs(session.end) : null;

  const [room, setRoom] = useState(isEdit ? scheduledExam.room || '' : '');

  // Address mode: institute (default) | exam center id | other
  const [addressMode, setAddressMode] = useState(() => {
    if (isEdit) {
      const centerId = toId(scheduledExam.examCenter);
      if (centerId) return centerId;
      if (scheduledExam.address && !isSameAddress(scheduledExam.address, instituteAddress)) {
        if (formatAddress(scheduledExam.address)) return ADDRESS_MODE_OTHER;
      }
    }
    return ADDRESS_MODE_INSTITUTE;
  });

  const initialAddress = isEdit ? scheduledExam.address : instituteAddress;
  const [address1, setAddress1] = useState(initialAddress?.address1 || '');
  const [address2, setAddress2] = useState(initialAddress?.address2 || '');
  const [zipcode, setZipcode] = useState(initialAddress?.zipcode || '');
  const [city, setCity] = useState(initialAddress?.city || '');

  const [selectedExaminators, setSelectedExaminators] = useState(() => {
    if (!isEdit || !scheduledExam.examinators?.length) return [];
    return scheduledExam.examinators;
  });
  const [submitting, setSubmitting] = useState(false);

  const centerDialog = useBoolean();

  const selectedCenter = useMemo(
    () => examCenters.find((c) => toId(c) === addressMode) || null,
    [examCenters, addressMode]
  );

  // Members who can be examinators (TEACHER, ADMIN)
  const examinatorOptions = (membres || []).filter(
    (m) => m.role === 'ADMIN' || m.role === 'TEACHER'
  );

  const handleAddressModeChange = useCallback(
    (event) => {
      const mode = event.target.value;
      setAddressMode(mode);
      if (mode === ADDRESS_MODE_INSTITUTE) {
        setAddress1(instituteAddress?.address1 || '');
        setAddress2(instituteAddress?.address2 || '');
        setZipcode(instituteAddress?.zipcode || '');
        setCity(instituteAddress?.city || '');
      } else if (mode === ADDRESS_MODE_OTHER) {
        setAddress1('');
        setAddress2('');
        setZipcode('');
        setCity('');
      }
    },
    [instituteAddress]
  );

  const handleCenterCreated = useCallback(
    (created) => {
      examCentersMutate();
      const createdId = toId(created);
      if (createdId) setAddressMode(createdId);
    },
    [examCentersMutate]
  );

  const shouldDisableDate = useCallback(
    (date) => !isDayInRange(date, sessionStart, sessionEnd),
    [sessionStart, sessionEnd]
  );

  const handleSubmit = useCallback(async () => {
    if (!examinatorsOnly && (!selectedExam || !startDate)) {
      toast.error(t('exam_and_date_required'));
      return;
    }

    setSubmitting(true);
    try {
      const examinatorsPayload = selectedExaminators.map((e) => `/api/users/${e.user?.id || e.id}`);
      const patchConfig = { headers: { 'Content-Type': 'application/merge-patch+json' } };

      if (examinatorsOnly) {
        await axios.patch(
          `/api/scheduled-exams/${scheduledExam.id}`,
          { examinators: examinatorsPayload },
          patchConfig
        );
        toast.success(t('examinators_updated'));
      } else {
        let addressPayload;
        if (selectedCenter) {
          addressPayload = {
            address1: selectedCenter.address?.address1 || null,
            address2: selectedCenter.address?.address2 || null,
            zipcode: selectedCenter.address?.zipcode || null,
            city: selectedCenter.address?.city || null,
          };
        } else {
          addressPayload = {
            address1: address1 || null,
            address2: address2 || null,
            zipcode: zipcode || null,
            city: city || null,
          };
        }

        const payload = {
          exam: `/api/exams/${toId(selectedExam)}`,
          startDate: dayjs(startDate).toISOString(),
          room: room || (selectedCenter ? selectedCenter.label : null) || null,
          address: addressPayload,
          examinators: examinatorsPayload,
        };

        if (selectedCenter) {
          payload.examCenter = getExamCenterIri(selectedCenter);
        } else if (isEdit && toId(scheduledExam.examCenter)) {
          payload.examCenter = null;
        }

        if (isEdit) {
          await axios.patch(`/api/scheduled-exams/${scheduledExam.id}`, payload, patchConfig);
          toast.success(t('exam_modified'));
        } else {
          await axios.post(`/api/sessions/${session.id}/scheduled-exams`, payload);
          toast.success(t('exam_added'));
        }
      }
      onSuccess();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }, [
    examinatorsOnly,
    selectedExam,
    startDate,
    room,
    address1,
    address2,
    zipcode,
    city,
    selectedExaminators,
    selectedCenter,
    isEdit,
    scheduledExam,
    session.id,
    onSuccess,
    t,
  ]);

  const renderAddressSection = () => (
    <>
      <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
        {tm('exam_center')}
      </Typography>

      <Stack direction="row" spacing={1} alignItems="flex-start">
        <TextField
          select
          fullWidth
          label={tm('exam_center')}
          value={addressMode}
          onChange={handleAddressModeChange}
          error={!!examCentersError}
          helperText={examCentersError ? tm('exam_centers_unavailable') : undefined}
        >
          <MenuItem value={ADDRESS_MODE_INSTITUTE}>{tm('institute_address_default')}</MenuItem>
          {examCenters.map((center) => (
            <MenuItem key={toId(center)} value={toId(center)}>
              {center.label}
              {center.address?.city ? ` — ${center.address.city}` : ''}
            </MenuItem>
          ))}
          <MenuItem value={ADDRESS_MODE_OTHER}>{tm('other_address')}</MenuItem>
        </TextField>

        <Tooltip title={tm('new_center')}>
          <span>
            <Button
              variant="outlined"
              color="inherit"
              onClick={centerDialog.onTrue}
              disabled={!instituteId}
              sx={{ height: 56, whiteSpace: 'nowrap', px: 1.5 }}
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              {tm('new_center')}
            </Button>
          </span>
        </Tooltip>
      </Stack>

      {selectedCenter && (
        <Box
          sx={{
            p: 2,
            borderRadius: 1.5,
            bgcolor: 'background.neutral',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
            <Iconify icon="solar:buildings-2-bold" width={18} sx={{ color: 'text.secondary' }} />
            <Typography variant="subtitle2">{selectedCenter.label}</Typography>
          </Stack>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {formatAddress(selectedCenter.address) || '—'}
          </Typography>
        </Box>
      )}

      {!selectedCenter && (
        <>
          <TextField
            label={t('address_field')}
            value={address1}
            onChange={(e) => setAddress1(e.target.value)}
            placeholder="123 Rue de la Paix"
          />

          <TextField
            label={t('address_complement')}
            value={address2}
            onChange={(e) => setAddress2(e.target.value)}
            placeholder="Bâtiment B, Étage 2"
          />

          <Stack direction="row" spacing={2}>
            <TextField
              label={t('zipcode')}
              value={zipcode}
              onChange={(e) => setZipcode(e.target.value)}
              sx={{ flex: 1 }}
            />
            <TextField
              label={t('city')}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              sx={{ flex: 2 }}
            />
          </Stack>
        </>
      )}
    </>
  );

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {examinatorsOnly ? t('edit_examinators') : isEdit ? t('edit_exam') : t('add_exam_title')}
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {!examinatorsOnly && (
              <>
                {/* Épreuve */}
                <Autocomplete
                  options={exams}
                  getOptionLabel={(option) => option.label || ''}
                  value={selectedExam}
                  onChange={(_, value) => setSelectedExam(value)}
                  isOptionEqualToValue={(option, value) => examKey(option) === examKey(value)}
                  renderInput={(params) => (
                    <TextField {...params} label={t('exam_field_required')} placeholder={t('select_exam')} />
                  )}
                  renderOption={(props, option) => (
                    <li {...props} key={examKey(option)}>
                      <Box>
                        <Typography variant="subtitle2">{option.label}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {[
                            option.duration && tm('duration_min', { count: option.duration }),
                            option.isWritten && tm('written'),
                            option.isOption && t('option'),
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </Typography>
                      </Box>
                    </li>
                  )}
                />

                {/* Date — bounded to the session interval, days in range highlighted */}
                <DateTimePicker
                  label={t('datetime_required')}
                  value={startDate}
                  onChange={(value) => setStartDate(value)}
                  minDateTime={sessionStart || undefined}
                  maxDateTime={sessionEnd || undefined}
                  referenceDate={sessionStart || undefined}
                  shouldDisableDate={shouldDisableDate}
                  slots={{ day: SessionRangeDay }}
                  slotProps={{
                    day: { sessionStart, sessionEnd },
                    textField: {
                      fullWidth: true,
                      helperText:
                        sessionStart && sessionEnd
                          ? `${t('exam_date_within_session', {
                              start: sessionStart.format('DD/MM/YYYY'),
                              end: sessionEnd.format('DD/MM/YYYY'),
                              interpolation: { escapeValue: false },
                            })} ${tm('available_days_hint')}`
                          : tm('available_days_hint'),
                    },
                  }}
                />

                {/* Salle */}
                <TextField
                  label={t('room')}
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="Ex: A101"
                />

                {renderAddressSection()}
              </>
            )}

            {examinatorsOnly && (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('exam_for')}
                <strong>{scheduledExam?.exam?.label || '—'}</strong>
              </Typography>
            )}

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
                <TextField {...params} label={t('examinators')} placeholder={t('select_examinators')} />
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
            {t('cancel')}
          </Button>
          <LoadingButton variant="contained" loading={submitting} onClick={handleSubmit}>
            {isEdit ? t('save') : t('add')}
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {centerDialog.value && (
        <ExamCenterDialog
          open
          onClose={centerDialog.onFalse}
          instituteId={instituteId}
          defaultAddress={instituteAddress}
          onCreated={handleCenterCreated}
        />
      )}
    </>
  );
}
