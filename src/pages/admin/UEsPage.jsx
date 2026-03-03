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
  Chip,
  Autocomplete,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { unitesEnseignementService, usersService, niveauxService, semestresService } from '../../api/services';
import { useConfig } from '../../contexts/ConfigContext';
import toast from 'react-hot-toast';

export default function UEsPage() {
  const { anneeActive, refreshKey } = useConfig();
  const [items, setItems] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [niveaux, setNiveaux] = useState([]);
  const [semestres, setSemestres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ code_ue: '', libelle_ue: '', semestre_obj: '', enseignants: [], niveaux: [] });
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const load = async () => {
    try {
      const [ueRes, usrRes, nivRes, semRes] = await Promise.all([
        unitesEnseignementService.getAll(),
        usersService.getAll(),
        niveauxService.getAll(),
        semestresService.getAll(anneeActive ? { annee_academique: anneeActive.id } : {}),
      ]);
      setItems(ueRes.data);
      setEnseignants(usrRes.data.filter((u) =>
        u.roles?.some((r) => (r.nom_role || r) === 'Enseignant')
      ));
      setNiveaux(nivRes.data);
      const semData = Array.isArray(semRes.data?.results) ? semRes.data.results : (Array.isArray(semRes.data) ? semRes.data : []);
      setSemestres(semData);
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error('Session expiree, veuillez vous reconnecter');
      } else {
        toast.error('Erreur chargement des donnees');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [refreshKey]);

  const handleClose = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm({ code_ue: '', libelle_ue: '', semestre_obj: '', enseignants: [], niveaux: [] });
  };

  const handleOpen = (item = null) => {
    if (item && item.id) {
      setEditing(item);
      setForm({
        code_ue: item.code_ue || '',
        libelle_ue: item.libelle_ue || '',
        semestre_obj: item.semestre_obj || '',
        enseignants: item.enseignants || [],
        niveaux: item.niveaux || [],
      });
    } else {
      setEditing(null);
      setForm({ code_ue: '', libelle_ue: '', semestre_obj: semestres[0]?.id || '', enseignants: [], niveaux: [] });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.code_ue.trim() || !form.libelle_ue.trim()) return;
    setSaving(true);
    try {
      const data = {
        code_ue: form.code_ue,
        libelle_ue: form.libelle_ue,
        semestre_obj: form.semestre_obj || null,
        enseignants: form.enseignants.map((e) => (typeof e === 'object' ? e.id : e)),
        niveaux: form.niveaux.map((n) => (typeof n === 'object' ? n.id : n)),
      };
      if (editing && editing.id) {
        await unitesEnseignementService.update(editing.id, data);
        toast.success('UE modifiee');
      } else {
        await unitesEnseignementService.create(data);
        toast.success('UE creee');
      }
      handleClose();
      load();
    } catch (err) {
      const detail = err.response?.data;
      const msg = typeof detail === 'string' ? detail
        : detail?.detail || detail?.non_field_errors?.[0]
        || Object.values(detail || {}).flat().join(', ')
        || 'Erreur sauvegarde';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await unitesEnseignementService.delete(deleteId);
      toast.success('UE supprimee');
      setDeleteOpen(false);
      load();
    } catch {
      toast.error('Erreur suppression');
    }
  };

  const columns = [
    { field: 'code_ue', label: 'Code' },
    { field: 'libelle_ue', label: 'Libelle' },
    {
      field: 'semestre_info',
      label: 'Semestre',
      render: (r) => {
        const info = r.semestre_info;
        if (info) return <Chip label={`S${info.numero}`} size="small" variant="outlined" />;
        return '-';
      },
    },
    {
      field: 'enseignants',
      label: 'Enseignants',
      sortable: false,
      render: (r) => {
        const names = r.enseignants_details || r.enseignants || [];
        return (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {names.slice(0, 2).map((e, i) => (
              <Chip key={i} label={typeof e === 'object' ? `${e.first_name} ${e.last_name}` : e} size="small" />
            ))}
            {names.length > 2 && <Chip label={`+${names.length - 2}`} size="small" />}
          </Box>
        );
      },
    },
    {
      field: 'niveaux',
      label: 'Niveaux',
      sortable: false,
      render: (r) => {
        const nivs = r.niveaux_details || r.niveaux || [];
        return (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {nivs.slice(0, 2).map((n, i) => (
              <Chip key={i} label={typeof n === 'object' ? `${n.filiere_nom || ''} ${n.nom_niveau}`.trim() : n} size="small" variant="outlined" />
            ))}
            {nivs.length > 2 && <Chip label={`+${nivs.length - 2}`} size="small" variant="outlined" />}
          </Box>
        );
      },
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
        title="Unites d'enseignement"
        description="Gestion des UEs"
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
            searchFields={['code_ue', 'libelle_ue']}
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

      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editing ? 'Modifier l\'UE' : 'Nouvelle UE'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Code UE"
            fullWidth
            value={form.code_ue}
            onChange={(e) => setForm({ ...form, code_ue: e.target.value })}
          />
          <TextField
            label="Libelle"
            fullWidth
            value={form.libelle_ue}
            onChange={(e) => setForm({ ...form, libelle_ue: e.target.value })}
          />
          <TextField
            select
            label="Semestre"
            fullWidth
            value={form.semestre_obj}
            onChange={(e) => setForm({ ...form, semestre_obj: e.target.value })}
          >
            {semestres.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                Semestre {s.numero}
              </MenuItem>
            ))}
          </TextField>
          <Autocomplete
            multiple
            options={enseignants}
            getOptionLabel={(o) => typeof o === 'object' ? `${o.first_name} ${o.last_name}` : String(o)}
            value={form.enseignants.map((e) => typeof e === 'object' ? e : enseignants.find((x) => x.id === e) || e)}
            onChange={(_, val) => setForm({ ...form, enseignants: val })}
            isOptionEqualToValue={(opt, val) => opt.id === (val?.id || val)}
            renderInput={(params) => <TextField {...params} label="Enseignants" />}
          />
          <Autocomplete
            multiple
            options={niveaux}
            getOptionLabel={(o) => typeof o === 'object' ? `${o.nom_filiere || o.filiere_nom || ''} ${o.nom_niveau}`.trim() : String(o)}
            value={form.niveaux.map((n) => typeof n === 'object' ? n : niveaux.find((x) => x.id === n) || n)}
            onChange={(_, val) => setForm({ ...form, niveaux: val })}
            isOptionEqualToValue={(opt, val) => opt.id === (val?.id || val)}
            renderInput={(params) => <TextField {...params} label="Niveaux" />}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} color="inherit">Annuler</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving || !form.code_ue.trim() || !form.libelle_ue.trim()}>
            {saving ? 'Sauvegarde...' : (editing ? 'Modifier' : 'Creer')}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer l'UE"
        message="Etes-vous sur de vouloir supprimer cette unite d'enseignement ?"
        confirmText="Supprimer"
        confirmColor="error"
      />
    </Box>
  );
}
