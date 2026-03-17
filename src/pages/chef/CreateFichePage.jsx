import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Grid, TextField, Button, Autocomplete,
  ToggleButtonGroup, ToggleButton, Typography, IconButton, Skeleton,
  CircularProgress, Alert, AlertTitle,
} from '@mui/material';
import { ArrowBack, Save as SaveIcon, MeetingRoom, Person } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import PageHeader from '../../components/common/PageHeader';
import { fichesSuiviService, unitesEnseignementService, sallesService, usersService } from '../../api/services';
import toast from 'react-hot-toast';

dayjs.locale('fr');

export default function ChefCreateFichePage() {
  const navigate = useNavigate();

  const [ues, setUes] = useState([]);
  const [salles, setSalles] = useState([]);
  const [delegues, setDelegues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedUe, setSelectedUe] = useState(null);
  const [selectedEnseignant, setSelectedEnseignant] = useState(null);
  const [selectedDelegue, setSelectedDelegue] = useState(null);
  const [dateCours, setDateCours] = useState(null);
  const [heureDebut, setHeureDebut] = useState(null);
  const [heureFin, setHeureFin] = useState(null);
  const [selectedSalle, setSelectedSalle] = useState(null);
  const [typeSeance, setTypeSeance] = useState('CM');
  const [titreChapitre, setTitreChapitre] = useState('');
  const [contenuAborde, setContenuAborde] = useState('');
  const [conflicts, setConflicts] = useState([]);
  const conflictTimer = useRef(null);
  const [errors, setErrors] = useState({});

  const enseignants = selectedUe?.enseignants_details || selectedUe?.enseignants || [];

  useEffect(() => {
    const load = async () => {
      try {
        const [ueRes, sallesRes, usersRes] = await Promise.all([
          unitesEnseignementService.getAll(),
          sallesService.getAll(),
          usersService.getAll(),
        ]);
        setUes(ueRes.data);
        setSalles(sallesRes.data.filter((s) => s.est_active));
        setDelegues(usersRes.data.filter((u) =>
          u.roles?.some((r) => (r.nom_role || r) === 'Délégué' || (r.nom_role || r) === 'Delegue')
        ));
      } catch {
        toast.error('Erreur chargement des donnees');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Conflict detection
  useEffect(() => {
    if (conflictTimer.current) clearTimeout(conflictTimer.current);
    const canCheck = (selectedSalle || selectedEnseignant) && dateCours && heureDebut && heureFin
      && heureFin.isAfter(heureDebut);
    if (!canCheck) { setConflicts([]); return; }

    conflictTimer.current = setTimeout(async () => {
      try {
        const res = await fichesSuiviService.checkConflicts({
          salle: selectedSalle?.id || null,
          enseignant: selectedEnseignant?.id || null,
          date_cours: dateCours.format('YYYY-MM-DD'),
          heure_debut: heureDebut.format('HH:mm'),
          heure_fin: heureFin.format('HH:mm'),
        });
        setConflicts(res.data.conflicts || []);
      } catch { /* silent */ }
    }, 500);
    return () => { if (conflictTimer.current) clearTimeout(conflictTimer.current); };
  }, [selectedSalle, selectedEnseignant, dateCours, heureDebut, heureFin]);

  const validate = () => {
    const newErrors = {};
    if (!selectedUe) newErrors.ue = 'Veuillez selectionner une UE';
    if (!selectedEnseignant) newErrors.enseignant = 'Veuillez selectionner un enseignant';
    if (!selectedDelegue) newErrors.delegue = 'Veuillez selectionner un delegue';
    if (!dateCours) newErrors.dateCours = 'Veuillez selectionner une date';
    if (!heureDebut) newErrors.heureDebut = "Veuillez selectionner l'heure de debut";
    if (!heureFin) newErrors.heureFin = "Veuillez selectionner l'heure de fin";
    if (heureDebut && heureFin && heureFin.isBefore(heureDebut)) {
      newErrors.heureFin = "L'heure de fin doit etre apres l'heure de debut";
    }
    if (!titreChapitre.trim()) newErrors.titreChapitre = 'Veuillez saisir le titre du chapitre';
    if (!contenuAborde.trim()) newErrors.contenuAborde = 'Veuillez saisir le contenu aborde';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const data = {
        ue: selectedUe.id,
        enseignant: selectedEnseignant.id,
        delegue: selectedDelegue.id,
        date_cours: dateCours.format('YYYY-MM-DD'),
        heure_debut: heureDebut.format('HH:mm'),
        heure_fin: heureFin.format('HH:mm'),
        salle: selectedSalle?.id || null,
        type_seance: typeSeance,
        titre_chapitre: titreChapitre.trim(),
        contenu_aborde: contenuAborde.trim(),
      };
      await fichesSuiviService.create(data);
      toast.success('Fiche creee avec succes');
      navigate('/chef/fiches');
    } catch (err) {
      const detail = err.response?.data;
      if (detail && typeof detail === 'object') {
        const messages = Object.values(detail).flat().join(', ');
        toast.error(messages || 'Erreur lors de la creation');
      } else {
        toast.error('Erreur lors de la creation');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={48} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={500} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
      <Box className="fade-in">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <IconButton onClick={() => navigate('/chef/fiches')}>
            <ArrowBack />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Creer une fiche de suivi
            </Typography>
            <Typography variant="body2" sx={{ color: '#7E7E7E' }}>
              Creez une fiche pour n'importe quel enseignant, sans restriction de date
            </Typography>
          </Box>
        </Box>

        <Card>
          <CardContent sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* Delegue */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete
                  options={delegues}
                  value={selectedDelegue}
                  onChange={(_, value) => setSelectedDelegue(value)}
                  getOptionLabel={(o) => `${o.first_name} ${o.last_name} (${o.email})`}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  renderInput={(params) => (
                    <TextField {...params} label="Delegue" error={!!errors.delegue} helperText={errors.delegue} />
                  )}
                />
              </Grid>

              {/* UE */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete
                  options={ues}
                  value={selectedUe}
                  onChange={(_, value) => { setSelectedUe(value); setSelectedEnseignant(null); }}
                  getOptionLabel={(o) => {
                    const nivs = o.niveaux_details || [];
                    const cl = nivs.map((n) => `${n.filiere_nom || ''} ${n.nom_niveau}`.trim()).join(', ');
                    return `${o.code_ue} - ${o.libelle_ue}${cl ? ` (${cl})` : ''}`;
                  }}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  renderInput={(params) => (
                    <TextField {...params} label="Unite d'enseignement" error={!!errors.ue} helperText={errors.ue} />
                  )}
                />
              </Grid>

              {/* Enseignant */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete
                  options={enseignants}
                  value={selectedEnseignant}
                  onChange={(_, value) => setSelectedEnseignant(value)}
                  getOptionLabel={(o) => typeof o === 'object' ? `${o.first_name || ''} ${o.last_name || ''}`.trim() : String(o)}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  disabled={!selectedUe}
                  renderInput={(params) => (
                    <TextField {...params} label="Enseignant" error={!!errors.enseignant} helperText={errors.enseignant || (!selectedUe ? "Selectionnez d'abord une UE" : '')} />
                  )}
                />
              </Grid>

              {/* Date - PAS de restriction min */}
              <Grid size={{ xs: 12, md: 6 }}>
                <DatePicker
                  label="Date du cours"
                  value={dateCours}
                  onChange={(v) => setDateCours(v)}
                  slotProps={{
                    textField: { fullWidth: true, error: !!errors.dateCours, helperText: errors.dateCours },
                  }}
                />
              </Grid>

              {/* Heures */}
              <Grid size={{ xs: 12, md: 3 }}>
                <TimePicker label="Heure de debut" value={heureDebut} onChange={(v) => setHeureDebut(v)} ampm={false}
                  slotProps={{ textField: { fullWidth: true, error: !!errors.heureDebut, helperText: errors.heureDebut } }} />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TimePicker label="Heure de fin" value={heureFin} onChange={(v) => setHeureFin(v)} ampm={false}
                  slotProps={{ textField: { fullWidth: true, error: !!errors.heureFin, helperText: errors.heureFin } }} />
              </Grid>

              {/* Salle */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete
                  options={salles}
                  value={selectedSalle}
                  onChange={(_, v) => setSelectedSalle(v)}
                  getOptionLabel={(o) => `${o.nom_salle}${o.batiment ? ` (${o.batiment})` : ''}`}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  renderInput={(params) => <TextField {...params} label="Salle" placeholder="Optionnel" />}
                />
              </Grid>

              {/* Type seance */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#7E7E7E' }}>Type de seance</Typography>
                  <ToggleButtonGroup value={typeSeance} exclusive onChange={(_, v) => { if (v) setTypeSeance(v); }} fullWidth>
                    <ToggleButton value="CM" sx={{ fontWeight: 600, '&.Mui-selected': { bgcolor: '#001EA614', color: '#001EA6' } }}>CM</ToggleButton>
                    <ToggleButton value="TD" sx={{ fontWeight: 600, '&.Mui-selected': { bgcolor: '#3B82F614', color: '#3B82F6' } }}>TD</ToggleButton>
                    <ToggleButton value="TP" sx={{ fontWeight: 600, '&.Mui-selected': { bgcolor: '#F7B01614', color: '#F7B016' } }}>TP</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              </Grid>

              {/* Titre + Contenu */}
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="Titre du chapitre" value={titreChapitre}
                  onChange={(e) => setTitreChapitre(e.target.value)} error={!!errors.titreChapitre} helperText={errors.titreChapitre} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth multiline rows={4} label="Contenu aborde" value={contenuAborde}
                  onChange={(e) => setContenuAborde(e.target.value)} error={!!errors.contenuAborde} helperText={errors.contenuAborde} />
              </Grid>

              {/* Conflicts */}
              {conflicts.length > 0 && (
                <Grid size={{ xs: 12 }}>
                  <Alert severity="warning">
                    <AlertTitle>Conflits detectes</AlertTitle>
                    {conflicts.map((c, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        {c.type === 'salle' ? <MeetingRoom fontSize="small" /> : <Person fontSize="small" />}
                        <Typography variant="body2">{c.message}</Typography>
                      </Box>
                    ))}
                  </Alert>
                </Grid>
              )}

              {/* Actions */}
              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button variant="outlined" onClick={() => navigate('/chef/fiches')} disabled={submitting}>Annuler</Button>
                  <Button variant="contained" startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    onClick={handleSubmit} disabled={submitting}>
                    Creer la fiche
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </LocalizationProvider>
  );
}
