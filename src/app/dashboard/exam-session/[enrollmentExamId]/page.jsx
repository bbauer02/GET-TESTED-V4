import { ExamSessionView } from 'src/sections/exam-session/view';

// ----------------------------------------------------------------------

export const metadata = { title: 'Passage d\'examen' };

export default async function Page({ params }) {
  const { enrollmentExamId } = await params;
  return <ExamSessionView enrollmentExamId={enrollmentExamId} />;
}
