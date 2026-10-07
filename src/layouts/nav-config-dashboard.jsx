import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';

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

export function navData(t) {
  return [
    /**
     * Overview
     */
    {
      subheader: t('overview'),
      items: [
        { title: t('dashboard'), path: paths.dashboard.root, icon: ICONS.dashboard, excludedRoles: ['institute_admin', 'institute_staff'] },
        { title: t('my_profile'), path: paths.dashboard.profile, icon: ICONS.user },
        { title: t('find_session'), path: paths.dashboard.sessionSearch.root, icon: ICONS.calendar, excludedRoles: ['institute_admin', 'institute_staff', 'admin'] },
        { title: t('my_enrollments'), path: paths.dashboard.mesInscriptions.root, icon: ICONS.booking, excludedRoles: ['institute_admin', 'institute_staff', 'admin'] },
      ],
    },
    /**
     * Management — admin plateforme uniquement
     */
    {
      subheader: t('management'),
      items: [
        {
          title: t('users'),
          path: paths.dashboard.user.root,
          icon: ICONS.user,
          allowedRoles: ['admin'],
          children: [
            { title: t('list'), path: paths.dashboard.user.list },
            { title: t('create'), path: paths.dashboard.user.new },
          ],
        },
        {
          title: t('institutes'),
          path: paths.dashboard.institute.root,
          icon: ICONS.job,
          allowedRoles: ['admin'],
          children: [
            { title: t('list'), path: paths.dashboard.institute.list },
            { title: t('create'), path: paths.dashboard.institute.new },
          ],
        },
        {
          title: t('assessments'),
          path: paths.dashboard.assessment.root,
          icon: ICONS.course,
          allowedRoles: ['admin'],
          children: [
            { title: t('list'), path: paths.dashboard.assessment.list },
            { title: t('create'), path: paths.dashboard.assessment.new },
          ],
        },
        {
          title: t('exams'),
          path: paths.dashboard.exam.root,
          icon: ICONS.order,
          allowedRoles: ['admin'],
          children: [
            { title: t('list'), path: paths.dashboard.exam.list },
            { title: t('create'), path: paths.dashboard.exam.new },
          ],
        },
        {
          title: t('skills'),
          path: paths.dashboard.skill.root,
          icon: ICONS.label,
          allowedRoles: ['admin'],
          children: [
            { title: t('list'), path: paths.dashboard.skill.list },
            { title: t('create'), path: paths.dashboard.skill.new },
          ],
        },
        {
          title: t('invoices'),
          path: paths.dashboard.invoice.root,
          icon: ICONS.invoice,
          allowedRoles: ['admin'],
        },
        {
          title: t('documents'),
          path: paths.dashboard.documentType.root,
          icon: ICONS.file,
          allowedRoles: ['admin'],
          children: [
            { title: t('document_types'), path: paths.dashboard.documentType.list },
            { title: t('master_templates'), path: paths.dashboard.masterTemplate.list },
          ],
        },
      ],
    },
    /**
     * Espace Institut — droits par rôle dans l'institut (ADMIN / STAFF / TEACHER)
     */
    {
      subheader: t('institute_space'),
      items: [
        {
          title: t('profile_card'),
          path: paths.dashboard.espaceInstitut.fiche,
          icon: ICONS.banking,
          allowedRoles: ['institute_admin', 'institute_staff'],
        },
        {
          title: t('members'),
          path: paths.dashboard.espaceInstitut.membres,
          icon: ICONS.user,
          allowedRoles: ['institute_admin'],
        },
        {
          title: t('sessions'),
          path: paths.dashboard.espaceInstitut.sessions,
          icon: ICONS.calendar,
          allowedRoles: ['institute_admin', 'institute_staff'],
        },
        {
          title: t('my_exams'),
          path: paths.dashboard.espaceInstitut.sessions,
          icon: ICONS.calendar,
          allowedRoles: ['institute_teacher'],
        },
        {
          title: t('candidates'),
          path: paths.dashboard.espaceInstitut.candidats,
          icon: ICONS.booking,
          allowedRoles: ['institute_admin', 'institute_staff'],
        },
        {
          title: t('assessments'),
          path: paths.dashboard.espaceInstitut.assessments,
          icon: ICONS.course,
          allowedRoles: ['institute_admin'],
        },
        {
          title: t('question_bank'),
          path: paths.dashboard.espaceInstitut.questions,
          icon: ICONS.course,
          allowedRoles: ['institute_admin', 'institute_teacher'],
        },
        {
          title: t('documents'),
          path: paths.dashboard.espaceInstitut.documents,
          icon: ICONS.file,
          allowedRoles: ['institute_admin', 'institute_staff'],
        },
        {
          title: t('invoices'),
          path: paths.dashboard.espaceInstitut.invoices,
          icon: ICONS.invoice,
          allowedRoles: ['institute_admin'],
        },
        {
          title: t('stripe'),
          path: paths.dashboard.espaceInstitut.stripe,
          icon: ICONS.banking,
          allowedRoles: ['institute_admin'],
        },
      ],
    },
  ];
}
