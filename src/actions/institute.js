import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints, extractMembers, extractTotalItems } from 'src/lib/axios';

// ----------------------------------------------------------------------

const swrOptions = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

// ----------------------------------------------------------------------

export function useGetInstitutes() {
  const url = endpoints.institute.list;

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  const institutes = extractMembers(data);

  const memoizedValue = useMemo(
    () => ({
      institutes,
      institutesLoading: isLoading,
      institutesError: error,
      institutesValidating: isValidating,
      institutesEmpty: !isLoading && !isValidating && !institutes.length,
      institutesTotalCount: extractTotalItems(data),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetInstitute(instituteId) {
  const url = instituteId ? `${endpoints.institute.details}/${instituteId}` : '';

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      institute: data,
      instituteLoading: isLoading,
      instituteError: error,
      instituteValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetInstituteMemberships(instituteId) {
  const url = instituteId ? endpoints.institute.memberships(instituteId) : '';

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  const members = extractMembers(data);

  const memoizedValue = useMemo(
    () => ({
      memberships: members,
      membershipsLoading: isLoading,
      membershipsError: error,
      membershipsValidating: isValidating,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetInstituteSessions(instituteId) {
  const url = instituteId ? endpoints.institute.sessions(instituteId) : '';

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  const sessions = extractMembers(data);

  const memoizedValue = useMemo(
    () => ({
      sessions,
      sessionsLoading: isLoading,
      sessionsError: error,
      sessionsValidating: isValidating,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}
