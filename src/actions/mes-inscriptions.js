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

export function useGetMyEnrollments() {
  const url = endpoints.enrollment.myEnrollments;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, swrOptions);

  const enrollments = extractMembers(data);

  const memoizedValue = useMemo(
    () => ({
      enrollments,
      enrollmentsLoading: isLoading,
      enrollmentsError: error,
      enrollmentsValidating: isValidating,
      enrollmentsEmpty: !isLoading && !isValidating && !enrollments.length,
      enrollmentsMutate: mutate,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetMyEnrollment(enrollmentId) {
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
