import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { configurationService, unitesEnseignementService } from '../../api/services';
import { useConfig } from '../../contexts/ConfigContext';
import StepAnnee from './setup/StepAnnee';
import StepReconduction from './setup/StepReconduction';
import StepStructure from './setup/StepStructure';
import StepProgrammes from './setup/StepProgrammes';
import StepSalles from './setup/StepSalles';
import StepEnseignants from './setup/StepEnseignants';
import StepUEs from './setup/StepUEs';
import StepChefs from './setup/StepChefs';

// Parcours unique de configuration, qui s'adapte a l'existant.
//
// L'ordre suit les dependances : les comptes enseignants doivent exister avant
// l'import des UEs, sans quoi les affectations ne peuvent pas etre resolues.
// Chaque etape porte la cle de checklist qui atteste, cote serveur, que les
// donnees existent vraiment : le fil d'etapes reflete la base, et non la simple
// progression de l'utilisateur.
//
// L'etape « Reconduction » n'apparait que si une annee precedente contient des
// UEs a reprendre : proposer de reconduire un programme inexistant n'aurait
// aucun sens sur une plateforme neuve.
const ETAPES = [
  { cle: 'annee', label: 'Annee academique', checklist: 'annee_creee' },
  { cle: 'reconduction', label: 'Reconduction', checklist: null, optionnelle: true },
  { cle: 'structure', label: 'Structure academique', checklist: 'departements_crees' },
  { cle: 'programmes', label: 'Programmes', checklist: 'niveaux_crees' },
  { cle: 'salles', label: 'Salles', checklist: 'salles_creees' },
  { cle: 'enseignants', label: 'Enseignants', checklist: 'enseignants_crees' },
  { cle: 'ues', label: "Unites d'enseignement", checklist: 'ues_creees' },
  { cle: 'chefs', label: 'Chefs de departement', checklist: null },
];

export default function SetupWizardPage() {
  const navigate = useNavigate();
  const { refresh } = useConfig();
  const [activeStep, setActiveStep] = useState(0);
  const [checklist, setChecklist] = useState({});
  const [reconductionPossible, setReconductionPossible] = useState(false);
  const [anneeId, setAnneeId] = useState(null);
  const [finishing, setFinishing] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Detecter une configuration en cours pour permettre la reprise
  useEffect(() => {
    const detectProgress = async () => {
      try {
        const res = await configurationService.getChecklist();
        const { annee, checklist, est_configuree } = res.data;
        setChecklist(checklist || {});

        // La reconduction n'a de sens que s'il existe un programme anterieur.
        try {
          const ues = await unitesEnseignementService.getAll();
          const anterieures = (ues.data || []).filter(
            (u) => !annee || u.annee_academique !== annee.id
          );
          setReconductionPossible(anterieures.length > 0);
        } catch {
          setReconductionPossible(false);
        }

        if (annee && !est_configuree) {
          setAnneeId(annee.id);

          // Reprise a la premiere etape dont la checklist n'est pas satisfaite.
          const visibles = ETAPES.filter((e) => !e.optionnelle);
          const premiere = visibles.findIndex(
            (e) => e.checklist && !checklist[e.checklist]
          );
          setActiveStep(premiere === -1 ? visibles.length - 1 : premiere);
        }
      } catch {
        // Pas de checklist → demarrer normalement
      } finally {
        setInitializing(false);
      }
    };
    detectProgress();
  }, []);

  // Les etapes optionnelles non pertinentes sont retirees du parcours.
  const etapes = ETAPES.filter(
    (e) => !e.optionnelle || (e.cle === 'reconduction' && reconductionPossible)
  );
  const steps = etapes.map((e) => e.label);

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
      await configurationService.markConfigured(anneeId);
      await refresh();
      toast.success('Configuration terminee avec succes !');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const detail = err.response?.data;
      if (detail && typeof detail === 'object') {
        const messages = Object.values(detail).flat().join(', ');
        toast.error(messages || 'Erreur lors de la finalisation');
      } else {
        toast.error('Erreur lors de la finalisation de la configuration');
      }
      setFinishing(false);
    }
  };

  const renderStep = () => {
    const suivant = { onNext: handleNext, onBack: handleBack };
    switch (etapes[activeStep]?.cle) {
      case 'annee':
        return <StepAnnee onNext={handleStepAnneeNext} />;
      case 'reconduction':
        return <StepReconduction anneeId={anneeId} {...suivant} />;
      case 'structure':
        return <StepStructure {...suivant} />;
      case 'programmes':
        return <StepProgrammes {...suivant} />;
      case 'salles':
        return <StepSalles {...suivant} />;
      case 'enseignants':
        return <StepEnseignants {...suivant} />;
      case 'ues':
        return <StepUEs {...suivant} anneeId={anneeId} />;
      case 'chefs':
        return <StepChefs onComplete={handleComplete} onBack={handleBack} />;
      default:
        return null;
    }
  };

  if (initializing) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: '#F5F7FA',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <CircularProgress size={48} />
        <Typography variant="h6" color="text.secondary">
          Chargement de la configuration...
        </Typography>
      </Box>
    );
  }

  if (finishing) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: '#F5F7FA',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <CircularProgress size={48} />
        <Typography variant="h6" color="text.secondary">
          Finalisation de la configuration...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#F5F7FA',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 4,
        px: 2,
      }}
    >
      {/* Header / Logo */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            color: '#001EA6',
            letterSpacing: '-0.02em',
            mb: 0.5,
          }}
        >
          Koursa
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configuration initiale du systeme
        </Typography>
      </Box>

      {/* Stepper */}
      <Box sx={{ width: '100%', maxWidth: 800, mb: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label, index) => (
            <Step
              key={label}
              completed={
                etapes[index].checklist
                  ? !!checklist[etapes[index].checklist]
                  : index < activeStep
              }
            >
              {/* Navigation libre : aucune etape n'est verrouillee, on peut
                  revenir completer ce qui manque a tout moment. */}
              <StepLabel
                onClick={() => setActiveStep(index)}
                sx={{
                  cursor: 'pointer',
                  '& .MuiStepLabel-label': {
                    fontSize: '0.8rem',
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
      <Card
        sx={{
          width: '100%',
          maxWidth: 700,
          minHeight: 300,
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          {renderStep()}
        </CardContent>
      </Card>

      {/* Step indicator */}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
        Etape {activeStep + 1} sur {steps.length}
      </Typography>
    </Box>
  );
}
