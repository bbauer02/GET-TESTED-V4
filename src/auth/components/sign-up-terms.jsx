import Box from '@mui/material/Box';

// ----------------------------------------------------------------------

export function SignUpTerms({ sx, ...other }) {
  return (
    <Box
      component="span"
      sx={[
        () => ({
          mt: 3,
          display: 'block',
          textAlign: 'center',
          typography: 'caption',
          color: 'text.secondary',
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      En créant un compte, vous acceptez les conditions d&apos;utilisation et la politique de
      confidentialité de GetTested.
    </Box>
  );
}
