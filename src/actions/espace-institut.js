import { useMemo } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';

import axios, { fetcher, endpoints, normalizeExam, extractMembers } from 'src/lib/axios';

// ----------------------------------------------------------------------

const swrOptions = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

// ----------------------------------------------------------------------

export function useGetInstituteFiche(id) {
  const url = id ? `${endpoints.institute.details}/${id}` : '';

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      institute: data || null,
      instituteLoading: isLoading,
      instituteError: error,
      instituteValidating: isValidating,
      instituteMutate: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export async function updateMembershipRole({ membershipId, role, instituteId }) {
  const response = await axios.patch(
    endpoints.institute.membership(membershipId),
    { role },
    { headers: { 'Content-Type': 'application/merge-patch+json' } }
  );

  if (instituteId) {
    globalMutate(endpoints.institute.memberships(instituteId));
  }

  return response.data;
}

// ----------------------------------------------------------------------

export async function deleteEnrollment(enrollmentId) {
  const id = String(enrollmentId).split('/').pop();
  const response = await axios.delete(`/api/enrollments/${id}`);
  return response.data;
}

// ----------------------------------------------------------------------

export function useGetInstituteMembres(id) {
  const url = id ? endpoints.institute.memberships(id) : '';

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  const membres = extractMembers(data);

  const memoizedValue = useMemo(
    () => ({
      membres,
      membresLoading: isLoading,
      membresError: error,
      membresValidating: isValidating,
      membresEmpty: !isLoading && !isValidating && !membres.length,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetInstituteSessions(id) {
  const url = id ? endpoints.institute.sessions(id) : '';

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, swrOptions);

  const sessions = extractMembers(data);

  const memoizedValue = useMemo(
    () => ({
      sessions,
      sessionsLoading: isLoading,
      sessionsError: error,
      sessionsMutate: mutate,
      sessionsValidating: isValidating,
      sessionsEmpty: !isLoading && !isValidating && !sessions.length,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

/**
 * Enrich session's scheduledExams with full exam data (option/written fields
 * are missing from the session endpoint's serialization).
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

export function useGetSession(sessionId) {
  const url = sessionId ? `/api/sessions/${sessionId}` : '';

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, swrOptions);

  // Fetch all exams to get full data (option/written fields)
  const { data: examsData } = useSWR(endpoints.exam.list, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => {
      const examsMap = new Map();
      extractMembers(examsData).forEach((e) => {
        examsMap.set(e.id, normalizeExam(e));
      });

      return {
        session: enrichSessionExams(data, examsMap) || null,
        sessionLoading: isLoading,
        sessionError: error,
        sessionValidating: isValidating,
        sessionMutate: mutate,
      };
    },
    [data, examsData, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetInstituteEnrollments(id) {
  // Endpoint dédié : la liste des sessions n'embarque plus les inscrits (seulement leur nombre)
  const url = id ? endpoints.enrollment.instituteEnrollments(id) : '';

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(() => {
    const enrollments = extractMembers(data);
    return {
      enrollments,
      enrollmentsLoading: isLoading,
      enrollmentsError: error,
      enrollmentsMutate: mutate,
      enrollmentsValidating: isValidating,
      enrollmentsEmpty: !isLoading && !isValidating && !enrollments.length,
    };
  }, [data, error, isLoading, isValidating, mutate]);

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetInstituteEnrollment(enrollmentId) {
  const url = enrollmentId ? endpoints.enrollment.details(enrollmentId) : '';

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      enrollment: data || null,
      enrollmentLoading: isLoading,
      enrollmentError: error,
      enrollmentValidating: isValidating,
      enrollmentMutate: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetInstituteAssessments(id) {
  const url = id ? `/api/institutes/${id}/assessments` : '';

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  const assessments = extractMembers(data);

  const memoizedValue = useMemo(
    () => ({
      assessments,
      assessmentsLoading: isLoading,
      assessmentsError: error,
      assessmentsValidating: isValidating,
      assessmentsEmpty: !isLoading && !isValidating && !assessments.length,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}
