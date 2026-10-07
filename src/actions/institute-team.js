import { mutate } from 'swr';

import axios, { endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

const MERGE_PATCH_HEADERS = { headers: { 'Content-Type': 'application/merge-patch+json' } };

export const MEMBER_ROLES = ['ADMIN', 'TEACHER', 'STAFF'];

export const MEMBER_STATUSES = ['ACTIVE', 'PENDING', 'ARCHIVED'];

// ----------------------------------------------------------------------

/**
 * Extract the membership id from a membership object (id or IRI).
 */
export function getMembershipId(membership) {
  if (!membership) return '';
  return String(membership.id || membership['@id'] || '')
    .split('/')
    .pop();
}

/**
 * Membership status is optional on older API payloads: default to ACTIVE.
 */
export function getMembershipStatus(membership) {
  return membership?.status || 'ACTIVE';
}

/**
 * Detect the "already a member" conflict (409) from the axios error message.
 * The shared axios instance rewraps errors, so the HTTP status is not available here.
 */
export function isAlreadyMemberError(error) {
  const message = error?.message || '';
  return /409|d[ée]j[àa] membre|already (a )?member|conflict/i.test(message);
}

function revalidateMembers(instituteId) {
  if (instituteId) {
    return mutate(endpoints.institute.memberships(instituteId));
  }
  return Promise.resolve();
}

// ----------------------------------------------------------------------

export async function inviteMember({ instituteId, email, firstname, lastname, role }) {
  const response = await axios.post(endpoints.institute.inviteMember(instituteId), {
    email,
    firstname,
    lastname,
    role,
  });

  await revalidateMembers(instituteId);

  return response.data;
}

export async function updateMembership({ membershipId, instituteId, data }) {
  const response = await axios.patch(
    endpoints.institute.membership(membershipId),
    data,
    MERGE_PATCH_HEADERS
  );

  await revalidateMembers(instituteId);

  return response.data;
}

export async function deleteMembership({ membershipId, instituteId }) {
  const response = await axios.delete(endpoints.institute.membership(membershipId));

  await revalidateMembers(instituteId);

  return response.data;
}

// ----------------------------------------------------------------------

export async function getInvitation(token) {
  const response = await axios.get(endpoints.auth.invitation(token));
  return response.data;
}

export async function acceptInvitation(token, password) {
  const response = await axios.post(endpoints.auth.acceptInvitation(token), { password });
  return response.data;
}

// ----------------------------------------------------------------------

export async function sendPhoneVerificationCode() {
  const response = await axios.post(endpoints.user.phoneSendCode, {});
  return response.data;
}

export async function verifyPhoneCode(code) {
  const response = await axios.post(endpoints.user.phoneVerifyCode, { code });
  return response.data;
}
