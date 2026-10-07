import dayjs from 'dayjs';
import { useMemo } from 'react';

import { escapeHtml } from 'src/utils/escape-html';

import { useGetInstituteInvoices } from 'src/actions/invoice';
import { useGetInstituteSessions } from 'src/actions/espace-institut';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

/**
 * Generates smart notifications from existing data (sessions, invoices).
 * Can be replaced with a real API endpoint later.
 */
export function useNotifications() {
  const { user } = useAuthContext();
  const instituteId = user?.currentInstitute?.id;

  const { sessions } = useGetInstituteSessions(instituteId);
  const { invoices } = useGetInstituteInvoices(instituteId);

  const notifications = useMemo(() => {
    const items = [];
    const now = dayjs();

    // Sessions starting within 7 days
    (sessions || []).forEach((session) => {
      if (!session.start) return;
      const start = dayjs(session.start);
      const daysUntil = start.diff(now, 'day');

      if (daysUntil >= 0 && daysUntil <= 7) {
        items.push({
          id: `session-soon-${session.id}`,
          type: 'session',
          category: 'Session',
          isUnRead: daysUntil <= 2,
          createdAt: now.subtract(1, 'hour').toISOString(),
          title: `<p>La session <strong>${escapeHtml(session.assessment?.label || 'Assessment')}</strong> commence ${daysUntil === 0 ? "aujourd'hui" : `dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}`}</p>`,
          avatarUrl: null,
        });
      }
    });

    // Sessions with low availability (>70% full)
    (sessions || []).forEach((session) => {
      if (session.status !== 'OPEN') return;
      const enrolled = session.enrollmentsCount ?? session.enrollments?.length ?? 0;
      const capacity = session.placesAvailable ?? 0;
      if (capacity > 0 && enrolled / capacity >= 0.7) {
        items.push({
          id: `session-full-${session.id}`,
          type: 'session',
          category: 'Session',
          isUnRead: enrolled / capacity >= 0.9,
          createdAt: now.subtract(2, 'hour').toISOString(),
          title: `<p>Session <strong>${escapeHtml(session.assessment?.label || 'Assessment')}</strong> : ${enrolled}/${capacity} places occupées</p>`,
          avatarUrl: null,
        });
      }
    });

    // Pending invoices
    (invoices || []).forEach((inv) => {
      if (inv.status === 'PENDING' || inv.status === 'DRAFT') {
        items.push({
          id: `invoice-pending-${inv.id}`,
          type: 'payment',
          category: 'Facture',
          isUnRead: true,
          createdAt: inv.invoiceDate || inv.createdAt || now.toISOString(),
          title: `<p>Facture <strong>${escapeHtml(inv.invoiceNumber || inv.reference || '')}</strong> en attente de paiement</p>`,
          avatarUrl: null,
        });
      }

      if (inv.status === 'OVERDUE') {
        items.push({
          id: `invoice-overdue-${inv.id}`,
          type: 'payment',
          category: 'Facture',
          isUnRead: true,
          createdAt: inv.invoiceDate || inv.createdAt || now.toISOString(),
          title: `<p>Facture <strong>${escapeHtml(inv.invoiceNumber || inv.reference || '')}</strong> en retard de paiement</p>`,
          avatarUrl: null,
        });
      }
    });

    // Sort by date desc
    items.sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf());

    return items;
  }, [sessions, invoices]);

  return { notifications };
}
