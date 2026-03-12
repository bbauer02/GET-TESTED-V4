import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints, extractMembers } from 'src/lib/axios';

// ----------------------------------------------------------------------

const swrOptions = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

// ----------------------------------------------------------------------

export function useGetAssessments() {
  const url = endpoints.assessment.list;

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

// ----------------------------------------------------------------------

export function useGetAssessment(assessmentId) {
  const url = assessmentId ? `${endpoints.assessment.details}/${assessmentId}` : '';

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      assessment: data,
      assessmentLoading: isLoading,
      assessmentError: error,
      assessmentValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}
