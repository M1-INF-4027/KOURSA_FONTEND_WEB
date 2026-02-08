import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Box, CircularProgress } from '@mui/material';

export default function AuthGuard() {
  const { isAuth, isLoading, user } = useAuth();

  if (isLoading) {
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

  return <Outlet />;
}
