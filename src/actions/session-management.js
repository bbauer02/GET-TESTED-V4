import { useMemo } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';

import axios, { fetcher, endpoints, extractMembers } from 'src/lib/axios';

// ----------------------------------------------------------------------

const swrOptions = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  shouldRetryOnError: false,
};

const MERGE_PATCH_HEADERS = { headers: { 'Content-Type': 'application/merge-patch+json' } };

function toId(value) {
  if (!value) return null;
  return String(value).split('/').pop();
}

// ----------------------------------------------------------------------
// Centres d'examen
// ----------------------------------------------------------------------

export function useGetExamCenters(instituteId) {
  const url = instituteId ? endpoints.institute.examCenters(instituteId) : '';

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(() => {
    const examCenters = extractMembers(data);
    return {
      examCenters,
      examCentersLoading: isLoading,
      examCentersError: error,
      examCentersValidating: isValidating,
      examCentersEmpty: !isLoading && !isValidating && !examCenters.length,
      examCentersMutate: mutate,
    };
  }, [data, error, isLoading, isValidating, mutate]);

  return memoizedValue;
}

export async function createExamCenter(instituteId, payload) {
  const response = await axios.post(endpoints.institute.examCenters(instituteId), payload);
  globalMutate(endpoints.institute.examCenters(instituteId));
  return response.data;
}

export function getExamCenterIri(examCenter) {
  if (!examCenter) return null;
  if (typeof examCenter === 'string') return examCenter;
  return examCenter['@id'] || endpoints.examCenter.details(examCenter.id);
}

// ----------------------------------------------------------------------
// Épreuves planifiées
// ----------------------------------------------------------------------

export async function deleteScheduledExam(scheduledExamId) {
  const response = await axios.delete(`/api/scheduled-exams/${toId(scheduledExamId)}`);
  return response.data;
}

// ----------------------------------------------------------------------
// Session : annulation
// ----------------------------------------------------------------------

export async function getSessionCancelPreview(sessionId) {
  const response = await axios.get(endpoints.session.cancelPreview(toId(sessionId)));
  return response.data;
}

export async function transitionSession(sessionId, transition, extra = {}) {
  const response = await axios.patch(
    `/api/sessions/${toId(sessionId)}/transition`,
    { transition, ...extra },
    MERGE_PATCH_HEADERS
  );
  return response.data;
}

/** Suppression d'une session en brouillon (soft delete côté API). */
export async function deleteDraftSession(sessionId) {
  await axios.delete(`/api/sessions/${toId(sessionId)}`);
}

// ----------------------------------------------------------------------
// Inscriptions
// ----------------------------------------------------------------------

export async function updateEnrollmentInformation(enrollmentId, information) {
  const id = toId(enrollmentId);
  const response = await axios.patch(
    endpoints.enrollment.details(id),
    { information: information || null },
    MERGE_PATCH_HEADERS
  );
  globalMutate(endpoints.enrollment.details(id));
  return response.data;
}

export async function getEnrollmentRefundPreview(enrollmentId) {
  const response = await axios.get(endpoints.enrollment.refundPreview(toId(enrollmentId)));
  return response.data;
}

export async function deleteEnrollmentSession(enrollmentId) {
  const response = await axios.delete(endpoints.enrollment.details(toId(enrollmentId)));
  return response.data;
}

export async function transferEnrollment(enrollmentId, targetSessionId) {
  const response = await axios.post(endpoints.enrollment.transfer(toId(enrollmentId)), {
    targetSessionId: toId(targetSessionId),
  });
  return response.data;
}

export async function sendEnrollmentSms(enrollmentId, message) {
  const response = await axios.post(endpoints.enrollment.sendSms(toId(enrollmentId)), { message });
  return response.data;
}

// ----------------------------------------------------------------------
// Documents
// ----------------------------------------------------------------------

export function useGetSessionDocumentPublications(sessionId) {
  const url = sessionId ? endpoints.session.documentPublications(toId(sessionId)) : '';

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(() => {
    const publications = extractMembers(data);
    return {
      publications,
      publicationsLoading: isLoading,
      publicationsError: error,
      publicationsValidating: isValidating,
      publicationsMutate: mutate,
    };
  }, [data, error, isLoading, isValidating, mutate]);

  return memoizedValue;
}

export function useGetDocumentTypes() {
  const { data, isLoading, error } = useSWR(endpoints.documentType.list, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      documentTypes: extractMembers(data),
      documentTypesLoading: isLoading,
      documentTypesError: error,
    }),
    [data, error, isLoading]
  );

  return memoizedValue;
}

export function useGetEnrollmentDocuments(enrollmentId) {
  const url = enrollmentId ? endpoints.enrollment.documents(toId(enrollmentId)) : '';

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(() => {
    const documents = Array.isArray(data) ? data : extractMembers(data);
    return {
      documents,
      documentsLoading: isLoading,
      documentsError: error,
      documentsValidating: isValidating,
      documentsMutate: mutate,
    };
  }, [data, error, isLoading, isValidating, mutate]);

  return memoizedValue;
}

export async function fetchSessionDocumentsBatch(sessionId, { documentType, enrollmentIds, force }) {
  const params = {
    documentType,
    enrollmentIds: (enrollmentIds || []).map(toId).join(','),
  };
  if (force) params.force = 1;

  const response = await axios.get(endpoints.session.documentsBatch(toId(sessionId)), { params });
  return response.data;
}
