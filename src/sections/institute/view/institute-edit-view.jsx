'use client';

import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { useGetInstitute } from 'src/actions/institute';
import { DashboardContent } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { InstituteCreateEditForm } from '../institute-create-edit-form';

// ----------------------------------------------------------------------

export function InstituteEditView() {
  const { t } = useTranslate('institute');
  const { id } = useParams();

  const { institute, instituteLoading } = useGetInstitute(id);

  if (instituteLoading) {
    return <LoadingScreen />;
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('heading_edit')}
        links={[
          { name: t('dashboard'), href: paths.dashboard.root },
          { name: t('heading'), href: paths.dashboard.institute.list },
          { name: institute?.label || '' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <InstituteCreateEditForm currentInstitute={institute} />
    </DashboardContent>
  );
}
