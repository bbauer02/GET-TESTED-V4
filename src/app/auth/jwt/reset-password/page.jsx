import { JwtResetPasswordView } from 'src/auth/view/jwt';

// ----------------------------------------------------------------------

export const metadata = { title: 'Nouveau mot de passe' };

export default function Page() {
  return <JwtResetPasswordView />;
}
