'use client';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { useGetLevels, useGetAssessments, useGetPublicSessions } from 'src/actions/session-public';

import { Iconify } from 'src/components/iconify';
import { LoadErrorContent } from 'src/components/load-error';

import { useAuthContext } from 'src/auth/hooks';

import { SessionCard } from '../session-card';
import { SessionFilters } from '../session-filters';

// ----------------------------------------------------------------------

const ITEMS_PER_PAGE = 12;

export function SessionSearchView() {
  const { t } = useTranslate('sessions');
  const { authenticated } = useAuthContext();
  const basePath = authenticated ? paths.dashboard.sessionSearch.root : null;

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ assessment: '', level: '' });

  const { sessions, sessionsTotal, sessionsLoading, sessionsEmpty, sessionsError, sessionsMutate } =
    useGetPublicSessions(filters, { page, itemsPerPage: ITEMS_PER_PAGE });
  const { assessments, assessmentsLoading } = useGetAssessments();
  const { levels, levelsLoading } = useGetLevels();

  const selectedAssessment = assessments.find((a) => a.id === filters.assessment) || null;

  const handleChangeFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  // Pagination côté serveur
  const totalPages = Math.ceil(sessionsTotal / ITEMS_PER_PAGE);
  const hasFilters = !!filters.assessment || !!filters.level;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
        <Typography variant="h3" sx={{ mb: 1 }}>
          {t('search_title')}
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 600, mx: 'auto' }}>
          {t('search_subtitle')}
        </Typography>
      </Box>

      {/* Filters */}
      <SessionFilters
        filters={filters}
        onChangeFilter={handleChangeFilter}
        assessments={assessments}
        levels={levels}
        assessmentsLoading={assessmentsLoading}
        levelsLoading={levelsLoading}
        selectedAssessment={selectedAssessment}
      />

      {/* Loading */}
      {sessionsLoading && (
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' } }}>
          {[...Array(6)].map((_, i) => (
            <Box
              key={i}
              sx={{
                height: 320,
                borderRadius: 2,
                bgcolor: 'background.neutral',
                animation: 'pulse 1.5s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 0.4 },
                  '50%': { opacity: 0.7 },
                },
              }}
            />
          ))}
        </Box>
      )}

      {/* Error state */}
      {sessionsError && !sessionsLoading && (
        <LoadErrorContent error={sessionsError} onRetry={sessionsMutate} />
      )}

      {/* Empty state */}
      {sessionsEmpty && !sessionsLoading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {t('no_sessions')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('no_sessions_hint')}
          </Typography>
          {hasFilters && (
            <Button
              variant="outlined"
              color="inherit"
              sx={{ mt: 3 }}
              startIcon={<Iconify icon="solar:restart-bold" />}
              onClick={() => {
                setFilters({ assessment: '', level: '' });
                setPage(1);
              }}
            >
              {t('reset_filters')}
            </Button>
          )}
        </Box>
      )}

      {/* Grid */}
      {!sessionsLoading && !sessionsEmpty && !sessionsError && (
        <>
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
            {sessions.map((session) => (
              <SessionCard key={session.id || session['@id']} session={session} basePath={basePath} />
            ))}
          </Box>

          {totalPages > 1 && (
            <Pagination
              page={page}
              count={totalPages}
              onChange={(e, v) => {
                setPage(v);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}
            />
          )}
        </>
      )}
    </Container>
  );
}
