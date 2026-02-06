import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import AuthGuard from './components/guards/AuthGuard';
import RoleGuard from './components/guards/RoleGuard';
import MainLayout from './components/layout/MainLayout';

// Lazy loaded pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const DashboardPage = lazy(() => import('./pages/shared/DashboardPage'));
const ProfilePage = lazy(() => import('./pages/shared/ProfilePage'));
const NotFoundPage = lazy(() => import('./pages/shared/NotFoundPage'));

// Enseignant
const FichesListPage = lazy(() => import('./pages/enseignant/FichesListPage'));
const FicheDetailPage = lazy(() => import('./pages/enseignant/FicheDetailPage'));

// Delegue
const DeleGueFichesListPage = lazy(() => import('./pages/delegue/FichesListPage'));
const DelegueCreateFichePage = lazy(() => import('./pages/delegue/CreateFichePage'));
const DeleGueFicheDetailPage = lazy(() => import('./pages/delegue/FicheDetailPage'));

// Chef
const DeleguesPage = lazy(() => import('./pages/chef/DeleguesPage'));
const ChefUsersPage = lazy(() => import('./pages/chef/UsersPage'));
const ChefFichesPage = lazy(() => import('./pages/chef/FichesPage'));
const ExportPage = lazy(() => import('./pages/chef/ExportPage'));

// Admin
const FacultesPage = lazy(() => import('./pages/admin/FacultesPage'));
const DepartementsPage = lazy(() => import('./pages/admin/DepartementsPage'));
const FilieresPage = lazy(() => import('./pages/admin/FilieresPage'));
const NiveauxPage = lazy(() => import('./pages/admin/NiveauxPage'));
const UEsPage = lazy(() => import('./pages/admin/UEsPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/UsersPage'));
const AdminFichesPage = lazy(() => import('./pages/admin/FichesPage'));

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

          {/* Protected */}
          <Route element={<AuthGuard />}>
            <Route element={<MainLayout />}>
              {/* Redirect root to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* Shared */}
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />

              {/* Enseignant (default routes — no RoleGuard, accessible to any authenticated user) */}
              <Route path="/fiches" element={<FichesListPage />} />
              <Route path="/fiches/:id" element={<FicheDetailPage />} />

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
                <Route path="/chef/fiches" element={<ChefFichesPage />} />
                <Route path="/chef/export" element={<ExportPage />} />
              </Route>

              {/* Super Admin */}
              <Route element={<RoleGuard allowedRoles={['Super Administrateur']} />}>
                <Route path="/admin/facultes" element={<FacultesPage />} />
                <Route path="/admin/departements" element={<DepartementsPage />} />
                <Route path="/admin/filieres" element={<FilieresPage />} />
                <Route path="/admin/niveaux" element={<NiveauxPage />} />
                <Route path="/admin/ues" element={<UEsPage />} />
                <Route path="/admin/utilisateurs" element={<AdminUsersPage />} />
                <Route path="/admin/fiches" element={<AdminFichesPage />} />
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
