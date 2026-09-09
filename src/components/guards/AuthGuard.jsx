import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useConfig } from '../../contexts/ConfigContext';
import { Box, CircularProgress } from '@mui/material';

export default function AuthGuard() {
  const { isAuth, isLoading, user } = useAuth();
  const { isLoading: configLoading } = useConfig();

  if (isLoading || configLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  // Rediriger les comptes en attente vers la page d'attente
  if (user?.statut === 'EN_ATTENTE') {
    return <Navigate to="/pending" replace />;
  }

  // Comptes crees par import : le mot de passe provisoire est l'adresse email,
  // aucun acces n'est ouvert tant qu'il n'a pas ete change.
  if (user?.doit_changer_mot_de_passe) {
    return <Navigate to="/changer-mot-de-passe" replace />;
  }

  return <Outlet />;
}
