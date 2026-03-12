'use client';

import { useState, useMemo, useCallback } from 'react';
import { varAlpha } from 'minimal-shared/utils';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { DataGrid } from '@mui/x-data-grid';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { parsePhoneNumber } from 'react-phone-number-input';

import { useGetUsers } from 'src/actions/user';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { FlagIcon } from 'src/components/flag-icon';
import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { UserQuickEditForm } from '../user-quick-edit-form';

// ----------------------------------------------------------------------

const ROLE_COLOR_MAP = {
  admin: 'success',
  user: 'info',
  manager: 'warning',
  superadmin: 'error',
};

const TAB_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'verified', label: 'Verified' },
  { value: 'active', label: 'Active' },
];

// ----------------------------------------------------------------------

export function UserListView() {
  const { users: rawUsers, usersLoading } = useGetUsers();

  const [currentTab, setCurrentTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [quickEditOpen, setQuickEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const users = useMemo(
    () =>
      rawUsers.map((user) => ({
        ...user,
        name: `${user.firstname ?? ''} ${user.lastname ?? ''}`.trim(),
      })),
    [rawUsers]
  );

  const handleEditRow = useCallback((user) => {
    setSelectedUser(user);
    setQuickEditOpen(true);
  }, []);

  const handleCloseQuickEdit = useCallback(() => {
    setQuickEditOpen(false);
    setSelectedUser(null);
  }, []);

  const columns = useMemo(
    () => [
      {
        field: 'name',
        headerName: 'Name',
        flex: 1,
        minWidth: 200,
        renderCell: (params) => (
          <Stack direction="row" alignItems="center" spacing={2} sx={{ height: 1 }}>
            <Stack
              sx={{
                width: 40,
                height: 40,
                flexShrink: 0,
                borderRadius: '50%',
                overflow: 'hidden',
                bgcolor: 'background.neutral',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {params.row.avatar ? (
                <img
                  src={params.row.avatar}
                  alt={params.row.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                  {params.row.firstname?.charAt(0)?.toUpperCase()}
                  {params.row.lastname?.charAt(0)?.toUpperCase()}
                </Typography>
              )}
            </Stack>
            <Stack sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" noWrap>
                {params.row.name}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.disabled' }} noWrap>
                {params.row.email}
              </Typography>
            </Stack>
          </Stack>
        ),
      },
      {
        field: 'email',
        headerName: 'Email',
        flex: 1,
        minWidth: 200,
      },
      {
        field: 'phone',
        headerName: 'Phone',
        width: 200,
        renderCell: (params) => {
          const { phoneCountryCode, phone } = params.row;
          let country = '';
          if (phoneCountryCode) {
            try {
              const fullNumber = phone?.startsWith('+') ? phone : `${phoneCountryCode}${phone || ''}`;
              const parsed = parsePhoneNumber(fullNumber);
              country = parsed?.country || '';
            } catch (e) { /* ignore parse errors */ }
          }
          return (
            <Stack direction="row" alignItems="center" spacing={1} sx={{ height: 1 }}>
              {country && <FlagIcon code={country} />}
              <Typography variant="body2">{params.value}</Typography>
            </Stack>
          );
        },
      },
      {
        field: 'platformRole',
        headerName: 'Role',
        width: 160,
        renderCell: (params) => (
          <Label
            variant="soft"
            color={ROLE_COLOR_MAP[params.value?.toLowerCase()] || 'default'}
          >
            {params.value}
          </Label>
        ),
      },
      {
        field: 'actions',
        headerName: '',
        width: 80,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params) => (
          <Tooltip title="Quick Edit">
            <IconButton onClick={() => handleEditRow(params.row)}>
              <Iconify icon="solar:pen-bold" />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    [handleEditRow]
  );

  // Extract unique roles from user data
  const roleOptions = useMemo(
    () => [...new Set(users.map((u) => u.platformRole).filter(Boolean))],
    [users]
  );

  // Count users per tab
  const tabCounts = useMemo(() => {
    const all = users.length;
    const verified = users.filter((u) => u.verified).length;
    const active = users.filter((u) => u.active).length;
    return { all, verified, active };
  }, [users]);

  // Filtered rows
  const filteredUsers = useMemo(() => {
    let result = users;

    // Tab filter
    if (currentTab === 'verified') {
      result = result.filter((u) => u.verified);
    } else if (currentTab === 'active') {
      result = result.filter((u) => u.active);
    }

    // Role filter
    if (roleFilter !== 'all') {
      result = result.filter((u) => u.platformRole === roleFilter);
    }

    // Search filter (firstname / lastname)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          (u.firstname ?? '').toLowerCase().includes(q) ||
          (u.lastname ?? '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [users, currentTab, roleFilter, searchQuery]);

  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs
        heading="Utilisateurs"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Utilisateurs', href: paths.dashboard.user.root },
          { name: 'Liste' },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.user.new}
            variant="contained"
            color="inherit"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            New user
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        {/* ---- Tabs ---- */}
        <Tabs
          value={currentTab}
          onChange={(_, value) => setCurrentTab(value)}
          sx={{
            px: 2.5,
            boxShadow: (theme) =>
              `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
          }}
        >
          {TAB_OPTIONS.map((tab) => (
            <Tab
              key={tab.value}
              value={tab.value}
              label={tab.label}
              iconPosition="end"
              icon={
                <Label
                  variant={currentTab === tab.value ? 'filled' : 'soft'}
                  color={
                    (tab.value === 'verified' && 'info') ||
                    (tab.value === 'active' && 'success') ||
                    'default'
                  }
                >
                  {tabCounts[tab.value]}
                </Label>
              }
            />
          ))}
        </Tabs>

        {/* ---- Toolbar: role filter + search ---- */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          sx={{ px: 2.5, py: 2 }}
        >
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={roleFilter}
              label="Role"
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              {roleOptions.map((role) => (
                <MenuItem key={role} value={role}>
                  {role}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name..."
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ flexGrow: 1, maxWidth: 320 }}
          />
        </Stack>

        {/* ---- DataGrid ---- */}
        <DataGrid
          rows={filteredUsers}
          columns={columns}
          loading={usersLoading}
          showToolbar={false}
          pageSizeOptions={[5, 10, 25]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          disableRowSelectionOnClick
          disableColumnMenu
          disableColumnFilter
          disableColumnSelector
          getRowHeight={() => 72}
          sx={{
            borderTop: (theme) => `dashed 1px ${theme.vars.palette.divider}`,
            '& .MuiDataGrid-row': {
              cursor: 'pointer',
            },
          }}
        />
      </Card>

      <UserQuickEditForm
        currentUser={selectedUser}
        open={quickEditOpen}
        onClose={handleCloseQuickEdit}
      />
    </DashboardContent>
  );
}
