import { JwtSetPasswordView } from 'src/auth/view/jwt';

// ----------------------------------------------------------------------

export const metadata = { title: 'Définir le mot de passe' };

export default function Page() {
  return <JwtSetPasswordView />;
}
