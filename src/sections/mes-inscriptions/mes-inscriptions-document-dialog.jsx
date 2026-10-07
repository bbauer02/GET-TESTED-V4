'use client';

import useSWR from 'swr';
import { useRef, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { toPdfFilename, downloadElementAsPdf } from 'src/utils/html-to-pdf';

import { useTranslate } from 'src/locales';
import { fetcher, endpoints, extractMembers } from 'src/lib/axios';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';

import { DocumentTemplatePreview } from 'src/sections/document-template/document-template-preview';
import { renderDocumentTemplate } from 'src/sections/espace-institut/utils/render-document-template';

// ----------------------------------------------------------------------

const swrOptions = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

/**
 * @param {object} template  Optional: template already resolved by the API
 *                           (GET /api/enrollment-sessions/{id}/documents). When provided,
 *                           the institute templates are not fetched.
 */
export function MesInscriptionsDocumentDialog({
  open,
  onClose,
  enrollment,
  documentType,
  template: providedTemplate,
}) {
  const { t } = useTranslate('inscriptions');
  const session = enrollment?.session;
  const institute = session?.institute;

  // Fetch the document template for this institute + document type (unless provided)
  const dtId = documentType?.id || documentType?.['@id']?.split('/').pop();
  const instId = institute?.id || institute?.['@id']?.split('/').pop();

  const templateUrl = instId && !providedTemplate ? endpoints.documentTemplate.list(instId) : '';

  const { data: templatesData, isLoading } = useSWR(
    open && templateUrl ? templateUrl : '',
    fetcher,
    swrOptions
  );

  const templates = extractMembers(templatesData);

  // Find the template matching this document type
  const template = useMemo(() => {
    if (providedTemplate?.content) return providedTemplate;
    if (!templates.length || !dtId) return null;
    return templates.find((tpl) => {
      const tDtId = tpl.documentType?.id || tpl.documentType?.['@id']?.split('/').pop();
      return tDtId === dtId;
    });
  }, [providedTemplate, templates, dtId]);

  // Build merge context and merge
  const mergedHtml = useMemo(
    () => renderDocumentTemplate({ template, enrollment, session, institute }),
    [template, enrollment, session, institute]
  );

  const previewRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const candidate = enrollment?.user;
      await downloadElementAsPdf(
        previewRef.current,
        toPdfFilename(documentType?.label, candidate?.lastname, candidate?.firstname)
      );
    } catch (error) {
      console.error(error);
      toast.error(t('download_error'));
    } finally {
      setDownloading(false);
    }
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
        {documentType?.label || t('document_label')}

        <IconButton onClick={onClose} sx={{ ml: 'auto' }}>
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {isLoading ? (
          <LoadingScreen sx={{ py: 5 }} />
        ) : !template ? (
          <EmptyContent
            title={t('template_not_found')}
            description={t('template_not_found_desc')}
            sx={{ py: 5 }}
          />
        ) : (
          <Box ref={previewRef}>
            <DocumentTemplatePreview htmlContent={mergedHtml} />
          </Box>
        )}
      </DialogContent>

      <DialogActions className="no-print">
        <Button onClick={onClose} color="inherit">
          {t('close')}
        </Button>
        {template && (
          <>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<Iconify icon="solar:printer-bold" />}
              onClick={handlePrint}
            >
              {t('print')}
            </Button>
            <Button
              variant="contained"
              loading={downloading}
              startIcon={<Iconify icon="solar:download-minimalistic-bold" />}
              onClick={handleDownload}
            >
              {t('download_pdf')}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
