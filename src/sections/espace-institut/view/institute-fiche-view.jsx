'use client';

import { toast } from 'sonner';
import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { usePathname, useSearchParams } from 'src/routes/hooks';

import axios from 'src/lib/axios';
import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { useGetInstituteFiche, useGetInstituteMembres, useGetInstituteSessions } from 'src/actions/espace-institut';

import { Iconify } from 'src/components/iconify';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { InstituteProfileCover } from 'src/sections/institute/institute-profile-cover';

import { useCurrentInstitute } from 'src/auth/hooks';

import { InstituteFicheHome } from '../institute-fiche-home';
import { InstituteFicheTeam } from '../institute-fiche-team';
import { InstituteFicheDashboard } from '../institute-fiche-dashboard';

// ----------------------------------------------------------------------

const TAB_PARAM = 'tab';

// NAV_ITEMS is defined inside the component to use translations

// ----------------------------------------------------------------------

export function InstituteFicheView() {
  const { t } = useTranslate('institute_space');
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const NAV_ITEMS = [
    {
      value: '',
      label: t('tab_dashboard'),
      icon: <Iconify width={24} icon="solar:chart-square-bold" />,
    },
    {
      value: 'profile',
      label: t('tab_profile'),
      icon: <Iconify width={24} icon="solar:user-id-bold" />,
    },
    {
      value: 'team',
      label: t('tab_team'),
      icon: <Iconify width={24} icon="solar:users-group-rounded-bold" />,
    },
  ];
  const selectedTab = searchParams.get(TAB_PARAM) ?? '';

  const currentInstitute = useCurrentInstitute();
  const canEditFiche = currentInstitute?.membershipRole === 'ADMIN';
  const { institute, instituteLoading, instituteMutate } = useGetInstituteFiche(currentInstitute?.id);
  const { membres, membresLoading } = useGetInstituteMembres(currentInstitute?.id);
  const { sessions, sessionsLoading } = useGetInstituteSessions(currentInstitute?.id);

  const createRedirectPath = (currentPath, query) => {
    const queryString = new URLSearchParams({ [TAB_PARAM]: query }).toString();
    return query ? `${currentPath}?${queryString}` : currentPath;
  };

  const handleUploadImage = useCallback(async (file, type) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const endpoint = type === 'logo'
        ? `/api/institutes/${currentInstitute.id}/logo`
        : `/api/institutes/${currentInstitute.id}/cover`;

      await axios.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      instituteMutate();
      toast.success(type === 'logo' ? t('logo_updated') : t('cover_updated'));
    } catch (error) {
      console.error(error);
      toast.error(t('upload_error'));
    }
  }, [currentInstitute?.id, instituteMutate]);

  const handleChangeLogo = useCallback((file) => handleUploadImage(file, 'logo'), [handleUploadImage]);
  const handleChangeCover = useCallback((file) => handleUploadImage(file, 'cover'), [handleUploadImage]);

  const handleSaveCoverPosition = useCallback(async (positionY) => {
    try {
      await axios.patch(`/api/institutes/${currentInstitute.id}`, {
        coverPositionY: positionY,
      }, {
        headers: { 'Content-Type': 'application/merge-patch+json' },
      });
      instituteMutate();
      toast.success(t('position_saved'));
    } catch (error) {
      console.error(error);
      toast.error(t('position_save_error'));
    }
  }, [currentInstitute?.id, instituteMutate]);

  if (instituteLoading || membresLoading || sessionsLoading) {
    return (
      <DashboardContent>
        <LoadingScreen />
      </DashboardContent>
    );
  }

  if (!institute) return null;

  const city = institute.address?.city || '';

  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs
        heading={t('fiche_title')}
        links={[
          { name: 'Tableau de bord', href: paths.dashboard.root },
          { name: institute.label },
          { name: t('fiche') },
        ]}
        action={
          canEditFiche && (
            <Button
              component={RouterLink}
              href={paths.dashboard.espaceInstitut.ficheEdit}
              variant="contained"
              startIcon={<Iconify icon="solar:pen-bold" />}
            >
              {t('edit')}
            </Button>
          )
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card sx={{ height: 290 }}>
        <InstituteProfileCover
          name={institute.label}
          city={city}
          logoUrl={institute.logo}
          coverUrl={institute.coverImage}
          coverPositionY={institute.coverPositionY ?? 50}
          editable
          onChangeLogo={handleChangeLogo}
          onChangeCover={handleChangeCover}
          onSaveCoverPosition={handleSaveCoverPosition}
        />

        <Box
          sx={{
            width: 1,
            bottom: 0,
            zIndex: 9,
            px: { md: 3 },
            display: 'flex',
            position: 'absolute',
            bgcolor: 'background.paper',
            justifyContent: { xs: 'center', md: 'flex-end' },
          }}
        >
          <Tabs value={selectedTab}>
            {NAV_ITEMS.map((tab) => (
              <Tab
                component={RouterLink}
                key={tab.value}
                value={tab.value}
                icon={tab.icon}
                label={tab.label}
                href={createRedirectPath(pathname, tab.value)}
              />
            ))}
          </Tabs>
        </Box>
      </Card>

      {selectedTab === '' && (
        <InstituteFicheDashboard
          sessions={sessions}
          memberships={membres}
          instituteId={currentInstitute?.id}
          sx={{ mt: 4 }}
        />
      )}

      {selectedTab === 'profile' && (
        <InstituteFicheHome
          institute={institute}
          memberships={membres}
          sessions={sessions}
          sx={{ mt: 3 }}
        />
      )}

      {selectedTab === 'team' && (
        <InstituteFicheTeam memberships={membres} instituteId={currentInstitute?.id} />
      )}
    </DashboardContent>
  );
}
