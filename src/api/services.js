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

// ==================== AUTH ====================
export const authService = {
  login: (credentials) => api.post('/auth/token/', credentials),
  refreshToken: (refreshToken) => api.post('/auth/token/refresh/', { refresh: refreshToken }),
  confirmPassword: (password) => api.post('/users/utilisateurs/confirm-password/', { password }),
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
};

// ==================== ACADEMIC ====================
export const facultesService = {
  getAll: () => fetchAll('/academic/facultes/'),
  getById: (id) => api.get(`/academic/facultes/${id}/`),
  create: (data) => api.post('/academic/facultes/', data),
  update: (id, data) => api.patch(`/academic/facultes/${id}/`, data),
  delete: (id) => api.delete(`/academic/facultes/${id}/`),
};

export const departementsService = {
  getAll: () => fetchAll('/academic/departements/'),
  getById: (id) => api.get(`/academic/departements/${id}/`),
  create: (data) => api.post('/academic/departements/', data),
  update: (id, data) => api.patch(`/academic/departements/${id}/`, data),
  delete: (id) => api.delete(`/academic/departements/${id}/`),
};

export const filieresService = {
  getAll: () => fetchAll('/academic/filieres/'),
  getById: (id) => api.get(`/academic/filieres/${id}/`),
  create: (data) => api.post('/academic/filieres/', data),
  update: (id, data) => api.patch(`/academic/filieres/${id}/`, data),
  delete: (id) => api.delete(`/academic/filieres/${id}/`),
};

export const niveauxService = {
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
  valider: (id, validationToken) =>
    api.post(`/teaching/fiches-suivi/${id}/valider/`, { validation_token: validationToken }),
  refuser: (id, motif) =>
    api.post(`/teaching/fiches-suivi/${id}/refuser/`, { motif_refus: motif }),
  resoumettre: (id) =>
    api.post(`/teaching/fiches-suivi/${id}/resoumettre/`),
  checkConflicts: (data) =>
    api.post('/teaching/fiches-suivi/check-conflicts/', data),
};
