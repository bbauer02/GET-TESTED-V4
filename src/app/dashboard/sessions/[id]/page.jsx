'use client';

import { useParams, useSearchParams } from 'next/navigation';

import { SessionEnrollmentView } from 'src/sections/session-public/view';

// ----------------------------------------------------------------------

export default function Page() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const paymentResult = searchParams.get('payment');

  return <SessionEnrollmentView sessionId={id} paymentResult={paymentResult} />;
}
