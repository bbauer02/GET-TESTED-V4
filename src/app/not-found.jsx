import { NotFoundView } from 'src/sections/error';

// ----------------------------------------------------------------------

export const metadata = { title: 'Page introuvable' };

export default function Page() {
  return <NotFoundView />;
}
