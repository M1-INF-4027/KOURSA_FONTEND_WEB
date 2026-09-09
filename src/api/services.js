import api from './config';

// Helper: extract array from paginated or direct response
function unwrap(response) {
  const data = response.data;
  // Paginated: { count, next, previous, results: [...] }
  if (data && Array.isArray(data.results)) {
    return { ...response, data: data.results };
  }
  return response;
}

// Helper: fetch all pages
async function fetchAll(url, params) {
  const res = await api.get(url, { params: { page_size: 10000, ...params } });
  return unwrap(res);
}

// Les imports sont longs par nature : creer 47 comptes enseignants demande une
// minute, le hachage PBKDF2 d'un mot de passe coutant a lui seul ~1,3 s. Le
// delai global de 15 s du client les interrompait en cours de route, laissant
// l'import a moitie fait — d'ou un echec au premier essai, suivi d'un succes au
// second, les comptes deja crees n'etant plus a hacher.
const DELAI_IMPORT_MS = 300000;

// Helper: poste un fichier Excel vers un endpoint d'import.
// `champs` ajoute les parametres attendus par certains imports (filiere, departement...).
function postFichier(url, file, champs = {}) {
  const formData = new FormData();
  formData.append('file', file);
  Object.entries(champs).forEach(([cle, valeur]) => {
    if (valeur !== undefined && valeur !== null && valeur !== '') {
      formData.append(cle, valeur);
    }
  });
  return api.post(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: DELAI_IMPORT_MS,
  });
}

// Helper: envoie les lignes arbitrees dans l'apercu, avec le meme delai etendu.
function postLignes(url, corps) {
  return api.post(url, corps, { timeout: DELAI_IMPORT_MS });
}


// Helper: construit les deux temps d'un import pour un endpoint donne.
//   simuler(file)      -> le serveur decrit ce qu'il ecrirait, sans rien ecrire
//   importerLignes(rows) -> ecriture des lignes arbitrees dans l'apercu
function importDeuxTemps(url) {
  return {
    simuler: (file, champs = {}) => postFichier(url, file, { ...champs, dry_run: '1' }),
    import: (file, champs = {}) => postFichier(url, file, champs),
    importerLignes: (rows, champs = {}) => postLignes(url, { rows, ...champs }),
  };
}

// ==================== AUTH ====================
export const authService = {
  login: (credentials) => api.post('/auth/token/', credentials),
  refreshToken: (refreshToken) => api.post('/auth/token/refresh/', { refresh: refreshToken }),
};

// ==================== DASHBOARD ====================
function buildDashboardParams({ dateDebut, dateFin, filiere, niveau, semestre, departement } = {}) {
  const params = new URLSearchParams();
  if (dateDebut) params.append('date_debut', dateDebut);
  if (dateFin) params.append('date_fin', dateFin);
  if (filiere) params.append('filiere', filiere);
  if (niveau) params.append('niveau', niveau);
  if (semestre) params.append('semestre', semestre);
  if (departement) params.append('departement', departement);
  return params;
}

export const dashboardService = {
  getRoot: () => api.get('/dashboard/'),
  getStats: (filters) => {
    const params = buildDashboardParams(filters);
    return api.get(`/dashboard/stats/?${params.toString()}`);
  },
  getRecapitulatif: (filters) => {
    const params = buildDashboardParams(filters);
    return api.get(`/dashboard/recapitulatif/?${params.toString()}`);
  },
  exportBilan: (filters) => {
    const params = buildDashboardParams(filters);
    return api.get(`/dashboard/export-bilan/?${params.toString()}`, { responseType: 'blob' });
  },
  exportParUE: (filters, ueId) => {
    const params = buildDashboardParams(filters);
    if (ueId) params.append('ue', ueId);
    return api.get(`/dashboard/export-par-ue/?${params.toString()}`, { responseType: 'blob' });
  },
  exportParEnseignant: (filters, enseignantId) => {
    const params = buildDashboardParams(filters);
    if (enseignantId) params.append('enseignant', enseignantId);
    return api.get(`/dashboard/export-par-enseignant/?${params.toString()}`, { responseType: 'blob' });
  },
  exportHeures: (annee, mois) => {
    const params = new URLSearchParams();
    if (annee) params.append('annee', annee.toString());
    if (mois) params.append('mois', mois.toString());
    return api.get(`/dashboard/export-heures/?${params.toString()}`, { responseType: 'blob' });
  },
  getAdminOverview: () => api.get('/dashboard/admin-overview/'),
  getWeeklyTracking: (semaine, departement) => {
    const params = new URLSearchParams();
    if (semaine) params.append('semaine', semaine);
    if (departement) params.append('departement', departement);
    return api.get(`/dashboard/weekly-tracking/?${params.toString()}`);
  },
  getEnseignantWeeklyTracking: (semaine) => api.get(`/dashboard/enseignant-weekly-tracking/${semaine ? `?semaine=${semaine}` : ''}`),
  exportMonRapport: (filters) => {
    const params = buildDashboardParams(filters);
    return api.get(`/dashboard/export-mon-rapport/?${params.toString()}`, { responseType: 'blob' });
  },
};

// ==================== USERS ====================
export const usersService = {
  getAll: () => fetchAll('/users/utilisateurs/'),
  getById: (id) => api.get(`/users/utilisateurs/${id}/`),
  getMe: () => api.get('/users/utilisateurs/me/'),
  create: (data) => api.post('/users/utilisateurs/', data),
  update: (id, data) => api.patch(`/users/utilisateurs/${id}/`, data),
  delete: (id) => api.delete(`/users/utilisateurs/${id}/`),
  approuverDelegue: (id) => api.post(`/users/utilisateurs/${id}/approuver-delegue/`),
  approuver: (id) => api.post(`/users/utilisateurs/${id}/approuver/`),
  register: (data) => api.post('/users/utilisateurs/', data),
  changerNiveau: (niveauId) => api.post('/users/utilisateurs/changer-niveau/', { niveau_id: niveauId }),
  resetDatabase: (password) => api.post('/users/utilisateurs/reset-database/', { password }),
  changePassword: (data) => api.post('/users/utilisateurs/change-password/', data),
  simulerEnseignants: (file) =>
    postFichier('/users/utilisateurs/import-enseignants/', file, { dry_run: '1' }),
  importEnseignants: (file) =>
    postFichier('/users/utilisateurs/import-enseignants/', file),
  importerEnseignantsLignes: (rows) =>
    postLignes('/users/utilisateurs/import-enseignants/', { rows }),
};

export const rolesService = {
  getAll: () => fetchAll('/users/roles/'),
  getById: (id) => api.get(`/users/roles/${id}/`),
};

// ==================== WHITELIST ====================
export const whitelistService = {
  getAll: (params) => fetchAll('/users/whitelist/', params),
  create: (data) => api.post('/users/whitelist/', data),
  bulkCreate: (data) => api.post('/users/whitelist/bulk/', data),
  delete: (id) => api.delete(`/users/whitelist/${id}/`),
  deleteAll: (params) => api.delete('/users/whitelist/delete-all/', { params }),
  import: (file, departement, roleDefaut) =>
    postFichier('/users/whitelist/import/', file, {
      departement,
      role_defaut: roleDefaut,
    }),
  simuler: (file, departement, roleDefaut) =>
    postFichier('/users/whitelist/import/', file, {
      departement,
      role_defaut: roleDefaut,
      dry_run: '1',
    }),
  importerLignes: (rows, departement, roleDefaut) =>
    postLignes('/users/whitelist/import/', {
      rows,
      departement,
      role_defaut: roleDefaut,
    }),
};

// ==================== ACADEMIC ====================
export const structureService = {
  // Importe la hierarchie complete : Faculte > Departement > Filiere > Niveau
  import: (file) => postFichier('/academic/structure/import/', file),
};

export const facultesService = {
  ...importDeuxTemps('/academic/facultes/import/'),

  getAll: () => fetchAll('/academic/facultes/'),
  getById: (id) => api.get(`/academic/facultes/${id}/`),
  create: (data) => api.post('/academic/facultes/', data),
  update: (id, data) => api.patch(`/academic/facultes/${id}/`, data),
  delete: (id) => api.delete(`/academic/facultes/${id}/`),
};

export const departementsService = {
  ...importDeuxTemps('/academic/departements/import/'),

  getAll: () => fetchAll('/academic/departements/'),
  getById: (id) => api.get(`/academic/departements/${id}/`),
  create: (data) => api.post('/academic/departements/', data),
  update: (id, data) => api.patch(`/academic/departements/${id}/`, data),
  delete: (id) => api.delete(`/academic/departements/${id}/`),
};

export const filieresService = {
  ...importDeuxTemps('/academic/filieres/import/'),

  getAll: () => fetchAll('/academic/filieres/'),
  getById: (id) => api.get(`/academic/filieres/${id}/`),
  create: (data) => api.post('/academic/filieres/', data),
  update: (id, data) => api.patch(`/academic/filieres/${id}/`, data),
  delete: (id) => api.delete(`/academic/filieres/${id}/`),
};

export const niveauxService = {
  ...importDeuxTemps('/academic/niveaux/import/'),

  getAll: () => fetchAll('/academic/niveaux/'),
  getByDepartement: (deptId) => fetchAll(`/academic/niveaux/?departement=${deptId}`),
  getById: (id) => api.get(`/academic/niveaux/${id}/`),
  create: (data) => api.post('/academic/niveaux/', data),
  update: (id, data) => api.patch(`/academic/niveaux/${id}/`, data),
  delete: (id) => api.delete(`/academic/niveaux/${id}/`),
};

export const sallesService = {
  getAll: () => fetchAll('/academic/salles/'),
  getById: (id) => api.get(`/academic/salles/${id}/`),
  create: (data) => api.post('/academic/salles/', data),
  update: (id, data) => api.patch(`/academic/salles/${id}/`, data),
  delete: (id) => api.delete(`/academic/salles/${id}/`),
  deleteAll: () => api.delete('/academic/salles/delete-all/'),
  simuler: (file) => postFichier('/academic/salles/import/', file, { dry_run: '1' }),
  import: (file) => postFichier('/academic/salles/import/', file),
  importerLignes: (rows) => postLignes('/academic/salles/import/', { rows }),
};

// ==================== TEACHING ====================
export const unitesEnseignementService = {
  getAll: () => fetchAll('/teaching/unites-enseignement/'),
  getBySemestre: (semestreId) => fetchAll(`/teaching/unites-enseignement/?semestre_id=${semestreId}`),
  getByAnnee: (anneeId) => fetchAll(`/teaching/unites-enseignement/?annee_academique=${anneeId}`),
  getById: (id) => api.get(`/teaching/unites-enseignement/${id}/`),
  create: (data) => api.post('/teaching/unites-enseignement/', data),
  update: (id, data) => api.patch(`/teaching/unites-enseignement/${id}/`, data),
  delete: (id) => api.delete(`/teaching/unites-enseignement/${id}/`),
  deleteAll: () => api.delete('/teaching/unites-enseignement/delete-all/'),
  import: (file, { filiere, semestre, niveaux, anneeAcademique } = {}) =>
    postFichier('/teaching/unites-enseignement/import/', file, {
      filiere,
      semestre,
      niveaux,
      annee_academique: anneeAcademique,
    }),
  simuler: (file, { filiere, semestre, anneeAcademique } = {}) =>
    postFichier('/teaching/unites-enseignement/import/', file, {
      filiere,
      semestre,
      annee_academique: anneeAcademique,
      dry_run: '1',
    }),
  importerLignes: (rows, { filiere, anneeAcademique } = {}) =>
    postLignes('/teaching/unites-enseignement/import/', {
      rows, filiere, annee_academique: anneeAcademique,
    }),
  importAffectations: (file, { filiere, anneeAcademique } = {}) =>
    postFichier('/teaching/unites-enseignement/import-affectations/', file, {
      filiere,
      annee_academique: anneeAcademique,
    }),
  simulerAffectations: (file, { filiere, anneeAcademique } = {}) =>
    postFichier('/teaching/unites-enseignement/import-affectations/', file, {
      filiere,
      annee_academique: anneeAcademique,
      dry_run: '1',
    }),
  importerAffectationsLignes: (rows, { filiere, anneeAcademique } = {}) =>
    postLignes('/teaching/unites-enseignement/import-affectations/', {
      rows, filiere, annee_academique: anneeAcademique,
    }),
  getMesDelegues: () => api.get('/teaching/unites-enseignement/mes-delegues/'),
};

// ==================== CONFIGURATION ====================
export const configurationService = {
  getStatus: () => api.get('/configuration/status/'),
  createAnnee: (data) => api.post('/configuration/annee-academique/', data),
  activerAnnee: (id) => api.post(`/configuration/annee-academique/${id}/activer/`),
  activerSemestre: (id) => api.post(`/configuration/semestre/${id}/activer/`),
  reconduire: (id) => api.post(`/configuration/annee-academique/${id}/reconduire/`),
  getChecklist: () => api.get('/configuration/checklist/'),
  markConfigured: (id) => api.post(`/configuration/annee-academique/${id}/marquer-configuree/`),
  getChefChecklist: () => api.get('/configuration/chef-checklist/'),
};

// ==================== ANNEES ACADEMIQUES ====================
export const anneesAcademiquesService = {
  getAll: () => fetchAll('/academic/annees-academiques/'),
  getById: (id) => api.get(`/academic/annees-academiques/${id}/`),
  create: (data) => api.post('/academic/annees-academiques/', data),
  update: (id, data) => api.patch(`/academic/annees-academiques/${id}/`, data),
  delete: (id) => api.delete(`/academic/annees-academiques/${id}/`),
};

export const semestresService = {
  getAll: (params) => api.get('/academic/semestres/', { params }),
};

// ==================== ALERTS ====================
export const alertsService = {
  alertEnseignant: (data) => api.post('/notifications/alert-enseignant/', data),
  alertDelegue: (data) => api.post('/notifications/alert-delegue/', data),
};

export const fichesSuiviService = {
  getAll: () => fetchAll('/teaching/fiches-suivi/'),
  getBySemestre: (semestreId) => fetchAll(`/teaching/fiches-suivi/?semestre_id=${semestreId}`),
  getByAnnee: (anneeId) => fetchAll(`/teaching/fiches-suivi/?annee_academique=${anneeId}`),
  getById: (id) => api.get(`/teaching/fiches-suivi/${id}/`),
  create: (data) => api.post('/teaching/fiches-suivi/', data),
  update: (id, data) => api.patch(`/teaching/fiches-suivi/${id}/`, data),
  delete: (id) => api.delete(`/teaching/fiches-suivi/${id}/`),
  getEnAttente: () => fetchAll('/teaching/fiches-suivi/en-attente/'),
  valider: (id) =>
    api.post(`/teaching/fiches-suivi/${id}/valider/`),
  refuser: (id, motif) =>
    api.post(`/teaching/fiches-suivi/${id}/refuser/`, { motif_refus: motif }),
  resoumettre: (id) =>
    api.post(`/teaching/fiches-suivi/${id}/resoumettre/`),
  checkConflicts: (data) =>
    api.post('/teaching/fiches-suivi/check-conflicts/', data),
  exportPdf: (id) =>
    api.get(`/teaching/fiches-suivi/${id}/export-pdf/`, { responseType: 'blob' }),
};
