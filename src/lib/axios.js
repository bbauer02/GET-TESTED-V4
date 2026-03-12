import axios from 'axios';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const axiosInstance = axios.create({
  baseURL: CONFIG.serverUrl,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/ld+json',
  },
});

axiosInstance.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error?.response?.data;
    const message =
      data?.['hydra:description'] ||
      data?.detail ||
      data?.message ||
      error?.message ||
      'Something went wrong!';
    console.error('Axios error:', message);
    return Promise.reject(new Error(message));
  }
);

export default axiosInstance;

// ----------------------------------------------------------------------

export const fetcher = async (args) => {
  try {
    const [url, config] = Array.isArray(args) ? args : [args, {}];

    const res = await axiosInstance.get(url, config);

    return res.data;
  } catch (error) {
    console.error('Fetcher failed:', error);
    throw error;
  }
};

// ----------------------------------------------------------------------

/**
 * Extract collection items from API response (handles JSON-LD, Hydra, and plain array).
 */
export function extractMembers(data) {
  if (Array.isArray(data)) return data;
  return data?.['hydra:member'] ?? data?.member ?? [];
}

/**
 * Extract total count from API response.
 */
export function extractTotalItems(data) {
  if (Array.isArray(data)) return data.length;
  return data?.['hydra:totalItems'] ?? data?.totalItems ?? 0;
}

// ----------------------------------------------------------------------

/**
 * Normalize API response: Symfony serializes `isOption` as `option` and `isWritten` as `written`.
 * This helper adds the `is*` aliases so the front can use them consistently.
 */
export function normalizeExam(exam) {
  if (!exam) return exam;
  return {
    ...exam,
    isOption: exam.isOption ?? exam.option ?? false,
    isWritten: exam.isWritten ?? exam.written ?? false,
  };
}

// ----------------------------------------------------------------------

export const endpoints = {
  user: {
    update: '/api/users/me/',
    list: '/api/users/',
    details: '/api/users',
    create: '/api/auth/register/',
    changePassword: '/api/me/change-password',
    uploadAvatar: '/api/users/me/avatar/',
  },
  chat: '/api/chat/',
  kanban: '/api/kanban/',
  calendar: '/api/calendar/',
  auth: {
    me: '/api/users/me/',
    signIn: '/api/auth/login/',
    signUp: '/api/auth/register/',
  },
  mail: {
    list: '/api/mail/list/',
    details: '/api/mail/details/',
    labels: '/api/mail/labels/',
  },
  post: {
    list: '/api/post/list/',
    details: '/api/post/details/',
    latest: '/api/post/latest/',
    search: '/api/post/search/',
  },
  product: {
    list: '/api/product/list/',
    details: '/api/product/details/',
    search: '/api/product/search/',
  },
  institute: {
    list: '/api/institutes',
    details: '/api/institutes',
    memberships: (id) => `/api/institutes/${id}/memberships`,
    sessions: (id) => `/api/institutes/${id}/sessions`,
    stripeConnect: (id) => `/api/institutes/${id}/stripe/connect`,
    stripeSession: (id) => `/api/institutes/${id}/stripe/session`,
    stripeStatus: (id) => `/api/institutes/${id}/stripe/status`,
  },
  assessment: {
    list: '/api/assessments',
    details: '/api/assessments',
  },
  level: {
    list: '/api/levels',
    create: '/api/levels',
  },
  exam: {
    list: '/api/exams',
    details: '/api/exams',
  },
  skill: {
    list: '/api/skills',
    details: '/api/skills',
  },
  session: {
    list: '/api/sessions',
    details: (id) => `/api/sessions/${id}`,
    enroll: (id) => `/api/sessions/${id}/enroll`,
    scheduledExams: (id) => `/api/sessions/${id}/scheduled-exams`,
  },
};
