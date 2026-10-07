import { JwtForgotPasswordView } from 'src/auth/view/jwt';

// ----------------------------------------------------------------------

export const metadata = { title: 'Mot de passe oublié' };

export default function Page() {
  return <JwtForgotPasswordView />;
}
