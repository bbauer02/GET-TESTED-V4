'use client';

import { useSetState } from 'minimal-shared/hooks';
import { useMemo, useEffect, useCallback } from 'react';

import axios, { endpoints, refreshAccessToken, REFRESH_TOKEN_STORAGE_KEY } from 'src/lib/axios';

import { JWT_STORAGE_KEY } from './constant';
import { AuthContext } from '../auth-context';
import { setSession, isValidToken } from './utils';

// ----------------------------------------------------------------------

/** Clé localStorage de l'institut courant choisi par l'utilisateur (multi-instituts). */
export const CURRENT_INSTITUTE_STORAGE_KEY = 'gettested-current-institute';

// Rôles de l'institut courant (mêmes règles que les voters de l'API) :
// ADMIN = tout ; STAFF = gestion opérationnelle (sessions, inscrits, documents, résultats) ;
// TEACHER = ses épreuves (sessions où il est examinateur) et la banque de questions.
const INSTITUTE_ROLES = {
  ADMIN: 'institute_admin',
  STAFF: 'institute_staff',
  TEACHER: 'institute_teacher',
};

function buildRoles(platformRole, currentInstitute) {
  const roles = [platformRole?.toLowerCase() ?? 'user'];
  if (currentInstitute && INSTITUTE_ROLES[currentInstitute.membershipRole]) {
    roles.push(INSTITUTE_ROLES[currentInstitute.membershipRole]);
  }
  return roles;
}

function readStoredInstituteId() {
  try {
    return localStorage.getItem(CURRENT_INSTITUTE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredInstituteId(instituteId) {
  try {
    if (instituteId == null) {
      localStorage.removeItem(CURRENT_INSTITUTE_STORAGE_KEY);
    } else {
      localStorage.setItem(CURRENT_INSTITUTE_STORAGE_KEY, String(instituteId));
    }
  } catch {
    // stockage indisponible (navigation privée, quota…) : sélection non persistée
  }
}

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

        // Institut courant : celui choisi précédemment (s'il fait toujours partie des adhésions
        // actives), sinon le premier
        const storedInstituteId = readStoredInstituteId();
        const currentInstitute =
          userInstitutes.find((inst) => String(inst.id) === storedInstituteId) ||
          userInstitutes[0] ||
          null;

        const roles = buildRoles(userData.platformRole, currentInstitute);

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

  /**
   * Change l'institut courant (utilisateur membre de plusieurs instituts) : met à jour
   * `currentInstitute` et recalcule `user.roles` localement, sans rappeler /users/me.
   * Retourne true si le changement a été appliqué.
   */
  const switchInstitute = useCallback(
    (instituteId) => {
      const currentUser = state.user;
      if (!currentUser) return false;

      const target = (currentUser.institutes || []).find(
        (inst) => String(inst.id) === String(instituteId)
      );
      if (!target) return false;

      writeStoredInstituteId(target.id);

      if (String(currentUser.currentInstitute?.id) === String(target.id)) return true;

      const roles = buildRoles(currentUser.platformRole, target);
      setState({ user: { ...currentUser, currentInstitute: target, role: roles[0], roles } });
      return true;
    },
    [setState, state.user]
  );

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
      switchInstitute,
      loading: status === 'loading',
      authenticated: status === 'authenticated',
      unauthenticated: status === 'unauthenticated',
    }),
    [checkUserSession, switchInstitute, state.user, status]
  );

  return <AuthContext value={memoizedValue}>{children}</AuthContext>;
}
