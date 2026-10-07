'use client';

import { useEffect } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { SplashScreen } from 'src/components/loading-screen';

import { useAuthContext } from 'src/auth/hooks';

import { AdminDashboardView } from './admin-dashboard-view';
import { CandidateDashboardView } from './candidate-dashboard-view';

// ----------------------------------------------------------------------

export function DashboardRedirect() {
  const router = useRouter();
  const { user, loading } = useAuthContext();

  // Admin et staff d'un institut atterrissent sur l'espace institut, un examinateur sur ses épreuves
  const isInstituteAdmin = user?.roles?.some((r) => r === 'institute_admin' || r === 'institute_staff');
  const isTeacher = user?.roles?.includes('institute_teacher');
  const isPlatformAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!loading && isInstituteAdmin && !isPlatformAdmin) {
      router.replace(paths.dashboard.espaceInstitut.fiche);
    } else if (!loading && isTeacher && !isPlatformAdmin) {
      router.replace(paths.dashboard.espaceInstitut.sessions);
    }
  }, [loading, isInstituteAdmin, isTeacher, isPlatformAdmin, router]);

  if (loading) {
    return <SplashScreen />;
  }

  // Institute admin (non platform admin) → redirect to espace institut
  if ((isInstituteAdmin || isTeacher) && !isPlatformAdmin) {
    return <SplashScreen />;
  }

  // Platform admin → admin dashboard
  if (isPlatformAdmin) {
    return <AdminDashboardView />;
  }

  // Regular user → candidate dashboard
  return <CandidateDashboardView />;
}
