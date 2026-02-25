'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
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
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';

import axios, { endpoints } from 'src/lib/axios';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { FlagIcon } from 'src/components/flag-icon';
import { DashboardContent } from 'src/layouts/dashboard';

// ----------------------------------------------------------------------

const PHONE_CODE_TO_COUNTRY = {
  '+33': 'FR', '+1': 'US', '+44': 'GB', '+49': 'DE', '+34': 'ES', '+39': 'IT',
  '+81': 'JP', '+86': 'CN', '+82': 'KR', '+91': 'IN', '+55': 'BR', '+7': 'RU',
  '+61': 'AU', '+31': 'NL', '+32': 'BE', '+41': 'CH', '+46': 'SE', '+47': 'NO',
  '+45': 'DK', '+48': 'PL', '+43': 'AT', '+351': 'PT', '+30': 'GR', '+90': 'TR',
  '+20': 'EG', '+212': 'MA', '+213': 'DZ', '+216': 'TN', '+966': 'SA', '+971': 'AE',
  '+972': 'IL', '+852': 'HK', '+65': 'SG', '+60': 'MY', '+66': 'TH', '+84': 'VN',
  '+62': 'ID', '+63': 'PH', '+52': 'MX', '+54': 'AR', '+56': 'CL', '+57': 'CO',
  '+353': 'IE', '+358': 'FI', '+36': 'HU', '+40': 'RO', '+380': 'UA', '+375': 'BY',
};

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

const COLUMNS = [
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
          {params.row.photoURL ? (
            <img
              src={params.row.photoURL}
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
      const countryCode = PHONE_CODE_TO_COUNTRY[params.row.phoneCountryCode] || '';
      return (
        <Stack direction="row" alignItems="center" spacing={1} sx={{ height: 1 }}>
          {countryCode && <FlagIcon code={countryCode} />}
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
    type: 'actions',
    headerName: '',
    width: 80,
    getActions: (params) => [
      <GridActionsCellItem
        key="view"
        icon={<Iconify icon="solar:eye-bold" />}
        label="View"
        onClick={() => console.log('View', params.id)}
      />,
      <GridActionsCellItem
        key="edit"
        icon={<Iconify icon="solar:pen-bold" />}
        label="Edit"
        onClick={() => console.log('Edit', params.id)}
      />,
    ],
  },
];

// ----------------------------------------------------------------------

export function UserListView() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(endpoints.user.list);
      const data = Array.isArray(res.data) ? res.data : res.data?.['hydra:member'] ?? [];

      const mapped = data.map((user) => ({
        ...user,
        name: `${user.firstname ?? ''} ${user.lastname ?? ''}`.trim(),
      }));

      setUsers(mapped);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: { xs: 3, md: 5 } }}>
        <Typography variant="h4">Users</Typography>
        <Button
          variant="contained"
          color="inherit"
          startIcon={<Iconify icon="mingcute:add-line" />}
        >
          New user
        </Button>
      </Stack>

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
          columns={COLUMNS}
          loading={loading}
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
    </DashboardContent>
  );
}
