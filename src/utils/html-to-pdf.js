// Conversion d'un élément HTML rendu à l'écran en fichier PDF A4 téléchargé par le navigateur.
// html2pdf.js est importé à la demande (navigateur uniquement, ~300 ko).

export async function downloadElementAsPdf(element, filename) {
  if (!element) return;

  const { default: html2pdf } = await import('html2pdf.js');

  await html2pdf()
    .set({
      margin: 10,
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        // La page d'aperçu (A4 à l'écran, ombre comprise) ne doit pas déborder sur une 2e page
        onclone: (doc) => {
          doc.querySelectorAll('.document-preview').forEach((page) => {
            page.style.minHeight = 'auto';
            page.style.boxShadow = 'none';
            page.style.width = '100%';
            page.style.padding = '0';
          });
        },
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] },
    })
    .from(element)
    .save();
}

/** Nom de fichier lisible : « convocation-dupont-jean.pdf » */
export function toPdfFilename(...parts) {
  const slug = parts
    .filter(Boolean)
    .join('-')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  return `${slug || 'document'}.pdf`;
}
