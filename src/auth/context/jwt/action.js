'use client';

import axios, { endpoints, revokeRefreshToken } from 'src/lib/axios';

import { setSession } from './utils';
import { JWT_STORAGE_KEY } from './constant';

// ----------------------------------------------------------------------

/** **************************************
 * Sign in
 *************************************** */
export const signInWithPassword = async ({ email, password }) => {
  try {
    const params = { email, password };

    const res = await axios.post(endpoints.auth.signIn, params);

    const { access_token, refresh_token } = res.data;

    if (!access_token) {
      throw new Error('Access token not found in response');
    }

    setSession(access_token, refresh_token);
  } catch (error) {
    console.error('Error during sign in:', error);
    throw error;
  }
};

/** **************************************
 * Sign up
 *************************************** */
export const signUp = async ({ email, password, firstName, lastName }) => {
  const params = {
    email,
    password,
    firstName,
    lastName,
  };

  try {
    const res = await axios.post(endpoints.auth.signUp, params);

    const { access_token } = res.data;

    if (!access_token) {
      throw new Error('Access token not found in response');
    }

    sessionStorage.setItem(JWT_STORAGE_KEY, access_token);
  } catch (error) {
    console.error('Error during sign up:', error);
    throw error;
  }
};

/** **************************************
 * Forgot / reset password
 *************************************** */
export const requestPasswordReset = async (email) => {
  // L'API répond toujours 200 pour ne pas révéler l'existence d'un compte
  await axios.post(endpoints.auth.forgotPassword, { email });
};

export const resetPassword = async (token, newPassword) => {
  await axios.post(endpoints.auth.resetPassword(token), { newPassword });
};

/** **************************************
 * Sign out
 *************************************** */
export const signOut = async () => {
  try {
    // Le jeton de renouvellement est supprimé côté serveur (sans bloquer la déconnexion)
    await revokeRefreshToken();

    await setSession(null);
    try {
      // L'institut choisi appartient à l'utilisateur déconnecté
      localStorage.removeItem('gettested-current-institute');
    } catch {
      // stockage indisponible
    }
  } catch (error) {
    console.error('Error during sign out:', error);
    throw error;
  }
};
