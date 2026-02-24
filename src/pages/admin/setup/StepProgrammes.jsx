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
  MenuItem,
  Chip,
  CircularProgress,
  Skeleton,
  Collapse,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  School,
  MenuBook,
  Layers,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import {
  departementsService,
  filieresService,
  niveauxService,
} from '../../../api/services';

export default function StepProgrammes({ onNext, onBack }) {
  const [departements, setDepartements] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [niveaux, setNiveaux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  // Filiere dialog
  const [filDialogOpen, setFilDialogOpen] = useState(false);
  const [editingFil, setEditingFil] = useState(null);
  const [filForm, setFilForm] = useState({ nom_filiere: '', departement: '' });
  const [savingFil, setSavingFil] = useState(false);

  // Niveau dialog
  const [nivDialogOpen, setNivDialogOpen] = useState(false);
  const [editingNiv, setEditingNiv] = useState(null);
  const [nivForm, setNivForm] = useState({ nom_niveau: '', filiere: '' });
  const [savingNiv, setSavingNiv] = useState(false);

  const load = async () => {
    try {
      const [depRes, filRes, nivRes] = await Promise.all([
        departementsService.getAll(),
        filieresService.getAll(),
        niveauxService.getAll(),
      ]);
      setDepartements(depRes.data);
      setFilieres(filRes.data);
      setNiveaux(nivRes.data);

      // Auto-expand all departments by default
      const expandMap = {};
      depRes.data.forEach((d) => { expandMap[d.id] = true; });
      setExpanded(expandMap);
    } catch {
      toast.error('Erreur lors du chargement des donnees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleExpand = (depId) => {
    setExpanded((prev) => ({ ...prev, [depId]: !prev[depId] }));
  };

  // Filiere handlers
  const openFilDialog = (fil = null, preselectedDep = '') => {
    setEditingFil(fil);
    setFilForm(fil
      ? { nom_filiere: fil.nom_filiere, departement: fil.departement || '' }
      : { nom_filiere: '', departement: preselectedDep || '' }
    );
    setFilDialogOpen(true);
  };

  const saveFil = async () => {
    if (!filForm.nom_filiere.trim() || !filForm.departement) return;
    setSavingFil(true);
    try {
      if (editingFil) {
        await filieresService.update(editingFil.id, filForm);
        toast.success('Filiere modifiee');
      } else {
        await filieresService.create(filForm);
        toast.success('Filiere creee');
      }
      setFilDialogOpen(false);
      load();
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSavingFil(false);
    }
  };

  const deleteFil = async (id) => {
    const hasNiveaux = niveaux.some((n) => n.filiere === id);
    if (hasNiveaux) {
      toast.error('Supprimez d\'abord les niveaux de cette filiere');
      return;
    }
    try {
      await filieresService.delete(id);
      toast.success('Filiere supprimee');
      load();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  // Niveau handlers
  const openNivDialog = (niv = null, preselectedFil = '') => {
    setEditingNiv(niv);
    setNivForm(niv
      ? { nom_niveau: niv.nom_niveau, filiere: niv.filiere || '' }
      : { nom_niveau: '', filiere: preselectedFil || '' }
    );
    setNivDialogOpen(true);
  };

  const saveNiv = async () => {
    if (!nivForm.nom_niveau.trim() || !nivForm.filiere) return;
    setSavingNiv(true);
    try {
      if (editingNiv) {
        await niveauxService.update(editingNiv.id, nivForm);
        toast.success('Niveau modifie');
      } else {
        await niveauxService.create(nivForm);
        toast.success('Niveau cree');
      }
      setNivDialogOpen(false);
      load();
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSavingNiv(false);
    }
  };

  const deleteNiv = async (id) => {
    try {
      await niveauxService.delete(id);
      toast.success('Niveau supprime');
      load();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const canProceed = filieres.length >= 1 && niveaux.length >= 1;

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={150} sx={{ mb: 2, borderRadius: 3 }} />
        <Skeleton variant="rounded" height={150} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Programmes academiques
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Organisez les filieres et niveaux par departement. Vous devez avoir au moins une filiere et un niveau pour continuer.
      </Typography>

      {departements.length === 0 && (
        <Card sx={{ mb: 2, bgcolor: '#F5F7FA' }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <School sx={{ fontSize: 48, color: '#7E7E7E', mb: 1 }} />
            <Typography color="text.secondary">
              Aucun departement trouve. Retournez a l'etape precedente pour en creer.
            </Typography>
          </CardContent>
        </Card>
      )}

      {departements.map((dep) => {
        const depFilieres = filieres.filter((f) => f.departement === dep.id);
        const isExpanded = expanded[dep.id] ?? true;

        return (
          <Card key={dep.id} sx={{ mb: 2 }}>
            <CardContent sx={{ pb: isExpanded ? 2 : '16px !important' }}>
              {/* Department header */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
                onClick={() => toggleExpand(dep.id)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <School sx={{ color: '#001EA6' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {dep.nom_departement}
                  </Typography>
                  <Chip
                    label={dep.nom_faculte || 'Faculte'}
                    size="small"
                    sx={{ bgcolor: '#E8EAFF', color: '#001EA6' }}
                  />
                  <Chip
                    label={`${depFilieres.length} filiere(s)`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
                <IconButton size="small">
                  {isExpanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>

              <Collapse in={isExpanded}>
                {/* Filieres under department */}
                {depFilieres.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2, ml: 4 }}>
                    Aucune filiere dans ce departement.
                  </Typography>
                )}

                {depFilieres.map((fil) => {
                  const filNiveaux = niveaux.filter((n) => n.filiere === fil.id);
                  return (
                    <Box key={fil.id} sx={{ mt: 2, ml: 2 }}>
                      {/* Filiere row */}
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        py: 0.5,
                        px: 1.5,
                        bgcolor: '#F5F7FA',
                        borderRadius: 1,
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <MenuBook sx={{ fontSize: 18, color: '#001EA6' }} />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {fil.nom_filiere}
                          </Typography>
                          <Chip
                            label={`${filNiveaux.length} niveau(x)`}
                            size="small"
                            variant="outlined"
                            sx={{ height: 22, fontSize: '0.7rem' }}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton size="small" onClick={() => openFilDialog(fil)}>
                            <Edit sx={{ fontSize: 16 }} />
                          </IconButton>
                          <IconButton size="small" sx={{ color: '#EF4444' }} onClick={() => deleteFil(fil.id)}>
                            <Delete sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>
                      </Box>

                      {/* Niveaux under filiere */}
                      {filNiveaux.length > 0 && (
                        <Box sx={{ pl: 3, borderLeft: '2px solid #DFDFDF', ml: 2, mt: 0.5 }}>
                          {filNiveaux.map((niv) => (
                            <Box
                              key={niv.id}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                py: 0.5,
                                px: 1,
                                borderRadius: 1,
                                '&:hover': { bgcolor: '#FAFAFA' },
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Layers sx={{ fontSize: 16, color: '#7E7E7E' }} />
                                <Typography variant="body2">{niv.nom_niveau}</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <IconButton size="small" onClick={() => openNivDialog(niv)}>
                                  <Edit sx={{ fontSize: 14 }} />
                                </IconButton>
                                <IconButton size="small" sx={{ color: '#EF4444' }} onClick={() => deleteNiv(niv.id)}>
                                  <Delete sx={{ fontSize: 14 }} />
                                </IconButton>
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      )}

                      {/* Add niveau button */}
                      <Button
                        size="small"
                        startIcon={<Add />}
                        onClick={() => openNivDialog(null, fil.id)}
                        sx={{ ml: 3, mt: 0.5, fontSize: '0.75rem' }}
                      >
                        Ajouter un niveau
                      </Button>
                    </Box>
                  );
                })}

                {/* Add filiere button */}
                <Button
                  size="small"
                  startIcon={<Add />}
                  onClick={() => openFilDialog(null, dep.id)}
                  sx={{ mt: 1.5, ml: 2 }}
                >
                  Ajouter une filiere
                </Button>
              </Collapse>
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

      {/* Filiere Dialog */}
      <Dialog open={filDialogOpen} onClose={() => setFilDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingFil ? 'Modifier la filiere' : 'Nouvelle filiere'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Nom de la filiere"
            fullWidth
            value={filForm.nom_filiere}
            onChange={(e) => setFilForm({ ...filForm, nom_filiere: e.target.value })}
            autoFocus
          />
          <TextField
            select
            label="Departement"
            fullWidth
            value={filForm.departement}
            onChange={(e) => setFilForm({ ...filForm, departement: e.target.value })}
          >
            {departements.map((d) => (
              <MenuItem key={d.id} value={d.id}>{d.nom_departement}</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFilDialogOpen(false)} color="inherit">Annuler</Button>
          <Button
            onClick={saveFil}
            variant="contained"
            disabled={savingFil || !filForm.nom_filiere.trim() || !filForm.departement}
          >
            {savingFil ? 'Sauvegarde...' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Niveau Dialog */}
      <Dialog open={nivDialogOpen} onClose={() => setNivDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingNiv ? 'Modifier le niveau' : 'Nouveau niveau'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Nom du niveau"
            fullWidth
            value={nivForm.nom_niveau}
            onChange={(e) => setNivForm({ ...nivForm, nom_niveau: e.target.value })}
            autoFocus
          />
          <TextField
            select
            label="Filiere"
            fullWidth
            value={nivForm.filiere}
            onChange={(e) => setNivForm({ ...nivForm, filiere: e.target.value })}
          >
            {filieres.map((f) => (
              <MenuItem key={f.id} value={f.id}>{f.nom_filiere}</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setNivDialogOpen(false)} color="inherit">Annuler</Button>
          <Button
            onClick={saveNiv}
            variant="contained"
            disabled={savingNiv || !nivForm.nom_niveau.trim() || !nivForm.filiere}
          >
            {savingNiv ? 'Sauvegarde...' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
