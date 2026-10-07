'use client';

import { useSetState } from 'minimal-shared/hooks';
import { useMemo, useEffect, useCallback } from 'react';

import axios, { endpoints, refreshAccessToken, REFRESH_TOKEN_STORAGE_KEY } from 'src/lib/axios';

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
      let accessToken = sessionStorage.getItem(JWT_STORAGE_KEY);

      // Token expiré (onglet resté ouvert, rechargement tardif) : tentative de renouvellement
      if (!isValidToken(accessToken) && sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)) {
        accessToken = await refreshAccessToken();
      }

      if (accessToken && isValidToken(accessToken)) {
        setSession(accessToken);

        const res = await axios.get(endpoints.auth.me);

        const userData = res.data;

        const isPlatformAdmin = userData.platformRole === 'ADMIN';

        // Build institute list from active memberships only (ADMIN, STAFF, TEACHER) :
        // une adhésion en attente ou archivée ne donne aucun accès à l'espace institut
        const instituteMap = new Map();
        (userData.memberships || [])
          .filter((m) => (m.status ?? 'ACTIVE') === 'ACTIVE')
          .filter((m) => m.role === 'ADMIN' || m.role === 'STAFF' || m.role === 'TEACHER')
          .forEach((m) => {
            const instId = m.institute?.id;
            if (!instId) return;
            const existing = instituteMap.get(instId);
            // Keep the highest-privilege role per institute: ADMIN > STAFF > TEACHER
            const priority = { ADMIN: 3, STAFF: 2, TEACHER: 1 };
            if (!existing || (priority[m.role] || 0) > (priority[existing.membershipRole] || 0)) {
              instituteMap.set(instId, {
                id: instId,
                iri: m.institute?.['@id'],
                label: m.institute?.label,
                membershipRole: m.role,
              });
            }
          });
        const userInstitutes = Array.from(instituteMap.values());

        const currentInstitute = userInstitutes[0] || null;

        // Rôles de l'institut courant (mêmes règles que les voters de l'API) :
        // ADMIN = tout ; STAFF = gestion opérationnelle (sessions, inscrits, documents, résultats) ;
        // TEACHER = ses épreuves (sessions où il est examinateur) et la banque de questions.
        const INSTITUTE_ROLES = { ADMIN: 'institute_admin', STAFF: 'institute_staff', TEACHER: 'institute_teacher' };
        const roles = [userData.platformRole?.toLowerCase() ?? 'user'];
        if (currentInstitute && INSTITUTE_ROLES[currentInstitute.membershipRole]) {
          roles.push(INSTITUTE_ROLES[currentInstitute.membershipRole]);
        }

        const user = {
          ...userData,
          displayName: `${userData.firstname} ${userData.lastname}`,
          photoURL: userData.avatar || null,
          role: roles[0],
          roles,
          institutes: userInstitutes,
          currentInstitute,
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
