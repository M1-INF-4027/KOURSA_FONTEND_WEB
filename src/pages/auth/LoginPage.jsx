import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Visibility, VisibilityOff, Email as EmailIcon, Lock as LockIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';
import coteLogin from '../../assets/cote_login.png';
import logo from '../../assets/logo.png';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Connexion reussie !');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.detail || 'Email ou mot de passe incorrect';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left side - Image */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          width: '50%',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${coteLogin})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(0,30,166,0.85) 0%, rgba(0,13,107,0.9) 100%)',
          }}
        />
        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', p: 6 }}>
          <Typography variant="h3" sx={{ color: '#FFFFFF', fontWeight: 800, mb: 2 }}>
            Koursa
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 400, maxWidth: 400 }}>
            Plateforme de gestion academique et de suivi des enseignements
          </Typography>
        </Box>
      </Box>

      {/* Right side - Form */}
      <Box
        sx={{
          flex: 1,
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
            width: '100%',
            maxWidth: 440,
            p: 5,
            borderRadius: 4,
            border: '1px solid #DFDFDF',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <img src={logo} alt="Koursa" style={{ width: 56, height: 56, marginBottom: 12 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#001EA6' }}>
              Connexion
            </Typography>
            <Typography variant="body2" sx={{ color: '#7E7E7E', mt: 0.5 }}>
              Accedez a votre espace de gestion
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              label="Adresse email"
              type="email"
              fullWidth
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2.5 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: '#7E7E7E' }} />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              label="Mot de passe"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 3 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#7E7E7E' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                py: 1.5,
                bgcolor: '#F7B016',
                color: '#131313',
                fontWeight: 700,
                fontSize: '1rem',
                '&:hover': { bgcolor: '#C78C00' },
              }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: '#131313' }} /> : 'Se connecter'}
            </Button>
          </form>

          <Typography variant="body2" sx={{ textAlign: 'center', mt: 3, color: '#7E7E7E' }}>
            Vous etes enseignant ?{' '}
            <Typography
              component={RouterLink}
              to="/register"
              variant="body2"
              sx={{ color: '#001EA6', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              Creer un compte
            </Typography>
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
