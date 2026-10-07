'use client';

import { useBoolean } from 'minimal-shared/hooks';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import { useTranslate } from 'src/locales';
import {
  MEMBER_ROLES,
  MEMBER_STATUSES,
  getMembershipId,
  getMembershipStatus,
} from 'src/actions/institute-team';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { SearchNotFound } from 'src/components/search-not-found';

import { InstituteMemberInviteDialog } from './institute-member-invite-dialog';
import {
  getMemberFullName,
  MEMBER_STATUS_COLORS,
  InstituteMemberDetailsDrawer,
} from './institute-member-details-drawer';

// ----------------------------------------------------------------------

export function InstituteFicheTeam({ memberships, instituteId, title, hideTitle = false, sx, ...other }) {
  const { t } = useTranslate('institute_space');

  const inviteDialog = useBoolean();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);

  const roleLabels = useMemo(
    () => Object.fromEntries(MEMBER_ROLES.map((role) => [role, t(`role_${role.toLowerCase()}`)])),
    [t]
  );

  const dataFiltered = useMemo(
    () =>
      applyFilter({
        inputData: (memberships || []).filter((m) => m.role !== 'CUSTOMER'),
        query: searchQuery,
        role: roleFilter,
        status: statusFilter,
        roleLabels,
      }),
    [memberships, searchQuery, roleFilter, statusFilter, roleLabels]
  );

  // Keep the drawer in sync with the SWR list (role/status updates)
  const selectedMembership = useMemo(
    () => (memberships || []).find((m) => getMembershipId(m) === selectedId) || null,
    [memberships, selectedId]
  );

  const handleOpenMember = useCallback((membership) => {
    setSelectedId(getMembershipId(membership));
  }, []);

  const handleCloseMember = useCallback(() => {
    setSelectedId(null);
  }, []);

  const hasFilters = !!searchQuery || roleFilter !== 'all' || statusFilter !== 'all';
  const isEmpty = !(memberships || []).length;
  const notFound = !dataFiltered.length && hasFilters;

  const renderHeader = () => (
    <Box
      sx={{
        gap: 2,
        display: 'flex',
        alignItems: { sm: 'center' },
        justifyContent: hideTitle ? 'flex-end' : 'space-between',
        flexDirection: { xs: 'column', sm: 'row' },
      }}
    >
      {!hideTitle && <Typography variant="h4">{title || t('team_title')}</Typography>}

      <Button
        variant="contained"
        onClick={inviteDialog.onTrue}
        startIcon={<Iconify icon="mingcute:add-line" />}
      >
        {t('team_invite')}
      </Button>
    </Box>
  );

  const renderFilters = () => (
    <Stack
      spacing={2}
      direction={{ xs: 'column', md: 'row' }}
      sx={{ alignItems: { md: 'center' } }}
    >
      <TextField
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        placeholder={t('team_search')}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          },
        }}
        sx={{ flexGrow: 1 }}
      />

      <TextField
        select
        label={t('team_filter_role')}
        value={roleFilter}
        onChange={(event) => setRoleFilter(event.target.value)}
        sx={{ width: { xs: 1, md: 200 } }}
      >
        <MenuItem value="all">{t('filter_all')}</MenuItem>
        {MEMBER_ROLES.map((role) => (
          <MenuItem key={role} value={role}>
            {roleLabels[role]}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        label={t('team_filter_status')}
        value={statusFilter}
        onChange={(event) => setStatusFilter(event.target.value)}
        sx={{ width: { xs: 1, md: 200 } }}
      >
        <MenuItem value="all">{t('filter_all')}</MenuItem>
        {MEMBER_STATUSES.map((status) => (
          <MenuItem key={status} value={status}>
            {t(`member_status_${status.toLowerCase()}`)}
          </MenuItem>
        ))}
      </TextField>
    </Stack>
  );

  const renderCount = () => (
    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
      {t('team_results_count', { count: dataFiltered.length })}
    </Typography>
  );

  const renderGrid = () => (
    <Box
      sx={{
        gap: 3,
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(1, 1fr)',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
        },
      }}
    >
      {dataFiltered.map((membership) => (
        <MemberCard
          key={getMembershipId(membership)}
          membership={membership}
          roleLabels={roleLabels}
          onOpen={() => handleOpenMember(membership)}
          t={t}
        />
      ))}
    </Box>
  );

  const renderContent = () => {
    if (isEmpty) {
      return (
        <EmptyContent
          title={t('team_empty')}
          description={t('team_empty_desc')}
          sx={{ py: 10 }}
          action={
            <Button
              variant="contained"
              onClick={inviteDialog.onTrue}
              startIcon={<Iconify icon="mingcute:add-line" />}
              sx={{ mt: 2 }}
            >
              {t('team_invite')}
            </Button>
          }
        />
      );
    }

    if (notFound) {
      return <SearchNotFound query={searchQuery} sx={{ py: 10 }} />;
    }

    return renderGrid();
  };

  return (
    <Stack spacing={3} sx={[{ my: 5 }, ...(Array.isArray(sx) ? sx : [sx])]} {...other}>
      {renderHeader()}
      {renderFilters()}
      {renderCount()}
      {renderContent()}

      <InstituteMemberInviteDialog
        open={inviteDialog.value}
        onClose={inviteDialog.onFalse}
        instituteId={instituteId}
      />

      <InstituteMemberDetailsDrawer
        open={!!selectedMembership}
        onClose={handleCloseMember}
        membership={selectedMembership}
        instituteId={instituteId}
      />
    </Stack>
  );
}

// ----------------------------------------------------------------------

function MemberCard({ membership, roleLabels, onOpen, t }) {
  const user = membership.user || {};
  const fullName = getMemberFullName(membership) || '-';
  const status = getMembershipStatus(membership);
  const isArchived = status === 'ARCHIVED';

  return (
    <Card
      onClick={onOpen}
      sx={[
        (theme) => ({
          py: 5,
          px: 3,
          display: 'flex',
          cursor: 'pointer',
          position: 'relative',
          alignItems: 'center',
          flexDirection: 'column',
          transition: theme.transitions.create(['box-shadow', 'opacity']),
          '&:hover': { boxShadow: theme.customShadows?.z16 || theme.shadows[16] },
        }),
        isArchived && { opacity: 0.56, filter: 'grayscale(1)' },
      ]}
    >
      <Label
        variant="soft"
        color={MEMBER_STATUS_COLORS[status] || 'default'}
        sx={{ position: 'absolute', top: 16, left: 16 }}
      >
        {t(`member_status_${status.toLowerCase()}`)}
      </Label>

      <Tooltip title={t('member_edit')}>
        <IconButton
          size="small"
          onClick={(event) => {
            event.stopPropagation();
            onOpen();
          }}
          sx={{ position: 'absolute', top: 10, right: 10 }}
        >
          <Iconify icon="solar:pen-bold" width={18} />
        </IconButton>
      </Tooltip>

      <Avatar alt={fullName} src={user.avatar || undefined} sx={{ width: 64, height: 64, mb: 2 }}>
        {fullName.charAt(0).toUpperCase()}
      </Avatar>

      <Typography variant="subtitle1" noWrap sx={{ maxWidth: 1 }}>
        {fullName}
      </Typography>

      {user.email && (
        <Typography variant="caption" noWrap sx={{ color: 'text.secondary', maxWidth: 1 }}>
          {user.email}
        </Typography>
      )}

      <Typography variant="body2" sx={{ mt: 1.5, color: 'text.secondary' }}>
        {roleLabels[membership.role] || membership.role || '-'}
      </Typography>
    </Card>
  );
}

// ----------------------------------------------------------------------

function applyFilter({ inputData, query, role, status, roleLabels }) {
  let data = inputData;

  if (role !== 'all') {
    data = data.filter((membership) => membership.role === role);
  }

  if (status !== 'all') {
    data = data.filter((membership) => getMembershipStatus(membership) === status);
  }

  if (query) {
    const q = query.toLowerCase();
    data = data.filter((membership) => {
      const user = membership.user || {};
      const fields = [getMemberFullName(membership), user.email, roleLabels[membership.role]];
      return fields.some((field) => field?.toLowerCase().includes(q));
    });
  }

  return data;
}
