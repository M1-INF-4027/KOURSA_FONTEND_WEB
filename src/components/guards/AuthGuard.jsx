import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useConfig } from '../../contexts/ConfigContext';
import { useRoles } from '../../hooks/useRoles';
import { Box, CircularProgress } from '@mui/material';

export default function AuthGuard() {
  const { isAuth, isLoading, user } = useAuth();
  const { isConfigured, isLoading: configLoading } = useConfig();
  const { isAdmin } = useRoles();
  const location = useLocation();

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

  // Rediriger admin vers le wizard si pas encore configure
  if (isAdmin && !isConfigured && location.pathname !== '/setup') {
    return <Navigate to="/setup" replace />;
  }

  return <Outlet />;
}
