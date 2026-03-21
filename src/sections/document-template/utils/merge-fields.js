// ----------------------------------------------------------------------

export const MERGE_FIELD_CATEGORIES = [
  {
    category: 'Candidat',
    fields: [
      { field: 'candidate.civility', label: 'Civilite' },
      { field: 'candidate.firstname', label: 'Prenom' },
      { field: 'candidate.lastname', label: 'Nom' },
      { field: 'candidate.email', label: 'Email' },
      { field: 'candidate.phone', label: 'Telephone' },
      { field: 'candidate.birthday', label: 'Date de naissance' },
      { field: 'candidate.address', label: 'Adresse' },
      { field: 'candidate.city', label: 'Ville' },
      { field: 'candidate.zipcode', label: 'Code postal' },
    ],
  },
  {
    category: 'Session',
    fields: [
      { field: 'session.assessment', label: 'Nom du test' },
      { field: 'session.level', label: 'Niveau' },
      { field: 'session.start', label: 'Date de debut' },
      { field: 'session.end', label: 'Date de fin' },
    ],
  },
  {
    category: 'Institut',
    fields: [
      { field: 'institute.label', label: "Nom de l'institut" },
      { field: 'institute.email', label: 'Email' },
      { field: 'institute.address', label: 'Adresse' },
      { field: 'institute.city', label: 'Ville' },
      { field: 'institute.siren', label: 'SIREN' },
    ],
  },
  {
    category: 'Inscription',
    fields: [
      { field: 'enrollment.registrationDate', label: "Date d'inscription" },
      { field: 'enrollment.exams', label: 'Liste des epreuves (texte)' },
      { field: 'enrollment.examsTable', label: 'Tableau des epreuves (date, heure, salle, lieu)' },
    ],
  },
  {
    category: 'Facture',
    fields: [
      { field: 'invoice.number', label: 'Numero de facture' },
      { field: 'invoice.totalTTC', label: 'Montant TTC' },
    ],
  },
];
