import { CONFIG } from 'src/global-config';

import { JwtResetPasswordView } from 'src/auth/view/jwt';

// ----------------------------------------------------------------------

export const metadata = { title: `Nouveau mot de passe | ${CONFIG.appName}` };

export default function Page() {
  return <JwtResetPasswordView />;
}
