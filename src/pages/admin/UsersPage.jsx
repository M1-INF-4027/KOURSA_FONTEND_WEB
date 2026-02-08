import { useState, useEffect, useMemo } from 'react';
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
  Tabs,
  Tab,
  Skeleton,
  Chip,
  Autocomplete,
  Grid,
} from '@mui/material';
import { Add, Edit, Delete, ToggleOn, ToggleOff, CheckCircle } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import RoleBadge from '../../components/common/RoleBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { usersService, rolesService } from '../../api/services';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [allRoles, setAllRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', roles: [] });
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const load = async () => {
    try {
      const [usrRes, rolesRes] = await Promise.all([
        usersService.getAll(),
        rolesService.getAll(),
      ]);
      setUsers(usrRes.data);
      setAllRoles(rolesRes.data);
    } catch {
      toast.error('Erreur chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (tab === 'ALL') return users;
    if (tab === 'EN_ATTENTE') return users.filter((u) => u.statut === 'EN_ATTENTE');
    return users.filter((u) =>
      u.roles?.some((r) => (r.nom_role || r) === tab)
    );
  }, [users, tab]);

  const handleOpen = (item = null) => {
    setEditing(item);
    if (item) {
      setForm({
        first_name: item.first_name || '',
        last_name: item.last_name || '',
        email: item.email || '',
        password: '',
        roles: item.roles?.map((r) => (typeof r === 'object' ? r.id : r)) || [],
      });
    } else {
      setForm({ first_name: '', last_name: '', email: '', password: '', roles: [] });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = { ...form };
      if (!data.password) delete data.password;
      if (editing) {
        await usersService.update(editing.id, data);
        toast.success('Utilisateur modifie');
      } else {
        if (!data.password) {
          toast.error('Mot de passe requis');
          setSaving(false);
          return;
        }
        await usersService.create(data);
        toast.success('Utilisateur cree');
      }
      setDialogOpen(false);
      load();
    } catch (err) {
      const msg = err.response?.data ? Object.values(err.response.data).flat().join(', ') : 'Erreur sauvegarde';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (user) => {
    const newStatus = user.statut === 'ACTIF' ? 'INACTIF' : 'ACTIF';
    try {
      await usersService.update(user.id, { statut: newStatus });
      toast.success(`Utilisateur ${newStatus === 'ACTIF' ? 'active' : 'desactive'}`);
      load();
    } catch {
      toast.error('Erreur mise a jour');
    }
  };

  const handleApprove = async (userId) => {
    try {
      await usersService.approuver(userId);
      toast.success('Utilisateur approuve');
      load();
    } catch {
      toast.error('Erreur approbation');
    }
  };

  const handleDelete = async () => {
    try {
      await usersService.delete(deleteId);
      toast.success('Utilisateur supprime');
      setDeleteOpen(false);
      load();
    } catch {
      toast.error('Erreur suppression');
    }
  };

  const columns = [
    { field: 'first_name', label: 'Prenom' },
    { field: 'last_name', label: 'Nom' },
    { field: 'email', label: 'Email' },
    {
      field: 'roles',
      label: 'Roles',
      sortable: false,
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {row.roles?.map((r, i) => <RoleBadge key={i} role={r.nom_role || r} />)}
        </Box>
      ),
    },
    {
      field: 'statut',
      label: 'Statut',
      render: (row) => <StatusBadge status={row.statut} />,
    },
  ];

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={48} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={400} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  return (
    <Box className="fade-in">
      <PageHeader
        title="Utilisateurs"
        description="Gestion globale des utilisateurs"
        action={
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
            Ajouter
          </Button>
        }
      />

      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ px: 3, pt: 2 }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
              <Tab label="Tous" value="ALL" sx={{ textTransform: 'none', fontWeight: 600 }} />
              <Tab label="Super Admin" value="Super Administrateur" sx={{ textTransform: 'none', fontWeight: 600 }} />
              <Tab label="Chef Dept." value="Chef de Département" sx={{ textTransform: 'none', fontWeight: 600 }} />
              <Tab label="Enseignants" value="Enseignant" sx={{ textTransform: 'none', fontWeight: 600 }} />
              <Tab label="Delegues" value="Délégué" sx={{ textTransform: 'none', fontWeight: 600 }} />
              <Tab
                label={`En attente (${users.filter((u) => u.statut === 'EN_ATTENTE').length})`}
                value="EN_ATTENTE"
                sx={{ textTransform: 'none', fontWeight: 600, color: users.some((u) => u.statut === 'EN_ATTENTE') ? '#F7B016' : undefined }}
              />
            </Tabs>
          </Box>
          <DataTable
            columns={columns}
            rows={filtered}
            searchFields={['first_name', 'last_name', 'email']}
            actions={(row) => (
              <>
                {row.statut === 'EN_ATTENTE' && (
                  <Tooltip title="Approuver">
                    <IconButton size="small" sx={{ color: '#10B981' }} onClick={() => handleApprove(row.id)}>
                      <CheckCircle fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Modifier">
                  <IconButton size="small" onClick={() => handleOpen(row)}>
                    <Edit fontSize="small" />
                  </IconButton>
                </Tooltip>
                {row.statut !== 'EN_ATTENTE' && (
                  <Tooltip title={row.statut === 'ACTIF' ? 'Desactiver' : 'Activer'}>
                    <IconButton size="small" onClick={() => handleToggle(row)}>
                      {row.statut === 'ACTIF' ? (
                        <ToggleOn sx={{ color: '#10B981', fontSize: 28 }} />
                      ) : (
                        <ToggleOff sx={{ color: '#7E7E7E', fontSize: 28 }} />
                      )}
                    </IconButton>
                  </Tooltip>
                )}
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
          {editing ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Prenom"
                fullWidth
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Nom"
                fullWidth
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                disabled={!!editing}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label={editing ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe'}
                type="password"
                fullWidth
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Autocomplete
                multiple
                options={allRoles}
                getOptionLabel={(o) => o.nom_role || o}
                value={allRoles.filter((r) => form.roles.includes(r.id))}
                onChange={(_, val) => setForm({ ...form, roles: val.map((r) => r.id) })}
                isOptionEqualToValue={(opt, val) => opt.id === val.id}
                renderInput={(params) => <TextField {...params} label="Roles" />}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">Annuler</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving || !form.email.trim()}>
            {saving ? 'Sauvegarde...' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer l'utilisateur"
        message="Etes-vous sur de vouloir supprimer cet utilisateur ? Cette action est irreversible."
        confirmText="Supprimer"
        confirmColor="error"
      />
    </Box>
  );
}
