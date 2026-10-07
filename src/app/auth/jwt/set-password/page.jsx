import { CONFIG } from 'src/global-config';

import { JwtSetPasswordView } from 'src/auth/view/jwt';

// ----------------------------------------------------------------------

export const metadata = { title: `Set password | Jwt - ${CONFIG.appName}` };

export default function Page() {
  return <JwtSetPasswordView />;
}
