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

export function useGetDocumentTemplates(instituteId) {
  const url = instituteId ? endpoints.documentTemplate.list(instituteId) : '';

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, swrOptions);

  const templates = extractMembers(data);

  const memoizedValue = useMemo(
    () => ({
      templates,
      templatesLoading: isLoading,
      templatesError: error,
      templatesValidating: isValidating,
      templatesEmpty: !isLoading && !isValidating && !templates.length,
      templatesMutate: mutate,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetMasterTemplates() {
  const url = endpoints.documentTemplate.masterList;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, swrOptions);

  const templates = extractMembers(data);

  const memoizedValue = useMemo(
    () => ({
      templates,
      templatesLoading: isLoading,
      templatesError: error,
      templatesValidating: isValidating,
      templatesEmpty: !isLoading && !isValidating && !templates.length,
      templatesMutate: mutate,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetDocumentTypes() {
  const url = endpoints.documentType.list;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, swrOptions);

  const documentTypes = extractMembers(data);

  const memoizedValue = useMemo(
    () => ({
      documentTypes,
      documentTypesLoading: isLoading,
      documentTypesError: error,
      documentTypesValidating: isValidating,
      documentTypesEmpty: !isLoading && !isValidating && !documentTypes.length,
      documentTypesMutate: mutate,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetDocumentTemplate(templateId) {
  const url = templateId ? `${endpoints.documentTemplate.details}/${templateId}` : '';

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      template: data ?? null,
      templateLoading: isLoading,
      templateError: error,
      templateValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}
