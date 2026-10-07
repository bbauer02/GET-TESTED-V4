import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const INSTITUTE_ROLES = ['institute_admin', 'institute_staff', 'institute_teacher'];

/**
 * Menu du compte (avatar). `labelKey` est traduit via le namespace `layout`.
 * `home` bascule entre l'accueil public et le tableau de bord selon la page courante.
 */
export const _account = [
  { labelKey: 'home', href: '/', icon: <Iconify icon="solar:home-angle-bold-duotone" /> },
  {
    labelKey: 'my_profile',
    href: paths.dashboard.profile,
    icon: <Iconify icon="custom:profile-duotone" />,
  },
  {
    labelKey: 'my_enrollments',
    href: paths.dashboard.mesInscriptions.root,
    icon: <Iconify icon="solar:notes-bold-duotone" />,
    excludedRoles: ['admin', ...INSTITUTE_ROLES],
  },
  {
    labelKey: 'institute_space',
    href: paths.dashboard.espaceInstitut.root,
    icon: <Iconify icon="solar:buildings-2-bold-duotone" />,
    allowedRoles: INSTITUTE_ROLES,
  },
];
