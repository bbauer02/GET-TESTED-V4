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

/**
 * Indicateurs du back-office plateforme (admin), calculés en base par l'API :
 * users, institutes, sessions, sessionsByStatus, enrollments, invoices,
 * invoicesByStatus ({ PAID: { count, amount }, ... }), commissionsHT.
 */
export function useGetAdminStats() {
  const { data, isLoading, error, isValidating, mutate } = useSWR(
    endpoints.admin.stats,
    fetcher,
    swrOptions
  );

  const memoizedValue = useMemo(
    () => ({
      stats: data || null,
      statsLoading: isLoading,
      statsError: error,
      statsValidating: isValidating,
      statsMutate: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}
