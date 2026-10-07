import { JwtSignInView } from 'src/auth/view/jwt';

// ----------------------------------------------------------------------

export const metadata = { title: 'Connexion' };

export default function Page() {
  return <JwtSignInView />;
}
