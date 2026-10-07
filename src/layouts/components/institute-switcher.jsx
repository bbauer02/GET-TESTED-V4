'use client';

import { mutate } from 'swr';
import { useCallback } from 'react';
import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomPopover } from 'src/components/custom-popover';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

/** Libellé, couleur et icône du rôle d'un utilisateur dans un institut. */
export function useInstituteRoleConfig() {
  const { t } = useTranslate('navbar');

  return useCallback(
    (membershipRole) => {
      const ROLE_CONFIG = {
        ADMIN: { label: t('role_admin'), color: 'error', icon: 'solar:shield-star-bold' },
        STAFF: { label: t('role_staff'), color: 'info', icon: 'solar:shield-user-bold' },
        TEACHER: { label: t('examiner'), color: 'secondary', icon: 'solar:pen-new-square-bold' },
      };
      return ROLE_CONFIG[membershipRole] || ROLE_CONFIG.ADMIN;
    },
    [t]
  );
}

// ----------------------------------------------------------------------

/**
 * Sélecteur d'institut courant, pour les utilisateurs membres de plusieurs instituts.
 * Après changement : caches SWR invalidés et retour à l'accueil de l'espace institut
 * (pour ne pas rester sur une ressource de l'autre institut).
 */
export function InstituteSwitcher({ sx, ...other }) {
  const { t } = useTranslate('navbar');

  const router = useRouter();

  const { user, switchInstitute } = useAuthContext();

  const getRoleConfig = useInstituteRoleConfig();

  const { open, anchorEl, onClose, onOpen } = usePopover();

  const institutes = user?.institutes ?? [];
  const current = user?.currentInstitute;
  const currentConfig = getRoleConfig(current?.membershipRole);

  const handleChange = useCallback(
    (institute) => {
      onClose();

      if (String(institute.id) === String(current?.id)) return;

      if (!switchInstitute(institute.id)) return;

      // Toutes les données en cache appartiennent potentiellement à l'ancien institut
      mutate(() => true, undefined, { revalidate: true });

      router.push(paths.dashboard.espaceInstitut.root);
    },
    [current?.id, onClose, router, switchInstitute]
  );

  const renderButton = () => (
    <ButtonBase
      disableRipple
      onClick={onOpen}
      aria-label={t('switch_institute')}
      aria-haspopup="menu"
      aria-expanded={open ? 'true' : undefined}
      sx={[
        (theme) => ({
          py: 0.5,
          px: 0.75,
          gap: 1,
          borderRadius: 1,
          transition: theme.transitions.create(['background-color'], {
            duration: theme.transitions.duration.shorter,
          }),
          '&:hover': { bgcolor: 'action.hover' },
          ...(open && { bgcolor: 'action.hover' }),
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Iconify icon={currentConfig.icon} width={20} sx={{ color: `${currentConfig.color}.main` }} />

      <Typography
        variant="subtitle2"
        noWrap
        sx={{ maxWidth: 160, lineHeight: 1.2, display: { xs: 'none', sm: 'block' } }}
      >
        {current?.label}
      </Typography>

      <Label
        color={currentConfig.color}
        sx={{ height: 22, cursor: 'inherit', display: { xs: 'none', sm: 'inline-flex' } }}
      >
        {currentConfig.label}
      </Label>

      <Iconify width={16} icon="carbon:chevron-sort" sx={{ color: 'text.disabled' }} />
    </ButtonBase>
  );

  const renderMenuList = () => (
    <CustomPopover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      slotProps={{
        arrow: { placement: 'top-left' },
        paper: { sx: { mt: 0.5, width: 280 } },
      }}
    >
      <Typography
        variant="overline"
        component="div"
        sx={{ px: 1, pt: 0.5, pb: 1, color: 'text.secondary' }}
      >
        {t('switch_institute')}
      </Typography>

      <Scrollbar sx={{ maxHeight: 320 }}>
        <MenuList>
          {institutes.map((institute) => {
            const config = getRoleConfig(institute.membershipRole);
            const selected = String(institute.id) === String(current?.id);

            return (
              <MenuItem
                key={institute.id}
                selected={selected}
                onClick={() => handleChange(institute)}
                sx={{ minHeight: 48, gap: 1.5 }}
              >
                <Iconify icon={config.icon} width={20} sx={{ color: `${config.color}.main` }} />

                <Box
                  component="span"
                  sx={{
                    flexGrow: 1,
                    minWidth: 0,
                    typography: 'body2',
                    fontWeight: 'fontWeightMedium',
                  }}
                >
                  <Box
                    component="span"
                    sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}
                  >
                    {institute.label}
                  </Box>
                </Box>

                <Label color={config.color}>{config.label}</Label>

                {selected && (
                  <Iconify icon="eva:checkmark-fill" width={16} sx={{ color: 'primary.main' }} />
                )}
              </MenuItem>
            );
          })}
        </MenuList>
      </Scrollbar>
    </CustomPopover>
  );

  return (
    <>
      {renderButton()}
      {renderMenuList()}
    </>
  );
}
