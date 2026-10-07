import useSWR from 'swr';
import { useMemo } from 'react';

import axios, { fetcher, endpoints, extractMembers } from 'src/lib/axios';

// ----------------------------------------------------------------------

const swrOptions = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

// ----------------------------------------------------------------------

export function useGetUsers() {
  const url = endpoints.user.list;

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  const users = extractMembers(data);

  const memoizedValue = useMemo(
    () => ({
      users,
      usersLoading: isLoading,
      usersError: error,
      usersValidating: isValidating,
      usersEmpty: !isLoading && !isValidating && !users.length,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetUser(userId) {
  const url = userId ? `${endpoints.user.details}/${userId}` : '';

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      user: data,
      userLoading: isLoading,
      userError: error,
      userValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

/**
 * Création d'un compte par l'admin plateforme : compte inactif + email d'invitation
 * (définition du mot de passe). L'API répond 409 si l'email est déjà utilisé.
 */
export async function inviteUser({ firstname, lastname, email, platformRole, phone, phoneCountryCode }) {
  const res = await axios.post(endpoints.user.invite, {
    firstname,
    lastname,
    email,
    platformRole,
    phone: phone || null,
    phoneCountryCode: phone ? phoneCountryCode : null,
  });
  return res.data;
}

/** Active / désactive un compte (admin plateforme). Un compte désactivé ne peut plus se connecter. */
export async function setUserActive(userId, isActive) {
  const res = await axios.patch(
    `${endpoints.user.details}/${userId}`,
    { isActive },
    { headers: { 'Content-Type': 'application/merge-patch+json' } }
  );
  return res.data;
}
