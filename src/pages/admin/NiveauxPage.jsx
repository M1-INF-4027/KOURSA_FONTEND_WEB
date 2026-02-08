import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Skeleton,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { niveauxService, filieresService } from '../../api/services';
import toast from 'react-hot-toast';

export default function NiveauxPage() {
  const [items, setItems] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nom_niveau: '', filiere: '' });
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const load = async () => {
    try {
      const [nivRes, filRes] = await Promise.all([
        niveauxService.getAll(),
        filieresService.getAll(),
      ]);
      setItems(nivRes.data);
      setFilieres(filRes.data);
    } catch {
      toast.error('Erreur chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleOpen = (item = null) => {
    setEditing(item);
    setForm(item
      ? { nom_niveau: item.nom_niveau, filiere: item.filiere || '' }
      : { nom_niveau: '', filiere: '' }
    );
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nom_niveau.trim() || !form.filiere) return;
    setSaving(true);
    try {
      if (editing) {
        await niveauxService.update(editing.id, form);
        toast.success('Niveau modifie');
      } else {
        await niveauxService.create(form);
        toast.success('Niveau cree');
      }
      setDialogOpen(false);
      load();
    } catch {
      toast.error('Erreur sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await niveauxService.delete(deleteId);
      toast.success('Niveau supprime');
      setDeleteOpen(false);
      load();
    } catch {
      toast.error('Erreur suppression');
    }
  };

  const columns = [
    { field: 'nom_niveau', label: 'Niveau' },
    { field: 'nom_filiere', label: 'Filiere' },
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
        title="Niveaux"
        description="Gestion des niveaux"
        action={
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
            Ajouter
          </Button>
        }
      />

      <Card>
        <CardContent sx={{ p: 0 }}>
          <DataTable
            columns={columns}
            rows={items}
            searchFields={['nom_niveau', 'nom_filiere']}
            actions={(row) => (
              <>
                <Tooltip title="Modifier">
                  <IconButton size="small" onClick={() => handleOpen(row)}>
                    <Edit fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Supprimer">
                  <IconButton size="small" sx={{ color: '#EF4444' }} onClick={() => { setDeleteId(row.id); setDeleteOpen(true); }}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editing ? 'Modifier le niveau' : 'Nouveau niveau'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Nom du niveau"
            fullWidth
            value={form.nom_niveau}
            onChange={(e) => setForm({ ...form, nom_niveau: e.target.value })}
          />
          <TextField
            select
            label="Filiere"
            fullWidth
            value={form.filiere}
            onChange={(e) => setForm({ ...form, filiere: e.target.value })}
          >
            {filieres.map((f) => (
              <MenuItem key={f.id} value={f.id}>{f.nom_filiere}</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">Annuler</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving || !form.nom_niveau.trim() || !form.filiere}>
            {saving ? 'Sauvegarde...' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer le niveau"
        message="Etes-vous sur de vouloir supprimer ce niveau ?"
        confirmText="Supprimer"
        confirmColor="error"
      />
    </Box>
  );
}
