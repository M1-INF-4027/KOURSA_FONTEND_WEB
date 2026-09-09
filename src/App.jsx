import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import AuthGuard from './components/guards/AuthGuard';
import RoleGuard from './components/guards/RoleGuard';
import MainLayout from './components/layout/MainLayout';

/**
 * Charge une page en differe, en se relevant d'un deploiement survenu entre-temps.
 *
 * Les fichiers sont nommes avec une empreinte et l'ancien jeu est supprime a
 * chaque mise en ligne. Un onglet reste ouvert continue de reclamer les anciens
 * noms et recoit des 404 : « Failed to fetch dynamically imported module ».
 * On recharge alors la page une seule fois pour recuperer le nouvel index.
 */
const CLE_RECHARGEMENT = 'koursa:rechargement-apres-deploiement';

function pageDifferee(charger) {
  return lazy(() =>
    charger()
      .then((module) => {
        try { sessionStorage.removeItem(CLE_RECHARGEMENT); } catch { /* stockage indisponible */ }
        return module;
      })
      .catch((erreur) => {
        let dejaTente = true;
        try {
          dejaTente = sessionStorage.getItem(CLE_RECHARGEMENT) === '1';
          if (!dejaTente) sessionStorage.setItem(CLE_RECHARGEMENT, '1');
        } catch { /* stockage indisponible : on ne boucle pas */ }

        if (!dejaTente) {
          window.location.reload();
          // Suspend le rendu : le rechargement est deja engage.
          return new Promise(() => {});
        }
        throw erreur;
      })
  );
}

// Lazy loaded pages
const LoginPage = pageDifferee(() => import('./pages/auth/LoginPage'));
const RegisterPage = pageDifferee(() => import('./pages/auth/RegisterPage'));
const PendingPage = pageDifferee(() => import('./pages/auth/PendingPage'));
const ForcePasswordChangePage = pageDifferee(() => import('./pages/auth/ForcePasswordChangePage'));
const DashboardPage = pageDifferee(() => import('./pages/shared/DashboardPage'));
const ProfilePage = pageDifferee(() => import('./pages/shared/ProfilePage'));
const AcademicPage = pageDifferee(() => import('./pages/shared/AcademicPage'));
const NotFoundPage = pageDifferee(() => import('./pages/shared/NotFoundPage'));

// Enseignant
const FichesListPage = pageDifferee(() => import('./pages/enseignant/FichesListPage'));
const FicheDetailPage = pageDifferee(() => import('./pages/enseignant/FicheDetailPage'));
const MesDeleguesPage = pageDifferee(() => import('./pages/enseignant/MesDeleguesPage'));
const EnseignantExportPage = pageDifferee(() => import('./pages/enseignant/ExportPage'));

// Delegue
const DeleGueFichesListPage = pageDifferee(() => import('./pages/delegue/FichesListPage'));
const DelegueCreateFichePage = pageDifferee(() => import('./pages/delegue/CreateFichePage'));
const DeleGueFicheDetailPage = pageDifferee(() => import('./pages/delegue/FicheDetailPage'));

// Chef
const DeleguesPage = pageDifferee(() => import('./pages/chef/DeleguesPage'));
const ChefUsersPage = pageDifferee(() => import('./pages/chef/UsersPage'));
const ChefFichesPage = pageDifferee(() => import('./pages/chef/FichesPage'));
const ExportPage = pageDifferee(() => import('./pages/chef/ExportPage'));
const ChefUEsPage = pageDifferee(() => import('./pages/chef/UEsPage'));
const WeeklyTrackingPage = pageDifferee(() => import('./pages/chef/WeeklyTrackingPage'));
const WhitelistPage = pageDifferee(() => import('./pages/chef/WhitelistPage'));
const ChefCreateFichePage = pageDifferee(() => import('./pages/chef/CreateFichePage'));

// Admin
const AdminWhitelistPage = pageDifferee(() => import('./pages/admin/WhitelistPage'));
const AdminWeeklyTrackingPage = pageDifferee(() => import('./pages/admin/WeeklyTrackingPage'));
const FacultesPage = pageDifferee(() => import('./pages/admin/FacultesPage'));
const DepartementsPage = pageDifferee(() => import('./pages/admin/DepartementsPage'));
const FilieresPage = pageDifferee(() => import('./pages/admin/FilieresPage'));
const NiveauxPage = pageDifferee(() => import('./pages/admin/NiveauxPage'));
const SallesPage = pageDifferee(() => import('./pages/admin/SallesPage'));
const UEsPage = pageDifferee(() => import('./pages/admin/UEsPage'));
const AdminUsersPage = pageDifferee(() => import('./pages/admin/UsersPage'));
const AdminFichesPage = pageDifferee(() => import('./pages/admin/FichesPage'));
const SetupWizardPage = pageDifferee(() => import('./pages/admin/SetupWizardPage'));
const AnneesPage = pageDifferee(() => import('./pages/admin/AnneesPage'));
const AdminExportPage = pageDifferee(() => import('./pages/admin/ExportPage'));

function Loading() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <CircularProgress />
    </Box>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/pending" element={<PendingPage />} />
          {/* Hors AuthGuard : c'est lui qui redirige ici, l'y inclure bouclerait */}
          <Route path="/changer-mot-de-passe" element={<ForcePasswordChangePage />} />

          {/* Protected */}
          <Route element={<AuthGuard />}>
            {/* Setup wizard — full page, no sidebar */}
            <Route path="/setup" element={<SetupWizardPage />} />

            <Route element={<MainLayout />}>
              {/* Redirect root to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* Shared */}
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/academique" element={<AcademicPage />} />

              {/* Enseignant (default routes — no RoleGuard, accessible to any authenticated user) */}
              <Route path="/fiches" element={<FichesListPage />} />
              <Route path="/fiches/:id" element={<FicheDetailPage />} />
              <Route path="/enseignant/delegues" element={<MesDeleguesPage />} />
              <Route path="/enseignant/export" element={<EnseignantExportPage />} />

              {/* Delegue */}
              <Route element={<RoleGuard allowedRoles={['Délégué']} />}>
                <Route path="/delegue/fiches" element={<DeleGueFichesListPage />} />
                <Route path="/delegue/fiches/new" element={<DelegueCreateFichePage />} />
                <Route path="/delegue/fiches/:id" element={<DeleGueFicheDetailPage />} />
                <Route path="/delegue/fiches/:id/edit" element={<DelegueCreateFichePage />} />
              </Route>

              {/* Chef Departement */}
              <Route element={<RoleGuard allowedRoles={['Chef de Département']} />}>
                <Route path="/chef/delegues" element={<DeleguesPage />} />
                <Route path="/chef/utilisateurs" element={<ChefUsersPage />} />
                <Route path="/chef/ues" element={<ChefUEsPage />} />
                <Route path="/chef/fiches" element={<ChefFichesPage />} />
                <Route path="/chef/fiches/new" element={<ChefCreateFichePage />} />
                <Route path="/chef/export" element={<ExportPage />} />
                <Route path="/chef/suivi-hebdo" element={<WeeklyTrackingPage />} />
                <Route path="/chef/whitelist" element={<WhitelistPage />} />
              </Route>

              {/* Super Admin */}
              <Route element={<RoleGuard allowedRoles={['Super Administrateur']} />}>
                <Route path="/admin/facultes" element={<FacultesPage />} />
                <Route path="/admin/departements" element={<DepartementsPage />} />
                <Route path="/admin/filieres" element={<FilieresPage />} />
                <Route path="/admin/niveaux" element={<NiveauxPage />} />
                <Route path="/admin/salles" element={<SallesPage />} />
                <Route path="/admin/ues" element={<UEsPage />} />
                <Route path="/admin/utilisateurs" element={<AdminUsersPage />} />
                <Route path="/admin/fiches" element={<AdminFichesPage />} />
                <Route path="/admin/export" element={<AdminExportPage />} />
                <Route path="/admin/annees" element={<AnneesPage />} />
                {/* Parcours unifie : creer une annee et la configurer suivent le meme
                      chemin, qui s'adapte a ce qui existe deja. */}
                <Route path="/admin/nouvelle-annee" element={<Navigate to="/setup" replace />} />
                <Route path="/admin/whitelist" element={<AdminWhitelistPage />} />
                <Route path="/admin/suivi-hebdo" element={<AdminWeeklyTrackingPage />} />
              </Route>

              {/* 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
