import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, Chip, Autocomplete, TextField, Skeleton,
  IconButton, Tooltip,
} from '@mui/material';
import { Edit } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import { unitesEnseignementService, usersService } from '../../api/services';
import { useConfig } from '../../contexts/ConfigContext';
import toast from 'react-hot-toast';

export default function ChefUEsPage() {
  const { refreshKey } = useConfig();
  const [items, setItems] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formEnseignants, setFormEnseignants] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [ueRes, usrRes] = await Promise.all([
        unitesEnseignementService.getAll(),
        usersService.getAll(),
      ]);
      const ues = Array.isArray(ueRes.data) ? ueRes.data : ueRes.data?.results || [];
      const users = Array.isArray(usrRes.data) ? usrRes.data : usrRes.data?.results || [];
      setItems(ues);
      setEnseignants(users.filter((u) =>
        u.roles?.some((r) => (r.nom_role || r) === 'Enseignant')
      ));
    } catch {
      toast.error('Erreur chargement des UEs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [refreshKey]);

  const handleOpen = (item) => {
    setEditing(item);
    const currentEnseignants = (item.enseignants_details || item.enseignants || [])
      .map((e) => typeof e === 'object' ? e : enseignants.find((x) => x.id === e))
      .filter(Boolean);
    setFormEnseignants(currentEnseignants);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await unitesEnseignementService.update(editing.id, {
        enseignants: formEnseignants.map((e) => e.id),
      });
      toast.success('Enseignants mis a jour');
      setDialogOpen(false);
      load();
    } catch {
      toast.error('Erreur sauvegarde');
    } finally {
      setSaving(false);
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
      field: 'niveaux',
      label: 'Classe',
      sortable: false,
      render: (r) => {
        const nivs = r.niveaux_details || r.niveaux || [];
        return (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {nivs.map((n, i) => (
              <Chip
                key={i}
                label={typeof n === 'object' ? `${n.filiere_nom || ''} ${n.nom_niveau}`.trim() : n}
                size="small"
                variant="outlined"
              />
            ))}
          </Box>
        );
      },
    },
    {
      field: 'enseignants',
      label: 'Enseignants',
      sortable: false,
      render: (r) => {
        const names = r.enseignants_details || r.enseignants || [];
        if (names.length === 0) {
          return <Chip label="Aucun" size="small" sx={{ color: '#EF4444', bgcolor: '#FEE2E2', fontWeight: 600 }} />;
        }
        return (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {names.map((e, i) => (
              <Chip
                key={i}
                label={typeof e === 'object' ? `${e.first_name} ${e.last_name}` : e}
                size="small"
              />
            ))}
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
        title="UEs du departement"
        description="Gerez les enseignants assignes aux unites d'enseignement"
      />

      <Card>
        <CardContent sx={{ p: 0 }}>
          <DataTable
            columns={columns}
            rows={items}
            searchFields={['code_ue', 'libelle_ue']}
            actions={(row) => (
              <Tooltip title="Assigner des enseignants">
                <IconButton size="small" onClick={() => handleOpen(row)}>
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Assigner des enseignants — {editing?.code_ue}
        </DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
          <Box sx={{ mb: 2 }}>
            <Chip label={editing?.libelle_ue} variant="outlined" />
          </Box>
          <Autocomplete
            multiple
            options={enseignants}
            getOptionLabel={(o) => typeof o === 'object' ? `${o.first_name} ${o.last_name} (${o.email})` : String(o)}
            value={formEnseignants}
            onChange={(_, val) => setFormEnseignants(val)}
            isOptionEqualToValue={(opt, val) => opt.id === (val?.id || val)}
            renderInput={(params) => <TextField {...params} label="Enseignants" />}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">Annuler</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? 'Sauvegarde...' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
