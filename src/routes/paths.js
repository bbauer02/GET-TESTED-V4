// ----------------------------------------------------------------------

const ROOTS = {
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
};

// ----------------------------------------------------------------------

export const paths = {
  faqs: '/faqs',
  minimalStore: 'https://mui.com/store/items/minimal-dashboard/',
  devenirPartenaire: '/devenir-partenaire',
  // Public sessions
  sessions: {
    root: '/sessions',
    details: (id) => `/sessions/${id}`,
  },
  // AUTH
  auth: {
    amplify: {
      signIn: `${ROOTS.AUTH}/amplify/sign-in`,
      verify: `${ROOTS.AUTH}/amplify/verify`,
      signUp: `${ROOTS.AUTH}/amplify/sign-up`,
      updatePassword: `${ROOTS.AUTH}/amplify/update-password`,
      resetPassword: `${ROOTS.AUTH}/amplify/reset-password`,
    },
    jwt: {
      signIn: `${ROOTS.AUTH}/jwt/sign-in`,
      signUp: `${ROOTS.AUTH}/jwt/sign-up`,
    },
    firebase: {
      signIn: `${ROOTS.AUTH}/firebase/sign-in`,
      verify: `${ROOTS.AUTH}/firebase/verify`,
      signUp: `${ROOTS.AUTH}/firebase/sign-up`,
      resetPassword: `${ROOTS.AUTH}/firebase/reset-password`,
    },
    auth0: {
      signIn: `${ROOTS.AUTH}/auth0/sign-in`,
    },
    supabase: {
      signIn: `${ROOTS.AUTH}/supabase/sign-in`,
      verify: `${ROOTS.AUTH}/supabase/verify`,
      signUp: `${ROOTS.AUTH}/supabase/sign-up`,
      updatePassword: `${ROOTS.AUTH}/supabase/update-password`,
      resetPassword: `${ROOTS.AUTH}/supabase/reset-password`,
    },
  },
  // DASHBOARD
  dashboard: {
    root: ROOTS.DASHBOARD,
    profile: `${ROOTS.DASHBOARD}/profile`,
    user: {
      root: `${ROOTS.DASHBOARD}/user`,
      list: `${ROOTS.DASHBOARD}/user/list`,
      new: `${ROOTS.DASHBOARD}/user/new`,
      edit: (id) => `${ROOTS.DASHBOARD}/user/${id}/edit`,
    },
    institute: {
      root: `${ROOTS.DASHBOARD}/institute`,
      list: `${ROOTS.DASHBOARD}/institute/list`,
      new: `${ROOTS.DASHBOARD}/institute/new`,
      edit: (id) => `${ROOTS.DASHBOARD}/institute/${id}/edit`,
      profile: (id) => `${ROOTS.DASHBOARD}/institute/${id}`,
    },
    assessment: {
      root: `${ROOTS.DASHBOARD}/assessment`,
      list: `${ROOTS.DASHBOARD}/assessment/list`,
      new: `${ROOTS.DASHBOARD}/assessment/new`,
      edit: (id) => `${ROOTS.DASHBOARD}/assessment/${id}/edit`,
    },
    exam: {
      root: `${ROOTS.DASHBOARD}/exam`,
      list: `${ROOTS.DASHBOARD}/exam/list`,
      new: `${ROOTS.DASHBOARD}/exam/new`,
      edit: (id) => `${ROOTS.DASHBOARD}/exam/${id}/edit`,
    },
    skill: {
      root: `${ROOTS.DASHBOARD}/skill`,
      list: `${ROOTS.DASHBOARD}/skill/list`,
      new: `${ROOTS.DASHBOARD}/skill/new`,
      edit: (id) => `${ROOTS.DASHBOARD}/skill/${id}/edit`,
    },
    invoice: {
      root: `${ROOTS.DASHBOARD}/invoice`,
      list: `${ROOTS.DASHBOARD}/invoice/list`,
      details: (id) => `${ROOTS.DASHBOARD}/invoice/${id}`,
    },
    documentType: {
      root: `${ROOTS.DASHBOARD}/document-type`,
      list: `${ROOTS.DASHBOARD}/document-type`,
      new: `${ROOTS.DASHBOARD}/document-type/new`,
      edit: (id) => `${ROOTS.DASHBOARD}/document-type/${id}/edit`,
    },
    masterTemplate: {
      root: `${ROOTS.DASHBOARD}/master-template`,
      list: `${ROOTS.DASHBOARD}/master-template`,
      new: `${ROOTS.DASHBOARD}/master-template/new`,
      edit: (id) => `${ROOTS.DASHBOARD}/master-template/${id}/edit`,
    },
    sessionSearch: {
      root: `${ROOTS.DASHBOARD}/sessions`,
      details: (id) => `${ROOTS.DASHBOARD}/sessions/${id}`,
    },
    mesInscriptions: {
      root: `${ROOTS.DASHBOARD}/mes-inscriptions`,
      details: (id) => `${ROOTS.DASHBOARD}/mes-inscriptions/${id}`,
    },
    espaceInstitut: {
      root: `${ROOTS.DASHBOARD}/espace-institut`,
      fiche: `${ROOTS.DASHBOARD}/espace-institut/fiche`,
      ficheEdit: `${ROOTS.DASHBOARD}/espace-institut/fiche/edit`,
      membres: `${ROOTS.DASHBOARD}/espace-institut/membres`,
      sessions: `${ROOTS.DASHBOARD}/espace-institut/sessions`,
      assessments: `${ROOTS.DASHBOARD}/espace-institut/assessments`,
      assessmentNew: `${ROOTS.DASHBOARD}/espace-institut/assessments/new`,
      assessmentView: (id) => `${ROOTS.DASHBOARD}/espace-institut/assessments/${id}`,
      assessmentEdit: (id) => `${ROOTS.DASHBOARD}/espace-institut/assessments/${id}/edit`,
      exams: (assessmentId) => `${ROOTS.DASHBOARD}/espace-institut/assessments/${assessmentId}/exams`,
      examNew: (assessmentId) => `${ROOTS.DASHBOARD}/espace-institut/assessments/${assessmentId}/exams/new`,
      examEdit: (assessmentId, examId) => `${ROOTS.DASHBOARD}/espace-institut/assessments/${assessmentId}/exams/${examId}/edit`,
      sessionView: (id) => `${ROOTS.DASHBOARD}/espace-institut/sessions/${id}`,
      sessionNew: `${ROOTS.DASHBOARD}/espace-institut/sessions/new`,
      sessionEdit: (id) => `${ROOTS.DASHBOARD}/espace-institut/sessions/${id}/edit`,
      stripe: `${ROOTS.DASHBOARD}/espace-institut/stripe`,
      invoices: `${ROOTS.DASHBOARD}/espace-institut/invoices`,
      invoiceDetails: (id) => `${ROOTS.DASHBOARD}/espace-institut/invoices/${id}`,
      documents: `${ROOTS.DASHBOARD}/espace-institut/documents`,
      documentNew: `${ROOTS.DASHBOARD}/espace-institut/documents/new`,
      documentEdit: (id) => `${ROOTS.DASHBOARD}/espace-institut/documents/${id}/edit`,
      documentGenerate: (id) => `${ROOTS.DASHBOARD}/espace-institut/documents/${id}/generate`,
    },
  },
};
