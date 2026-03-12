'use client';

import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useGetInstitute } from 'src/actions/institute';

import { InstituteCreateEditForm } from '../institute-create-edit-form';

// ----------------------------------------------------------------------

export function InstituteEditView() {
  const { id } = useParams();

  const { institute, instituteLoading } = useGetInstitute(id);

  if (instituteLoading) {
    return <LoadingScreen />;
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Modifier l'institut"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Instituts', href: paths.dashboard.institute.list },
          { name: institute?.label || '' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <InstituteCreateEditForm currentInstitute={institute} />
    </DashboardContent>
  );
}
