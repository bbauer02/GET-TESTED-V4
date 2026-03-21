import { MainLayout } from 'src/layouts/main/layout';

// ----------------------------------------------------------------------

export const metadata = { title: 'Devenir partenaire - GetTested' };

export default function Layout({ children }) {
  return <MainLayout>{children}</MainLayout>;
}
