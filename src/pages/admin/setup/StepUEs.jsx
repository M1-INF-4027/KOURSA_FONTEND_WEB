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
  Autocomplete,
  Chip,
  CircularProgress,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { Add, Edit, Delete, MenuBook } from '@mui/icons-material';
import toast from 'react-hot-toast';
import {
  unitesEnseignementService,
  usersService,
  niveauxService,
  semestresService,
} from '../../../api/services';

export default function StepUEs({ onNext, onBack, anneeId }) {
  const [ues, setUes] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [niveaux, setNiveaux] = useState([]);
  const [semestres, setSemestres] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    code_ue: '',
    libelle_ue: '',
    semestre: '',
    semestreType: 'S1',
    enseignants: [],
    niveaux: [],
  });
  const [saving, setSaving] = useState(false);

  // Delete
  const [deleteId, setDeleteId] = useState(null);

  const load = async () => {
    try {
      const [ueRes, usrRes, nivRes, semRes] = await Promise.all([
        unitesEnseignementService.getAll(),
        usersService.getAll(),
        niveauxService.getAll(),
        semestresService.getAll(anneeId ? { annee_academique: anneeId } : {}),
      ]);
      setUes(ueRes.data);
      setEnseignants(
        usrRes.data.filter((u) =>
          u.roles?.some((r) => (r.nom_role || r) === 'Enseignant')
        )
      );
      setNiveaux(nivRes.data);

      const semData = Array.isArray(semRes.data?.results) ? semRes.data.results : (Array.isArray(semRes.data) ? semRes.data : []);
      setSemestres(semData);
    } catch {
      toast.error('Erreur lors du chargement des donnees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const getSemestreId = (type) => {
    const sem = semestres.find(
      (s) => s.numero === (type === 'S1' ? 1 : 2) || s.libelle?.toLowerCase().includes(type.toLowerCase())
    );
    return sem?.id || '';
  };

  const getSemestreLabel = (semestreId) => {
    const sem = semestres.find((s) => s.id === semestreId);
    if (sem) return sem.libelle || `S${sem.numero}`;
    return '-';
  };

  const openDialog = (ue = null) => {
    setEditing(ue);
    if (ue) {
      const sem = semestres.find((s) => s.id === ue.semestre);
      const sType = sem?.numero === 2 ? 'S2' : 'S1';
      setForm({
        code_ue: ue.code_ue || '',
        libelle_ue: ue.libelle_ue || '',
        semestre: ue.semestre || '',
        semestreType: sType,
        enseignants: ue.enseignants_details || ue.enseignants || [],
        niveaux: ue.niveaux_details || ue.niveaux || [],
      });
    } else {
      setForm({
        code_ue: '',
        libelle_ue: '',
        semestre: getSemestreId('S1'),
        semestreType: 'S1',
        enseignants: [],
        niveaux: [],
      });
    }
    setDialogOpen(true);
  };

  const handleSemestreToggle = (_, val) => {
    if (!val) return;
    setForm((prev) => ({
      ...prev,
      semestreType: val,
      semestre: getSemestreId(val),
    }));
  };

  const handleSave = async () => {
    if (!form.code_ue.trim() || !form.libelle_ue.trim()) {
      toast.error('Le code et le libelle sont requis');
      return;
    }

    setSaving(true);
    try {
      const data = {
        code_ue: form.code_ue.trim(),
        libelle_ue: form.libelle_ue.trim(),
        semestre: form.semestre || getSemestreId(form.semestreType),
        enseignants: form.enseignants.map((e) => (typeof e === 'object' ? e.id : e)),
        niveaux: form.niveaux.map((n) => (typeof n === 'object' ? n.id : n)),
      };

      if (editing) {
        await unitesEnseignementService.update(editing.id, data);
        toast.success('UE modifiee');
      } else {
        await unitesEnseignementService.create(data);
        toast.success('UE creee');
      }
      setDialogOpen(false);
      load();
    } catch (err) {
      const detail = err.response?.data;
      if (detail && typeof detail === 'object') {
        const messages = Object.values(detail).flat().join(', ');
        toast.error(messages || 'Erreur lors de la sauvegarde');
      } else {
        toast.error('Erreur lors de la sauvegarde');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await unitesEnseignementService.delete(id);
      toast.success('UE supprimee');
      setDeleteId(null);
      load();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const canProceed = ues.length >= 1;

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={200} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Unites d'enseignement
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Ajoutez les unites d'enseignement (UE) pour cette annee. Chaque UE est rattachee a un semestre et peut etre affectee a des enseignants et des niveaux.
      </Typography>

      {/* Add UE button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={() => openDialog()}
        >
          Ajouter une UE
        </Button>
      </Box>

      {ues.length === 0 && (
        <Card sx={{ mb: 2, bgcolor: '#F5F7FA' }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <MenuBook sx={{ fontSize: 48, color: '#7E7E7E', mb: 1 }} />
            <Typography color="text.secondary">
              Aucune UE. Commencez par en ajouter une.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* UE list */}
      {ues.map((ue) => {
        const ensNames = ue.enseignants_details || [];
        const nivNames = ue.niveaux_details || [];

        return (
          <Card key={ue.id} sx={{ mb: 1.5 }}>
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Chip
                      label={ue.code_ue}
                      size="small"
                      sx={{ fontWeight: 700, bgcolor: '#001EA6', color: '#fff' }}
                    />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {ue.libelle_ue}
                    </Typography>
                    <Chip
                      label={getSemestreLabel(ue.semestre)}
                      size="small"
                      variant="outlined"
                      sx={{ height: 22 }}
                    />
                  </Box>

                  {ensNames.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5, lineHeight: '24px' }}>
                        Enseignants:
                      </Typography>
                      {ensNames.map((e, i) => (
                        <Chip
                          key={i}
                          label={typeof e === 'object' ? `${e.first_name} ${e.last_name}` : e}
                          size="small"
                          variant="outlined"
                          sx={{ height: 22, fontSize: '0.7rem' }}
                        />
                      ))}
                    </Box>
                  )}

                  {nivNames.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5, lineHeight: '24px' }}>
                        Niveaux:
                      </Typography>
                      {nivNames.map((n, i) => (
                        <Chip
                          key={i}
                          label={typeof n === 'object' ? `${n.filiere_nom || n.nom_filiere || ''} ${n.nom_niveau}`.trim() : n}
                          size="small"
                          variant="outlined"
                          sx={{ height: 22, fontSize: '0.7rem' }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>

                <Box sx={{ display: 'flex', gap: 0.5, ml: 1, flexShrink: 0 }}>
                  <IconButton size="small" onClick={() => openDialog(ue)}>
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton size="small" sx={{ color: '#EF4444' }} onClick={() => handleDelete(ue.id)}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </CardContent>
          </Card>
        );
      })}

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button variant="outlined" onClick={onBack}>
          Precedent
        </Button>
        <Button
          variant="contained"
          onClick={onNext}
          disabled={!canProceed}
        >
          Suivant
        </Button>
      </Box>

      {/* UE Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editing ? 'Modifier l\'UE' : 'Nouvelle UE'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Code UE"
            fullWidth
            value={form.code_ue}
            onChange={(e) => setForm({ ...form, code_ue: e.target.value })}
            placeholder="Ex: INF301"
            autoFocus
          />
          <TextField
            label="Libelle"
            fullWidth
            value={form.libelle_ue}
            onChange={(e) => setForm({ ...form, libelle_ue: e.target.value })}
            placeholder="Ex: Algorithmique avancee"
          />

          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
              Semestre
            </Typography>
            <ToggleButtonGroup
              value={form.semestreType}
              exclusive
              onChange={handleSemestreToggle}
              fullWidth
              size="small"
            >
              <ToggleButton value="S1" sx={{ fontWeight: 600 }}>
                Semestre 1
              </ToggleButton>
              <ToggleButton value="S2" sx={{ fontWeight: 600 }}>
                Semestre 2
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Autocomplete
            multiple
            options={enseignants}
            getOptionLabel={(o) =>
              typeof o === 'object' ? `${o.first_name} ${o.last_name}` : String(o)
            }
            value={form.enseignants.map((e) =>
              typeof e === 'object' ? e : enseignants.find((x) => x.id === e) || e
            )}
            onChange={(_, val) => setForm({ ...form, enseignants: val })}
            isOptionEqualToValue={(opt, val) => opt.id === (val?.id || val)}
            renderInput={(params) => <TextField {...params} label="Enseignants" />}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index });
                return (
                  <Chip
                    key={key}
                    {...tagProps}
                    label={typeof option === 'object' ? `${option.first_name} ${option.last_name}` : option}
                    size="small"
                  />
                );
              })
            }
          />

          <Autocomplete
            multiple
            options={niveaux}
            getOptionLabel={(o) =>
              typeof o === 'object'
                ? `${o.nom_filiere || o.filiere_nom || ''} ${o.nom_niveau}`.trim()
                : String(o)
            }
            value={form.niveaux.map((n) =>
              typeof n === 'object' ? n : niveaux.find((x) => x.id === n) || n
            )}
            onChange={(_, val) => setForm({ ...form, niveaux: val })}
            isOptionEqualToValue={(opt, val) => opt.id === (val?.id || val)}
            renderInput={(params) => <TextField {...params} label="Niveaux" />}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index });
                return (
                  <Chip
                    key={key}
                    {...tagProps}
                    label={
                      typeof option === 'object'
                        ? `${option.nom_filiere || option.filiere_nom || ''} ${option.nom_niveau}`.trim()
                        : option
                    }
                    size="small"
                    variant="outlined"
                  />
                );
              })
            }
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">Annuler</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving || !form.code_ue.trim() || !form.libelle_ue.trim()}
          >
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
