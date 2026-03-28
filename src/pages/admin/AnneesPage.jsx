import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Skeleton,
  Typography,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Add, Delete, CheckCircle, Warning as WarningIcon, DeleteForever } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { anneesAcademiquesService, configurationService, usersService } from '../../api/services';
import { useConfig } from '../../contexts/ConfigContext';
import toast from 'react-hot-toast';

export default function AnneesPage() {
  const navigate = useNavigate();
  const { refresh } = useConfig();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [activating, setActivating] = useState(null);

  // Reset database
  const [resetOpen, setResetOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  const load = async () => {
    try {
      const res = await anneesAcademiquesService.getAll();
      setItems(res.data);
    } catch {
      toast.error('Erreur chargement des annees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleActivate = async (id) => {
    setActivating(id);
    try {
      await configurationService.activerAnnee(id);
      toast.success('Annee activee avec succes');
      await refresh();
      load();
    } catch {
      toast.error('Erreur lors de l\'activation');
    } finally {
      setActivating(null);
    }
  };

  const handleDelete = async () => {
    try {
      await anneesAcademiquesService.delete(deleteId);
      toast.success('Annee supprimee');
      setDeleteOpen(false);
      load();
    } catch {
      toast.error('Erreur suppression');
    }
  };

  const handleReset = async () => {
    setResetLoading(true);
    setResetError('');
    try {
      await usersService.resetDatabase(resetPassword);
      toast.success('Base de donnees reinitialisee');
      setResetOpen(false);
      setResetPassword('');
      await refresh();
      load();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setResetError(detail || 'Erreur lors de la reinitialisation');
    } finally {
      setResetLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const columns = [
    { field: 'libelle', label: 'Annee' },
    {
      field: 'est_active',
      label: 'Statut',
      render: (row) => (
        <Chip
          label={row.est_active ? 'Active' : 'Inactive'}
          size="small"
          sx={{
            fontWeight: 600,
            backgroundColor: row.est_active ? '#E8F5E9' : '#F5F5F5',
            color: row.est_active ? '#2E7D32' : '#757575',
          }}
        />
      ),
    },
    {
      field: 'est_configuree',
      label: 'Configuree',
      render: (row) => (
        <Chip
          label={row.est_configuree ? 'Oui' : 'Non'}
          size="small"
          sx={{
            fontWeight: 600,
            backgroundColor: row.est_configuree ? '#E8F5E9' : '#FFF3E0',
            color: row.est_configuree ? '#2E7D32' : '#E65100',
          }}
        />
      ),
    },
    {
      field: 'date_creation',
      label: 'Date de creation',
      render: (row) => formatDate(row.date_creation),
    },
  ];

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={48} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={300} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  return (
    <Box className="fade-in">
      <PageHeader
        title="Annees academiques"
        description="Gestion des annees academiques"
        action={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/admin/nouvelle-annee')}
            sx={{ backgroundColor: '#001EA6', '&:hover': { backgroundColor: '#001484' } }}
          >
            Nouvelle annee
          </Button>
        }
      />

      <Card>
        <CardContent sx={{ p: 0 }}>
          <DataTable
            columns={columns}
            rows={items}
            searchFields={['libelle']}
            actions={(row) => (
              <>
                <Tooltip title="Activer cette annee">
                  <span>
                    <IconButton
                      size="small"
                      disabled={row.est_active || activating === row.id}
                      onClick={() => handleActivate(row.id)}
                      sx={{ color: '#001EA6' }}
                    >
                      <CheckCircle fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Supprimer">
                  <span>
                    <IconButton
                      size="small"
                      disabled={row.est_active}
                      sx={{ color: row.est_active ? undefined : '#EF4444' }}
                      onClick={() => { setDeleteId(row.id); setDeleteOpen(true); }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </>
            )}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer l'annee academique"
        message="Etes-vous sur de vouloir supprimer cette annee academique ? Cette action est irreversible."
        confirmText="Supprimer"
        confirmColor="error"
      />

      {/* Zone dangereuse */}
      <Card sx={{ mt: 4, border: '1px solid #EF4444' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <WarningIcon sx={{ color: '#EF4444' }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#EF4444' }}>
              Zone dangereuse
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Reinitialiser la base de donnees
              </Typography>
              <Typography variant="body2" sx={{ color: '#7E7E7E' }}>
                Supprime toutes les donnees : fiches, UEs, utilisateurs, structure academique. Seul votre compte Super Admin sera conserve. Cette action est irreversible.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteForever />}
              onClick={() => { setResetOpen(true); setResetError(''); setResetPassword(''); }}
              sx={{ ml: 3, whiteSpace: 'nowrap' }}
            >
              Tout supprimer
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Dialog de confirmation reset */}
      <Dialog
        open={resetOpen}
        onClose={() => !resetLoading && setResetOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#EF4444', display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon /> Reinitialiser la base de donnees
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            Cette action supprimera <b>toutes les donnees</b> de la plateforme de maniere irreversible. Seul votre compte Super Admin sera conserve.
          </Alert>
          <Typography variant="body2" sx={{ mb: 2, color: '#525252' }}>
            Pour confirmer, saisissez votre mot de passe :
          </Typography>
          {resetError && <Alert severity="error" sx={{ mb: 2 }}>{resetError}</Alert>}
          <TextField
            type="password"
            label="Mot de passe"
            fullWidth
            value={resetPassword}
            onChange={(e) => { setResetPassword(e.target.value); setResetError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && resetPassword && handleReset()}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setResetOpen(false)} color="inherit" disabled={resetLoading}>
            Annuler
          </Button>
          <Button
            onClick={handleReset}
            variant="contained"
            color="error"
            disabled={resetLoading || !resetPassword}
            startIcon={resetLoading ? <CircularProgress size={18} color="inherit" /> : <DeleteForever />}
          >
            {resetLoading ? 'Suppression...' : 'Confirmer la reinitialisation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
