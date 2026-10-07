// État du paiement d'une inscription, à partir de sa facture candidat (hors commission et avoirs).

export const PAYMENT_STATE = {
  PAID: 'paid',
  TO_PAY: 'to_pay',
  CANCELLED: 'cancelled',
  NOT_INVOICED: 'not_invoiced',
};

export const PAYMENT_STATE_COLORS = {
  paid: 'success',
  to_pay: 'warning',
  cancelled: 'default',
  not_invoiced: 'default',
};

export const PAYMENT_STATE_ICONS = {
  paid: 'solar:check-circle-bold',
  to_pay: 'solar:card-bold',
  cancelled: 'solar:close-circle-bold',
  not_invoiced: 'solar:clock-circle-bold',
};

export function getEnrollmentPayment(enrollment) {
  const invoice = (enrollment?.invoices || []).find(
    (inv) => inv.businessType !== 'PLATFORM_COMMISSION' && inv.invoiceType !== 'CREDIT_NOTE'
  );

  if (!invoice) {
    return { invoice: null, state: PAYMENT_STATE.NOT_INVOICED };
  }

  const state =
    {
      PAID: PAYMENT_STATE.PAID,
      ISSUED: PAYMENT_STATE.TO_PAY,
      CANCELLED: PAYMENT_STATE.CANCELLED,
    }[invoice.status] || PAYMENT_STATE.NOT_INVOICED;

  return { invoice, state };
}
