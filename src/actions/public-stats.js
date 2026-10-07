import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

const swrOptions = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

export function useGetPublicStats() {
  const { data, isLoading, error } = useSWR(endpoints.publicStats, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      stats: data || null,
      statsLoading: isLoading,
      statsError: error,
    }),
    [data, error, isLoading]
  );

  return memoizedValue;
}
