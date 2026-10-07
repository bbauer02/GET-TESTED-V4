'use client';

import { ExamQuestionMcq } from './exam-question-mcq';
import { ExamQuestionOrdering } from './exam-question-ordering';
import { ExamQuestionMatching } from './exam-question-matching';
import { ExamQuestionFillBlank } from './exam-question-fillblank';
import { ExamQuestionHighlight } from './exam-question-highlight';

// ----------------------------------------------------------------------

const QUESTION_COMPONENTS = {
  mcq: ExamQuestionMcq,
  fill_blank: ExamQuestionFillBlank,
  highlight: ExamQuestionHighlight,
  ordering: ExamQuestionOrdering,
  matching: ExamQuestionMatching,
};

// ----------------------------------------------------------------------

export function ExamQuestionRenderer({ question, answer, onAnswer }) {
  if (!question) return null;

  const type = (question.type || '').toLowerCase();
  const Component = QUESTION_COMPONENTS[type];

  if (!Component) {
    return (
      <div>
        Type de question non supporté : <strong>{question.type}</strong>
      </div>
    );
  }

  return <Component question={question} answer={answer} onAnswer={onAnswer} />;
}
