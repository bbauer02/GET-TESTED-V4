import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints, extractMembers, extractTotalItems } from 'src/lib/axios';

// ----------------------------------------------------------------------

const swrOptions = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

// ----------------------------------------------------------------------

export function useGetQuestions(params = {}) {
  const searchParams = new URLSearchParams();

  if (params.assessment) searchParams.set('assessment', params.assessment);
  if (params.level) searchParams.set('level', params.level);
  if (params.status) searchParams.set('status', params.status);
  if (params.search) searchParams.set('label', params.search);

  const query = searchParams.toString();
  const url = `${endpoints.question.list}${query ? `?${query}` : ''}`;

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, swrOptions);

  const questions = extractMembers(data);
  const totalItems = extractTotalItems(data);

  const memoizedValue = useMemo(
    () => ({
      questions,
      questionsTotal: totalItems,
      questionsLoading: isLoading,
      questionsError: error,
      questionsValidating: isValidating,
      questionsEmpty: !isLoading && !isValidating && !questions.length,
      questionsMutate: mutate,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetQuestion(questionId) {
  const url = questionId ? endpoints.question.details(questionId) : '';

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      question: data || null,
      questionLoading: isLoading,
      questionError: error,
      questionValidating: isValidating,
      questionMutate: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

/**
 * Fetch all questions for a given institute.
 * Uses /api/questions filtered by the institute's assessments.
 */
export function useGetInstituteQuestions(instituteId) {
  // First fetch the institute's assessments
  const assessmentsUrl = instituteId ? `/api/institutes/${instituteId}/assessments` : '';
  const { data: assessmentsData } = useSWR(assessmentsUrl, fetcher, swrOptions);

  const assessments = extractMembers(assessmentsData);

  // Build URL with assessment[] filters — pagination off (itemsPerPage=0 or large number)
  const questionsUrl = useMemo(() => {
    if (!assessments.length) return '';
    const params = new URLSearchParams();
    assessments.forEach((a) => {
      const iri = a['@id'] || `/api/assessments/${a.id}`;
      params.append('assessment[]', iri);
    });
    params.set('itemsPerPage', '200');
    return `${endpoints.question.list}?${params.toString()}`;
  }, [assessments]);

  const { data, isLoading, error, isValidating, mutate } = useSWR(
    questionsUrl || null,
    fetcher,
    swrOptions
  );

  const rawQuestions = extractMembers(data);

  // Enrich questions: resolve assessment/level IRIs to objects using assessments data
  const questions = useMemo(() => {
    if (!rawQuestions.length || !assessments.length) return rawQuestions;

    // Build lookup maps: IRI -> object
    const assessmentByIri = {};
    const levelByIri = {};
    assessments.forEach((a) => {
      const aIri = a['@id'] || `/api/assessments/${a.id}`;
      assessmentByIri[aIri] = a;
      (a.levels || []).forEach((l) => {
        if (typeof l === 'object') {
          const lIri = l['@id'] || `/api/levels/${l.id}`;
          levelByIri[lIri] = l;
        }
      });
    });

    return rawQuestions.map((q) => ({
      ...q,
      assessment: typeof q.assessment === 'string' ? (assessmentByIri[q.assessment] || q.assessment) : q.assessment,
      level: typeof q.level === 'string' ? (levelByIri[q.level] || q.level) : q.level,
    }));
  }, [rawQuestions, assessments]);

  const memoizedValue = useMemo(
    () => ({
      questions,
      questionsLoading: isLoading || (!assessmentsData && !!instituteId),
      questionsError: error,
      questionsValidating: isValidating,
      questionsEmpty: !isLoading && !isValidating && !questions.length,
      questionsMutate: mutate,
    }),
     
    [questions, assessmentsData, instituteId, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetSubject(subjectId) {
  const url = subjectId ? endpoints.subject.details(subjectId) : '';

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      subject: data || null,
      subjectLoading: isLoading,
      subjectError: error,
      subjectValidating: isValidating,
      subjectMutate: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetSubjectForScheduledExam(scheduledExamId) {
  const url = scheduledExamId ? endpoints.subject.forScheduledExam(scheduledExamId) : '';

  const { data, isLoading, error, isValidating, mutate } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      subject: data || null,
      subjectLoading: isLoading,
      subjectError: error,
      subjectValidating: isValidating,
      subjectMutate: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}
