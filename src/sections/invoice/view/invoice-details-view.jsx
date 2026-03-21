'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { useGetInvoice } from 'src/actions/invoice';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { InvoiceDetails } from '../invoice-details';

// ----------------------------------------------------------------------

export function InvoiceDetailsView({ id, backHref, breadcrumbLinks }) {
  const { invoice, invoiceLoading } = useGetInvoice(id);

  const defaultLinks = [
    { name: 'Dashboard', href: paths.dashboard.root },
    { name: 'Factures', href: paths.dashboard.invoice.root },
    { name: invoice?.invoiceNumber || '...' },
  ];

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={invoice?.invoiceNumber || 'Détail facture'}
        backHref={backHref || paths.dashboard.invoice.root}
        links={breadcrumbLinks || defaultLinks}
        sx={{ mb: 3 }}
      />

      <InvoiceDetails invoice={invoice} />
    </DashboardContent>
  );
}
