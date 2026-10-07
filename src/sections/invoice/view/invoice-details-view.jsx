'use client';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { useGetInvoice } from 'src/actions/invoice';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useAuthContext } from 'src/auth/hooks';

import { InvoiceDetails } from '../invoice-details';
import { InvoiceManagementActions } from '../invoice-management-actions';

// ----------------------------------------------------------------------

export function InvoiceDetailsView({ id, backHref, breadcrumbLinks, showManagementActions = false }) {
  const { t } = useTranslate('invoice');
  const { user } = useAuthContext();
  const { invoice, invoiceLoading, invoiceMutate } = useGetInvoice(id);

  // Actions de gestion réservées au back-office plateforme
  const canManage = showManagementActions && user?.role === 'admin';

  const defaultLinks = [
    { name: t('dashboard'), href: paths.dashboard.root },
    { name: t('heading'), href: paths.dashboard.invoice.root },
    { name: invoice?.invoiceNumber || '...' },
  ];

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={invoice?.invoiceNumber || t('heading_details')}
        backHref={backHref || paths.dashboard.invoice.root}
        links={breadcrumbLinks || defaultLinks}
        sx={{ mb: 3 }}
      />

      {canManage && !invoiceLoading && invoice && (
        <InvoiceManagementActions invoice={invoice} onUpdated={invoiceMutate} sx={{ mb: 3 }} />
      )}

      <InvoiceDetails invoice={invoice} />
    </DashboardContent>
  );
}
