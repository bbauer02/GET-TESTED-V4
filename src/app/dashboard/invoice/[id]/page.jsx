import { InvoiceDetailsView } from 'src/sections/invoice/view';

// ----------------------------------------------------------------------

export const metadata = { title: 'Détail facture' };

export default function Page({ params }) {
  const { id } = params;

  return <InvoiceDetailsView id={id} />;
}
