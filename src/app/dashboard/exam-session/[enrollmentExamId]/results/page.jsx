import { ExamResultsView } from 'src/sections/exam-session/view';

// ----------------------------------------------------------------------

export const metadata = { title: 'Résultats d\'examen' };

export default async function Page({ params }) {
  const { enrollmentExamId } = await params;
  return <ExamResultsView enrollmentExamId={enrollmentExamId} />;
}
