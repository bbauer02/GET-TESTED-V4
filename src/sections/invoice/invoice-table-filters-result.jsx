'use client';

import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { fDate, fDateRangeShortLabel } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

const STATUS_LABEL_KEYS = {
  DRAFT: 'status_draft',
  ISSUED: 'status_issued',
  PAID: 'status_paid',
  CANCELLED: 'status_cancelled',
};

export function InvoiceTableFiltersResult({
  filters,
  totalResults,
  onResetPage,
  allowPartialDates = false,
  sx,
}) {
  const { t } = useTranslate('invoice');
  const { state: currentFilters, setState: updateFilters, resetState: resetFilters } = filters;

  const { startDate, endDate } = currentFilters;

  const handleRemoveKeyword = useCallback(() => {
    onResetPage();
    updateFilters({ name: '' });
  }, [onResetPage, updateFilters]);

  const handleRemoveStatus = useCallback(() => {
    onResetPage();
    updateFilters({ status: 'all' });
  }, [onResetPage, updateFilters]);

  const handleRemoveDate = useCallback(() => {
    onResetPage();
    updateFilters({ startDate: null, endDate: null });
  }, [onResetPage, updateFilters]);

  const handleReset = useCallback(() => {
    onResetPage();
    resetFilters();
  }, [onResetPage, resetFilters]);

  // allowPartialDates : une seule borne suffit pour filtrer (« à partir du … » / « jusqu'au … »)
  const dateLabel =
    (startDate && endDate && fDateRangeShortLabel(startDate, endDate)) ||
    (allowPartialDates && startDate && `≥ ${fDate(startDate)}`) ||
    (allowPartialDates && endDate && `≤ ${fDate(endDate)}`) ||
    '';

  return (
    <FiltersResult totalResults={totalResults} onReset={handleReset} sx={sx}>
      <FiltersBlock label={t('filter_status_label')} isShow={currentFilters.status !== 'all'}>
        <Chip
          {...chipProps}
          label={
            STATUS_LABEL_KEYS[currentFilters.status]
              ? t(STATUS_LABEL_KEYS[currentFilters.status])
              : currentFilters.status
          }
          onDelete={handleRemoveStatus}
        />
      </FiltersBlock>

      <FiltersBlock label={t('filter_date_label')} isShow={allowPartialDates ? Boolean(startDate || endDate) : Boolean(startDate && endDate)}>
        <Chip {...chipProps} label={dateLabel} onDelete={handleRemoveDate} />
      </FiltersBlock>

      <FiltersBlock label={t('filter_search_label')} isShow={!!currentFilters.name}>
        <Chip {...chipProps} label={currentFilters.name} onDelete={handleRemoveKeyword} />
      </FiltersBlock>
    </FiltersResult>
  );
}
