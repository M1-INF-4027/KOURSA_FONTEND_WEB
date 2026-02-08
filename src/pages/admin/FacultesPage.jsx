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
  IconButton,
  Tooltip,
  Skeleton,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { facultesService } from '../../api/services';
import toast from 'react-hot-toast';

export default function FacultesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nom_faculte: '' });
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const load = async () => {
    try {
      const res = await facultesService.getAll();
      setItems(res.data);
    } catch {
      toast.error('Erreur chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleOpen = (item = null) => {
    setEditing(item);
    setForm(item ? { nom_faculte: item.nom_faculte } : { nom_faculte: '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nom_faculte.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await facultesService.update(editing.id, form);
        toast.success('Faculte modifiee');
      } else {
        await facultesService.create(form);
        toast.success('Faculte creee');
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
      await facultesService.delete(deleteId);
      toast.success('Faculte supprimee');
      setDeleteOpen(false);
      load();
    } catch {
      toast.error('Erreur suppression');
    }
  };

  const columns = [
    { field: 'id', label: 'ID' },
    { field: 'nom_faculte', label: 'Nom de la faculte' },
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
        title="Facultes"
        description="Gestion des facultes"
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
            searchFields={['nom_faculte']}
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editing ? 'Modifier la faculte' : 'Nouvelle faculte'}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Nom de la faculte"
            fullWidth
            value={form.nom_faculte}
            onChange={(e) => setForm({ ...form, nom_faculte: e.target.value })}
            sx={{ mt: 1 }}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">Annuler</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving || !form.nom_faculte.trim()}>
            {saving ? 'Sauvegarde...' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer la faculte"
        message="Etes-vous sur de vouloir supprimer cette faculte ? Cette action est irreversible."
        confirmText="Supprimer"
        confirmColor="error"
      />
    </Box>
  );
}
