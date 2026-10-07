// Statuts métier renvoyés par l'API : couleurs de <Label> et clés de traduction (namespace `common`).
// Utilisation : <Label color={SESSION_STATUS_COLORS[s]}>{t(`session_status_${s}`)}</Label>

export const SESSION_STATUS_COLORS = {
  DRAFT: 'default',
  OPEN: 'success',
  LOCKED: 'warning',
  VALIDATED: 'info',
  CANCELLED: 'error',
};

export const INVOICE_STATUS_COLORS = {
  DRAFT: 'default',
  ISSUED: 'warning',
  PAID: 'success',
  CANCELLED: 'error',
};
