'use client';

import Card from '@mui/material/Card';

import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { LoadingScreen } from 'src/components/loading-screen';

import {
  useGetInstitute,
  useGetInstituteMemberships,
  useGetInstituteSessions,
} from 'src/actions/institute';

import { InstituteProfileCover } from '../institute-profile-cover';
import { InstituteProfileHome } from '../institute-profile-home';

// ----------------------------------------------------------------------

export function InstituteProfileView() {
  const { id } = useParams();

  const { institute, instituteLoading } = useGetInstitute(id);
  const { memberships, membershipsLoading } = useGetInstituteMemberships(id);
  const { sessions, sessionsLoading } = useGetInstituteSessions(id);

  if (instituteLoading || membershipsLoading || sessionsLoading) {
    return <LoadingScreen />;
  }

  if (!institute) {
    return null;
  }

  const city = institute.address?.city || '';

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={institute.label}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Instituts', href: paths.dashboard.institute.root },
          { name: institute.label },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card sx={{ height: 290 }}>
        <InstituteProfileCover name={institute.label} city={city} logoUrl={institute.logo} coverUrl={institute.coverImage} coverPositionY={institute.coverPositionY ?? 50} />
      </Card>

      <InstituteProfileHome
        institute={institute}
        memberships={memberships}
        sessions={sessions}
        sx={{ mt: 3 }}
      />
    </DashboardContent>
  );
}
