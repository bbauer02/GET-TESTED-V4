import dayjs from 'dayjs';

import { escapeHtml } from 'src/utils/escape-html';

// ----------------------------------------------------------------------

/**
 * Build a flat context object from enrollment data for merge field replacement.
 */
export function buildMergeContext({ enrollment, session, institute, invoice }) {
  const candidate = enrollment?.user || enrollment?.candidate || {};
  const address = candidate?.address || {};

  const enrollmentExams = enrollment?.enrollmentExams || enrollment?.exams || [];

  const context = {
    // Candidat
    'candidate.civility': candidate.civility?.value || candidate.civility || '',
    'candidate.firstname': candidate.firstname || candidate.firstName || '',
    'candidate.lastname': candidate.lastname || candidate.lastName || '',
    'candidate.email': candidate.email || '',
    'candidate.phone': candidate.phone || candidate.phoneNumber || '',
    'candidate.birthday': candidate.birthday ? dayjs(candidate.birthday).format('DD/MM/YYYY') : '',
    'candidate.address': address.address1 || address.street || '',
    'candidate.city': address.city || '',
    'candidate.zipcode': address.zipcode || '',

    // Session
    'session.assessment': session?.assessment?.label || '',
    'session.level': session?.level?.label || '',
    'session.start': session?.start ? dayjs(session.start).format('DD/MM/YYYY HH:mm') : '',
    'session.end': session?.end ? dayjs(session.end).format('DD/MM/YYYY HH:mm') : '',

    // Institut
    'institute.label': institute?.label || '',
    'institute.email': institute?.email || '',
    'institute.address': institute?.address?.address1 || '',
    'institute.city': institute?.address?.city || '',
    'institute.zipcode': institute?.address?.zipcode || '',
    'institute.siren': institute?.siren || '',
    'institute.siret': institute?.siret || '',
    'institute.legalForm': institute?.legalForm || '',
    'institute.shareCapital': institute?.shareCapital || '',
    'institute.rcsCity': institute?.rcsCity || '',
    'institute.logo': institute?.logo
      ? `<img src="${escapeHtml(institute.logo)}" alt="Logo" style="max-height:60px;max-width:180px;" />`
      : '',

    // Inscription
    'enrollment.referenceNumber': enrollment?.referenceNumber || '',
    'enrollment.registrationDate': enrollment?.registrationDate
      ? dayjs(enrollment.registrationDate).format('DD/MM/YYYY')
      : '',
    'enrollment.exams': enrollmentExams
      .map((e) => e.scheduledExam?.exam?.label || e.exam?.label || e.label || '')
      .filter(Boolean)
      .join(', '),
    'enrollment.examsTable': buildExamsTable(enrollmentExams, institute),

    // Facture (montants de l'API en euros)
    'invoice.number': invoice?.invoiceNumber || invoice?.number || '',
    'invoice.totalTTC':
      invoice?.totalTTC != null
        ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: invoice.currency || 'EUR' }).format(invoice.totalTTC)
        : '',

    // Document
    'document.date': dayjs().format('DD/MM/YYYY'),
  };

  // Les valeurs saisies par les utilisateurs sont échappées : seuls les blocs générés ici restent en HTML
  const htmlFields = ['institute.logo', 'enrollment.examsTable'];
  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => [key, htmlFields.includes(key) ? value : escapeHtml(value)])
  );
}

// ----------------------------------------------------------------------

/**
 * Build an HTML table of exams grouped by location, BAC-style convocation.
 */
function buildExamsTable(enrollmentExams, institute) {
  if (!enrollmentExams?.length) return '<p><em>Aucune épreuve programmée</em></p>';

  // Group exams by location (address key)
  const groups = new Map();

  enrollmentExams.forEach((ee) => {
    const se = ee.scheduledExam || {};
    const addr = se.address || institute?.address || {};
    const locationKey = [addr.address1, addr.zipcode, addr.city].filter(Boolean).join('|') || 'default';
    const locationLabel = addr.address1 || institute?.address?.address1 || '';
    const locationCity = [addr.zipcode, addr.city].filter(Boolean).join(' ');

    if (!groups.has(locationKey)) {
      groups.set(locationKey, { label: locationLabel, city: locationCity, room: se.room || '', exams: [] });
    }

    const group = groups.get(locationKey);
    const exam = se.exam || ee.exam || {};
    group.exams.push({
      label: exam.label || '—',
      date: se.startDate ? dayjs(se.startDate).format('DD/MM/YYYY') : '—',
      time: se.startDate ? dayjs(se.startDate).format('HH:mm') : '—',
      duration: exam.duration ? `${exam.duration} min` : '',
      room: se.room || '—',
    });
  });

  const blocks = [];

  groups.forEach((group) => {
    const rows = group.exams.map((ex) =>
      `<tr>
        <td style="padding:6px 12px;">${escapeHtml(ex.label)}${ex.duration ? ` <span style="font-size:0.85em;color:#666;">(${ex.duration})</span>` : ''}</td>
        <td style="padding:6px 12px;">${ex.date} — <strong>${ex.time}</strong></td>
        <td style="padding:6px 12px;">${escapeHtml(ex.room)}</td>
      </tr>`
    ).join('');

    blocks.push(
      `<table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr>
          <td colspan="3" style="padding:10px 12px;background-color:#f0f0f0;">
            <strong>${escapeHtml(group.label)}</strong><br>
            <span style="font-size:0.85em;color:#555;">${escapeHtml(group.city)}</span>
          </td>
        </tr>
        ${rows}
      </table>`
    );
  });

  return blocks.join('');
}

// ----------------------------------------------------------------------

/**
 * Replace merge fields in HTML template content with actual values.
 * Handles both <span data-merge-field="..."> nodes and {{ field }} text patterns.
 */
export function replaceMergeFields(htmlContent, context) {
  if (!htmlContent) return '';

  let result = htmlContent;

  // Replace <span data-merge-field="xxx">...</span> with the value
  result = result.replace(
    /<span[^>]*data-merge-field="([^"]+)"[^>]*>[^<]*<\/span>/g,
    (match, field) => context[field] ?? ''
  );

  // Replace {{ field }} text patterns
  result = result.replace(
    /\{\{\s*([^}]+)\s*\}\}/g,
    (match, field) => context[field.trim()] ?? match
  );

  return result;
}
