import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, extractMembers, extractTotalItems } from 'src/lib/axios';

// ----------------------------------------------------------------------

const EMPTY_VALUES = [undefined, null, '', 'all'];

/**
 * Collection API Platform paginée, triée et filtrée côté serveur.
 *
 * @param {string} url        Endpoint de collection (ex. '/api/users')
 * @param {object} options
 * @param {number} options.page         Page courante, base 0 (comme useTable / MUI)
 * @param {number} options.rowsPerPage  Nombre d'éléments par page (100 max côté API)
 * @param {string} options.orderBy      Champ de tri (OrderFilter)
 * @param {'asc'|'desc'} options.order  Sens du tri
 * @param {object} options.filters      Paramètres de filtre (q, status, invoiceDate[after]…) ;
 *                                      les valeurs vides ou 'all' sont ignorées
 * @param {boolean} options.enabled     false pour ne rien charger
 */
export function usePaginatedCollection(
  url,
  { page = 0, rowsPerPage = 10, orderBy, order = 'asc', filters = {}, enabled = true } = {}
) {
  const params = useMemo(() => {
    const result = { page: page + 1, itemsPerPage: rowsPerPage };
    if (orderBy) {
      result[`order[${orderBy}]`] = order;
    }
    Object.entries(filters).forEach(([key, value]) => {
      if (!EMPTY_VALUES.includes(value)) {
        result[key] = value;
      }
    });
    return result;
  }, [page, rowsPerPage, orderBy, order, filters]);

  const key = enabled && url ? [url, { params }] : null;

  const { data, isLoading, isValidating, error, mutate } = useSWR(key, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  });

  return useMemo(
    () => ({
      items: extractMembers(data),
      totalItems: extractTotalItems(data),
      loading: isLoading,
      validating: isValidating,
      error,
      mutate,
    }),
    [data, isLoading, isValidating, error, mutate]
  );
}
