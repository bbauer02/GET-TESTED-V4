import { redirect } from 'next/navigation';

import { paths } from 'src/routes/paths';

// ----------------------------------------------------------------------

export default function EspaceInstitutPage() {
  redirect(paths.dashboard.espaceInstitut.fiche);
}
