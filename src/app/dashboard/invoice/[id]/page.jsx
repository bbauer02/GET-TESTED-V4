import { InvoiceDetailsView } from 'src/sections/invoice/view';

// ----------------------------------------------------------------------

export const metadata = { title: 'Détail facture' };

export default async function Page({ params }) {
  const { id } = await params;

  return <InvoiceDetailsView id={id} showManagementActions />;
}
