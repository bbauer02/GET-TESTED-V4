'use client';

import { useBoolean } from 'minimal-shared/hooks';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { fDate } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';
import {
  MEMBER_ROLES,
  getMembershipId,
  updateMembership,
  deleteMembership,
  getMembershipStatus,
} from 'src/actions/institute-team';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';

// ----------------------------------------------------------------------

export const MEMBER_STATUS_COLORS = {
  ACTIVE: 'success',
  PENDING: 'warning',
  ARCHIVED: 'default',
};

export function getMemberFullName(membership) {
  const user = membership?.user || {};
  return [user.firstname, user.lastname].filter(Boolean).join(' ');
}

// ----------------------------------------------------------------------

export function InstituteMemberDetailsDrawer({ open, onClose, membership, instituteId }) {
  const { t } = useTranslate('institute_space');

  const confirmDelete = useBoolean();

  const [role, setRole] = useState(membership?.role || 'STAFF');
  const [saving, setSaving] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setRole(membership?.role || 'STAFF');
  }, [membership]);

  const membershipId = getMembershipId(membership);
  const status = getMembershipStatus(membership);
  const user = membership?.user || {};
  const fullName = getMemberFullName(membership) || '-';
  const roleChanged = role !== (membership?.role || 'STAFF');

  const handleSaveRole = useCallback(async () => {
    setSaving(true);
    try {
      await updateMembership({ membershipId, instituteId, data: { role } });
      toast.success(t('member_role_updated'));
    } catch (error) {
      console.error(error);
      toast.error(error?.message || t('member_update_error'));
    } finally {
      setSaving(false);
    }
  }, [membershipId, instituteId, role, t]);

  const handleChangeStatus = useCallback(
    async (newStatus) => {
      setChangingStatus(true);
      try {
        await updateMembership({ membershipId, instituteId, data: { status: newStatus } });
        toast.success(newStatus === 'ARCHIVED' ? t('member_archived') : t('member_reactivated'));
      } catch (error) {
        console.error(error);
        toast.error(error?.message || t('member_update_error'));
      } finally {
        setChangingStatus(false);
      }
    },
    [membershipId, instituteId, t]
  );

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      await deleteMembership({ membershipId, instituteId });
      toast.success(t('member_deleted'));
      confirmDelete.onFalse();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error?.message || t('member_delete_error'));
    } finally {
      setDeleting(false);
    }
  }, [membershipId, instituteId, t, confirmDelete, onClose]);

  const renderHeader = () => (
    <Box sx={{ py: 2, pl: 2.5, pr: 1, display: 'flex', alignItems: 'center' }}>
      <Typography variant="h6" sx={{ flexGrow: 1 }}>
        {t('member_details')}
      </Typography>

      <IconButton onClick={onClose}>
        <Iconify icon="mingcute:close-line" />
      </IconButton>
    </Box>
  );

  const renderIdentity = () => (
    <Stack alignItems="center" spacing={1.5} sx={{ px: 2.5, py: 3 }}>
      <Avatar alt={fullName} src={user.avatar || undefined} sx={{ width: 96, height: 96 }}>
        {fullName.charAt(0).toUpperCase()}
      </Avatar>

      <Typography variant="h6">{fullName}</Typography>

      <Label variant="soft" color={MEMBER_STATUS_COLORS[status] || 'default'}>
        {t(`member_status_${status.toLowerCase()}`)}
      </Label>
    </Stack>
  );

  const renderInfoRow = (icon, label, value) => (
    <Stack direction="row" spacing={1.5} alignItems="flex-start">
      <Iconify icon={icon} width={20} sx={{ mt: 0.25, color: 'text.secondary', flexShrink: 0 }} />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
          {label}
        </Typography>
        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
          {value || '-'}
        </Typography>
      </Box>
    </Stack>
  );

  const renderInfo = () => (
    <Stack spacing={2.5} sx={{ px: 2.5, py: 3 }}>
      {renderInfoRow('solar:letter-bold', t('member_email'), user.email)}
      {renderInfoRow('solar:phone-bold', t('member_phone'), user.phone)}
      {renderInfoRow(
        'solar:calendar-bold',
        t('member_since'),
        membership?.since ? fDate(membership.since) : ''
      )}
    </Stack>
  );

  const renderRole = () => (
    <Stack spacing={2} sx={{ px: 2.5, py: 3 }}>
      <Typography variant="subtitle2">{t('member_role')}</Typography>

      <TextField
        select
        fullWidth
        size="small"
        value={role}
        onChange={(event) => setRole(event.target.value)}
        disabled={saving || status === 'ARCHIVED'}
      >
        {MEMBER_ROLES.map((option) => (
          <MenuItem key={option} value={option}>
            {t(`role_${option.toLowerCase()}`)}
          </MenuItem>
        ))}
      </TextField>

      <Button
        variant="contained"
        onClick={handleSaveRole}
        loading={saving}
        disabled={!roleChanged || status === 'ARCHIVED'}
        startIcon={<Iconify icon="solar:check-circle-bold" />}
      >
        {t('member_save')}
      </Button>
    </Stack>
  );

  const renderActions = () => (
    <Stack spacing={1.5} sx={{ p: 2.5 }}>
      {status === 'ARCHIVED' ? (
        <Button
          fullWidth
          variant="soft"
          color="success"
          loading={changingStatus}
          onClick={() => handleChangeStatus('ACTIVE')}
          startIcon={<Iconify icon="solar:restart-bold" />}
        >
          {t('member_reactivate')}
        </Button>
      ) : (
        <Button
          fullWidth
          variant="soft"
          color="warning"
          loading={changingStatus}
          onClick={() => handleChangeStatus('ARCHIVED')}
          startIcon={<Iconify icon="solar:archive-bold" />}
        >
          {t('member_archive')}
        </Button>
      )}

      <Button
        fullWidth
        variant="soft"
        color="error"
        onClick={confirmDelete.onTrue}
        startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
      >
        {t('member_delete')}
      </Button>
    </Stack>
  );

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        slotProps={{
          backdrop: { invisible: false },
          paper: { sx: { width: { xs: 1, sm: 400 } } },
        }}
      >
        {renderHeader()}

        <Divider />

        {membership && (
          <Scrollbar fillContent>
            {renderIdentity()}
            <Divider sx={{ borderStyle: 'dashed' }} />
            {renderInfo()}
            <Divider sx={{ borderStyle: 'dashed' }} />
            {renderRole()}
            <Divider sx={{ borderStyle: 'dashed' }} />
            {renderActions()}
          </Scrollbar>
        )}
      </Drawer>

      <ConfirmDialog
        open={confirmDelete.value}
        onClose={confirmDelete.onFalse}
        title={t('member_delete_title')}
        content={t('member_delete_desc', { name: fullName })}
        action={
          <Button variant="contained" color="error" onClick={handleDelete} loading={deleting}>
            {t('member_delete_confirm')}
          </Button>
        }
      />
    </>
  );
}
