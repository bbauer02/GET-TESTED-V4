'use client';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { useGetLevels, useGetAssessments, useGetPublicSessions } from 'src/actions/session-public';

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

  const { sessions, sessionsLoading, sessionsEmpty } = useGetPublicSessions(filters);
  const { assessments, assessmentsLoading } = useGetAssessments();
  const { levels, levelsLoading } = useGetLevels();

  const selectedAssessment = assessments.find((a) => a.id === filters.assessment) || null;

  const handleChangeFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const paginatedSessions = sessions.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(sessions.length / ITEMS_PER_PAGE);

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

      {/* Empty state */}
      {sessionsEmpty && !sessionsLoading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {t('no_sessions')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('no_sessions_hint')}
          </Typography>
        </Box>
      )}

      {/* Grid */}
      {!sessionsLoading && !sessionsEmpty && (
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
            {paginatedSessions.map((session) => (
              <SessionCard key={session.id || session['@id']} session={session} basePath={basePath} />
            ))}
          </Box>

          {totalPages > 1 && (
            <Pagination
              page={page}
              count={totalPages}
              onChange={(e, v) => setPage(v)}
              sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}
            />
          )}
        </>
      )}
    </Container>
  );
}
