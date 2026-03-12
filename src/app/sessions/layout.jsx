import { SimpleLayout } from 'src/layouts/simple';

// ----------------------------------------------------------------------

export const metadata = { title: 'Sessions de test' };

export default function Layout({ children }) {
  return <SimpleLayout>{children}</SimpleLayout>;
}
