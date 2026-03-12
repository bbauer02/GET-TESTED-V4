'use client';

import { useParams } from 'next/navigation';

import { SessionEnrollmentView } from 'src/sections/session-public/view';

// ----------------------------------------------------------------------

export default function Page() {
  const { id } = useParams();

  return <SessionEnrollmentView sessionId={id} />;
}
