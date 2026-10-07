'use client';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { useGetInvoice } from 'src/actions/invoice';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { InvoiceDetails } from '../invoice-details';

// ----------------------------------------------------------------------

export function InvoiceDetailsView({ id, backHref, breadcrumbLinks }) {
  const { t } = useTranslate('invoice');
  const { invoice, invoiceLoading } = useGetInvoice(id);

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

      <InvoiceDetails invoice={invoice} />
    </DashboardContent>
  );
}
