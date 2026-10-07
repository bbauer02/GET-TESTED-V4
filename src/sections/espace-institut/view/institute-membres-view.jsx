'use client';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { useGetInstituteMembres } from 'src/actions/espace-institut';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useCurrentInstitute } from 'src/auth/hooks';

import { InstituteFicheTeam } from '../institute-fiche-team';

// ----------------------------------------------------------------------

export function InstituteMembresView() {
  const { t } = useTranslate('institute_space');
  const currentInstitute = useCurrentInstitute();
  const { membres, membresLoading } = useGetInstituteMembres(currentInstitute?.id);

  if (membresLoading) {
    return (
      <DashboardContent>
        <LoadingScreen />
      </DashboardContent>
    );
  }

  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs
        heading={t('team_title')}
        links={[
          { name: 'Tableau de bord', href: paths.dashboard.root },
          { name: currentInstitute?.label || 'Institut' },
          { name: t('team_title') },
        ]}
      />

      {/* Le titre est déjà porté par le fil d'Ariane */}
      <InstituteFicheTeam memberships={membres} instituteId={currentInstitute?.id} hideTitle sx={{ my: 3 }} />
    </DashboardContent>
  );
}
