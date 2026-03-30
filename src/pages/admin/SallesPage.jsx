import { useState, useEffect, useRef } from 'react';
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
  Chip,
} from '@mui/material';
import { Add, Edit, Delete, FileUpload, DeleteForever } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { sallesService } from '../../api/services';
import toast from 'react-hot-toast';

export default function SallesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nom_salle: '' });
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const fileInputRef = useRef(null);

  const load = async () => {
    try {
      const res = await sallesService.getAll();
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
    setForm(item ? { nom_salle: item.nom_salle } : { nom_salle: '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nom_salle.trim()) return;
    setSaving(true);
    try {
      const data = { nom_salle: form.nom_salle.trim(), est_active: true };
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
      toast.error('Erreur sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await sallesService.delete(deleteId);
      toast.success('Salle supprimee');
      setDeleteOpen(false);
      load();
    } catch {
      toast.error('Erreur suppression');
    }
  };

  const handleDeleteAll = async () => {
    try {
      const res = await sallesService.deleteAll();
      toast.success(`${res.data.deleted} salle(s) supprimee(s)`);
      setDeleteAllOpen(false);
      load();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await sallesService.import(file);
      const { created, skipped } = res.data;
      toast.success(`Import termine : ${created} creee(s), ${skipped} existante(s)`);
      load();
    } catch {
      toast.error("Erreur lors de l'import");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const columns = [
    { field: 'nom_salle', label: 'Nom de la salle' },
    {
      field: 'est_active',
      label: 'Statut',
      render: (row) => (
        <Chip
          label={row.est_active ? 'Active' : 'Inactive'}
          size="small"
          color={row.est_active ? 'success' : 'default'}
          variant="outlined"
        />
      ),
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
        title="Salles"
        description="Gestion des salles de cours"
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            {items.length > 0 && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteForever />}
                onClick={() => setDeleteAllOpen(true)}
              >
                Tout supprimer
              </Button>
            )}
            <input
              type="file"
              accept=".xlsx,.xls"
              hidden
              ref={fileInputRef}
              onChange={handleImport}
            />
            <Button
              variant="outlined"
              startIcon={<FileUpload />}
              onClick={() => fileInputRef.current?.click()}
            >
              Importer
            </Button>
            <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
              Ajouter
            </Button>
          </Box>
        }
      />

      <Card>
        <CardContent sx={{ p: 0 }}>
          <DataTable
            columns={columns}
            rows={items}
            searchFields={['nom_salle']}
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
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">Annuler</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving || !form.nom_salle.trim()}>
            {saving ? 'Sauvegarde...' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer la salle"
        message="Etes-vous sur de vouloir supprimer cette salle ?"
        confirmText="Supprimer"
        confirmColor="error"
      />

      <ConfirmDialog
        open={deleteAllOpen}
        onClose={() => setDeleteAllOpen(false)}
        onConfirm={handleDeleteAll}
        title="Supprimer toutes les salles"
        message={`Etes-vous sur de vouloir supprimer les ${items.length} salle(s) ? Cette action est irreversible.`}
        confirmText="Tout supprimer"
        confirmColor="error"
      />
    </Box>
  );
}
