'use client';

import { mergeClasses } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import { styled } from '@mui/material/styles';

import { RouterLink } from 'src/routes/components';

import { logoClasses } from './classes';

// ----------------------------------------------------------------------

/**
 * Logo typographique GetTested (en attendant le logo définitif).
 * Pour utiliser un fichier image, remplacer `mark` / `wordmark` par une balise <img>
 * pointant vers `${CONFIG.assetsDir}/logo/logo-single.svg` et `logo-full.svg`.
 */
export function Logo({ sx, disabled, className, href = '/', isSingle = true, ...other }) {
  const mark = (
    <Box
      component="span"
      sx={(theme) => ({
        width: 1,
        height: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 1.25,
        color: 'common.white',
        fontWeight: 800,
        fontSize: 22,
        lineHeight: 1,
        background: `linear-gradient(135deg, ${theme.vars.palette.primary.light} 0%, ${theme.vars.palette.primary.dark} 100%)`,
      })}
    >
      G
    </Box>
  );

  const wordmark = (
    <Box
      component="span"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        fontWeight: 800,
        fontSize: 20,
        letterSpacing: '-0.02em',
        color: 'text.primary',
        whiteSpace: 'nowrap',
      }}
    >
      <Box component="span" sx={{ width: 32, height: 32, flexShrink: 0 }}>
        {mark}
      </Box>
      <span>
        Get
        <Box component="span" sx={{ color: 'primary.main' }}>
          Tested
        </Box>
      </span>
    </Box>
  );

  return (
    <LogoRoot
      component={RouterLink}
      href={href}
      aria-label="GetTested"
      underline="none"
      className={mergeClasses([logoClasses.root, className])}
      sx={[
        {
          width: 40,
          height: 40,
          ...(!isSingle && { width: 'auto', height: 36 }),
          ...(disabled && { pointerEvents: 'none' }),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {isSingle ? mark : wordmark}
    </LogoRoot>
  );
}

// ----------------------------------------------------------------------

const LogoRoot = styled(Link)(() => ({
  flexShrink: 0,
  display: 'inline-flex',
  alignItems: 'center',
  verticalAlign: 'middle',
}));
