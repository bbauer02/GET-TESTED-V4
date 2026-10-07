import { buildMergeContext, replaceMergeFields } from 'src/sections/document-template/utils/merge-engine';

// ----------------------------------------------------------------------

/**
 * Render a document template (HTML with merge fields) for a given enrollment.
 * Returns the merged HTML string ("" when no template content).
 */
export function renderDocumentTemplate({ template, enrollment, session, institute, invoice }) {
  const content = typeof template === 'string' ? template : template?.content;
  if (!content) return '';

  const resolvedSession = session || enrollment?.session || {};
  const resolvedInstitute = institute || resolvedSession?.institute || {};

  const invoices = enrollment?.invoices || [];
  const resolvedInvoice =
    invoice || invoices.find((inv) => inv.businessType !== 'PLATFORM_COMMISSION') || null;

  const context = buildMergeContext({
    enrollment,
    session: resolvedSession,
    institute: resolvedInstitute,
    invoice: resolvedInvoice,
  });

  return replaceMergeFields(content, context);
}

// ----------------------------------------------------------------------

const PRINT_STYLES = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: #fff;
    color: #000;
    font-family: "Times New Roman", Times, serif;
    font-size: 12pt;
    line-height: 1.6;
  }
  .document-page {
    width: 210mm;
    min-height: 297mm;
    padding: 20mm;
    margin: 0 auto;
    page-break-after: always;
    break-after: page;
  }
  .document-page:last-child { page-break-after: auto; break-after: auto; }
  .document-page h1 { font-size: 20pt; margin-bottom: 0.5em; }
  .document-page h2 { font-size: 16pt; margin-bottom: 0.5em; }
  .document-page h3 { font-size: 14pt; margin-bottom: 0.5em; }
  .document-page p { margin-bottom: 0.8em; }
  .document-page ul, .document-page ol { padding-left: 1.5em; margin-bottom: 0.8em; }
  .document-page table { width: 100%; border-collapse: collapse; }
  .document-page td, .document-page th { border: 1px solid #bdbdbd; padding: 4px 8px; }
  @page { size: A4; margin: 0; }
  @media print {
    .document-page { width: 100%; min-height: auto; padding: 15mm; }
  }
`;

/**
 * Build a standalone printable HTML document from a list of rendered pages.
 */
export function buildPrintDocument(pages, title = 'Documents') {
  const body = (pages || [])
    .filter(Boolean)
    .map((html) => `<section class="document-page">${html}</section>`)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>${PRINT_STYLES}</style>
</head>
<body>${body}</body>
</html>`;
}

/**
 * Open a new window with the rendered pages and trigger the print dialog.
 * Returns the window instance (null when blocked by the browser).
 */
export function openPrintWindow(pages, title = 'Documents') {
  if (typeof window === 'undefined') return null;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return null;

  printWindow.document.open();
  printWindow.document.write(buildPrintDocument(pages, title));
  printWindow.document.close();

  const triggerPrint = () => {
    printWindow.focus();
    printWindow.print();
  };

  if (printWindow.document.readyState === 'complete') {
    setTimeout(triggerPrint, 250);
  } else {
    printWindow.addEventListener('load', () => setTimeout(triggerPrint, 250));
  }

  return printWindow;
}

// ----------------------------------------------------------------------

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
