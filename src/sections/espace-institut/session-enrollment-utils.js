// ----------------------------------------------------------------------
// Helpers shared by the enrollment dialogs / drawer / list.
// ----------------------------------------------------------------------

export function toEntityId(value) {
  if (!value) return null;
  if (typeof value === 'object') return value.id || toEntityId(value['@id']);
  return String(value).split('/').pop();
}

export function getEnrollmentDisplayName(enrollment) {
  const user = enrollment?.user || {};
  return (
    [user.firstname || user.firstName, user.lastname || user.lastName].filter(Boolean).join(' ') ||
    user.email ||
    ''
  );
}

/**
 * Build the E.164 phone number of the candidate ("+33612345678") or null.
 */
export function getEnrollmentPhoneE164(enrollment) {
  const user = enrollment?.user || {};
  const phone = (user.phone || '').toString().trim();
  if (!phone) return null;

  let full = phone;
  if (!phone.startsWith('+')) {
    const code = (user.phoneCountryCode || '').toString().trim();
    const national = phone.replace(/^0+/, '');
    full = code ? `${code.startsWith('+') ? code : `+${code}`}${national}` : phone;
  }

  const digits = full.replace(/[^\d]/g, '');
  if (!digits) return null;
  return `+${digits}`;
}

export function buildWhatsAppUrl(enrollment, message) {
  const e164 = getEnrollmentPhoneE164(enrollment);
  if (!e164) return null;
  const number = e164.replace('+', '');
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${number}${text}`;
}

export function isEnrollmentPhoneVerified(enrollment) {
  return !!enrollment?.user?.phoneVerifiedAt;
}
