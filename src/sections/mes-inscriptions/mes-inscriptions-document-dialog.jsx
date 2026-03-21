'use client';

import useSWR from 'swr';
import { useMemo } from 'react';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { fetcher, endpoints, extractMembers } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';

import { DocumentTemplatePreview } from 'src/sections/document-template/document-template-preview';
import { buildMergeContext, replaceMergeFields } from 'src/sections/document-template/utils/merge-engine';

// ----------------------------------------------------------------------

const swrOptions = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

export function MesInscriptionsDocumentDialog({
  open,
  onClose,
  enrollment,
  documentType,
}) {
  const session = enrollment?.session;
  const institute = session?.institute;

  // Fetch the document template for this institute + document type
  const dtId = documentType?.id || documentType?.['@id']?.split('/').pop();
  const instId = institute?.id || institute?.['@id']?.split('/').pop();

  const templateUrl = instId
    ? endpoints.documentTemplate.list(instId)
    : '';

  const { data: templatesData, isLoading } = useSWR(
    open && templateUrl ? templateUrl : '',
    fetcher,
    swrOptions
  );

  const templates = extractMembers(templatesData);

  // Find the template matching this document type
  const template = useMemo(() => {
    if (!templates.length || !dtId) return null;
    return templates.find((t) => {
      const tDtId = t.documentType?.id || t.documentType?.['@id']?.split('/').pop();
      return tDtId === dtId;
    });
  }, [templates, dtId]);

  // Build merge context and merge
  const mergedHtml = useMemo(() => {
    if (!template?.content) return '';

    // Find the enrollment invoice
    const invoices = enrollment?.invoices || [];
    const invoice = invoices.find((inv) => inv.businessType !== 'PLATFORM_COMMISSION');

    const context = buildMergeContext({
      enrollment,
      session,
      institute,
      invoice,
    });

    return replaceMergeFields(template.content, context);
  }, [template, enrollment, session, institute]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        '@media print': {
          '& .MuiDialog-paper': {
            boxShadow: 'none',
            margin: 0,
            maxWidth: '100%',
            maxHeight: '100%',
            borderRadius: 0,
          },
          '& .no-print': { display: 'none' },
        },
      }}
    >
      <DialogTitle className="no-print" sx={{ display: 'flex', alignItems: 'center' }}>
        {documentType?.label || 'Document'}

        <IconButton onClick={onClose} sx={{ ml: 'auto' }}>
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {isLoading ? (
          <LoadingScreen sx={{ py: 5 }} />
        ) : !template ? (
          <EmptyContent
            title="Modèle introuvable"
            description="Aucun modèle de document n'est configuré pour ce type."
            sx={{ py: 5 }}
          />
        ) : (
          <DocumentTemplatePreview htmlContent={mergedHtml} />
        )}
      </DialogContent>

      <DialogActions className="no-print">
        <Button onClick={onClose} color="inherit">
          Fermer
        </Button>
        {template && (
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:printer-bold" />}
            onClick={handlePrint}
          >
            Imprimer / PDF
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
