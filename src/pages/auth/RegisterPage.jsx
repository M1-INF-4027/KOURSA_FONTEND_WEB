import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { usersService, rolesService } from '../../api/services';
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
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import coteLogin from '../../assets/cote_login.png';
import logo from '../../assets/logo.png';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { first_name, last_name, email, password, confirmPassword } = formData;

    if (!first_name.trim() || !last_name.trim() || !email.trim() || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caracteres.');
      return;
    }

    setLoading(true);
    try {
      // Recuperer l'ID du role Enseignant
      const rolesRes = await rolesService.getAll();
      const roles = rolesRes.data;
      const roleEnseignant = roles.find((r) => r.nom_role === 'Enseignant');

      if (!roleEnseignant) {
        setError('Erreur de configuration : role Enseignant introuvable.');
        return;
      }

      await usersService.register({
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: email.trim(),
        password,
        roles_ids: [roleEnseignant.id],
      });

      setSuccess(true);
      toast.success('Demande envoyee avec succes !');
    } catch (err) {
      const data = err.response?.data;
      if (data?.email) {
        setError(Array.isArray(data.email) ? data.email[0] : data.email);
      } else if (data?.detail) {
        setError(data.detail);
      } else {
        setError("Une erreur est survenue lors de l'inscription.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', bgcolor: '#F5F7FA', p: 3 }}>
        <Paper elevation={0} sx={{ maxWidth: 480, p: 5, borderRadius: 4, border: '1px solid #DFDFDF', textAlign: 'center' }}>
          <Box
            sx={{
              width: 72, height: 72, borderRadius: '50%', bgcolor: '#EEF2FF',
              display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3,
            }}
          >
            <EmailIcon sx={{ fontSize: 36, color: '#001EA6' }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#001EA6', mb: 1 }}>
            Demande envoyee !
          </Typography>
          <Typography variant="body1" sx={{ color: '#7E7E7E', mb: 3, lineHeight: 1.7 }}>
            Votre demande d'inscription a ete transmise.
            Votre compte sera active apres validation par un chef de departement ou un administrateur.
          </Typography>
          <Typography variant="body2" sx={{ color: '#7E7E7E', mb: 4 }}>
            Vous pourrez vous connecter une fois votre compte approuve.
          </Typography>
          <Button
            variant="contained"
            fullWidth
            onClick={() => navigate('/login')}
            sx={{
              py: 1.5, bgcolor: '#001EA6', fontWeight: 700, fontSize: '1rem',
              '&:hover': { bgcolor: '#001080' },
            }}
          >
            Retour a la connexion
          </Button>
        </Paper>
      </Box>
    );
  }

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
            position: 'absolute', inset: 0,
            backgroundImage: `url(${coteLogin})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
          }}
        />
        <Box
          sx={{
            position: 'absolute', inset: 0,
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
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          bgcolor: '#F5F7FA', p: 3,
        }}
      >
        <Paper elevation={0} sx={{ width: '100%', maxWidth: 440, p: 5, borderRadius: 4, border: '1px solid #DFDFDF' }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <img src={logo} alt="Koursa" style={{ width: 56, height: 56, marginBottom: 12 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#001EA6' }}>
              Inscription Enseignant
            </Typography>
            <Typography variant="body2" sx={{ color: '#7E7E7E', mt: 0.5 }}>
              Creez votre compte pour acceder a la plateforme
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
              <TextField
                label="Prenom"
                fullWidth
                required
                value={formData.first_name}
                onChange={handleChange('first_name')}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon sx={{ color: '#7E7E7E' }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                label="Nom"
                fullWidth
                required
                value={formData.last_name}
                onChange={handleChange('last_name')}
              />
            </Box>

            <TextField
              label="Adresse email"
              type="email"
              fullWidth
              required
              value={formData.email}
              onChange={handleChange('email')}
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
              value={formData.password}
              onChange={handleChange('password')}
              sx={{ mb: 2.5 }}
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

            <TextField
              label="Confirmer le mot de passe"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              required
              value={formData.confirmPassword}
              onChange={handleChange('confirmPassword')}
              sx={{ mb: 3 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#7E7E7E' }} />
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
                py: 1.5, bgcolor: '#F7B016', color: '#131313',
                fontWeight: 700, fontSize: '1rem',
                '&:hover': { bgcolor: '#C78C00' },
              }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: '#131313' }} /> : "S'inscrire"}
            </Button>
          </form>

          <Typography variant="body2" sx={{ textAlign: 'center', mt: 3, color: '#7E7E7E' }}>
            Deja un compte ?{' '}
            <Typography
              component={RouterLink}
              to="/login"
              variant="body2"
              sx={{ color: '#001EA6', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              Se connecter
            </Typography>
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
