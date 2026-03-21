'use client';

import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';

// ----------------------------------------------------------------------

const PreviewRoot = styled(Box)(({ theme }) => ({
  width: '210mm',
  minHeight: '297mm',
  padding: '20mm',
  margin: '0 auto',
  backgroundColor: theme.vars.palette.common.white,
  color: theme.vars.palette.common.black,
  boxShadow: theme.vars.customShadows.z8,
  fontFamily: '"Times New Roman", Times, serif',
  fontSize: '12pt',
  lineHeight: 1.6,
  '& h1': { fontSize: '20pt', marginBottom: '0.5em' },
  '& h2': { fontSize: '16pt', marginBottom: '0.5em' },
  '& h3': { fontSize: '14pt', marginBottom: '0.5em' },
  '& p': { marginBottom: '0.8em' },
  '& ul, & ol': { paddingLeft: '1.5em', marginBottom: '0.8em' },
  '& table': {
    width: '100%',
    borderCollapse: 'collapse',
    '& td, & th': {
      border: `1px solid ${theme.vars.palette.grey[400]}`,
      padding: '4px 8px',
    },
  },
  '@media print': {
    boxShadow: 'none',
    margin: 0,
    padding: '15mm',
    width: '100%',
    minHeight: 'auto',
  },
}));

// ----------------------------------------------------------------------

export function DocumentTemplatePreview({ htmlContent }) {
  return (
    <PreviewRoot
      className="document-preview"
      dangerouslySetInnerHTML={{ __html: htmlContent || '' }}
    />
  );
}
