'use client';

import { toast } from 'sonner';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import AlertTitle from '@mui/material/AlertTitle';
import LoadingButton from '@mui/lab/LoadingButton';
import FormControlLabel from '@mui/material/FormControlLabel';

import { fDate } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';
import { useGetInstituteFiche } from 'src/actions/espace-institut';
import axios, { fetcher, endpoints, extractMembers } from 'src/lib/axios';
import {
  useGetDocumentTypes,
  fetchSessionDocumentsBatch,
  useGetSessionDocumentPublications,
} from 'src/actions/session-management';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { useCurrentInstitute } from 'src/auth/hooks';
import { getErrorMessage } from 'src/auth/utils/error-message';

import { toEntityId, getEnrollmentDisplayName } from './session-enrollment-utils';
import { openPrintWindow, renderDocumentTemplate } from './utils/render-document-template';

// ----------------------------------------------------------------------

export function SessionDocumentPublications({ session, onMutate }) {
  const { t } = useTranslate('session_management');
  const currentInstitute = useCurrentInstitute();

  const instituteId = toEntityId(session?.institute) || currentInstitute?.id;
  const { institute } = useGetInstituteFiche(instituteId);
  const resolvedInstitute = session?.institute?.label ? session.institute : institute || session?.institute;

  const { documentTypes, documentTypesLoading } = useGetDocumentTypes();
  const { publications, publicationsMutate } = useGetSessionDocumentPublications(session?.id);

  // Build a map: documentType id → publication
  const publicationMap = useMemo(() => {
    const map = new Map();
    publications.forEach((pub) => {
      const dtId = toEntityId(pub.documentType);
      if (dtId) map.set(dtId, pub);
    });
    return map;
  }, [publications]);

  const handleToggle = useCallback(
    async (documentType, isPublished, publication) => {
      try {
        if (isPublished && publication) {
          await axios.delete(`/api/session-document-publications/${toEntityId(publication)}`);
          toast.success(t('doc_unpublished'));
        } else {
          const dtIri = documentType['@id'] || `/api/document-types/${documentType.id}`;
          await axios.post(endpoints.session.documentPublications(session.id), {
            documentType: dtIri,
          });
          toast.success(t('doc_published'));
        }
        publicationsMutate();
        onMutate?.();
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    },
    [session?.id, publicationsMutate, onMutate, t]
  );

  const renderAvailability = (pub) => {
    if (!pub) return null;
    const availability = pub.availability;
    if (!availability) return null;

    if (availability.available) {
      return (
        <Label color="success" variant="soft" startIcon={<Iconify icon="solar:check-circle-bold" />}>
          {t('availability_available')}
        </Label>
      );
    }

    const reason = formatReason(availability.reason, t);
    const availableFrom = availability.availableFrom
      ? t('available_from', { date: fDate(availability.availableFrom) })
      : '';

    return (
      <Label color="default" variant="soft" startIcon={<Iconify icon="solar:clock-circle-bold" />}>
        {t('availability_unavailable')}
        {reason ? ` — ${reason}` : ''}
        {availableFrom ? ` (${availableFrom})` : ''}
      </Label>
    );
  };

  return (
    <Stack spacing={3}>
      <Alert severity="info" icon={<Iconify icon="solar:info-circle-bold" />}>
        <AlertTitle>{t('doc_rules_title')}</AlertTitle>
        {t('doc_rules')}
      </Alert>

      <Card>
        <CardHeader title={t('documents_title')} subheader={t('documents_subheader')} />

        <Box sx={{ p: 2 }}>
          {!documentTypesLoading && documentTypes.length === 0 && (
            <Typography variant="body2" sx={{ color: 'text.secondary', px: 1.5, py: 1 }}>
              {t('no_document_type')}
            </Typography>
          )}

          <Stack spacing={1}>
            {documentTypes.map((dt) => {
              const dtId = toEntityId(dt);
              const pub = publicationMap.get(dtId);
              const isPublished = !!pub;
              const isAuto = pub?.isAutoPublished || pub?.autoPublished;

              return (
                <Stack
                  key={dtId}
                  direction={{ xs: 'column', sm: 'row' }}
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  spacing={1.5}
                  sx={{
                    px: 1.5,
                    py: 1,
                    borderRadius: 1,
                    bgcolor: isPublished ? 'action.selected' : 'transparent',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Iconify
                      icon="solar:document-bold"
                      width={22}
                      sx={{ color: isPublished ? 'primary.main' : 'text.disabled', flexShrink: 0 }}
                    />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle2" noWrap>
                        {dt.label}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {dt.code}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
                    {renderAvailability(pub)}
                    {isAuto && (
                      <Label color="info" variant="soft">
                        {t('auto')}
                      </Label>
                    )}
                    <Switch
                      checked={isPublished}
                      onChange={() => handleToggle(dt, isPublished, pub)}
                      size="small"
                    />
                  </Stack>
                </Stack>
              );
            })}
          </Stack>
        </Box>
      </Card>

      <SessionBatchPrint
        session={session}
        institute={resolvedInstitute}
        instituteId={instituteId}
        documentTypes={documentTypes}
      />
    </Stack>
  );
}

// ----------------------------------------------------------------------

function formatReason(reason, t) {
  if (!reason) return '';
  if (/^[A-Z0-9_]+$/.test(reason)) {
    return t(`reason_${reason}`, { defaultValue: reason.toLowerCase().replace(/_/g, ' ') });
  }
  return reason;
}

// ----------------------------------------------------------------------

function SessionBatchPrint({ session, institute, instituteId, documentTypes }) {
  const { t } = useTranslate('session_management');

  const enrollments = useMemo(
    () => (session?.enrollments || []).filter((e) => e.status !== 'CANCELLED'),
    [session?.enrollments]
  );

  const [documentTypeId, setDocumentTypeId] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [printing, setPrinting] = useState(false);

  const allIds = useMemo(() => enrollments.map((e) => toEntityId(e)).filter(Boolean), [enrollments]);
  const allSelected = allIds.length > 0 && selectedIds.length === allIds.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  const selectedDocumentType = documentTypes.find((dt) => toEntityId(dt) === documentTypeId) || null;

  const handleToggleAll = useCallback(() => {
    setSelectedIds((prev) => (prev.length === allIds.length ? [] : allIds));
  }, [allIds]);

  const handleToggleOne = useCallback((enrollmentId) => {
    setSelectedIds((prev) =>
      prev.includes(enrollmentId) ? prev.filter((id) => id !== enrollmentId) : [...prev, enrollmentId]
    );
  }, []);

  const handlePrint = useCallback(async () => {
    if (!selectedDocumentType || selectedIds.length === 0) return;

    setPrinting(true);
    try {
      let template = null;
      let items = [];

      try {
        const batch = await fetchSessionDocumentsBatch(session.id, {
          documentType: selectedDocumentType.code,
          enrollmentIds: selectedIds,
        });
        template = batch?.template || null;
        items = Array.isArray(batch?.items) ? batch.items : [];
      } catch (batchError) {
        // Fallback (batch endpoint unavailable): render client-side from the institute templates
        const templates = extractMembers(await fetcher(endpoints.documentTemplate.list(instituteId)));
        template =
          templates.find((tpl) => toEntityId(tpl.documentType) === toEntityId(selectedDocumentType)) ||
          null;
        if (!template) throw batchError;
        items = enrollments
          .filter((e) => selectedIds.includes(toEntityId(e)))
          .map((enrollment) => ({ enrollment, availability: { available: true } }));
      }

      if (!template?.content) {
        toast.error(t('batch_no_template'));
        return;
      }

      const pages = items
        .filter((item) => item?.enrollment && item.availability?.available !== false)
        .map((item) =>
          renderDocumentTemplate({
            template,
            enrollment: item.enrollment,
            session,
            institute,
          })
        )
        .filter(Boolean);

      if (pages.length === 0) {
        toast.error(t('batch_no_document'));
        return;
      }

      const skipped = selectedIds.length - pages.length;
      if (skipped > 0) {
        toast.info(t('batch_skipped', { count: skipped }));
      }

      const printWindow = openPrintWindow(pages, selectedDocumentType.label || 'Documents');
      if (!printWindow) {
        toast.error('Popup bloquée : autorisez les fenêtres pour imprimer.');
        return;
      }
      toast.success(t('batch_ready', { count: pages.length }));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setPrinting(false);
    }
  }, [selectedDocumentType, selectedIds, session, institute, instituteId, enrollments, t]);

  return (
    <Card>
      <CardHeader
        title={t('batch_print_title')}
        subheader={t('batch_print_desc')}
        action={
          <LoadingButton
            variant="contained"
            loading={printing}
            disabled={!selectedDocumentType || selectedIds.length === 0}
            onClick={handlePrint}
            startIcon={<Iconify icon="solar:printer-bold" />}
          >
            {t('print')}
            {selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
          </LoadingButton>
        }
      />

      <Stack spacing={2} sx={{ p: 3 }}>
        <TextField
          select
          fullWidth
          label={t('document_type')}
          value={documentTypeId}
          onChange={(event) => setDocumentTypeId(event.target.value)}
        >
          {documentTypes.map((dt) => (
            <MenuItem key={toEntityId(dt)} value={toEntityId(dt)}>
              {dt.label}
            </MenuItem>
          ))}
        </TextField>

        {enrollments.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('no_enrollment')}
          </Typography>
        ) : (
          <Box
            sx={{
              borderRadius: 1.5,
              border: (theme) => `solid 1px ${theme.vars.palette.divider}`,
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ px: 2, py: 0.5 }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={handleToggleAll}
                  />
                }
                label={t('select_all')}
              />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {t('selected_count', { count: selectedIds.length })}
              </Typography>
            </Stack>

            <Divider />

            <Scrollbar sx={{ maxHeight: 320 }}>
              <Stack sx={{ px: 2, py: 1 }}>
                {enrollments.map((enrollment) => {
                  const enrollmentId = toEntityId(enrollment);
                  return (
                    <FormControlLabel
                      key={enrollmentId}
                      control={
                        <Checkbox
                          checked={selectedIds.includes(enrollmentId)}
                          onChange={() => handleToggleOne(enrollmentId)}
                        />
                      }
                      label={
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="body2">{getEnrollmentDisplayName(enrollment) || '—'}</Typography>
                          {enrollment.referenceNumber && (
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {enrollment.referenceNumber}
                            </Typography>
                          )}
                        </Stack>
                      }
                    />
                  );
                })}
              </Stack>
            </Scrollbar>
          </Box>
        )}
      </Stack>
    </Card>
  );
}
