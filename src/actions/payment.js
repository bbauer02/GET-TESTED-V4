import axios, { endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

/**
 * Ouvre une session Stripe Checkout pour une facture émise et redirige le candidat.
 * Au retour, la page reçoit `?payment=success&invoice={id}` ou `?payment=cancel`.
 */
export async function redirectToInvoiceCheckout(invoiceId, returnUrl) {
  const separator = returnUrl.includes('?') ? '&' : '?';

  const response = await axios.post(endpoints.invoice.checkout(invoiceId), {
    successUrl: `${returnUrl}${separator}payment=success&invoice=${invoiceId}`,
    cancelUrl: `${returnUrl}${separator}payment=cancel&invoice=${invoiceId}`,
  });

  window.location.href = response.data.checkoutUrl;
}

/**
 * Interroge l'API (qui interroge Stripe) jusqu'à confirmation du paiement.
 * Retourne 'paid', 'pending' (Stripe n'a pas encore confirmé) ou 'failed'.
 */
export async function waitForInvoicePayment(invoiceId, { attempts = 5, delayMs = 2000, config } = {}) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
       
      const { data } = await axios.post(endpoints.invoice.verifyPayment(invoiceId), {}, config);
      if (data.status === 'paid' || data.status === 'already_paid') {
        return 'paid';
      }
    } catch {
      // Erreur transitoire (Stripe indisponible…) : on retente
    }
     
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return 'pending';
}
