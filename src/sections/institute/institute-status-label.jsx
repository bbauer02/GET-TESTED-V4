'use client';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';

// ----------------------------------------------------------------------

/** Statuts de validation d'un institut par la plateforme (API : Institute.status). */
export const INSTITUTE_STATUSES = ['PENDING_REVIEW', 'ACTIVE', 'SUSPENDED'];

export const INSTITUTE_STATUS_COLORS = {
  PENDING_REVIEW: 'warning',
  ACTIVE: 'success',
  SUSPENDED: 'error',
};

export function InstituteStatusLabel({ status, sx, ...other }) {
  const { t } = useTranslate('institute');

  if (!status) return null;

  return (
    <Label
      variant="soft"
      color={INSTITUTE_STATUS_COLORS[status] || 'default'}
      sx={sx}
      {...other}
    >
      {t(`status_${status}`, { defaultValue: status })}
    </Label>
  );
}
