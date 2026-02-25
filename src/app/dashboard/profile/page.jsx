import { CONFIG } from 'src/global-config';

import { ProfileView } from 'src/sections/profile/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Profil | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <ProfileView />;
}
