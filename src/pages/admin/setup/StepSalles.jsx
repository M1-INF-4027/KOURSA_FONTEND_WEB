import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Skeleton,
} from '@mui/material';
import { Add, Edit, Delete, MeetingRoom } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { sallesService } from '../../../api/services';

export default function StepSalles({ onNext, onBack }) {
  const [salles, setSalles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nom_salle: '', batiment: '', capacite: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await sallesService.getAll();
      setSalles(res.data);
    } catch {
      toast.error('Erreur lors du chargement des salles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openDialog = (salle = null) => {
    setEditing(salle);
    setForm(salle
      ? { nom_salle: salle.nom_salle, batiment: salle.batiment || '', capacite: salle.capacite ?? '' }
      : { nom_salle: '', batiment: '', capacite: '' }
    );
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nom_salle.trim()) return;
    setSaving(true);
    try {
      const data = {
        nom_salle: form.nom_salle.trim(),
        batiment: form.batiment.trim(),
        capacite: form.capacite === '' ? null : Number(form.capacite),
        est_active: true,
      };
      if (editing) {
        await sallesService.update(editing.id, data);
        toast.success('Salle modifiee');
      } else {
        await sallesService.create(data);
        toast.success('Salle creee');
      }
      setDialogOpen(false);
      load();
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await sallesService.delete(id);
      toast.success('Salle supprimee');
      load();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const canProceed = salles.length >= 1;

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={120} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Salles
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Ajoutez les salles de cours. Vous devez avoir au moins une salle pour continuer.
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="outlined" startIcon={<Add />} onClick={() => openDialog()}>
          Ajouter une salle
        </Button>
      </Box>

      {salles.length === 0 && (
        <Card sx={{ mb: 2, bgcolor: '#F5F7FA' }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <MeetingRoom sx={{ fontSize: 48, color: '#7E7E7E', mb: 1 }} />
            <Typography color="text.secondary">
              Aucune salle. Commencez par en ajouter une.
            </Typography>
          </CardContent>
        </Card>
      )}

      {salles.map((salle) => (
        <Card key={salle.id} sx={{ mb: 1.5 }}>
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <MeetingRoom sx={{ color: '#001EA6' }} />
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {salle.nom_salle}
                </Typography>
                {salle.batiment && (
                  <Chip label={salle.batiment} size="small" variant="outlined" />
                )}
                {salle.capacite && (
                  <Chip label={`${salle.capacite} places`} size="small" variant="outlined" />
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <IconButton size="small" onClick={() => openDialog(salle)}>
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton size="small" sx={{ color: '#EF4444' }} onClick={() => handleDelete(salle.id)}>
                  <Delete fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </CardContent>
        </Card>
      ))}

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button variant="outlined" onClick={onBack}>
          Precedent
        </Button>
        <Button variant="contained" onClick={onNext} disabled={!canProceed}>
          Suivant
        </Button>
      </Box>

      {/* Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editing ? 'Modifier la salle' : 'Nouvelle salle'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Nom de la salle"
            fullWidth
            value={form.nom_salle}
            onChange={(e) => setForm({ ...form, nom_salle: e.target.value })}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <TextField
            label="Batiment"
            fullWidth
            value={form.batiment}
            onChange={(e) => setForm({ ...form, batiment: e.target.value })}
          />
          <TextField
            label="Capacite"
            fullWidth
            type="number"
            value={form.capacite}
            onChange={(e) => setForm({ ...form, capacite: e.target.value })}
            inputProps={{ min: 0 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">Annuler</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving || !form.nom_salle.trim()}
          >
            {saving ? 'Sauvegarde...' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
