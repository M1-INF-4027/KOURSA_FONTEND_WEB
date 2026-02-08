import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRoles } from '../../hooks/useRoles';
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Avatar,
  Typography,
  Divider,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Save as SaveIcon, Lock as LockIcon } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import { usersService } from '../../api/services';
import toast from 'react-hot-toast';

const roleLabels = {
  'Super Administrateur': { label: 'Super Admin', color: '#EF4444' },
  'Chef de Département': { label: 'Chef Departement', color: '#7C3AED' },
  'Enseignant': { label: 'Enseignant', color: '#001EA6' },
  'Délégué': { label: 'Delegue', color: '#10B981' },
};

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { roles } = useRoles();
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [saving, setSaving] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [changingPwd, setChangingPwd] = useState(false);

  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase();

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await usersService.update(user.id, { first_name: firstName, last_name: lastName });
      updateUser(res.data);
      toast.success('Profil mis a jour');
    } catch {
      toast.error('Erreur lors de la mise a jour');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPwdError('');
    if (newPassword !== confirmPwd) {
      setPwdError('Les mots de passe ne correspondent pas');
      return;
    }
    if (newPassword.length < 6) {
      setPwdError('Le mot de passe doit avoir au moins 6 caracteres');
      return;
    }
    setChangingPwd(true);
    try {
      await usersService.update(user.id, { password: newPassword });
      toast.success('Mot de passe modifie');
      setOldPassword('');
      setNewPassword('');
      setConfirmPwd('');
    } catch {
      toast.error('Erreur changement de mot de passe');
    } finally {
      setChangingPwd(false);
    }
  };

  return (
    <Box className="fade-in">
      <PageHeader title="Mon Profil" description="Gerez vos informations personnelles" />

      <Grid container spacing={3}>
        {/* Info Card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ textAlign: 'center' }}>
            <CardContent sx={{ py: 4 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: '#001EA6',
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  mx: 'auto',
                  mb: 2,
                }}
              >
                {initials}
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {user?.first_name} {user?.last_name}
              </Typography>
              <Typography variant="body2" sx={{ color: '#7E7E7E', mb: 2 }}>
                {user?.email}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                {roles.map((r) => {
                  const config = roleLabels[r] || { label: r, color: '#7E7E7E' };
                  return (
                    <Chip
                      key={r}
                      label={config.label}
                      size="small"
                      sx={{ bgcolor: `${config.color}14`, color: config.color, fontWeight: 600 }}
                    />
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Edit Form */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Informations personnelles
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Prenom"
                    fullWidth
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Nom"
                    fullWidth
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Email"
                    fullWidth
                    value={user?.email || ''}
                    disabled
                  />
                </Grid>
              </Grid>
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={18} /> : <SaveIcon />}
                  onClick={handleSaveProfile}
                  disabled={saving}
                >
                  Enregistrer
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                <LockIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: '1.25rem' }} />
                Changer le mot de passe
              </Typography>
              {pwdError && <Alert severity="error" sx={{ mb: 2 }}>{pwdError}</Alert>}
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Nouveau mot de passe"
                    type="password"
                    fullWidth
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Confirmer le mot de passe"
                    type="password"
                    fullWidth
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                  />
                </Grid>
              </Grid>
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  onClick={handleChangePassword}
                  disabled={changingPwd || !newPassword}
                >
                  {changingPwd ? <CircularProgress size={20} /> : 'Modifier le mot de passe'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
