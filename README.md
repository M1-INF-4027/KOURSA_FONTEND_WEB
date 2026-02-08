# KOURSA Frontend Web

Application web React pour la plateforme **Koursa** - Systeme de gestion academique et de suivi pedagogique.

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
| React Router | 7 | Navigation SPA |
| Axios | 1.9 | Client HTTP |
| Recharts | 2.15 | Graphiques |
| React Hot Toast | 2.5 | Notifications |
| Tailwind CSS | 4 | Utilitaires CSS |

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
│   │   │   ├── DeleguesPage.jsx  # Demandes en attente (delegues + enseignants)
│   │   │   ├── UsersPage.jsx     # Gestion utilisateurs du departement
│   │   │   ├── FichesPage.jsx
│   │   │   └── ExportPage.jsx
│   │   └── admin/
│   │       ├── UsersPage.jsx     # Gestion globale utilisateurs (CRUD + approbation)
│   │       ├── FacultesPage.jsx
│   │       ├── DepartementsPage.jsx
│   │       ├── FilieresPage.jsx
│   │       ├── NiveauxPage.jsx
│   │       ├── UEsPage.jsx
│   │       └── FichesPage.jsx
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

## Roles et acces

| Role | Dashboard | Pages accessibles |
|------|-----------|-------------------|
| **Super Administrateur** | Stats globales (utilisateurs, UEs, fiches) | Structure academique, UEs, Utilisateurs, Fiches |
| **Chef de Departement** | Stats departement (heures, retards, UEs) | Demandes, Utilisateurs, Fiches, Export |
| **Chef + Enseignant** | Dashboard Chef + acces "Mes Fiches" | Tout le menu Chef + Mes Fiches enseignant |
| **Enseignant** | Fiches en attente + validees | Mes Fiches |
| **Delegue** | Stats fiches + action rapide | Mes Fiches (creation, soumission) |

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

3. **Lancer le serveur de developpement**
```bash
npm run dev
```

L'application sera accessible sur http://localhost:5173/

### Build production

```bash
npm run build
```

Les fichiers sont generes dans le dossier `dist/`.

---

## Configuration API

La configuration se trouve dans `src/api/config.js`. L'URL de l'API est definie par la variable d'environnement `VITE_API_URL` ou par defaut :
- **Production:** `https://koursa.duckdns.org/api`
- **Developpement:** `http://localhost:8000/api`

---

## Licence

Apache License 2.0 - Copyright (c) 2025 M1 INF 4027
