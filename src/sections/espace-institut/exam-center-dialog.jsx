'use client';

import { toast } from 'sonner';
import { useState, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { useTranslate } from 'src/locales';
import { createExamCenter } from 'src/actions/session-management';

import { getErrorMessage } from 'src/auth/utils/error-message';

// ----------------------------------------------------------------------

const EMPTY_FORM = { label: '', address1: '', address2: '', zipcode: '', city: '' };

export function ExamCenterDialog({ open, onClose, instituteId, defaultAddress, onCreated }) {
  const { t } = useTranslate('session_management');

  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    address1: defaultAddress?.address1 || '',
    address2: defaultAddress?.address2 || '',
    zipcode: defaultAddress?.zipcode || '',
    city: defaultAddress?.city || '',
  }));
  const [submitting, setSubmitting] = useState(false);
  const [labelError, setLabelError] = useState('');

  const handleChange = useCallback(
    (field) => (event) => {
      const { value } = event.target;
      setForm((prev) => ({ ...prev, [field]: value }));
      if (field === 'label' && value.trim()) setLabelError('');
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    if (!form.label.trim()) {
      setLabelError(t('center_label_required'));
      return;
    }

    setSubmitting(true);
    try {
      const created = await createExamCenter(instituteId, {
        label: form.label.trim(),
        address: {
          address1: form.address1 || null,
          address2: form.address2 || null,
          zipcode: form.zipcode || null,
          city: form.city || null,
        },
      });
      toast.success(t('center_created'));
      onCreated?.(created);
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }, [form, instituteId, onCreated, onClose, t]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t('exam_center_dialog_title')}</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            autoFocus
            label={t('center_label')}
            value={form.label}
            onChange={handleChange('label')}
            error={!!labelError}
            helperText={labelError || undefined}
            required
          />
          <TextField label={t('address1')} value={form.address1} onChange={handleChange('address1')} />
          <TextField label={t('address2')} value={form.address2} onChange={handleChange('address2')} />
          <Stack direction="row" spacing={2}>
            <TextField
              label={t('zipcode')}
              value={form.zipcode}
              onChange={handleChange('zipcode')}
              sx={{ flex: 1 }}
            />
            <TextField
              label={t('city')}
              value={form.city}
              onChange={handleChange('city')}
              sx={{ flex: 2 }}
            />
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          {t('cancel')}
        </Button>
        <LoadingButton variant="contained" loading={submitting} onClick={handleSubmit}>
          {t('create')}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
