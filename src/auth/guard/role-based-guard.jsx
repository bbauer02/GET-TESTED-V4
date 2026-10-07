'use client';

import { m } from 'framer-motion';

import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { ForbiddenIllustration } from 'src/assets/illustrations';

import { varBounce, MotionContainer } from 'src/components/animate';

// ----------------------------------------------------------------------

/**
 * NOTE:
 * This component is for reference only.
 * You can customize the logic and conditions to better suit your application's requirements.
 */

export function RoleBasedGuard({ sx, children, hasContent, currentRole, allowedRoles }) {
  const { t } = useTranslate('common');
  const rolesArray = Array.isArray(currentRole) ? currentRole : [currentRole].filter(Boolean);

  if (rolesArray.length && allowedRoles && !allowedRoles.some((r) => rolesArray.includes(r))) {
    return hasContent ? (
      <Container
        component={MotionContainer}
        sx={[{ textAlign: 'center' }, ...(Array.isArray(sx) ? sx : [sx])]}
      >
        <m.div variants={varBounce('in')}>
          <Typography variant="h3" sx={{ mb: 2 }}>
            {t('permission_denied_title')}
          </Typography>
        </m.div>

        <m.div variants={varBounce('in')}>
          <Typography sx={{ color: 'text.secondary' }}>
            {t('permission_denied_description')}
          </Typography>
        </m.div>

        <m.div variants={varBounce('in')}>
          <ForbiddenIllustration sx={{ my: { xs: 5, sm: 10 } }} />
        </m.div>

        <Button component={RouterLink} href={paths.dashboard.root} size="large" variant="contained">
          {t('back_to_dashboard')}
        </Button>
      </Container>
    ) : null;
  }

  return <> {children} </>;
}
