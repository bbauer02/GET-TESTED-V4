'use client';

import { useSetState } from 'minimal-shared/hooks';
import { useMemo, useEffect, useCallback } from 'react';

import axios, { endpoints } from 'src/lib/axios';

import { JWT_STORAGE_KEY } from './constant';
import { AuthContext } from '../auth-context';
import { setSession, isValidToken } from './utils';

// ----------------------------------------------------------------------

/**
 * NOTE:
 * We only build demo at basic level.
 * Customer will need to do some extra handling yourself if you want to extend the logic and other features...
 */

export function AuthProvider({ children }) {
  const { state, setState } = useSetState({ user: null, loading: true });

  const checkUserSession = useCallback(async () => {
    try {
      const accessToken = sessionStorage.getItem(JWT_STORAGE_KEY);

      if (accessToken && isValidToken(accessToken)) {
        setSession(accessToken);

        const res = await axios.get(endpoints.auth.me);

        const userData = res.data;

        const isPlatformAdmin = userData.platformRole === 'ADMIN';

        const adminInstitutes = (userData.memberships || [])
          .filter((m) => m.role === 'ADMIN' || m.role === 'STAFF')
          .map((m) => ({ id: m.institute?.id, iri: m.institute?.['@id'], label: m.institute?.label }))
          .filter((inst, idx, arr) => arr.findIndex((i) => i.id === inst.id) === idx);

        const roles = [userData.platformRole?.toLowerCase() ?? 'user'];
        if (adminInstitutes.length > 0) roles.push('institute_admin');

        const user = {
          ...userData,
          displayName: `${userData.firstname} ${userData.lastname}`,
          photoURL: userData.avatar || null,
          role: roles[0],
          roles,
          institutes: adminInstitutes,
          currentInstitute: adminInstitutes[0] || null,
          accessToken,
        };

        setState({ user, loading: false });
      } else {
        setState({ user: null, loading: false });
      }
    } catch (error) {
      console.error(error);
      setState({ user: null, loading: false });
    }
  }, [setState]);

  useEffect(() => {
    checkUserSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------------------------------------------------------------

  const checkAuthenticated = state.user ? 'authenticated' : 'unauthenticated';

  const status = state.loading ? 'loading' : checkAuthenticated;

  const memoizedValue = useMemo(
    () => ({
      user: state.user ?? null,
      checkUserSession,
      loading: status === 'loading',
      authenticated: status === 'authenticated',
      unauthenticated: status === 'unauthenticated',
    }),
    [checkUserSession, state.user, status]
  );

  return <AuthContext value={memoizedValue}>{children}</AuthContext>;
}
