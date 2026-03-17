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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
} from '@mui/material';
import { Save as SaveIcon, Lock as LockIcon, SwapHoriz as SwapIcon } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import { usersService, filieresService, niveauxService } from '../../api/services';
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

  // Delegate level change
  const isDelegue = roles.some((r) => r === 'Délégué' || r === 'Delegue');
  const [levelDialogOpen, setLevelDialogOpen] = useState(false);
  const [allFilieres, setAllFilieres] = useState([]);
  const [allNiveaux, setAllNiveaux] = useState([]);
  const [selectedFiliere, setSelectedFiliere] = useState('');
  const [selectedNiveau, setSelectedNiveau] = useState('');
  const [savingLevel, setSavingLevel] = useState(false);

  const openLevelDialog = async () => {
    try {
      const [filRes, nivRes] = await Promise.all([filieresService.getAll(), niveauxService.getAll()]);
      setAllFilieres(filRes.data);
      setAllNiveaux(nivRes.data);
    } catch { /* silent */ }
    setLevelDialogOpen(true);
  };

  const filteredDialogNiveaux = selectedFiliere
    ? allNiveaux.filter((n) => (n.filiere || n.filiere_id) === Number(selectedFiliere))
    : allNiveaux;

  const handleChangeLevel = async () => {
    if (!selectedNiveau) return;
    setSavingLevel(true);
    try {
      await usersService.changerNiveau(selectedNiveau);
      toast.success('Niveau mis a jour');
      setLevelDialogOpen(false);
      const res = await usersService.getMe();
      updateUser(res.data);
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(detail || 'Erreur changement de niveau');
    } finally {
      setSavingLevel(false);
    }
  };

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
                  let label = config.label;
                  if ((r === 'Chef de Département' || r === 'Chef de Departement') && user?.nom_departement) {
                    label = `Chef Dept. ${user.nom_departement}`;
                  }
                  return (
                    <Chip
                      key={r}
                      label={label}
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

      {/* Level Change Dialog (Delegate only) */}
      {isDelegue && (
        <>
          <Card sx={{ mt: 3 }}>
            <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <SwapIcon sx={{ color: '#001EA6' }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Changement de classe</Typography>
                <Typography variant="body2" sx={{ color: '#7E7E7E' }}>
                  Nouvelle annee ? Mettez a jour votre filiere et niveau.
                </Typography>
              </Box>
              <Button variant="outlined" onClick={openLevelDialog}>
                Changer
              </Button>
            </CardContent>
          </Card>

          <Dialog
            open={levelDialogOpen}
            onClose={() => setLevelDialogOpen(false)}
            maxWidth="xs"
            fullWidth
            PaperProps={{ sx: { borderRadius: 3 } }}
          >
            <DialogTitle sx={{ fontWeight: 700 }}>
              <SwapIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#001EA6' }} />
              Changer de classe
            </DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Typography variant="body2" sx={{ color: '#525252' }}>
                Selectionnez votre nouvelle filiere et votre nouveau niveau.
              </Typography>
              <TextField
                select
                label="Filiere"
                fullWidth
                value={selectedFiliere}
                onChange={(e) => { setSelectedFiliere(e.target.value); setSelectedNiveau(''); }}
              >
                {allFilieres.map((f) => (
                  <MenuItem key={f.id} value={f.id}>{f.nom_filiere}</MenuItem>
                ))}
              </TextField>
              {selectedFiliere && (
                <TextField
                  select
                  label="Niveau"
                  fullWidth
                  value={selectedNiveau}
                  onChange={(e) => setSelectedNiveau(e.target.value)}
                >
                  {filteredDialogNiveaux.map((n) => (
                    <MenuItem key={n.id} value={n.id}>{n.nom_niveau}</MenuItem>
                  ))}
                </TextField>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
              <Button onClick={() => setLevelDialogOpen(false)} color="inherit">Annuler</Button>
              <Button
                onClick={handleChangeLevel}
                variant="contained"
                disabled={savingLevel || !selectedNiveau}
              >
                {savingLevel ? <CircularProgress size={20} /> : 'Confirmer'}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Box>
  );
}
