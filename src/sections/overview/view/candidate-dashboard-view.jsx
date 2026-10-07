'use client';

import dayjs from 'dayjs';
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
import { SESSION_STATUS_COLORS } from 'src/utils/status';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { useGetMyEnrollments } from 'src/actions/mes-inscriptions';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export function CandidateDashboardView() {
  const theme = useTheme();
  const { user } = useAuthContext();
  const { t } = useTranslate('dashboard');
  const { t: tc } = useTranslate('common');
  const { enrollments, enrollmentsLoading } = useGetMyEnrollments();

  const stats = useMemo(() => {
    const now = dayjs();
    const all = enrollments || [];
    const upcoming = all.filter((e) => e.session?.start && dayjs(e.session.start).isAfter(now));
    const past = all.filter((e) => e.session?.start && dayjs(e.session.start).isBefore(now));
    const withResults = all.filter((e) =>
      (e.enrollmentExams || []).some((ee) => ee.finalScore != null)
    );

    return {
      total: all.length,
      upcoming: upcoming.length,
      past: past.length,
      withResults: withResults.length,
    };
  }, [enrollments]);

  const upcomingEnrollments = useMemo(() => {
    const now = dayjs();
    return (enrollments || [])
      .filter((e) => e.session?.start && dayjs(e.session.start).isAfter(now))
      .sort((a, b) => dayjs(a.session.start).valueOf() - dayjs(b.session.start).valueOf())
      .slice(0, 5);
  }, [enrollments]);

  const recentResults = useMemo(
    () =>
      (enrollments || [])
        .filter((e) => (e.enrollmentExams || []).some((ee) => ee.finalScore != null))
        .slice(0, 5),
    [enrollments]
  );

  if (enrollmentsLoading) {
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
        alt={user?.displayName || user?.firstName}
        src={user?.avatar}
        sx={{ width: 64, height: 64 }}
      >
        {(user?.firstName || user?.displayName || '?').charAt(0).toUpperCase()}
      </Avatar>
      <Box>
        <Typography variant="h4">
          {t('greeting', { name: user?.firstName || user?.displayName || t('candidate') })}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          {t('candidate_subtitle')}
        </Typography>
      </Box>
    </Card>
  );

  const renderKpis = () => (
    <Grid container spacing={3}>
      {[
        { title: t('total_enrollments'), value: stats.total, icon: 'solar:document-text-bold-duotone', color: 'primary' },
        { title: t('upcoming'), value: stats.upcoming, icon: 'solar:calendar-bold-duotone', color: 'info' },
        { title: t('completed'), value: stats.past, icon: 'solar:check-circle-bold-duotone', color: 'success' },
        { title: t('results'), value: stats.withResults, icon: 'solar:clipboard-check-bold-duotone', color: 'warning' },
      ].map((kpi) => (
        <Grid key={kpi.title} size={{ xs: 6, md: 3 }}>
          <Card sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
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

  const renderUpcoming = () => (
    <Card>
      <CardHeader
        title={t('upcoming_sessions')}
        action={
          <Button
            size="small"
            color="inherit"
            component={RouterLink}
            href={paths.dashboard.mesInscriptions.root}
            endIcon={<Iconify icon="eva:arrow-ios-forward-fill" />}
          >
            {t('view_all')}
          </Button>
        }
      />

      {upcomingEnrollments.length > 0 ? (
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
                {upcomingEnrollments.map((enrollment) => {
                  const session = enrollment.session || {};
                  return (
                    <TableRow key={enrollment.id || enrollment['@id']}>
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
                  );
                })}
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>
      ) : (
        <Box sx={{ p: 3 }}>
          <EmptyContent
            title={t('no_upcoming_sessions')}
            action={
              <Button
                component={RouterLink}
                href={paths.dashboard.sessionSearch.root}
                variant="contained"
                startIcon={<Iconify icon="eva:search-fill" />}
                sx={{ mt: 2 }}
              >
                {t('find_session')}
              </Button>
            }
          />
        </Box>
      )}
    </Card>
  );

  const renderQuickActions = () => (
    <Card>
      <CardHeader title={t('quick_actions')} />
      <Stack spacing={1.5} sx={{ p: 3 }}>
        <Button
          component={RouterLink}
          href={paths.dashboard.sessionSearch.root}
          variant="soft"
          color="primary"
          startIcon={<Iconify icon="eva:search-fill" />}
          sx={{ justifyContent: 'flex-start' }}
        >
          {t('find_session')}
        </Button>

        <Button
          component={RouterLink}
          href={paths.dashboard.mesInscriptions.root}
          variant="soft"
          color="info"
          startIcon={<Iconify icon="solar:document-text-bold" />}
          sx={{ justifyContent: 'flex-start' }}
        >
          {t('my_enrollments')}
        </Button>

        <Button
          component={RouterLink}
          href={paths.dashboard.profile}
          variant="soft"
          color="secondary"
          startIcon={<Iconify icon="solar:user-bold" />}
          sx={{ justifyContent: 'flex-start' }}
        >
          {t('my_profile')}
        </Button>
      </Stack>
    </Card>
  );

  const renderResults = () => {
    if (!recentResults.length) return null;

    return (
      <Card>
        <CardHeader title={t('latest_results')} />
        <TableContainer sx={{ px: 1, pb: 2 }}>
          <Scrollbar>
            <Table size="small" sx={{ minWidth: 360 }}>
              <TableHead>
                <TableRow>
                  <TableCell>{t('assessment')}</TableCell>
                  <TableCell>{t('score')}</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {recentResults.map((enrollment) => {
                  const session = enrollment.session || {};
                  const enrollmentExams = enrollment.enrollmentExams || [];

                  return (
                    <TableRow key={enrollment.id || enrollment['@id']}>
                      <TableCell>
                        <Typography variant="body2" noWrap>
                          {session.assessment?.label || '—'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {session.start ? fDate(session.start) : ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                          {enrollmentExams
                            .filter((ee) => ee.finalScore != null)
                            .map((ee) => {
                              const exam = ee.scheduledExam?.exam;
                              const total = exam?.nbrQuestions;
                              const display = total ? `${ee.finalScore}/${total}` : `${ee.finalScore}`;
                              return (
                                <Label
                                  key={ee.id || ee['@id']}
                                  variant="soft"
                                  color={ee.status === 'PASSED' ? 'success' : ee.status === 'FAILED' ? 'error' : 'default'}
                                >
                                  {display}
                                </Label>
                              );
                            })}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>
      </Card>
    );
  };

  return (
    <DashboardContent maxWidth="xl">
      <Stack spacing={3}>
        {renderWelcome()}
        {renderKpis()}

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Stack spacing={3}>
              {renderUpcoming()}
              {renderResults()}
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
