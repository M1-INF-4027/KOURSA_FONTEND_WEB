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
import { filieresService, departementsService } from '../../api/services';
import toast from 'react-hot-toast';

export default function FilieresPage() {
  const [items, setItems] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nom_filiere: '', departement: '' });
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const load = async () => {
    try {
      const [filRes, depRes] = await Promise.all([
        filieresService.getAll(),
        departementsService.getAll(),
      ]);
      setItems(filRes.data);
      setDepartements(depRes.data);
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
      ? { nom_filiere: item.nom_filiere, departement: item.departement || '' }
      : { nom_filiere: '', departement: '' }
    );
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nom_filiere.trim() || !form.departement) return;
    setSaving(true);
    try {
      if (editing) {
        await filieresService.update(editing.id, form);
        toast.success('Filiere modifiee');
      } else {
        await filieresService.create(form);
        toast.success('Filiere creee');
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
      await filieresService.delete(deleteId);
      toast.success('Filiere supprimee');
      setDeleteOpen(false);
      load();
    } catch {
      toast.error('Erreur suppression');
    }
  };

  const columns = [
    { field: 'nom_filiere', label: 'Filiere' },
    { field: 'nom_departement', label: 'Departement' },
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
        title="Filieres"
        description="Gestion des filieres"
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
            searchFields={['nom_filiere', 'nom_departement']}
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
          {editing ? 'Modifier la filiere' : 'Nouvelle filiere'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Nom de la filiere"
            fullWidth
            value={form.nom_filiere}
            onChange={(e) => setForm({ ...form, nom_filiere: e.target.value })}
          />
          <TextField
            select
            label="Departement"
            fullWidth
            value={form.departement}
            onChange={(e) => setForm({ ...form, departement: e.target.value })}
          >
            {departements.map((d) => (
              <MenuItem key={d.id} value={d.id}>{d.nom_departement}</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">Annuler</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving || !form.nom_filiere.trim() || !form.departement}>
            {saving ? 'Sauvegarde...' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer la filiere"
        message="Etes-vous sur de vouloir supprimer cette filiere ?"
        confirmText="Supprimer"
        confirmColor="error"
      />
    </Box>
  );
}
