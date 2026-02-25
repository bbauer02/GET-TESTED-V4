import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/lib/axios';

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

  const memoizedValue = useMemo(
    () => ({
      institutes: Array.isArray(data) ? data : [],
      institutesLoading: isLoading,
      institutesError: error,
      institutesValidating: isValidating,
      institutesEmpty: !isLoading && !isValidating && !(Array.isArray(data) && data.length),
      institutesTotalCount: Array.isArray(data) ? data.length : 0,
    }),
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
