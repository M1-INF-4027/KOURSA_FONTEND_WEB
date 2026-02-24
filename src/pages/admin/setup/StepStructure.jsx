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
} from '@mui/material';
import { Add, Edit, Delete, School, AccountBalance } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { facultesService, departementsService } from '../../../api/services';

export default function StepStructure({ onNext, onBack }) {
  const [facultes, setFacultes] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Faculty dialog
  const [facDialogOpen, setFacDialogOpen] = useState(false);
  const [editingFac, setEditingFac] = useState(null);
  const [facForm, setFacForm] = useState({ nom_faculte: '' });
  const [savingFac, setSavingFac] = useState(false);

  // Department dialog
  const [depDialogOpen, setDepDialogOpen] = useState(false);
  const [editingDep, setEditingDep] = useState(null);
  const [depForm, setDepForm] = useState({ nom_departement: '', faculte: '' });
  const [savingDep, setSavingDep] = useState(false);

  const load = async () => {
    try {
      const [facRes, depRes] = await Promise.all([
        facultesService.getAll(),
        departementsService.getAll(),
      ]);
      setFacultes(facRes.data);
      setDepartements(depRes.data);
    } catch {
      toast.error('Erreur lors du chargement des donnees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Faculty handlers
  const openFacDialog = (fac = null) => {
    setEditingFac(fac);
    setFacForm(fac ? { nom_faculte: fac.nom_faculte } : { nom_faculte: '' });
    setFacDialogOpen(true);
  };

  const saveFac = async () => {
    if (!facForm.nom_faculte.trim()) return;
    setSavingFac(true);
    try {
      if (editingFac) {
        await facultesService.update(editingFac.id, facForm);
        toast.success('Faculte modifiee');
      } else {
        await facultesService.create(facForm);
        toast.success('Faculte creee');
      }
      setFacDialogOpen(false);
      load();
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSavingFac(false);
    }
  };

  const deleteFac = async (id) => {
    const hasDeps = departements.some((d) => d.faculte === id);
    if (hasDeps) {
      toast.error('Supprimez d\'abord les departements de cette faculte');
      return;
    }
    try {
      await facultesService.delete(id);
      toast.success('Faculte supprimee');
      load();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  // Department handlers
  const openDepDialog = (dep = null, preselectedFaculte = '') => {
    setEditingDep(dep);
    setDepForm(dep
      ? { nom_departement: dep.nom_departement, faculte: dep.faculte || '' }
      : { nom_departement: '', faculte: preselectedFaculte || '' }
    );
    setDepDialogOpen(true);
  };

  const saveDep = async () => {
    if (!depForm.nom_departement.trim() || !depForm.faculte) return;
    setSavingDep(true);
    try {
      if (editingDep) {
        await departementsService.update(editingDep.id, depForm);
        toast.success('Departement modifie');
      } else {
        await departementsService.create(depForm);
        toast.success('Departement cree');
      }
      setDepDialogOpen(false);
      load();
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSavingDep(false);
    }
  };

  const deleteDep = async (id) => {
    try {
      await departementsService.delete(id);
      toast.success('Departement supprime');
      load();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const canProceed = facultes.length >= 1 && departements.length >= 1;

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={120} sx={{ mb: 2, borderRadius: 3 }} />
        <Skeleton variant="rounded" height={120} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Structure academique
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Creez les facultes et leurs departements. Vous devez avoir au moins une faculte et un departement pour continuer.
      </Typography>

      {/* Add Faculty button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={() => openFacDialog()}
        >
          Ajouter une faculte
        </Button>
      </Box>

      {facultes.length === 0 && (
        <Card sx={{ mb: 2, bgcolor: '#F5F7FA' }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <AccountBalance sx={{ fontSize: 48, color: '#7E7E7E', mb: 1 }} />
            <Typography color="text.secondary">
              Aucune faculte. Commencez par en ajouter une.
            </Typography>
          </CardContent>
        </Card>
      )}

      {facultes.map((fac) => {
        const facDeps = departements.filter((d) => d.faculte === fac.id);
        return (
          <Card key={fac.id} sx={{ mb: 2 }}>
            <CardContent>
              {/* Faculty header */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: facDeps.length > 0 ? 2 : 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <AccountBalance sx={{ color: '#001EA6' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {fac.nom_faculte}
                  </Typography>
                  <Chip
                    label={`${facDeps.length} dept.`}
                    size="small"
                    variant="outlined"
                    sx={{ ml: 1 }}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <IconButton size="small" onClick={() => openFacDialog(fac)}>
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton size="small" sx={{ color: '#EF4444' }} onClick={() => deleteFac(fac.id)}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              {/* Departments under this faculty */}
              {facDeps.length > 0 && (
                <Box sx={{ pl: 2, borderLeft: '3px solid #001EA6', ml: 1.5 }}>
                  {facDeps.map((dep) => (
                    <Box
                      key={dep.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        py: 1,
                        px: 1.5,
                        borderRadius: 1,
                        '&:hover': { bgcolor: '#F5F7FA' },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <School sx={{ fontSize: 18, color: '#7E7E7E' }} />
                        <Typography variant="body2">{dep.nom_departement}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton size="small" onClick={() => openDepDialog(dep)}>
                          <Edit sx={{ fontSize: 16 }} />
                        </IconButton>
                        <IconButton size="small" sx={{ color: '#EF4444' }} onClick={() => deleteDep(dep.id)}>
                          <Delete sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}

              {/* Add department button */}
              <Button
                size="small"
                startIcon={<Add />}
                onClick={() => openDepDialog(null, fac.id)}
                sx={{ mt: facDeps.length > 0 ? 1 : 0, ml: 2 }}
              >
                Ajouter un departement
              </Button>
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

      {/* Faculty Dialog */}
      <Dialog open={facDialogOpen} onClose={() => setFacDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingFac ? 'Modifier la faculte' : 'Nouvelle faculte'}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Nom de la faculte"
            fullWidth
            value={facForm.nom_faculte}
            onChange={(e) => setFacForm({ nom_faculte: e.target.value })}
            sx={{ mt: 1 }}
            onKeyDown={(e) => e.key === 'Enter' && saveFac()}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFacDialogOpen(false)} color="inherit">Annuler</Button>
          <Button
            onClick={saveFac}
            variant="contained"
            disabled={savingFac || !facForm.nom_faculte.trim()}
          >
            {savingFac ? 'Sauvegarde...' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Department Dialog */}
      <Dialog open={depDialogOpen} onClose={() => setDepDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingDep ? 'Modifier le departement' : 'Nouveau departement'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Nom du departement"
            fullWidth
            value={depForm.nom_departement}
            onChange={(e) => setDepForm({ ...depForm, nom_departement: e.target.value })}
            autoFocus
          />
          <TextField
            select
            label="Faculte"
            fullWidth
            value={depForm.faculte}
            onChange={(e) => setDepForm({ ...depForm, faculte: e.target.value })}
          >
            {facultes.map((f) => (
              <MenuItem key={f.id} value={f.id}>{f.nom_faculte}</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDepDialogOpen(false)} color="inherit">Annuler</Button>
          <Button
            onClick={saveDep}
            variant="contained"
            disabled={savingDep || !depForm.nom_departement.trim() || !depForm.faculte}
          >
            {savingDep ? 'Sauvegarde...' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
