import { paths } from 'src/routes/paths';

import axios, { refreshAccessToken, REFRESH_TOKEN_STORAGE_KEY } from 'src/lib/axios';

import { JWT_STORAGE_KEY } from './constant';

// ----------------------------------------------------------------------

export function jwtDecode(token) {
  try {
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length < 2) {
      throw new Error('Invalid token!');
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(base64));

    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export function isValidToken(accessToken) {
  if (!accessToken) {
    return false;
  }

  try {
    const decoded = jwtDecode(accessToken);

    if (!decoded || !('exp' in decoded)) {
      return false;
    }

    const currentTime = Date.now() / 1000;

    return decoded.exp > currentTime;
  } catch (error) {
    console.error('Error during token validation:', error);
    return false;
  }
}

// ----------------------------------------------------------------------

let expiryTimer = null;

/**
 * Planifie le renouvellement du token une minute avant son expiration.
 * Si la session ne peut pas être prolongée, retour à la connexion (avec retour à la page courante).
 */
export function tokenExpired(exp) {
  clearTimeout(expiryTimer);

  const timeLeft = Math.max(0, exp * 1000 - Date.now() - 60 * 1000);

  expiryTimer = setTimeout(async () => {
    const newToken = await refreshAccessToken();

    if (newToken) {
      const decoded = jwtDecode(newToken);
      if (decoded?.exp) tokenExpired(decoded.exp);
      return;
    }

    sessionStorage.removeItem(JWT_STORAGE_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    const returnTo = encodeURIComponent(window.location.pathname);
    window.location.href = `${paths.auth.jwt.signIn}?returnTo=${returnTo}`;
  }, timeLeft);
}

// ----------------------------------------------------------------------

export async function setSession(accessToken, refreshToken) {
  try {
    if (accessToken) {
      sessionStorage.setItem(JWT_STORAGE_KEY, accessToken);
      if (refreshToken) {
        sessionStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
      }

      axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

      const decodedToken = jwtDecode(accessToken); // ~3 days by minimals server

      if (decodedToken && 'exp' in decodedToken) {
        tokenExpired(decodedToken.exp);
      } else {
        throw new Error('Invalid access token!');
      }
    } else {
      clearTimeout(expiryTimer);
      sessionStorage.removeItem(JWT_STORAGE_KEY);
      sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
      delete axios.defaults.headers.common.Authorization;
    }
  } catch (error) {
    console.error('Error during set session:', error);
    throw error;
  }
}
