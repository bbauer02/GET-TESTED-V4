import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axios, { fetcher, endpoints, extractMembers, extractTotalItems } from 'src/lib/axios';

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

// ----------------------------------------------------------------------

/**
 * Suppression définitive (admin plateforme). L'API refuse (409) si l'institut
 * possède des sessions ou des factures.
 */
export async function deleteInstitute(instituteId) {
  await axios.delete(`${endpoints.institute.details}/${instituteId}`);
  await mutate(endpoints.institute.list);
}

// ----------------------------------------------------------------------

/**
 * Validation / suspension / réactivation d'un institut (admin plateforme).
 * @param {'PENDING_REVIEW'|'ACTIVE'|'SUSPENDED'} status
 */
export async function updateInstituteStatus(instituteId, status) {
  const res = await axios.patch(
    endpoints.institute.status(instituteId),
    { status },
    { headers: { 'Content-Type': 'application/merge-patch+json' } }
  );
  await mutate(`${endpoints.institute.details}/${instituteId}`);
  return res.data;
}

/**
 * Désigne l'administrateur d'un institut par email : crée le compte si besoin
 * et envoie l'invitation (lien de définition du mot de passe).
 */
export async function inviteInstituteAdmin(instituteId, { email, firstname, lastname }) {
  const res = await axios.post(endpoints.institute.inviteMember(instituteId), {
    email,
    firstname,
    lastname,
    role: 'ADMIN',
  });
  return res.data;
}
