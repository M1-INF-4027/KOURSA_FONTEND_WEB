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
import { departementsService, facultesService, usersService } from '../../api/services';
import toast from 'react-hot-toast';

export default function DepartementsPage() {
  const [items, setItems] = useState([]);
  const [facultes, setFacultes] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nom_departement: '', faculte: '', chef_departement: '' });
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const load = async () => {
    try {
      const [depRes, facRes, usrRes] = await Promise.all([
        departementsService.getAll(),
        facultesService.getAll(),
        usersService.getAll(),
      ]);
      setItems(depRes.data);
      setFacultes(facRes.data);
      setEnseignants(usrRes.data.filter((u) =>
        u.roles?.some((r) => (r.nom_role || r) === 'Enseignant')
      ));
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
      ? { nom_departement: item.nom_departement, faculte: item.faculte || '', chef_departement: item.chef_departement || '' }
      : { nom_departement: '', faculte: '', chef_departement: '' }
    );
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nom_departement.trim() || !form.faculte) return;
    setSaving(true);
    try {
      const data = { ...form };
      if (!data.chef_departement) delete data.chef_departement;
      if (editing) {
        await departementsService.update(editing.id, data);
        toast.success('Departement modifie');
      } else {
        await departementsService.create(data);
        toast.success('Departement cree');
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
      await departementsService.delete(deleteId);
      toast.success('Departement supprime');
      setDeleteOpen(false);
      load();
    } catch {
      toast.error('Erreur suppression');
    }
  };

  const columns = [
    { field: 'nom_departement', label: 'Departement' },
    { field: 'nom_faculte', label: 'Faculte' },
    { field: 'nom_chef', label: 'Chef de departement', render: (r) => r.nom_chef || '-' },
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
        title="Departements"
        description="Gestion des departements"
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
            searchFields={['nom_departement', 'nom_faculte', 'nom_chef']}
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
          {editing ? 'Modifier le departement' : 'Nouveau departement'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Nom du departement"
            fullWidth
            value={form.nom_departement}
            onChange={(e) => setForm({ ...form, nom_departement: e.target.value })}
          />
          <TextField
            select
            label="Faculte"
            fullWidth
            value={form.faculte}
            onChange={(e) => setForm({ ...form, faculte: e.target.value })}
          >
            {facultes.map((f) => (
              <MenuItem key={f.id} value={f.id}>{f.nom_faculte}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Chef de departement"
            fullWidth
            value={form.chef_departement}
            onChange={(e) => setForm({ ...form, chef_departement: e.target.value })}
          >
            <MenuItem value="">Aucun</MenuItem>
            {enseignants.map((u) => (
              <MenuItem key={u.id} value={u.id}>{u.first_name} {u.last_name}</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">Annuler</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving || !form.nom_departement.trim() || !form.faculte}>
            {saving ? 'Sauvegarde...' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer le departement"
        message="Etes-vous sur de vouloir supprimer ce departement ?"
        confirmText="Supprimer"
        confirmColor="error"
      />
    </Box>
  );
}
