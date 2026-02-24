import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  Autocomplete,
  CircularProgress,
  Chip,
  Alert,
  Grid,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { configurationService, departementsService, usersService } from '../../api/services';
import { useConfig } from '../../contexts/ConfigContext';
import PageHeader from '../../components/common/PageHeader';

dayjs.locale('fr');

const steps = ['Annee academique', 'Reconduction', 'Chefs de departement'];

// ---------------------------------------------------------------------------
// Step 1 -- Annee academique
// ---------------------------------------------------------------------------
function StepAnneeAcademique({ onNext }) {
  const [form, setForm] = useState({
    libelle: '',
    s1_date_debut: null,
    s1_date_fin: null,
    s2_date_debut: null,
    s2_date_fin: null,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const newErrors = {};

    if (!form.libelle.trim()) {
      newErrors.libelle = 'Le libelle est requis';
    }
    if (!form.s1_date_debut) {
      newErrors.s1_date_debut = 'La date de debut du S1 est requise';
    }
    if (!form.s1_date_fin) {
      newErrors.s1_date_fin = 'La date de fin du S1 est requise';
    }
    if (!form.s2_date_debut) {
      newErrors.s2_date_debut = 'La date de debut du S2 est requise';
    }
    if (!form.s2_date_fin) {
      newErrors.s2_date_fin = 'La date de fin du S2 est requise';
    }

    if (form.s1_date_debut && form.s1_date_fin) {
      if (!dayjs(form.s1_date_fin).isAfter(dayjs(form.s1_date_debut))) {
        newErrors.s1_date_fin = 'La fin du S1 doit etre apres le debut du S1';
      }
    }
    if (form.s1_date_fin && form.s2_date_debut) {
      if (!dayjs(form.s2_date_debut).isAfter(dayjs(form.s1_date_fin))) {
        newErrors.s2_date_debut = 'Le debut du S2 doit etre apres la fin du S1';
      }
    }
    if (form.s2_date_debut && form.s2_date_fin) {
      if (!dayjs(form.s2_date_fin).isAfter(dayjs(form.s2_date_debut))) {
        newErrors.s2_date_fin = 'La fin du S2 doit etre apres le debut du S2';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        libelle: form.libelle.trim(),
        s1_date_debut: dayjs(form.s1_date_debut).format('YYYY-MM-DD'),
        s1_date_fin: dayjs(form.s1_date_fin).format('YYYY-MM-DD'),
        s2_date_debut: dayjs(form.s2_date_debut).format('YYYY-MM-DD'),
        s2_date_fin: dayjs(form.s2_date_fin).format('YYYY-MM-DD'),
      };

      const res = await configurationService.createAnnee(payload);
      toast.success('Annee academique creee avec succes');
      onNext(res.data.id);
    } catch (err) {
      const detail = err.response?.data;
      if (detail && typeof detail === 'object') {
        const messages = Object.values(detail).flat().join(', ');
        toast.error(messages || 'Erreur lors de la creation');
      } else {
        toast.error("Erreur lors de la creation de l'annee academique");
      }
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
      <Box>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Definir l'annee academique
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Renseignez le libelle et les dates des deux semestres pour la nouvelle annee academique.
        </Typography>

        <TextField
          label="Libelle de l'annee"
          placeholder="Ex: 2026-2027"
          fullWidth
          value={form.libelle}
          onChange={(e) => updateField('libelle', e.target.value)}
          error={!!errors.libelle}
          helperText={errors.libelle}
          sx={{ mb: 3 }}
        />

        <Typography variant="subtitle1" sx={{ mb: 2, color: '#001EA6' }}>
          Semestre 1
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DatePicker
              label="Date de debut S1"
              value={form.s1_date_debut}
              onChange={(val) => updateField('s1_date_debut', val)}
              format="DD/MM/YYYY"
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.s1_date_debut,
                  helperText: errors.s1_date_debut,
                },
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DatePicker
              label="Date de fin S1"
              value={form.s1_date_fin}
              onChange={(val) => updateField('s1_date_fin', val)}
              format="DD/MM/YYYY"
              minDate={form.s1_date_debut ? dayjs(form.s1_date_debut).add(1, 'day') : undefined}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.s1_date_fin,
                  helperText: errors.s1_date_fin,
                },
              }}
            />
          </Grid>
        </Grid>

        <Typography variant="subtitle1" sx={{ mb: 2, color: '#001EA6' }}>
          Semestre 2
        </Typography>
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DatePicker
              label="Date de debut S2"
              value={form.s2_date_debut}
              onChange={(val) => updateField('s2_date_debut', val)}
              format="DD/MM/YYYY"
              minDate={form.s1_date_fin ? dayjs(form.s1_date_fin).add(1, 'day') : undefined}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.s2_date_debut,
                  helperText: errors.s2_date_debut,
                },
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DatePicker
              label="Date de fin S2"
              value={form.s2_date_fin}
              onChange={(val) => updateField('s2_date_fin', val)}
              format="DD/MM/YYYY"
              minDate={form.s2_date_debut ? dayjs(form.s2_date_debut).add(1, 'day') : undefined}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.s2_date_fin,
                  helperText: errors.s2_date_fin,
                },
              }}
            />
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving}
            sx={{ minWidth: 160, bgcolor: '#001EA6', '&:hover': { bgcolor: '#001080' } }}
          >
            {saving ? <CircularProgress size={22} color="inherit" /> : 'Suivant'}
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  );
}

// ---------------------------------------------------------------------------
// Step 2 -- Reconduction
// ---------------------------------------------------------------------------
function StepReconduction({ anneeId, onNext, onBack }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  const handleReconduire = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await configurationService.reconduire(anneeId);
      setSummary(res.data);
      setDone(true);
      toast.success('Reconduction effectuee avec succes');
    } catch (err) {
      const detail = err.response?.data;
      if (detail && typeof detail === 'object') {
        const messages = Object.values(detail).flat().join(', ');
        setError(messages || 'Erreur lors de la reconduction');
      } else {
        setError('Erreur lors de la reconduction');
      }
      toast.error('Erreur lors de la reconduction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Reconduction des donnees
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Vous pouvez reconduire la structure academique (facultes, departements, filieres, niveaux,
        UEs) depuis l'annee precedente. Cette etape est facultative.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!done && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 3 }}>
          <Button
            variant="contained"
            onClick={handleReconduire}
            disabled={loading}
            sx={{
              minWidth: 300,
              bgcolor: '#001EA6',
              '&:hover': { bgcolor: '#001080' },
            }}
          >
            {loading ? (
              <CircularProgress size={22} color="inherit" />
            ) : (
              "Reconduire depuis l'annee precedente"
            )}
          </Button>
          <Typography variant="caption" color="text.secondary">
            Les programmes, UEs et assignations seront copies vers la nouvelle annee.
          </Typography>
        </Box>
      )}

      {done && summary && (
        <Box sx={{ mb: 3 }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            La reconduction a ete effectuee avec succes.
          </Alert>
          <Card variant="outlined" sx={{ bgcolor: '#F5F7FA' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 1.5, color: '#001EA6', fontWeight: 700 }}>
                Resume de la reconduction
              </Typography>
              {typeof summary === 'object' && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {Object.entries(summary).map(([key, value]) => (
                    <Chip
                      key={key}
                      label={`${key.replace(/_/g, ' ')}: ${value}`}
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Box>
              )}
              {typeof summary === 'string' && (
                <Typography variant="body2">{summary}</Typography>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button variant="outlined" onClick={onBack}>
          Precedent
        </Button>
        <Button
          variant="contained"
          onClick={onNext}
          sx={{ minWidth: 160, bgcolor: '#001EA6', '&:hover': { bgcolor: '#001080' } }}
        >
          {done ? 'Suivant' : 'Passer cette etape'}
        </Button>
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Step 3 -- Chefs de departement
// ---------------------------------------------------------------------------
function StepChefsDepartement({ onComplete, onBack }) {
  const [departements, setDepartements] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingDep, setSavingDep] = useState({});

  const load = async () => {
    try {
      const [depRes, usrRes] = await Promise.all([
        departementsService.getAll(),
        usersService.getAll(),
      ]);
      setDepartements(depRes.data);

      const enseignantsList = usrRes.data.filter((u) =>
        u.roles?.some((r) => (r.nom_role || r) === 'Enseignant')
      );
      setEnseignants(enseignantsList);

      const initialAssignments = {};
      depRes.data.forEach((dep) => {
        if (dep.chef_departement) {
          const chef = enseignantsList.find((e) => e.id === dep.chef_departement);
          if (chef) {
            initialAssignments[dep.id] = chef;
          }
        }
      });
      setAssignments(initialAssignments);
    } catch {
      toast.error('Erreur lors du chargement des donnees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAssign = async (depId, enseignant) => {
    const previous = assignments[depId];

    setAssignments((prev) => {
      const next = { ...prev };
      if (enseignant) {
        next[depId] = enseignant;
      } else {
        delete next[depId];
      }
      return next;
    });

    setSavingDep((prev) => ({ ...prev, [depId]: true }));
    try {
      await departementsService.update(depId, {
        chef_departement: enseignant ? enseignant.id : null,
      });
      toast.success(
        enseignant
          ? `${enseignant.first_name} ${enseignant.last_name} assigne comme chef`
          : 'Chef de departement retire'
      );
    } catch {
      setAssignments((prev) => {
        const next = { ...prev };
        if (previous) {
          next[depId] = previous;
        } else {
          delete next[depId];
        }
        return next;
      });
      toast.error("Erreur lors de l'assignation");
    } finally {
      setSavingDep((prev) => ({ ...prev, [depId]: false }));
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      await onComplete();
    } catch {
      // onComplete handles its own errors
    } finally {
      setSaving(false);
    }
  };

  const assignedCount = Object.keys(assignments).length;
  const totalDeps = departements.length;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Chefs de departement
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Reassignez ou confirmez le chef de chaque departement pour la nouvelle annee.
      </Typography>
      <Chip
        label={`${assignedCount} / ${totalDeps} departement(s) assigne(s)`}
        color={assignedCount === totalDeps ? 'success' : 'default'}
        variant="outlined"
        sx={{ mb: 3 }}
      />

      {departements.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Aucun departement trouve.
        </Alert>
      )}

      {departements.map((dep) => {
        const currentChef = assignments[dep.id] || null;
        const isSaving = savingDep[dep.id] || false;

        const availableEnseignants = enseignants.filter((e) => {
          const assignedTo = Object.entries(assignments).find(
            ([dId, chef]) => chef.id === e.id && Number(dId) !== dep.id
          );
          return !assignedTo;
        });

        return (
          <Card key={dep.id} sx={{ mb: 1.5 }}>
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {dep.nom_departement}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {dep.nom_faculte || 'Faculte'}
                  </Typography>
                </Box>
                {currentChef && (
                  <Chip
                    label="Assigne"
                    size="small"
                    color="success"
                    variant="outlined"
                    sx={{ ml: 'auto' }}
                  />
                )}
              </Box>

              <Autocomplete
                options={availableEnseignants}
                getOptionLabel={(o) =>
                  typeof o === 'object'
                    ? `${o.first_name} ${o.last_name} (${o.email})`
                    : String(o)
                }
                value={currentChef}
                onChange={(_, val) => handleAssign(dep.id, val)}
                isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
                loading={isSaving}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Chef de departement"
                    size="small"
                    slotProps={{
                      input: {
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {isSaving ? <CircularProgress size={18} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      },
                    }}
                  />
                )}
                noOptionsText="Aucun enseignant disponible"
              />
            </CardContent>
          </Card>
        );
      })}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button variant="outlined" onClick={onBack}>
          Precedent
        </Button>
        <Button
          variant="contained"
          onClick={handleComplete}
          disabled={saving}
          sx={{
            minWidth: 220,
            bgcolor: '#10B981',
            '&:hover': { bgcolor: '#059669' },
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
          }}
        >
          {saving ? <CircularProgress size={22} color="inherit" /> : 'Terminer et activer'}
        </Button>
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function NewYearWizardPage() {
  const navigate = useNavigate();
  const { refresh } = useConfig();
  const [activeStep, setActiveStep] = useState(0);
  const [anneeId, setAnneeId] = useState(null);
  const [finishing, setFinishing] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Detecter une configuration en cours pour permettre la reprise
  useEffect(() => {
    const detectProgress = async () => {
      try {
        const res = await configurationService.getChecklist();
        const { annee, est_configuree } = res.data;

        if (annee && !est_configuree) {
          setAnneeId(annee.id);
          // L'annee existe deja, aller a la reconduction
          setActiveStep(1);
        }
      } catch {
        // Pas de checklist → demarrer normalement
      } finally {
        setInitializing(false);
      }
    };
    detectProgress();
  }, []);

  const handleStepAnneeNext = (id) => {
    setAnneeId(id);
    setActiveStep(1);
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setActiveStep((prev) => Math.min(steps.length - 1, prev + 1));
  };

  const handleComplete = async () => {
    if (!anneeId) {
      toast.error('Erreur: annee academique non trouvee');
      return;
    }

    setFinishing(true);
    try {
      await configurationService.activerAnnee(anneeId);
      await configurationService.markConfigured(anneeId);
      await refresh();
      toast.success('Nouvelle annee academique activee avec succes');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const detail = err.response?.data;
      if (detail && typeof detail === 'object') {
        const messages = Object.values(detail).flat().join(', ');
        toast.error(messages || "Erreur lors de l'activation");
      } else {
        toast.error("Erreur lors de l'activation de l'annee academique");
      }
      setFinishing(false);
    }
  };

  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return <StepAnneeAcademique onNext={handleStepAnneeNext} />;
      case 1:
        return <StepReconduction anneeId={anneeId} onNext={handleNext} onBack={handleBack} />;
      case 2:
        return <StepChefsDepartement onComplete={handleComplete} onBack={handleBack} />;
      default:
        return null;
    }
  };

  if (initializing) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 2,
          py: 12,
        }}
      >
        <CircularProgress size={48} sx={{ color: '#001EA6' }} />
        <Typography variant="h6" color="text.secondary">
          Chargement...
        </Typography>
      </Box>
    );
  }

  if (finishing) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 2,
          py: 12,
        }}
      >
        <CircularProgress size={48} sx={{ color: '#001EA6' }} />
        <Typography variant="h6" color="text.secondary">
          Activation de l'annee academique...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Nouvelle annee academique"
        description="Creez et configurez une nouvelle annee academique en quelques etapes."
      />

      {/* Stepper */}
      <Box sx={{ maxWidth: 700, mx: 'auto', mb: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label, index) => (
            <Step key={label} completed={index < activeStep}>
              <StepLabel
                sx={{
                  '& .MuiStepLabel-label': {
                    fontSize: '0.85rem',
                    fontWeight: index === activeStep ? 700 : 400,
                  },
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Step content */}
      <Card sx={{ maxWidth: 700, mx: 'auto' }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          {renderStep()}
        </CardContent>
      </Card>

      {/* Step indicator */}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', textAlign: 'center', mt: 2 }}
      >
        Etape {activeStep + 1} sur {steps.length}
      </Typography>
    </Box>
  );
}
