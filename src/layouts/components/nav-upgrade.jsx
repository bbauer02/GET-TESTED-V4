'use client';

import { m } from 'framer-motion';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/global-config';

import { Label } from 'src/components/label';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

const INSTITUTE_ROLE_CONFIG = {
  ADMIN: { labelKey: 'role_admin_institute', color: 'primary' },
  STAFF: { labelKey: 'role_staff', color: 'info' },
  TEACHER: { labelKey: 'role_examiner', color: 'secondary' },
};

const PLATFORM_ROLE_CONFIG = {
  ADMIN: { labelKey: 'role_admin', color: 'error' },
  USER: { labelKey: 'role_candidate', color: 'default' },
};

export function getUserRoleDisplay(user, t) {
  let config;

  // Priority: platform admin > institute role > platform user
  if (user?.platformRole === 'ADMIN') {
    config = PLATFORM_ROLE_CONFIG.ADMIN;
  } else {
    const membershipRole = user?.currentInstitute?.membershipRole;
    if (membershipRole && INSTITUTE_ROLE_CONFIG[membershipRole]) {
      config = INSTITUTE_ROLE_CONFIG[membershipRole];
    } else {
      config = PLATFORM_ROLE_CONFIG[user?.platformRole] || PLATFORM_ROLE_CONFIG.USER;
    }
  }

  return {
    color: config.color,
    label: t ? t(config.labelKey) : config.labelKey,
  };
}

export function NavUpgrade({ sx, ...other }) {
  const { user } = useAuthContext();
  const { t } = useTranslate('layout');

  const roleDisplay = getUserRoleDisplay(user, t);
  const instituteName = user?.currentInstitute?.label;

  return (
    <Box
      sx={[{ px: 2, py: 5, textAlign: 'center' }, ...(Array.isArray(sx) ? sx : [sx])]}
      {...other}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
        <Box sx={{ position: 'relative' }}>
          <Avatar src={user?.photoURL} alt={user?.displayName} sx={{ width: 48, height: 48 }}>
            {user?.displayName?.charAt(0).toUpperCase()}
          </Avatar>

          <Label
            color={roleDisplay.color}
            variant="filled"
            sx={{
              top: -6,
              px: 0.5,
              left: 40,
              height: 20,
              position: 'absolute',
              borderBottomLeftRadius: 2,
            }}
          >
            {roleDisplay.label}
          </Label>
        </Box>

        <Box sx={{ mb: 2, mt: 1.5, width: 1 }}>
          <Typography
            variant="subtitle2"
            noWrap
            sx={{ mb: 0.5, color: 'var(--layout-nav-text-primary-color)' }}
          >
            {user?.displayName}
          </Typography>

          <Typography
            variant="body2"
            noWrap
            sx={{ color: 'var(--layout-nav-text-disabled-color)' }}
          >
            {user?.email}
          </Typography>

          {instituteName && (
            <Stack direction="row" justifyContent="center" sx={{ mt: 1 }}>
              <Label variant="soft" color="default" sx={{ fontSize: 10 }}>
                {instituteName}
              </Label>
            </Stack>
          )}
        </Box>
      </Box>
    </Box>
  );
}

// ----------------------------------------------------------------------

export function UpgradeBlock({ sx, ...other }) {
  const { t } = useTranslate('layout');

  return (
    <Box
      sx={[
        (theme) => ({
          ...theme.mixins.bgGradient({
            images: [
              `linear-gradient(135deg, ${varAlpha(theme.vars.palette.error.lightChannel, 0.92)}, ${varAlpha(theme.vars.palette.secondary.darkChannel, 0.92)})`,
              `url(${CONFIG.assetsDir}/assets/background/background-7.webp)`,
            ],
          }),
          px: 3,
          py: 4,
          borderRadius: 2,
          position: 'relative',
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Box
        sx={(theme) => ({
          top: 0,
          left: 0,
          width: 1,
          height: 1,
          borderRadius: 2,
          position: 'absolute',
          border: `solid 3px ${varAlpha(theme.vars.palette.common.whiteChannel, 0.16)}`,
        })}
      />

      <Box
        component={m.img}
        animate={{ y: [12, -12, 12] }}
        transition={{
          duration: 8,
          ease: 'linear',
          repeat: Infinity,
          repeatDelay: 0,
        }}
        alt="Small Rocket"
        src={`${CONFIG.assetsDir}/assets/illustrations/illustration-rocket-small.webp`}
        sx={{
          right: 0,
          width: 112,
          height: 112,
          position: 'absolute',
        }}
      />

      <Box
        sx={{
          display: 'flex',
          position: 'relative',
          flexDirection: 'column',
          alignItems: 'flex-start',
        }}
      >
        <Box component="span" sx={{ typography: 'h5', color: 'common.white' }}>
          {t('upgrade_discount')}
        </Box>

        <Box
          component="span"
          sx={{
            mb: 2,
            mt: 0.5,
            color: 'common.white',
            typography: 'subtitle2',
          }}
        >
          {t('upgrade_text')}
        </Box>

        <Button variant="contained" size="small" color="warning">
          {t('upgrade_button')}
        </Button>
      </Box>
    </Box>
  );
}
