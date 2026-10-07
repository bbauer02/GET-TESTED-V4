import { paths } from 'src/routes/paths';

import { InvoiceDetailsView } from 'src/sections/invoice/view';

// ----------------------------------------------------------------------

export const metadata = { title: 'Détail facture' };

export default async function Page({ params }) {
  const { id } = await params;

  return (
    <InvoiceDetailsView
      id={id}
      backHref={paths.dashboard.espaceInstitut.invoices}
      breadcrumbLinks={[
        { name: 'Tableau de bord', href: paths.dashboard.root },
        { name: 'Espace Institut', href: paths.dashboard.espaceInstitut.root },
        { name: 'Factures', href: paths.dashboard.espaceInstitut.invoices },
        { name: 'Détail' },
      ]}
    />
  );
}
