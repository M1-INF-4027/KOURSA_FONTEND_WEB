# KOURSA Frontend Web

Application web React pour la plateforme **Koursa** - Systeme de gestion academique et de suivi pedagogique.

## Fonctionnalites principales

- Authentification JWT avec gestion automatique du refresh token
- Dashboard adaptatif selon le role de l'utilisateur
- Gestion des fiches de suivi pedagogique (creation, validation directe, refus, resoumission)
- Telechargement des fiches validees en PDF (format officiel universite)
- Previsualisation de la fiche avant soumission (delegue)
- Creation de fiches par le chef de departement sans restriction de date
- Restriction de date a 3 jours dans le passe pour les delegues
- Filtrage par classe (Filiere / Niveau / Semestre) sur l'ensemble du systeme
- Vue hierarchique des UEs par filiere/niveau (espace chef)
- Structure academique complete (Facultes, Departements, Filieres, Niveaux, UEs)
- Code UE automatiquement en majuscule
- Filtre par filiere dans le formulaire de creation UE
- Gestion des utilisateurs avec systeme d'approbation
- Changement de niveau/filiere par les delegues (nouvelle annee)
- Export Excel des bilans (global, par UE, par enseignant)
- Import Excel des UEs (admin et chef, avec filtre par filiere)
- Import bulk d'emails pour la whitelist enseignants
- Inscription enseignant avec page d'attente de validation
- Dialog de confirmation avant deconnexion
- Affichage du nom du departement pour le chef de departement
- Interface responsive avec Material UI et Tailwind CSS
- Notifications toast pour les retours utilisateur
- Graphiques statistiques avec Recharts

---

## Deploiement Production

- **URL:** https://koursa.duckdns.org
- **Serveur:** 84.247.183.206 (softengine)
- **SSL:** Let's Encrypt
- **CI/CD:** GitHub Actions (build + deploy automatique sur push main)

---

## Technologies utilisees

| Technologie | Version | Description |
|-------------|---------|-------------|
| React | 19 | Librairie UI |
| Vite | 7 | Build tool |
| Material UI | 7 | Composants UI |
| MUI X Date Pickers | - | Selecteurs date/heure |
| React Router | 7 | Navigation SPA |
| Axios | 1.9 | Client HTTP |
| Recharts | 2.15 | Graphiques |
| React Hot Toast | 2.5 | Notifications |
| Tailwind CSS | 4 | Utilitaires CSS |
| Day.js | - | Manipulation de dates |

## Structure du projet

```
KOURSA_FONTEND_WEB/
├── src/
│   ├── api/                      # Configuration API et services
│   │   ├── config.js             # Instance Axios + intercepteurs
│   │   └── services.js           # Services CRUD par entite
│   ├── assets/                   # Images et ressources statiques
│   ├── components/
│   │   ├── common/               # Composants reutilisables
│   │   │   ├── DataTable.jsx     # Tableau generique avec tri/recherche/pagination
│   │   │   ├── PageHeader.jsx
│   │   │   ├── StatsCard.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   ├── RoleBadge.jsx
│   │   │   ├── ConfirmDialog.jsx
│   │   │   └── EmptyState.jsx
│   │   ├── guards/               # Protection des routes
│   │   │   ├── AuthGuard.jsx     # Authentification + redirection EN_ATTENTE
│   │   │   └── RoleGuard.jsx     # Controle d'acces par role
│   │   └── layout/
│   │       ├── MainLayout.jsx    # Layout principal (sidebar + contenu)
│   │       ├── Sidebar.jsx       # Navigation laterale par role
│   │       └── Topbar.jsx        # Barre superieure
│   ├── contexts/
│   │   └── AuthContext.jsx       # Gestion authentification (JWT + refresh)
│   ├── hooks/
│   │   └── useRoles.js           # Detection des roles utilisateur
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx     # Connexion
│   │   │   ├── RegisterPage.jsx  # Inscription enseignant
│   │   │   └── PendingPage.jsx   # Page d'attente (statut EN_ATTENTE)
│   │   ├── shared/
│   │   │   ├── DashboardPage.jsx # Dashboard adaptatif selon le role
│   │   │   ├── ProfilePage.jsx
│   │   │   └── NotFoundPage.jsx
│   │   ├── enseignant/
│   │   │   ├── FichesListPage.jsx
│   │   │   └── FicheDetailPage.jsx
│   │   ├── delegue/
│   │   │   ├── FichesListPage.jsx
│   │   │   ├── CreateFichePage.jsx
│   │   │   └── FicheDetailPage.jsx
│   │   ├── chef/
│   │   │   ├── DeleguesPage.jsx    # Demandes en attente (delegues + enseignants)
│   │   │   ├── UsersPage.jsx       # Gestion utilisateurs du departement
│   │   │   ├── UEsPage.jsx         # UEs avec vue hierarchique filiere/niveau
│   │   │   ├── FichesPage.jsx      # Fiches du departement
│   │   │   ├── CreateFichePage.jsx # Creation fiche par le chef (sans restriction date)
│   │   │   ├── ExportPage.jsx
│   │   │   ├── WeeklyTrackingPage.jsx # Suivi hebdomadaire
│   │   │   └── WhitelistPage.jsx   # Emails autorises
│   │   └── admin/
│   │       ├── UsersPage.jsx     # Gestion globale utilisateurs (CRUD + approbation)
│   │       ├── FacultesPage.jsx
│   │       ├── DepartementsPage.jsx
│   │       ├── FilieresPage.jsx
│   │       ├── NiveauxPage.jsx
│   │       ├── SallesPage.jsx
│   │       ├── UEsPage.jsx       # CRUD + import Excel + filtre filiere
│   │       ├── FichesPage.jsx
│   │       ├── WhitelistPage.jsx  # Emails autorises + import bulk
│   │       ├── ExportPage.jsx     # Export bilans Excel
│   │       ├── AnneesPage.jsx     # Annees academiques
│   │       ├── SetupWizardPage.jsx # Assistant configuration nouvelle annee
│   │       └── WeeklyTrackingPage.jsx # Suivi hebdomadaire
│   ├── App.jsx                   # Routes principales
│   ├── main.jsx                  # Point d'entree
│   └── index.css
├── .github/workflows/
│   └── deploy.yml                # CI/CD: build + SCP vers VPS + reload Nginx
├── package.json
├── vite.config.js
└── tailwind.config.js
```

---

## Variables d'environnement

Creer un fichier `.env` a la racine du projet (ou `.env.local` pour le dev) :

| Variable | Description | Defaut |
|----------|-------------|--------|
| `VITE_API_URL` | URL de base de l'API backend | `http://localhost:8000/api` (dev) / `https://koursa.duckdns.org/api` (prod) |

Exemple `.env` :
```env
VITE_API_URL=http://localhost:8000/api
```

La configuration se trouve dans `src/api/config.js`.

---

## Roles et acces

| Role | Dashboard | Pages accessibles |
|------|-----------|-------------------|
| **Super Administrateur** | Stats globales (utilisateurs, UEs, fiches) | Structure academique, UEs, Utilisateurs, Fiches |
| **Chef de Departement** | Stats departement avec filtres filiere/niveau/semestre | Demandes, Utilisateurs, UEs (vue hierarchique), Fiches (+ creation), Export |
| **Chef + Enseignant** | Dashboard Chef + acces "Mes Fiches" | Tout le menu Chef + Mes Fiches enseignant |
| **Enseignant** | Fiches en attente + validees | Mes Fiches (avec classe/niveau affiche) |
| **Delegue** | Stats fiches + action rapide | Mes Fiches (creation avec classe visible, soumission) |

### Filtrage par classe (Filiere / Niveau / Semestre)

Le systeme gere les fiches **par classe** (ex: INF L1, MATH M1). Chaque UE est liee a un ou plusieurs niveaux, et chaque niveau appartient a une filiere.

- **Dashboard Chef** : selecteurs Filiere → Niveau → Semestre pour filtrer les statistiques
- **Page Export** : memes selecteurs pour exporter les bilans d'une classe specifique
- **Toutes les listes de fiches** : colonne "Classe" visible (admin, chef, delegue, enseignant)
- **Pages detail fiche** : affichent la classe et le semestre
- **Creation de fiche (delegue)** : le selecteur UE affiche la classe (ex: "INF101 - Algo (Informatique M1)")

---

## Export PDF des fiches de suivi

Un bouton "Telecharger PDF" est disponible sur la page detail de chaque fiche. Le PDF genere reproduit le format officiel de la fiche papier de l'universite (en-tete bilingue, grille d'informations, contenu, signatures).

**Regles d'acces :**
- **Delegue / Enseignant** : bouton visible uniquement pour les fiches avec statut `VALIDEE`
- **Chef de Departement / Super Admin** : bouton toujours visible quel que soit le statut

Le bouton est present sur :
- `enseignant/FicheDetailPage.jsx` (utilise aussi par chef et admin via `/fiches/:id`)
- `delegue/FicheDetailPage.jsx`

---

## Import de donnees

### Import UEs (admin et chef)
- Bouton "Importer" sur la page UEs
- Format Excel attendu : colonnes `code`, `libelle`, `semestre`
- Apercu avant import avec validation ligne par ligne
- Selection du semestre et des niveaux par defaut

### Import Whitelist (admin et chef)
- Textarea pour coller les emails (un par ligne)
- Selection du role (ENSEIGNANT ou DELEGUE)
- Creation en masse via l'endpoint `/api/users/whitelist/bulk/`

### Fichiers d'import pre-segmentes
Des fichiers Excel prets a l'import sont disponibles dans `Ressources/Fichiers_Import/` :
| Fichier | Section d'import | Contenu |
|---|---|---|
| `Import_Whitelist_Fonda.xlsx` | Whitelist | 25 emails enseignants fondamental |
| `Import_Whitelist_Pro.xlsx` | Whitelist | 22 emails enseignants professionnel |
| `Import_UEs_Fonda.xlsx` | UEs | 188 UEs filiere fondamentale |
| `Import_UEs_Pro.xlsx` | UEs | 122 UEs filiere professionnelle |
| `Import_Affectations_Fonda.xlsx` | Reference | Mapping UE → Enseignant (fondamental) |
| `Import_Affectations_Pro.xlsx` | Reference | Mapping UE → Enseignant (professionnel) |

---

## Systeme d'inscription et approbation

1. **Enseignant** s'inscrit via `/register` → statut `EN_ATTENTE`
2. A la connexion, redirige vers `/pending` (page d'attente)
3. Le **Chef de Departement** ou **Super Admin** approuve depuis la page Demandes/Utilisateurs
4. L'enseignant clique "Verifier mon statut" → si approuve, redirige vers le dashboard
5. **Comptes crees par un admin** sont directement `ACTIF`

---

## Installation locale

### Prerequis
- Node.js >= 20
- npm

### Etapes

1. **Cloner le repository**
```bash
git clone https://github.com/M1-INF-4027/KOURSA_FONTEND_WEB.git
cd KOURSA_FONTEND_WEB
```

2. **Installer les dependances**
```bash
npm install
```

3. **Configurer les variables d'environnement** (optionnel)
```bash
# Creer un fichier .env a la racine
echo "VITE_API_URL=http://localhost:8000/api" > .env
```

4. **Lancer le serveur de developpement**
```bash
npm run dev
```

L'application sera accessible sur http://localhost:5173/

---

## Scripts npm

| Commande | Description |
|----------|-------------|
| `npm run dev` | Lancer le serveur de developpement (Vite) |
| `npm run build` | Build de production (genere `dist/`) |
| `npm run preview` | Previsualiser le build de production |
| `npm run lint` | Linter le code |

### Build production

```bash
npm run build
```

Les fichiers sont generes dans le dossier `dist/`.

---

## Equipe

Projet realise par **M1 INF 4027** - Master 1 Informatique.

## Licence

Apache License 2.0 - Copyright (c) 2025 M1 INF 4027
