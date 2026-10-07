import useSWR from 'swr';
import { toast } from 'sonner';
import { useMemo, useState, useCallback } from 'react';

import axiosInstance, { fetcher, endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

const swrOptions = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

// ----------------------------------------------------------------------

export function useStripeStatus(instituteId) {
  const url = instituteId ? endpoints.institute.stripeStatus(instituteId) : '';

  const { data, isLoading, error, mutate } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      status: data || null,
      statusLoading: isLoading,
      statusError: error,
      statusMutate: mutate,
    }),
    [data, isLoading, error, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useCreateStripeAccount(instituteId) {
  const [creating, setCreating] = useState(false);

  const createAccount = useCallback(async () => {
    if (!instituteId) return;

    setCreating(true);
    try {
      await axiosInstance.post(endpoints.institute.stripeConnect(instituteId));
      toast.success('Compte Stripe créé avec succès !');
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la création du compte Stripe');
      throw error;
    } finally {
      setCreating(false);
    }
  }, [instituteId]);

  return { createAccount, creating };
}

// ----------------------------------------------------------------------

export function useStripeAccountSession(instituteId) {
  const fetchClientSecret = useCallback(async () => {
    const response = await axiosInstance.post(endpoints.institute.stripeSession(instituteId));
    return response.data.client_secret;
  }, [instituteId]);

  return { fetchClientSecret };
}
