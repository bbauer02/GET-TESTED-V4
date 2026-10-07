import { CONFIG } from 'src/global-config';

import { JwtForgotPasswordView } from 'src/auth/view/jwt';

// ----------------------------------------------------------------------

export const metadata = { title: `Mot de passe oublié | ${CONFIG.appName}` };

export default function Page() {
  return <JwtForgotPasswordView />;
}
