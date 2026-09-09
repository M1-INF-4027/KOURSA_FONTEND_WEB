import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  TextField,
  Typography,
} from '@mui/material';
import { LockReset } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { usersService } from '../../api/services';

/**
 * Changement de mot de passe impose a la premiere connexion.
 *
 * Les comptes crees par import ont pour mot de passe initial leur propre
 * adresse email, connue de quiconque dispose des fichiers d'import : tant que
 * `doit_changer_mot_de_passe` est vrai, l'AuthGuard renvoie ici.
 */
export default function ForcePasswordChangePage() {
  const { user, logout, refreshUser } = useAuth();
  const [ancien, setAncien] = useState('');
  const [nouveau, setNouveau] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState(null);

  const emailUtilise = nouveau.trim().toLowerCase() === (user?.email || '').toLowerCase();
  const tropCourt = nouveau.length > 0 && nouveau.length < 8;
  const discordant = confirmation.length > 0 && nouveau !== confirmation;
  const valide =
    ancien && nouveau && nouveau === confirmation && nouveau.length >= 8 && !emailUtilise;

  const soumettre = async (e) => {
    e.preventDefault();
    if (!valide) return;
    setEnCours(true);
    setErreur(null);
    try {
      await usersService.changePassword({ old_password: ancien, new_password: nouveau });
      toast.success('Mot de passe modifie');
      await refreshUser();
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setErreur(detail || 'Impossible de modifier le mot de passe.');
    } finally {
      setEnCours(false);
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
        px: 2,
      }}
    >
      <Card sx={{ maxWidth: 460, width: '100%', borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <LockReset sx={{ fontSize: 44, color: '#001EA6' }} />
            <Typography variant="h6" sx={{ fontWeight: 700, mt: 1 }}>
              Choisissez un mot de passe
            </Typography>
          </Box>

          <Alert severity="warning" sx={{ mb: 3 }}>
            Votre compte a ete cree avec votre adresse email comme mot de passe
            provisoire. Choisissez-en un nouveau pour continuer.
          </Alert>

          {erreur && <Alert severity="error" sx={{ mb: 2 }}>{erreur}</Alert>}

          <Box component="form" onSubmit={soumettre} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Mot de passe actuel"
              type="password"
              value={ancien}
              onChange={(e) => setAncien(e.target.value)}
              helperText="Il s'agit de votre adresse email"
              autoFocus
              fullWidth
            />
            <TextField
              label="Nouveau mot de passe"
              type="password"
              value={nouveau}
              onChange={(e) => setNouveau(e.target.value)}
              error={tropCourt || emailUtilise}
              helperText={
                emailUtilise
                  ? 'Le mot de passe ne peut pas etre votre adresse email'
                  : tropCourt
                    ? '8 caracteres minimum'
                    : ' '
              }
              fullWidth
            />
            <TextField
              label="Confirmez le nouveau mot de passe"
              type="password"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              error={discordant}
              helperText={discordant ? 'Les deux saisies different' : ' '}
              fullWidth
            />

            <Button
              type="submit"
              variant="contained"
              disabled={!valide || enCours}
              sx={{ py: 1.2, bgcolor: '#001EA6', '&:hover': { bgcolor: '#001080' } }}
            >
              {enCours ? <CircularProgress size={22} color="inherit" /> : 'Enregistrer et continuer'}
            </Button>

            <Button onClick={logout} color="inherit" size="small">
              Se deconnecter
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
