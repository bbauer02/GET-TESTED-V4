import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints, extractMembers, normalizeExam } from 'src/lib/axios';

// ----------------------------------------------------------------------

const swrOptions = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

// ----------------------------------------------------------------------

export function useGetExams() {
  const url = endpoints.exam.list;

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  const exams = extractMembers(data).map(normalizeExam);

  const memoizedValue = useMemo(
    () => ({
      exams,
      examsLoading: isLoading,
      examsError: error,
      examsValidating: isValidating,
      examsEmpty: !isLoading && !isValidating && !exams.length,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetLevels() {
  const url = endpoints.level.list;

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  const levels = extractMembers(data);

  const memoizedValue = useMemo(
    () => ({
      levels,
      levelsLoading: isLoading,
      levelsError: error,
      levelsValidating: isValidating,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetAssessmentExams(assessmentId) {
  const url = assessmentId ? `/api/assessments/${assessmentId}/exams` : '';

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  const exams = extractMembers(data).map(normalizeExam);

  const memoizedValue = useMemo(
    () => ({
      exams,
      examsLoading: isLoading,
      examsError: error,
      examsValidating: isValidating,
      examsEmpty: !isLoading && !isValidating && !exams.length,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetExam(examId) {
  const url = examId ? `${endpoints.exam.details}/${examId}` : '';

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      exam: normalizeExam(data),
      examLoading: isLoading,
      examError: error,
      examValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}
