import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints, extractMembers } from 'src/lib/axios';

// ----------------------------------------------------------------------

const swrOptions = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

// ----------------------------------------------------------------------

export function useGetSkills() {
  const url = endpoints.skill.list;

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  const skills = extractMembers(data);

  const memoizedValue = useMemo(
    () => ({
      skills,
      skillsLoading: isLoading,
      skillsError: error,
      skillsValidating: isValidating,
      skillsEmpty: !isLoading && !isValidating && !skills.length,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetSkill(skillId) {
  const url = skillId ? `${endpoints.skill.details}/${skillId}` : '';

  const { data, isLoading, error, isValidating } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      skill: data || null,
      skillLoading: isLoading,
      skillError: error,
      skillValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}
