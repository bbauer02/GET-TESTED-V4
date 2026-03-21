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

export function useGetInvoices() {
  const url = `${endpoints.invoice.list}?businessType=PLATFORM_COMMISSION`;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      invoices: extractMembers(data),
      invoicesTotal: extractTotalItems(data),
      invoicesLoading: isLoading,
      invoicesError: error,
      invoicesValidating: isValidating,
      invoicesEmpty: !isLoading && !isValidating && !extractMembers(data).length,
      invoicesMutate: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetInvoice(invoiceId) {
  const url = invoiceId ? endpoints.invoice.details(invoiceId) : '';

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      invoice: data ?? null,
      invoiceLoading: isLoading,
      invoiceError: error,
      invoiceValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetInstituteInvoices(instituteId) {
  const url = instituteId ? endpoints.invoice.instituteInvoices(instituteId) : '';

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      invoices: extractMembers(data),
      invoicesTotal: extractTotalItems(data),
      invoicesLoading: isLoading,
      invoicesError: error,
      invoicesValidating: isValidating,
      invoicesEmpty: !isLoading && !isValidating && !extractMembers(data).length,
      invoicesMutate: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}
