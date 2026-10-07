'use client';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import { alpha, useTheme } from '@mui/material/styles';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';
import { SESSION_STATUS_COLORS, INVOICE_STATUS_COLORS } from 'src/utils/status';

import { useTranslate } from 'src/locales';
import { useGetUsers } from 'src/actions/user';
import { useGetInvoices } from 'src/actions/invoice';
import { DashboardContent } from 'src/layouts/dashboard';
import { useGetInstitutes } from 'src/actions/institute';
import { useGetPublicSessions } from 'src/actions/session-public';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { LoadingScreen } from 'src/components/loading-screen';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export function AdminDashboardView() {
  const theme = useTheme();
  const { user } = useAuthContext();
  const { t } = useTranslate('dashboard');
  const { t: tc } = useTranslate('common');

  const { users, usersLoading } = useGetUsers();
  const { institutes, institutesLoading } = useGetInstitutes();
  const { sessions, sessionsLoading } = useGetPublicSessions();
  const { invoices, invoicesLoading } = useGetInvoices();

  const isLoading = usersLoading || institutesLoading || sessionsLoading || invoicesLoading;

  const recentSessions = useMemo(
    () => (sessions || []).slice(0, 5),
    [sessions]
  );

  const recentInvoices = useMemo(
    () => (invoices || []).slice(0, 5),
    [invoices]
  );

  if (isLoading) {
    return (
      <DashboardContent>
        <LoadingScreen />
      </DashboardContent>
    );
  }

  const renderWelcome = () => (
    <Card
      sx={{
        p: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        bgcolor: alpha(theme.palette.primary.main, 0.08),
      }}
    >
      <Avatar
        alt={user?.displayName}
        src={user?.avatar}
        sx={{ width: 64, height: 64 }}
      >
        {(user?.firstName || user?.displayName || 'A').charAt(0).toUpperCase()}
      </Avatar>
      <Box>
        <Typography variant="h4">
          {t('greeting', { name: user?.firstName || user?.displayName || 'Admin' })}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          {t('admin_subtitle')}
        </Typography>
      </Box>
    </Card>
  );

  const renderKpis = () => (
    <Grid container spacing={3}>
      {[
        {
          title: t('users'),
          value: (users || []).length,
          icon: 'solar:users-group-rounded-bold-duotone',
          color: 'primary',
          href: paths.dashboard.user.list,
        },
        {
          title: t('institutes'),
          value: (institutes || []).length,
          icon: 'solar:buildings-bold-duotone',
          color: 'info',
          href: paths.dashboard.institute.root,
        },
        {
          title: t('sessions'),
          value: (sessions || []).length,
          icon: 'solar:calendar-bold-duotone',
          color: 'success',
          href: null,
        },
        {
          title: t('invoices'),
          value: (invoices || []).length,
          icon: 'solar:bill-list-bold-duotone',
          color: 'warning',
          href: paths.dashboard.invoice.root,
        },
      ].map((kpi) => (
        <Grid key={kpi.title} size={{ xs: 6, md: 3 }}>
          <Card
            component={kpi.href ? RouterLink : 'div'}
            href={kpi.href || undefined}
            sx={{
              p: 2.5,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              textDecoration: 'none',
              color: 'inherit',
              ...(kpi.href && {
                '&:hover': { boxShadow: theme.shadows[8] },
                transition: theme.transitions.create(['box-shadow']),
              }),
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                display: 'flex',
                borderRadius: '50%',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(theme.palette[kpi.color].main, 0.12),
                color: `${kpi.color}.main`,
              }}
            >
              <Iconify icon={kpi.icon} width={24} />
            </Box>
            <Stack>
              <Typography variant="h4">{kpi.value}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {kpi.title}
              </Typography>
            </Stack>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderRecentSessions = () => (
    <Card>
      <CardHeader title={t('recent_sessions')} />
      {recentSessions.length > 0 ? (
        <TableContainer sx={{ px: 1, pb: 2 }}>
          <Scrollbar>
            <Table size="small" sx={{ minWidth: 480 }}>
              <TableHead>
                <TableRow>
                  <TableCell>{t('assessment')}</TableCell>
                  <TableCell>{t('institute')}</TableCell>
                  <TableCell>{t('date')}</TableCell>
                  <TableCell>{t('status')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentSessions.map((session) => (
                  <TableRow key={session.id || session['@id']}>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {session.assessment?.label || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {session.institute?.label || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>{session.start ? fDate(session.start) : '—'}</TableCell>
                    <TableCell>
                      <Label variant="soft" color={SESSION_STATUS_COLORS[session.status] || 'default'}>
                        {session.status ? tc(`session_status_${session.status}`) : '—'}
                      </Label>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>
      ) : (
        <Typography variant="body2" sx={{ p: 3, color: 'text.secondary' }}>
          {t('no_sessions')}
        </Typography>
      )}
    </Card>
  );

  const renderRecentInvoices = () => (
    <Card>
      <CardHeader
        title={t('recent_invoices')}
        action={
          <Button
            size="small"
            color="inherit"
            component={RouterLink}
            href={paths.dashboard.invoice.root}
            endIcon={<Iconify icon="eva:arrow-ios-forward-fill" />}
          >
            {t('view_all')}
          </Button>
        }
      />
      {recentInvoices.length > 0 ? (
        <TableContainer sx={{ px: 1, pb: 2 }}>
          <Scrollbar>
            <Table size="small" sx={{ minWidth: 360 }}>
              <TableHead>
                <TableRow>
                  <TableCell>{t('number')}</TableCell>
                  <TableCell>{t('type')}</TableCell>
                  <TableCell>{t('amount')}</TableCell>
                  <TableCell>{t('status')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentInvoices.map((invoice) => (
                  <TableRow key={invoice.id || invoice['@id']}>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {invoice.invoiceNumber || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" noWrap>
                        {invoice.type || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {invoice.totalTTC != null ? fCurrency(invoice.totalTTC) : '—'}
                    </TableCell>
                    <TableCell>
                      <Label variant="soft" color={INVOICE_STATUS_COLORS[invoice.status] || 'default'}>
                        {invoice.status ? tc(`invoice_status_${invoice.status}`) : '—'}
                      </Label>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>
      ) : (
        <Typography variant="body2" sx={{ p: 3, color: 'text.secondary' }}>
          {t('no_invoices')}
        </Typography>
      )}
    </Card>
  );

  const renderQuickActions = () => (
    <Card>
      <CardHeader title={t('quick_actions')} />
      <Stack spacing={1.5} sx={{ p: 3 }}>
        <Button
          component={RouterLink}
          href={paths.dashboard.user.list}
          variant="soft"
          color="primary"
          startIcon={<Iconify icon="solar:users-group-rounded-bold" />}
          sx={{ justifyContent: 'flex-start' }}
        >
          {t('manage_users')}
        </Button>

        <Button
          component={RouterLink}
          href={paths.dashboard.institute.root}
          variant="soft"
          color="info"
          startIcon={<Iconify icon="solar:buildings-bold" />}
          sx={{ justifyContent: 'flex-start' }}
        >
          {t('manage_institutes')}
        </Button>

        <Button
          component={RouterLink}
          href={paths.dashboard.assessment.root}
          variant="soft"
          color="success"
          startIcon={<Iconify icon="solar:document-text-bold" />}
          sx={{ justifyContent: 'flex-start' }}
        >
          {t('manage_assessments')}
        </Button>

        <Button
          component={RouterLink}
          href={paths.dashboard.invoice.root}
          variant="soft"
          color="warning"
          startIcon={<Iconify icon="solar:bill-list-bold" />}
          sx={{ justifyContent: 'flex-start' }}
        >
          {t('view_invoices')}
        </Button>
      </Stack>
    </Card>
  );

  return (
    <DashboardContent maxWidth="xl">
      <Stack spacing={3}>
        {renderWelcome()}
        {renderKpis()}

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Stack spacing={3}>
              {renderRecentSessions()}
              {renderRecentInvoices()}
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            {renderQuickActions()}
          </Grid>
        </Grid>
      </Stack>
    </DashboardContent>
  );
}
