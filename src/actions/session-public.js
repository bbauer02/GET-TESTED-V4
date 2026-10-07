import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints, normalizeExam, extractMembers, extractTotalItems } from 'src/lib/axios';

// ----------------------------------------------------------------------

/**
 * Enrich session's scheduledExams with full exam data (including option/written booleans)
 * because the session endpoint doesn't serialize those fields.
 */
function enrichSessionExams(session, examsMap) {
  if (!session) return session;
  const key = session.scheduledExams ? 'scheduledExams' : 'scheduled_exams';
  const list = session[key];
  if (!Array.isArray(list)) return session;
  return {
    ...session,
    [key]: list.map((se) => {
      const examId = se.exam?.id;
      const fullExam = examId && examsMap.get(examId);
      return {
        ...se,
        exam: fullExam ? { ...se.exam, ...fullExam } : normalizeExam(se.exam),
      };
    }),
  };
}

const swrOptions = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

// ----------------------------------------------------------------------

/**
 * Sessions ouvertes, filtrées et paginées par l'API (test, niveau, ordre chronologique).
 */
export function useGetPublicSessions(filters = {}, { page = 1, itemsPerPage = 12 } = {}) {
  const params = {
    status: 'OPEN',
    page,
    itemsPerPage,
    'order[start]': 'asc',
    ...(filters.assessment && { assessment: `/api/assessments/${filters.assessment}` }),
    ...(filters.level && { level: `/api/levels/${filters.level}` }),
  };

  const { data, isLoading, error, isValidating, mutate } = useSWR([endpoints.session.list, { params }], fetcher, {
    ...swrOptions,
    keepPreviousData: true,
  });

  // Fetch all exams to get full data (option/written fields)
  const { data: examsData } = useSWR(endpoints.exam.list, fetcher, swrOptions);

  const memoizedValue = useMemo(() => {
    // Build a map of exam id → full normalized exam
    const examsMap = new Map();
    extractMembers(examsData).forEach((e) => {
      examsMap.set(e.id, normalizeExam(e));
    });

    const sessions = extractMembers(data).map((s) => enrichSessionExams(s, examsMap));

    return {
      sessions,
      sessionsTotal: extractTotalItems(data),
      sessionsLoading: isLoading,
      sessionsError: error,
      sessionsValidating: isValidating,
      sessionsEmpty: !isLoading && !error && !sessions.length,
      sessionsMutate: mutate,
    };
  }, [data, examsData, error, isLoading, isValidating, mutate]);

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetPublicSession(sessionId) {
  const url = sessionId ? endpoints.session.details(sessionId) : '';

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  // Fetch all exams to get full data (option/written fields)
  const { data: examsData } = useSWR(endpoints.exam.list, fetcher, swrOptions);

  const memoizedValue = useMemo(() => {
    const examsMap = new Map();
    extractMembers(examsData).forEach((e) => {
      examsMap.set(e.id, normalizeExam(e));
    });

    return {
      session: enrichSessionExams(data, examsMap) || null,
      sessionLoading: isLoading,
      sessionError: error,
      sessionValidating: isValidating,
    };
  }, [data, examsData, error, isLoading, isValidating]);

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetAssessments() {
  const url = endpoints.assessment.list;

  const { data, isLoading } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(() => ({
    assessments: extractMembers(data),
    assessmentsLoading: isLoading,
  }), [data, isLoading]);

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetLevels() {
  const url = endpoints.level.list;

  const { data, isLoading } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(() => ({
    levels: extractMembers(data),
    levelsLoading: isLoading,
  }), [data, isLoading]);

  return memoizedValue;
}
