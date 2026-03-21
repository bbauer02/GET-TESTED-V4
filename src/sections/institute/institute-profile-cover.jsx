'use client';

import { useRef, useState, useCallback } from 'react';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Stack from '@mui/material/Stack';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function InstituteProfileCover({
  sx,
  name,
  city,
  logoUrl,
  coverUrl,
  coverPositionY = 50,
  onChangeLogo,
  onChangeCover,
  onSaveCoverPosition,
  editable,
  ...other
}) {
  const logoInputRef = useRef(null);
  const coverInputRef = useRef(null);

  // --- Repositioning state ---
  const [repositioning, setRepositioning] = useState(false);
  const [posY, setPosY] = useState(coverPositionY);
  const dragRef = useRef({ dragging: false, startY: 0, startPos: 0 });
  const containerRef = useRef(null);

  const handleMouseDown = useCallback((e) => {
    if (!repositioning) return;
    e.preventDefault();
    dragRef.current = { dragging: true, startY: e.clientY, startPos: posY };

    const handleMouseMove = (ev) => {
      if (!dragRef.current.dragging) return;
      const containerHeight = containerRef.current?.offsetHeight || 290;
      const deltaPixels = ev.clientY - dragRef.current.startY;
      const deltaPercent = (deltaPixels / containerHeight) * 100;
      const newPos = Math.max(0, Math.min(100, dragRef.current.startPos + deltaPercent));
      setPosY(newPos);
    };

    const handleMouseUp = () => {
      dragRef.current.dragging = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [repositioning, posY]);

  const handleSavePosition = useCallback(() => {
    setRepositioning(false);
    onSaveCoverPosition?.(Math.round(posY));
  }, [posY, onSaveCoverPosition]);

  const handleCancelReposition = useCallback(() => {
    setRepositioning(false);
    setPosY(coverPositionY);
  }, [coverPositionY]);

  const gradientOpacity = coverUrl ? 0.3 : 0.8;

  return (
    <Box
      ref={containerRef}
      onMouseDown={handleMouseDown}
      sx={[
        (theme) => ({
          ...theme.mixins.bgGradient({
            images: [
              `linear-gradient(0deg, ${varAlpha(theme.vars.palette.primary.darkerChannel, gradientOpacity)}, ${varAlpha(theme.vars.palette.primary.darkerChannel, gradientOpacity)})`,
              ...(coverUrl ? [`url(${coverUrl})`] : []),
            ],
            positions: ['center', `center ${posY}%`],
          }),
          height: 1,
          color: 'common.white',
          position: 'relative',
          cursor: repositioning ? 'grab' : 'default',
          userSelect: repositioning ? 'none' : 'auto',
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {/* Repositioning overlay */}
      {repositioning && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 20,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            pb: 2,
            pointerEvents: 'none',
          }}
        >
          <Stack direction="row" spacing={1} sx={{ pointerEvents: 'auto' }}>
            <Button
              variant="contained"
              size="small"
              onClick={handleSavePosition}
              startIcon={<Iconify icon="solar:check-circle-bold" />}
            >
              Enregistrer
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={handleCancelReposition}
              sx={{ color: 'common.white', borderColor: 'rgba(255,255,255,0.5)' }}
            >
              Annuler
            </Button>
          </Stack>
        </Box>
      )}

      {/* Cover edit buttons */}
      {editable && !repositioning && onChangeCover && (
        <>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onChangeCover(file);
              e.target.value = '';
            }}
          />
          <Stack
            direction="row"
            spacing={1}
            sx={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}
          >
            <Tooltip title="Changer la couverture">
              <IconButton
                onClick={() => coverInputRef.current?.click()}
                sx={{
                  bgcolor: 'rgba(0,0,0,0.54)',
                  color: 'common.white',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.72)' },
                }}
              >
                <Iconify icon="solar:camera-bold" />
              </IconButton>
            </Tooltip>

            {coverUrl && (
              <Tooltip title="Repositionner">
                <IconButton
                  onClick={() => setRepositioning(true)}
                  sx={{
                    bgcolor: 'rgba(0,0,0,0.54)',
                    color: 'common.white',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.72)' },
                  }}
                >
                  <Iconify icon="solar:move-to-folder-bold" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </>
      )}

      {/* Profile info (hidden during repositioning) */}
      {!repositioning && (
        <Box
          sx={{
            display: 'flex',
            left: { md: 24 },
            bottom: { md: 24 },
            zIndex: { md: 10 },
            pt: { xs: 6, md: 0 },
            position: { md: 'absolute' },
            flexDirection: { xs: 'column', md: 'row' },
          }}
        >
          <Box sx={{ position: 'relative', mx: 'auto' }}>
            <Avatar
              alt={name}
              src={logoUrl || undefined}
              sx={[
                (theme) => ({
                  width: { xs: 64, md: 128 },
                  height: { xs: 64, md: 128 },
                  border: `solid 2px ${theme.vars.palette.common.white}`,
                  fontSize: { xs: 24, md: 48 },
                  ...(logoUrl
                    ? { bgcolor: 'common.white' }
                    : { bgcolor: theme.vars.palette.primary.dark }),
                }),
              ]}
            >
              {!logoUrl && name?.charAt(0).toUpperCase()}
            </Avatar>

            {/* Logo edit button */}
            {editable && onChangeLogo && (
              <>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onChangeLogo(file);
                    e.target.value = '';
                  }}
                />
                <Tooltip title="Modifier le logo">
                  <IconButton
                    onClick={() => logoInputRef.current?.click()}
                    sx={{
                      position: 'absolute',
                      bottom: { xs: -4, md: 4 },
                      right: { xs: -4, md: 4 },
                      bgcolor: 'rgba(0,0,0,0.54)',
                      color: 'common.white',
                      width: 32,
                      height: 32,
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.72)' },
                    }}
                  >
                    <Iconify icon="solar:camera-bold" width={18} />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>

          <ListItemText
            primary={name}
            secondary={city}
            slotProps={{
              primary: { sx: { typography: 'h4' } },
              secondary: {
                sx: { mt: 0.5, opacity: 0.48, color: 'inherit' },
              },
            }}
            sx={{ mt: 3, ml: { md: 3 }, textAlign: { xs: 'center', md: 'unset' } }}
          />
        </Box>
      )}
    </Box>
  );
}
