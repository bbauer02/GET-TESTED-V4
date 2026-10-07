import useSWR from 'swr';
import { useMemo } from 'react';

import axios, { fetcher, endpoints, extractMembers, extractTotalItems } from 'src/lib/axios';

// ----------------------------------------------------------------------

const swrOptions = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

// ----------------------------------------------------------------------

export function useGetInvoices() {
  const url = `${endpoints.invoice.list}?businessType=PLATFORM_COMMISSION`;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      invoices: extractMembers(data),
      invoicesTotal: extractTotalItems(data),
      invoicesLoading: isLoading,
      invoicesError: error,
      invoicesValidating: isValidating,
      invoicesEmpty: !isLoading && !isValidating && !extractMembers(data).length,
      invoicesMutate: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetInvoice(invoiceId) {
  const url = invoiceId ? endpoints.invoice.details(invoiceId) : '';

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      invoice: data ?? null,
      invoiceLoading: isLoading,
      invoiceError: error,
      invoiceValidating: isValidating,
      invoiceMutate: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetInstituteInvoices(instituteId) {
  const url = instituteId ? endpoints.invoice.instituteInvoices(instituteId) : '';

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      invoices: extractMembers(data),
      invoicesTotal: extractTotalItems(data),
      invoicesLoading: isLoading,
      invoicesError: error,
      invoicesValidating: isValidating,
      invoicesEmpty: !isLoading && !isValidating && !extractMembers(data).length,
      invoicesMutate: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------
// Actions de gestion (admin plateforme / admin d'institut) — logique portée par l'API

const MERGE_PATCH = { headers: { 'Content-Type': 'application/merge-patch+json' } };

/** DRAFT → ISSUED : numérotation, date et totaux calculés par l'API. */
export async function issueInvoice(invoiceId) {
  const res = await axios.patch(endpoints.invoice.issue(invoiceId), {}, MERGE_PATCH);
  return res.data;
}

/** Ajoute un paiement (statut PENDING) à une facture émise. */
export async function createInvoicePayment(invoiceId, { amount, paymentMethod }) {
  const res = await axios.post(endpoints.invoice.payments(invoiceId), { amount, paymentMethod });
  return res.data;
}

/** PENDING → COMPLETED ; la facture passe à PAID quand le total est couvert. */
export async function completePayment(paymentId) {
  const res = await axios.patch(endpoints.payment.complete(paymentId), {}, MERGE_PATCH);
  return res.data;
}

/** PENDING → FAILED. */
export async function failPayment(paymentId) {
  const res = await axios.patch(endpoints.payment.fail(paymentId), {}, MERGE_PATCH);
  return res.data;
}

/** COMPLETED → REFUNDED : la facture est annulée et un avoir est émis (aucun appel Stripe). */
export async function refundPayment(paymentId) {
  const res = await axios.patch(endpoints.payment.refund(paymentId), {}, MERGE_PATCH);
  return res.data;
}
