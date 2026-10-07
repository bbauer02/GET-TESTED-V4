'use client';

import { merge } from 'es-toolkit';
import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { iconButtonClasses } from '@mui/material/IconButton';

import { allLangs, useTranslate } from 'src/locales';
import { useNotifications } from 'src/actions/notifications';

import { Logo } from 'src/components/logo';
import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';

import { useAuthContext } from 'src/auth/hooks';

import { NavMobile } from './nav-mobile';
import { VerticalDivider } from './content';
import { NavVertical } from './nav-vertical';
import { NavHorizontal } from './nav-horizontal';
import { _account } from '../nav-config-account';
import { Searchbar } from '../components/searchbar';
import { MenuButton } from '../components/menu-button';
import { AccountDrawer } from '../components/account-drawer';
import { SettingsButton } from '../components/settings-button';
import { navData as getNavData } from '../nav-config-dashboard';
import { LanguagePopover } from '../components/language-popover';
import { dashboardLayoutVars, dashboardNavColorVars } from './css-vars';
import { NotificationsDrawer } from '../components/notifications-drawer';
import { MainSection, layoutClasses, HeaderSection, LayoutSection } from '../core';

// ----------------------------------------------------------------------

export function DashboardLayout({ sx, cssVars, children, slotProps, layoutQuery = 'lg' }) {
  const theme = useTheme();

  const { user } = useAuthContext();

  const settings = useSettingsContext();

  const { t } = useTranslate('navbar');

  const navVars = dashboardNavColorVars(theme, settings.state.navColor, settings.state.navLayout);

  const { value: open, onFalse: onClose, onTrue: onOpen } = useBoolean();

  const { notifications: smartNotifications } = useNotifications();

  const navData = slotProps?.nav?.data ?? getNavData(t);

  const isNavMini = settings.state.navLayout === 'mini';
  const isNavHorizontal = settings.state.navLayout === 'horizontal';
  const isNavVertical = isNavMini || settings.state.navLayout === 'vertical';

  const canDisplayItemByRole = (allowedRoles, excludedRoles) => {
    const userRoles = user?.roles || [user?.role].filter(Boolean);
    // Hide if user has an excluded role
    if (excludedRoles?.some((r) => userRoles.includes(r))) return true;
    // Hide if user doesn't have any allowed role
    if (allowedRoles) return !allowedRoles.some((r) => userRoles.includes(r));
    return false;
  };

  const filteredNavData = navData.filter((group) =>
    group.items.some((item) => {
      const userRoles = user?.roles || [user?.role].filter(Boolean);
      // Check if excluded
      if (item.excludedRoles?.some((r) => userRoles.includes(r))) return false;
      // Check if allowed
      if (!item.allowedRoles) return true;
      return item.allowedRoles.some((r) => userRoles.includes(r));
    })
  );

  const renderHeader = () => {
    const headerSlotProps = {
      container: {
        maxWidth: false,
        sx: {
          ...(isNavVertical && { px: { [layoutQuery]: 5 } }),
          ...(isNavHorizontal && {
            bgcolor: 'var(--layout-nav-bg)',
            height: { [layoutQuery]: 'var(--layout-nav-horizontal-height)' },
            [`& .${iconButtonClasses.root}`]: { color: 'var(--layout-nav-text-secondary-color)' },
          }),
        },
      },
    };

    const headerSlots = {
      topArea: (
        <Alert severity="info" sx={{ display: 'none', borderRadius: 0 }}>
          This is an info Alert.
        </Alert>
      ),
      bottomArea: isNavHorizontal ? (
        <NavHorizontal
          data={filteredNavData}
          layoutQuery={layoutQuery}
          cssVars={navVars.section}
          checkPermissions={canDisplayItemByRole}
        />
      ) : null,
      leftArea: (
        <>
          {/** @slot Nav mobile */}
          <MenuButton
            onClick={onOpen}
            sx={{ mr: 1, ml: -1, [theme.breakpoints.up(layoutQuery)]: { display: 'none' } }}
          />
          <NavMobile
            data={filteredNavData}
            open={open}
            onClose={onClose}
            cssVars={navVars.section}
            checkPermissions={canDisplayItemByRole}
          />

          {/** @slot Logo */}
          {isNavHorizontal && (
            <Logo
              sx={{
                display: 'none',
                [theme.breakpoints.up(layoutQuery)]: { display: 'inline-flex' },
              }}
            />
          )}

          {/** @slot Divider */}
          {isNavHorizontal && (
            <VerticalDivider sx={{ [theme.breakpoints.up(layoutQuery)]: { display: 'flex' } }} />
          )}

          {/** @slot Institute / Role indicator */}
          <InstituteIndicator
            user={user}
            sx={{ ...(isNavHorizontal && { color: 'var(--layout-nav-text-primary-color)' }) }}
          />
        </>
      ),
      rightArea: (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0, sm: 0.75 } }}>
          {/** @slot Searchbar */}
          <Searchbar data={filteredNavData} />

          {/** @slot Language popover */}
          <LanguagePopover data={allLangs} />

          {/** @slot Notifications popover */}
          <NotificationsDrawer data={smartNotifications} />

          {/** @slot Settings button */}
          <SettingsButton />

          {/** @slot Account drawer */}
          <AccountDrawer data={_account} />
        </Box>
      ),
    };

    return (
      <HeaderSection
        layoutQuery={layoutQuery}
        disableElevation={isNavVertical}
        {...slotProps?.header}
        slots={{ ...headerSlots, ...slotProps?.header?.slots }}
        slotProps={merge(headerSlotProps, slotProps?.header?.slotProps ?? {})}
        sx={slotProps?.header?.sx}
      />
    );
  };

  const renderSidebar = () => (
    <NavVertical
      data={filteredNavData}
      isNavMini={isNavMini}
      layoutQuery={layoutQuery}
      cssVars={navVars.section}
      checkPermissions={canDisplayItemByRole}
      onToggleNav={() =>
        settings.setField(
          'navLayout',
          settings.state.navLayout === 'vertical' ? 'mini' : 'vertical'
        )
      }
    />
  );

  const renderFooter = () => null;

  const renderMain = () => <MainSection {...slotProps?.main}>{children}</MainSection>;

  return (
    <LayoutSection
      /** **************************************
       * @Header
       *************************************** */
      headerSection={renderHeader()}
      /** **************************************
       * @Sidebar
       *************************************** */
      sidebarSection={isNavHorizontal ? null : renderSidebar()}
      /** **************************************
       * @Footer
       *************************************** */
      footerSection={renderFooter()}
      /** **************************************
       * @Styles
       *************************************** */
      cssVars={{ ...dashboardLayoutVars(theme), ...navVars.layout, ...cssVars }}
      sx={[
        {
          [`& .${layoutClasses.sidebarContainer}`]: {
            [theme.breakpoints.up(layoutQuery)]: {
              pl: isNavMini ? 'var(--layout-nav-mini-width)' : 'var(--layout-nav-vertical-width)',
              transition: theme.transitions.create(['padding-left'], {
                easing: 'var(--layout-transition-easing)',
                duration: 'var(--layout-transition-duration)',
              }),
            },
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {renderMain()}
    </LayoutSection>
  );
}

// ----------------------------------------------------------------------

function InstituteIndicator({ user, sx }) {
  const { t } = useTranslate('navbar');
  const institute = user?.currentInstitute;

  const ROLE_CONFIG = {
    ADMIN: { label: 'Admin', color: 'error', icon: 'solar:shield-star-bold' },
    STAFF: { label: 'Staff', color: 'info', icon: 'solar:shield-user-bold' },
    TEACHER: { label: t('examiner'), color: 'secondary', icon: 'solar:pen-new-square-bold' },
  };

  if (!institute) {
    const isPlatformAdmin = user?.platformRole === 'ADMIN';
    return (
      <Box
        sx={[
          { display: 'flex', alignItems: 'center', gap: 1 },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        <Iconify
          icon={isPlatformAdmin ? 'solar:shield-star-bold' : 'solar:user-bold'}
          width={20}
          sx={{ color: isPlatformAdmin ? 'error.main' : 'text.secondary' }}
        />
        <Typography variant="subtitle2" sx={{ display: { xs: 'none', sm: 'block' } }}>
          {isPlatformAdmin ? t('admin_platform') : t('candidate')}
        </Typography>
      </Box>
    );
  }

  const config = ROLE_CONFIG[institute.membershipRole] || ROLE_CONFIG.ADMIN;

  return (
    <Box
      sx={[
        { display: 'flex', alignItems: 'center', gap: 1 },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Iconify icon={config.icon} width={20} sx={{ color: `${config.color}.main` }} />

      <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexDirection: 'column', lineHeight: 1 }}>
        <Typography variant="subtitle2" noWrap sx={{ maxWidth: 160, lineHeight: 1.2 }}>
          {institute.label}
        </Typography>
      </Box>

      <Label
        color={config.color}
        sx={{
          height: 22,
          display: { xs: 'none', sm: 'inline-flex' },
        }}
      >
        {config.label}
      </Label>
    </Box>
  );
}
