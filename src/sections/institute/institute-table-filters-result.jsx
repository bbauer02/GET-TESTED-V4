'use client';

import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { useTranslate } from 'src/locales';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

export function InstituteTableFiltersResult({ filters, onResetPage, totalResults, sx }) {
  const { t } = useTranslate('institute');
  const { state: currentFilters, setState: updateFilters, resetState: resetFilters } = filters;

  const handleRemoveKeyword = useCallback(() => {
    onResetPage();
    updateFilters({ name: '' });
  }, [onResetPage, updateFilters]);

  const handleRemoveStatus = useCallback(() => {
    onResetPage();
    updateFilters({ status: 'all' });
  }, [onResetPage, updateFilters]);

  const handleReset = useCallback(() => {
    onResetPage();
    resetFilters();
  }, [onResetPage, resetFilters]);

  return (
    <FiltersResult totalResults={totalResults} onReset={handleReset} sx={sx}>
      <FiltersBlock
        label={t('filter_status_label')}
        isShow={!!currentFilters.status && currentFilters.status !== 'all'}
      >
        <Chip
          {...chipProps}
          label={t(`status_${currentFilters.status}`, { defaultValue: currentFilters.status })}
          onDelete={handleRemoveStatus}
        />
      </FiltersBlock>

      <FiltersBlock label={t('filter_search_label')} isShow={!!currentFilters.name}>
        <Chip {...chipProps} label={currentFilters.name} onDelete={handleRemoveKeyword} />
      </FiltersBlock>
    </FiltersResult>
  );
}
