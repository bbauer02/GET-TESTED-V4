'use client';

import { toast } from 'sonner';
import { useState, useEffect, useCallback } from 'react';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { useTranslate } from 'src/locales';
import { updateEnrollmentInformation } from 'src/actions/session-management';

import { getErrorMessage } from 'src/auth/utils/error-message';

import { getEnrollmentDisplayName } from './session-enrollment-utils';

// ----------------------------------------------------------------------

export function SessionEnrollmentCommentDialog({ open, onClose, enrollment, onSaved }) {
  const { t } = useTranslate('session_management');

  const [value, setValue] = useState(enrollment?.information || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setValue(enrollment?.information || '');
  }, [open, enrollment?.information]);

  const handleSave = useCallback(async () => {
    const enrollmentId = enrollment?.id || enrollment?.['@id'];
    if (!enrollmentId) return;
    setSaving(true);
    try {
      const updated = await updateEnrollmentInformation(enrollmentId, value.trim());
      toast.success(t('comment_saved'));
      onSaved?.(updated || { ...enrollment, information: value.trim() });
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }, [enrollment, value, onSaved, onClose, t]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {t('comment_dialog_title')}
        {enrollment ? ` — ${getEnrollmentDisplayName(enrollment)}` : ''}
      </DialogTitle>

      <DialogContent dividers>
        <TextField
          autoFocus
          fullWidth
          multiline
          minRows={4}
          label={t('comment_label')}
          placeholder={t('comment_placeholder')}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          sx={{ mt: 1 }}
        />
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          {t('cancel')}
        </Button>
        <LoadingButton variant="contained" loading={saving} onClick={handleSave}>
          {t('save')}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
