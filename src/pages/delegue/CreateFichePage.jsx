import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Autocomplete,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
  IconButton,
  Skeleton,
  CircularProgress,
} from '@mui/material';
import { ArrowBack, Save as SaveIcon } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import PageHeader from '../../components/common/PageHeader';
import { fichesSuiviService, unitesEnseignementService } from '../../api/services';
import toast from 'react-hot-toast';

dayjs.locale('fr');

export default function CreateFichePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [ues, setUes] = useState([]);
  const [loadingUes, setLoadingUes] = useState(true);
  const [loadingFiche, setLoadingFiche] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  const [selectedUe, setSelectedUe] = useState(null);
  const [selectedEnseignant, setSelectedEnseignant] = useState(null);
  const [dateCours, setDateCours] = useState(null);
  const [heureDebut, setHeureDebut] = useState(null);
  const [heureFin, setHeureFin] = useState(null);
  const [salle, setSalle] = useState('');
  const [typeSeance, setTypeSeance] = useState('CM');
  const [titreChapitre, setTitreChapitre] = useState('');
  const [contenuAborde, setContenuAborde] = useState('');

  const [errors, setErrors] = useState({});

  // Get enseignants from selected UE
  const enseignants = selectedUe?.enseignants_details || selectedUe?.enseignants || [];

  // Load UEs
  useEffect(() => {
    const load = async () => {
      try {
        const res = await unitesEnseignementService.getAll();
        setUes(res.data);
      } catch {
        toast.error('Erreur chargement des UEs');
      } finally {
        setLoadingUes(false);
      }
    };
    load();
  }, []);

  // Load fiche in edit mode
  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      try {
        const res = await fichesSuiviService.getById(id);
        const fiche = res.data;
        setDateCours(fiche.date_cours ? dayjs(fiche.date_cours) : null);
        setHeureDebut(fiche.heure_debut ? dayjs(`2000-01-01T${fiche.heure_debut}`) : null);
        setHeureFin(fiche.heure_fin ? dayjs(`2000-01-01T${fiche.heure_fin}`) : null);
        setSalle(fiche.salle || '');
        setTypeSeance(fiche.type_seance || 'CM');
        setTitreChapitre(fiche.titre_chapitre || '');
        setContenuAborde(fiche.contenu_aborde || '');

        // Set UE and enseignant once UEs are loaded
        const waitForUes = setInterval(() => {
          setUes((currentUes) => {
            if (currentUes.length > 0) {
              clearInterval(waitForUes);
              const ueId = fiche.ue?.id || fiche.ue;
              const matchedUe = currentUes.find((u) => u.id === ueId);
              if (matchedUe) {
                setSelectedUe(matchedUe);
                const enseignantId = fiche.enseignant?.id || fiche.enseignant;
                const matchedEnseignant = (matchedUe.enseignants_details || matchedUe.enseignants || [])
                  .find((e) => e.id === enseignantId);
                if (matchedEnseignant) {
                  setSelectedEnseignant(matchedEnseignant);
                }
              }
            }
            return currentUes;
          });
        }, 100);

        // Cleanup interval after 5 seconds
        setTimeout(() => clearInterval(waitForUes), 5000);
      } catch {
        toast.error('Fiche introuvable');
        navigate('/delegue/fiches');
      } finally {
        setLoadingFiche(false);
      }
    };
    load();
  }, [id, isEdit]);

  const validate = () => {
    const newErrors = {};

    if (!selectedUe) newErrors.ue = 'Veuillez selectionner une UE';
    if (!selectedEnseignant) newErrors.enseignant = 'Veuillez selectionner un enseignant';
    if (!dateCours) {
      newErrors.dateCours = 'Veuillez selectionner une date';
    } else {
      const maxDate = dayjs().add(7, 'day');
      if (dateCours.isAfter(maxDate, 'day')) {
        newErrors.dateCours = 'La date ne peut pas depasser 7 jours dans le futur';
      }
    }
    if (!heureDebut) newErrors.heureDebut = 'Veuillez selectionner l\'heure de debut';
    if (!heureFin) newErrors.heureFin = 'Veuillez selectionner l\'heure de fin';
    if (heureDebut && heureFin && heureFin.isBefore(heureDebut)) {
      newErrors.heureFin = 'L\'heure de fin doit etre apres l\'heure de debut';
    }
    if (!typeSeance) newErrors.typeSeance = 'Veuillez selectionner un type de seance';
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
        date_cours: dateCours.format('YYYY-MM-DD'),
        heure_debut: heureDebut.format('HH:mm'),
        heure_fin: heureFin.format('HH:mm'),
        salle: salle.trim() || null,
        type_seance: typeSeance,
        titre_chapitre: titreChapitre.trim(),
        contenu_aborde: contenuAborde.trim(),
      };

      if (isEdit) {
        await fichesSuiviService.update(id, data);
        await fichesSuiviService.resoumettre(id);
        toast.success('Fiche resoumise avec succes');
        navigate(`/delegue/fiches/${id}`);
      } else {
        await fichesSuiviService.create(data);
        toast.success('Fiche creee avec succes');
        navigate('/delegue/fiches');
      }
    } catch (err) {
      const detail = err.response?.data;
      if (detail && typeof detail === 'object') {
        const messages = Object.values(detail).flat().join(', ');
        toast.error(messages || 'Erreur lors de la sauvegarde');
      } else {
        toast.error('Erreur lors de la sauvegarde');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingFiche || loadingUes) {
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
          <IconButton onClick={() => navigate(isEdit ? `/delegue/fiches/${id}` : '/delegue/fiches')}>
            <ArrowBack />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {isEdit ? 'Modifier et resoumettre' : 'Nouvelle fiche de suivi'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#7E7E7E' }}>
              {isEdit ? 'Corrigez les informations puis resoumettez' : 'Remplissez les informations du cours'}
            </Typography>
          </Box>
        </Box>

        <Card>
          <CardContent sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* UE */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete
                  options={ues}
                  value={selectedUe}
                  onChange={(_, value) => {
                    setSelectedUe(value);
                    setSelectedEnseignant(null);
                  }}
                  getOptionLabel={(option) => `${option.code_ue} - ${option.libelle_ue}`}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Unite d'enseignement"
                      error={!!errors.ue}
                      helperText={errors.ue}
                    />
                  )}
                />
              </Grid>

              {/* Enseignant */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete
                  options={enseignants}
                  value={selectedEnseignant}
                  onChange={(_, value) => setSelectedEnseignant(value)}
                  getOptionLabel={(option) => {
                    if (typeof option === 'object' && option !== null) {
                      return `${option.first_name || ''} ${option.last_name || ''}`.trim() || `Enseignant #${option.id}`;
                    }
                    return String(option);
                  }}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  disabled={!selectedUe}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Enseignant"
                      error={!!errors.enseignant}
                      helperText={errors.enseignant || (!selectedUe ? 'Selectionnez d\'abord une UE' : '')}
                    />
                  )}
                />
              </Grid>

              {/* Date */}
              <Grid size={{ xs: 12, md: 4 }}>
                <DatePicker
                  label="Date du cours"
                  value={dateCours}
                  onChange={(value) => setDateCours(value)}
                  maxDate={dayjs().add(7, 'day')}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.dateCours,
                      helperText: errors.dateCours,
                    },
                  }}
                />
              </Grid>

              {/* Heure debut */}
              <Grid size={{ xs: 12, md: 4 }}>
                <TimePicker
                  label="Heure de debut"
                  value={heureDebut}
                  onChange={(value) => setHeureDebut(value)}
                  ampm={false}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.heureDebut,
                      helperText: errors.heureDebut,
                    },
                  }}
                />
              </Grid>

              {/* Heure fin */}
              <Grid size={{ xs: 12, md: 4 }}>
                <TimePicker
                  label="Heure de fin"
                  value={heureFin}
                  onChange={(value) => setHeureFin(value)}
                  ampm={false}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.heureFin,
                      helperText: errors.heureFin,
                    },
                  }}
                />
              </Grid>

              {/* Salle */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Salle"
                  value={salle}
                  onChange={(e) => setSalle(e.target.value)}
                  placeholder="Ex: Amphi A, Salle 201..."
                />
              </Grid>

              {/* Type seance */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: errors.typeSeance ? '#EF4444' : '#7E7E7E' }}>
                    Type de seance
                  </Typography>
                  <ToggleButtonGroup
                    value={typeSeance}
                    exclusive
                    onChange={(_, value) => { if (value) setTypeSeance(value); }}
                    fullWidth
                  >
                    <ToggleButton value="CM" sx={{ fontWeight: 600, '&.Mui-selected': { bgcolor: '#001EA614', color: '#001EA6' } }}>
                      CM
                    </ToggleButton>
                    <ToggleButton value="TD" sx={{ fontWeight: 600, '&.Mui-selected': { bgcolor: '#3B82F614', color: '#3B82F6' } }}>
                      TD
                    </ToggleButton>
                    <ToggleButton value="TP" sx={{ fontWeight: 600, '&.Mui-selected': { bgcolor: '#F7B01614', color: '#F7B016' } }}>
                      TP
                    </ToggleButton>
                  </ToggleButtonGroup>
                  {errors.typeSeance && (
                    <Typography variant="caption" sx={{ color: '#EF4444', mt: 0.5 }}>{errors.typeSeance}</Typography>
                  )}
                </Box>
              </Grid>

              {/* Titre chapitre */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Titre du chapitre"
                  value={titreChapitre}
                  onChange={(e) => setTitreChapitre(e.target.value)}
                  error={!!errors.titreChapitre}
                  helperText={errors.titreChapitre}
                  placeholder="Ex: Introduction aux structures de donnees"
                />
              </Grid>

              {/* Contenu aborde */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Contenu aborde"
                  value={contenuAborde}
                  onChange={(e) => setContenuAborde(e.target.value)}
                  error={!!errors.contenuAborde}
                  helperText={errors.contenuAborde}
                  placeholder="Decrivez le contenu aborde pendant le cours..."
                />
              </Grid>

              {/* Submit */}
              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate(isEdit ? `/delegue/fiches/${id}` : '/delegue/fiches')}
                    disabled={submitting}
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {isEdit ? 'Resoumettre' : 'Soumettre la fiche'}
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
