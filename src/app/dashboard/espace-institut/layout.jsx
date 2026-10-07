'use client';

import { paths } from 'src/routes/paths';
import { usePathname } from 'src/routes/hooks';

import { useAuthContext } from 'src/auth/hooks';
import { RoleBasedGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

const ADMIN = ['institute_admin'];
const OPS = ['institute_admin', 'institute_staff'];
const ALL_MEMBERS = ['institute_admin', 'institute_staff', 'institute_teacher'];

const ROUTE = paths.dashboard.espaceInstitut;

// Droits par section (mêmes règles que les voters de l'API), du préfixe le plus spécifique au plus large
const ROUTE_ROLES = [
  // Résultats d'une session : saisie par les examinateurs
  { match: (p) => p.startsWith(ROUTE.sessions) && p.includes('/results'), roles: ALL_MEMBERS },
  { match: (p) => p.startsWith(`${ROUTE.sessions}/new`) || /\/sessions\/[^/]+\/edit/.test(p), roles: OPS },
  { match: (p) => p.startsWith(ROUTE.sessions), roles: ALL_MEMBERS },
  { match: (p) => p.startsWith(ROUTE.questions) || p.includes('/espace-institut/subject'), roles: ['institute_admin', 'institute_teacher'] },
  { match: (p) => p.startsWith(ROUTE.candidats), roles: OPS },
  { match: (p) => p.startsWith(ROUTE.documents), roles: OPS },
  { match: (p) => p.startsWith(ROUTE.ficheEdit), roles: ADMIN },
  { match: (p) => p.startsWith(ROUTE.fiche), roles: OPS },
  { match: (p) => p.startsWith(ROUTE.membres), roles: ADMIN },
  { match: (p) => p.startsWith(ROUTE.assessments), roles: ADMIN },
  { match: (p) => p.startsWith(ROUTE.invoices), roles: ADMIN },
  { match: (p) => p.startsWith(ROUTE.stripe), roles: ADMIN },
];

export default function EspaceInstitutLayout({ children }) {
  const { user } = useAuthContext();
  const pathname = usePathname();

  const allowedRoles = ROUTE_ROLES.find((route) => route.match(pathname))?.roles ?? ALL_MEMBERS;

  return (
    <RoleBasedGuard hasContent currentRole={user?.roles} allowedRoles={allowedRoles}>
      {children}
    </RoleBasedGuard>
  );
}
