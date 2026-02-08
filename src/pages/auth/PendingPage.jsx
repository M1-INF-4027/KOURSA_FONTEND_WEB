import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
} from '@mui/material';
import { HourglassTop as HourglassIcon, Refresh as RefreshIcon, Logout as LogoutIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';
import logo from '../../assets/logo.png';

export default function PendingPage() {
  const { refreshUser, logout } = useAuth();
  const [checking, setChecking] = useState(false);

  const handleCheck = async () => {
    setChecking(true);
    try {
      const updatedUser = await refreshUser();
      if (updatedUser?.statut === 'ACTIF') {
        toast.success('Votre compte a ete approuve !');
        // Force full reload to reset routing
        window.location.href = '/dashboard';
      } else {
        toast('Votre compte est toujours en attente de validation.', { icon: '\u23F3' });
      }
    } catch {
      toast.error('Impossible de verifier le statut.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#F5F7FA',
        p: 3,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: 480,
          width: '100%',
          p: 5,
          borderRadius: 4,
          border: '1px solid #DFDFDF',
          textAlign: 'center',
        }}
      >
        <img src={logo} alt="Koursa" style={{ width: 48, height: 48, marginBottom: 16 }} />

        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: '#FFF7E6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
          }}
        >
          <HourglassIcon sx={{ fontSize: 40, color: '#F7B016' }} />
        </Box>

        <Typography variant="h5" sx={{ fontWeight: 800, color: '#131313', mb: 1 }}>
          Compte en attente de validation
        </Typography>

        <Typography variant="body1" sx={{ color: '#7E7E7E', mb: 1, lineHeight: 1.7 }}>
          Votre demande d'inscription a bien ete recue.
        </Typography>
        <Typography variant="body2" sx={{ color: '#7E7E7E', mb: 4 }}>
          Un chef de departement ou un administrateur doit approuver votre compte
          avant que vous puissiez acceder a la plateforme.
        </Typography>

        <Button
          variant="contained"
          fullWidth
          onClick={handleCheck}
          disabled={checking}
          startIcon={checking ? <CircularProgress size={18} color="inherit" /> : <RefreshIcon />}
          sx={{
            py: 1.5,
            bgcolor: '#001EA6',
            fontWeight: 700,
            fontSize: '0.95rem',
            mb: 2,
            '&:hover': { bgcolor: '#001080' },
          }}
        >
          {checking ? 'Verification...' : 'Verifier mon statut'}
        </Button>

        <Button
          variant="outlined"
          fullWidth
          onClick={logout}
          startIcon={<LogoutIcon />}
          sx={{
            py: 1.5,
            borderColor: '#DFDFDF',
            color: '#7E7E7E',
            fontWeight: 600,
            '&:hover': { borderColor: '#EF4444', color: '#EF4444', bgcolor: '#FEF2F2' },
          }}
        >
          Se deconnecter
        </Button>
      </Paper>
    </Box>
  );
}
