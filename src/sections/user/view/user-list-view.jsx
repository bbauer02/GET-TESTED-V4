'use client';

import { varAlpha } from 'minimal-shared/utils';
import { useDebounce } from 'minimal-shared/hooks';
import { useMemo, useState, useCallback } from 'react';
import { parsePhoneNumber } from 'react-phone-number-input';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { usePaginatedCollection } from 'src/hooks/use-paginated-collection';

import { endpoints } from 'src/lib/axios';
import { useTranslate } from 'src/locales';
import { setUserActive } from 'src/actions/user';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { FlagIcon } from 'src/components/flag-icon';
import { Scrollbar } from 'src/components/scrollbar';
import { LoadErrorContent } from 'src/components/load-error';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, TableNoData, TableHeadCustom, TablePaginationCustom } from 'src/components/table';

import { useAuthContext } from 'src/auth/hooks';
import { getErrorMessage } from 'src/auth/utils';

import { UserQuickEditForm } from '../user-quick-edit-form';

// ----------------------------------------------------------------------

const ROLE_COLOR_MAP = {
  admin: 'success',
  user: 'info',
};

const ROLE_OPTIONS = ['USER', 'ADMIN'];

// Colonnes triables côté serveur (OrderFilter de l'API) : id de colonne -> champ API
const SORT_FIELDS = {
  name: 'lastname',
  platformRole: 'platformRole',
};

const COUNT_OPTIONS = { rowsPerPage: 1 };
const VERIFIED_FILTER = { isVerified: 'true' };
const ACTIVE_FILTER = { isActive: 'true' };
const INACTIVE_FILTER = { isActive: 'false' };

function phoneCountry(user) {
  if (!user.phoneCountryCode) return '';
  try {
    const fullNumber = user.phone?.startsWith('+') ? user.phone : `${user.phoneCountryCode}${user.phone || ''}`;
    return parsePhoneNumber(fullNumber)?.country || '';
  } catch {
    return '';
  }
}

// ----------------------------------------------------------------------

export function UserListView() {
  const { t } = useTranslate('user');

  const table = useTable({ defaultOrderBy: 'name', defaultRowsPerPage: 10 });

  const [currentTab, setCurrentTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [quickEditOpen, setQuickEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Activation / désactivation en attente de confirmation
  const { user: authUser } = useAuthContext();
  const [toggleUser, setToggleUser] = useState(null);
  const [toggling, setToggling] = useState(false);

  const TABLE_HEAD = [
    { id: 'name', label: t('table_name') },
    { id: 'phone', label: t('table_phone'), width: 200, sortable: false },
    { id: 'platformRole', label: t('table_role'), width: 160 },
    { id: 'status', label: t('table_status'), width: 120, sortable: false },
    { id: '', width: 112, sortable: false },
  ];

  const TAB_OPTIONS = [
    { value: 'all', label: t('tab_all'), color: 'default' },
    { value: 'verified', label: t('tab_verified'), color: 'info' },
    { value: 'active', label: t('tab_active'), color: 'success' },
    { value: 'inactive', label: t('tab_inactive'), color: 'error' },
  ];

  // Pagination, tri, recherche et filtres côté serveur (l'API pagine par 30)
  const debouncedSearch = useDebounce(searchQuery, 400);
  const filters = useMemo(
    () => ({
      q: debouncedSearch,
      platformRole: roleFilter,
      isVerified: currentTab === 'verified' ? 'true' : undefined,
      isActive: { active: 'true', inactive: 'false' }[currentTab],
    }),
    [debouncedSearch, roleFilter, currentTab]
  );

  const { items: users, totalItems, loading, error, mutate } = usePaginatedCollection(endpoints.user.list, {
    page: table.page,
    rowsPerPage: table.rowsPerPage,
    orderBy: SORT_FIELDS[table.orderBy],
    order: table.order,
    filters,
  });

  // Compteurs des onglets : une requête légère par onglet (totalItems seulement)
  const { totalItems: countAll } = usePaginatedCollection(endpoints.user.list, COUNT_OPTIONS);
  const { totalItems: countVerified } = usePaginatedCollection(endpoints.user.list, {
    ...COUNT_OPTIONS,
    filters: VERIFIED_FILTER,
  });
  const { totalItems: countActive, mutate: mutateCountActive } = usePaginatedCollection(
    endpoints.user.list,
    { ...COUNT_OPTIONS, filters: ACTIVE_FILTER }
  );
  const { totalItems: countInactive, mutate: mutateCountInactive } = usePaginatedCollection(
    endpoints.user.list,
    { ...COUNT_OPTIONS, filters: INACTIVE_FILTER }
  );
  const tabCounts = {
    all: countAll,
    verified: countVerified,
    active: countActive,
    inactive: countInactive,
  };

  const handleConfirmToggle = useCallback(async () => {
    if (!toggleUser) return;
    const activate = !toggleUser.active;
    setToggling(true);
    try {
      await setUserActive(toggleUser.id, activate);
      toast.success(activate ? t('activate_success') : t('deactivate_success'));
      mutate();
      mutateCountActive();
      mutateCountInactive();
    } catch (toggleError) {
      toast.error(getErrorMessage(toggleError));
    } finally {
      setToggling(false);
      setToggleUser(null);
    }
  }, [toggleUser, mutate, mutateCountActive, mutateCountInactive, t]);

  const { onResetPage } = table;

  const handleSort = useCallback(
    (id) => {
      table.onSort(id);
      onResetPage();
    },
    [table, onResetPage]
  );

  const handleEditRow = useCallback((user) => {
    setSelectedUser(user);
    setQuickEditOpen(true);
  }, []);

  const handleCloseQuickEdit = useCallback(() => {
    setQuickEditOpen(false);
    setSelectedUser(null);
    mutate();
    mutateCountActive();
    mutateCountInactive();
  }, [mutate, mutateCountActive, mutateCountInactive]);

  const renderTable = () => {
    if (error) {
      return <LoadErrorContent error={error} onRetry={mutate} />;
    }

    return (
      <>
        <Box sx={{ position: 'relative' }}>
          <Scrollbar>
            <Table size="medium" sx={{ minWidth: 720 }}>
              <TableHeadCustom
                order={table.order}
                orderBy={table.orderBy}
                headCells={TABLE_HEAD}
                onSort={handleSort}
              />

              <TableBody>
                {users.map((user) => {
                  const name = `${user.firstname ?? ''} ${user.lastname ?? ''}`.trim();
                  const country = phoneCountry(user);
                  const role = user.platformRole?.toLowerCase();

                  return (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar alt={name} src={user.avatar}>
                            {user.firstname?.charAt(0)?.toUpperCase()}
                            {user.lastname?.charAt(0)?.toUpperCase()}
                          </Avatar>
                          <Stack sx={{ minWidth: 0 }}>
                            <Typography variant="subtitle2" noWrap>
                              {name || '—'}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.disabled' }} noWrap>
                              {user.email}
                            </Typography>
                          </Stack>
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          {country && <FlagIcon code={country} />}
                          <Typography variant="body2">{user.phone || '—'}</Typography>
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Label variant="soft" color={ROLE_COLOR_MAP[role] || 'default'}>
                          {t(`role_${role}`, { defaultValue: user.platformRole })}
                        </Label>
                      </TableCell>

                      <TableCell>
                        <Label variant="soft" color={user.active ? 'success' : 'error'}>
                          {user.active ? t('status_active') : t('status_inactive')}
                        </Label>
                      </TableCell>

                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        {user.id !== authUser?.id && (
                          <Tooltip
                            title={user.active ? t('deactivate_tooltip') : t('activate_tooltip')}
                          >
                            <IconButton
                              color={user.active ? 'default' : 'success'}
                              onClick={() => setToggleUser(user)}
                            >
                              <Iconify
                                icon={
                                  user.active ? 'solar:forbidden-circle-bold' : 'solar:check-circle-bold'
                                }
                              />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title={t('quick_edit_tooltip')}>
                          <IconButton onClick={() => handleEditRow(user)}>
                            <Iconify icon="solar:pen-bold" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}

                <TableNoData notFound={!loading && !users.length} />
              </TableBody>
            </Table>
          </Scrollbar>
        </Box>

        <TablePaginationCustom
          page={table.page}
          dense={table.dense}
          count={totalItems}
          rowsPerPage={table.rowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
          onPageChange={table.onChangePage}
          onChangeDense={table.onChangeDense}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </>
    );
  };

  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs
        heading={t('heading')}
        links={[
          { name: t('dashboard'), href: paths.dashboard.root },
          { name: t('heading'), href: paths.dashboard.user.root },
          { name: t('breadcrumb_list') },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.user.new}
            variant="contained"
            color="inherit"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            {t('new_button')}
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <Tabs
          value={currentTab}
          onChange={(_, value) => {
            setCurrentTab(value);
            onResetPage();
          }}
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
                <Label variant={currentTab === tab.value ? 'filled' : 'soft'} color={tab.color}>
                  {tabCounts[tab.value]}
                </Label>
              }
            />
          ))}
        </Tabs>

        <Stack direction="row" alignItems="center" spacing={2} sx={{ px: 2.5, py: 2 }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>{t('filter_role')}</InputLabel>
            <Select
              value={roleFilter}
              label={t('filter_role')}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                onResetPage();
              }}
            >
              <MenuItem value="all">{t('filter_role_all')}</MenuItem>
              {ROLE_OPTIONS.map((role) => (
                <MenuItem key={role} value={role}>
                  {t(`role_${role.toLowerCase()}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onResetPage();
            }}
            placeholder={t('search_placeholder')}
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

        {renderTable()}
      </Card>

      <UserQuickEditForm currentUser={selectedUser} open={quickEditOpen} onClose={handleCloseQuickEdit} />

      <ConfirmDialog
        open={!!toggleUser}
        onClose={() => {
          if (!toggling) setToggleUser(null);
        }}
        title={toggleUser?.active ? t('deactivate_title') : t('activate_title')}
        content={
          toggleUser
            ? t(toggleUser.active ? 'deactivate_confirm' : 'activate_confirm', {
                name:
                  `${toggleUser.firstname ?? ''} ${toggleUser.lastname ?? ''}`.trim() ||
                  toggleUser.email,
                interpolation: { escapeValue: false },
              })
            : ''
        }
        action={
          <Button
            variant="contained"
            color={toggleUser?.active ? 'error' : 'success'}
            loading={toggling}
            onClick={handleConfirmToggle}
          >
            {toggleUser?.active ? t('deactivate_button') : t('activate_button')}
          </Button>
        }
      />
    </DashboardContent>
  );
}
