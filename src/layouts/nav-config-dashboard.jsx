import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';

import { Label } from 'src/components/label';
import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name) => <SvgColor src={`${CONFIG.assetsDir}/assets/icons/navbar/${name}.svg`} />;

const ICONS = {
  job: icon('ic-job'),
  blog: icon('ic-blog'),
  chat: icon('ic-chat'),
  mail: icon('ic-mail'),
  user: icon('ic-user'),
  file: icon('ic-file'),
  lock: icon('ic-lock'),
  tour: icon('ic-tour'),
  order: icon('ic-order'),
  label: icon('ic-label'),
  blank: icon('ic-blank'),
  kanban: icon('ic-kanban'),
  folder: icon('ic-folder'),
  course: icon('ic-course'),
  params: icon('ic-params'),
  banking: icon('ic-banking'),
  booking: icon('ic-booking'),
  invoice: icon('ic-invoice'),
  product: icon('ic-product'),
  calendar: icon('ic-calendar'),
  disabled: icon('ic-disabled'),
  external: icon('ic-external'),
  subpaths: icon('ic-subpaths'),
  menuItem: icon('ic-menu-item'),
  ecommerce: icon('ic-ecommerce'),
  analytics: icon('ic-analytics'),
  dashboard: icon('ic-dashboard'),
};

// ----------------------------------------------------------------------

export const navData = [
  /**
   * Overview
   */
  {
    subheader: 'Overview',
    items: [
      { title: 'Profile', path: paths.dashboard.profile, icon: ICONS.user },
    ],
  },
  /**
   * Management
   */
  {
    subheader: 'Management',
    items: [
      {
        title: 'User',
        path: paths.dashboard.user.root,
        icon: ICONS.user,
        allowedRoles: ['admin'],
        children: [
          { title: 'List', path: paths.dashboard.user.list },
          { title: 'Create', path: paths.dashboard.user.new },
        ],
      },
      {
        title: 'Instituts',
        path: paths.dashboard.institute.root,
        icon: ICONS.job,
        allowedRoles: ['admin'],
        children: [
          { title: 'Liste', path: paths.dashboard.institute.list },
          { title: 'Creer', path: paths.dashboard.institute.new },
        ],
      },
      {
        title: 'Assessments',
        path: paths.dashboard.assessment.root,
        icon: ICONS.course,
        allowedRoles: ['admin'],
        children: [
          { title: 'Liste', path: paths.dashboard.assessment.list },
          { title: 'Creer', path: paths.dashboard.assessment.new },
        ],
      },
      {
        title: 'Exams',
        path: paths.dashboard.exam.root,
        icon: ICONS.order,
        allowedRoles: ['admin'],
        children: [
          { title: 'Liste', path: paths.dashboard.exam.list },
          { title: 'Creer', path: paths.dashboard.exam.new },
        ],
      },
      {
        title: 'Skills',
        path: paths.dashboard.skill.root,
        icon: ICONS.label,
        allowedRoles: ['admin'],
        children: [
          { title: 'Liste', path: paths.dashboard.skill.list },
          { title: 'Creer', path: paths.dashboard.skill.new },
        ],
      },
    ],
  },
  /**
   * Espace Institut
   */
  {
    subheader: 'Espace Institut',
    items: [
      {
        title: 'Fiche',
        path: paths.dashboard.espaceInstitut.fiche,
        icon: ICONS.banking,
        allowedRoles: ['institute_admin'],
      },
      {
        title: 'Membres',
        path: paths.dashboard.espaceInstitut.membres,
        icon: ICONS.user,
        allowedRoles: ['institute_admin'],
      },
      {
        title: 'Sessions',
        path: paths.dashboard.espaceInstitut.sessions,
        icon: ICONS.calendar,
        allowedRoles: ['institute_admin'],
      },
      {
        title: 'Assessments',
        path: paths.dashboard.espaceInstitut.assessments,
        icon: ICONS.course,
        allowedRoles: ['institute_admin'],
      },
      {
        title: 'Stripe',
        path: paths.dashboard.espaceInstitut.stripe,
        icon: ICONS.banking,
        allowedRoles: ['institute_admin'],
      },
    ],
  },
];
