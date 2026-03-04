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
import { configurationService } from '../../api/services';
import { useConfig } from '../../contexts/ConfigContext';
import StepAnnee from './setup/StepAnnee';
import StepStructure from './setup/StepStructure';
import StepProgrammes from './setup/StepProgrammes';
import StepSalles from './setup/StepSalles';
import StepUEs from './setup/StepUEs';
import StepChefs from './setup/StepChefs';

const steps = [
  'Annee academique',
  'Structure academique',
  'Programmes',
  'Salles',
  "Unites d'enseignement",
  'Chefs de departement',
];

export default function SetupWizardPage() {
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
        const { annee, checklist, est_configuree } = res.data;

        if (annee && !est_configuree) {
          setAnneeId(annee.id);

          if (checklist.ues_creees) {
            setActiveStep(5);
          } else if (checklist.salles_creees) {
            setActiveStep(4);
          } else if (checklist.filieres_creees && checklist.niveaux_crees) {
            setActiveStep(3);
          } else if (checklist.facultes_creees && checklist.departements_crees) {
            setActiveStep(2);
          } else if (checklist.annee_creee) {
            setActiveStep(1);
          }
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
    switch (activeStep) {
      case 0:
        return <StepAnnee onNext={handleStepAnneeNext} />;
      case 1:
        return <StepStructure onNext={handleNext} onBack={handleBack} />;
      case 2:
        return <StepProgrammes onNext={handleNext} onBack={handleBack} />;
      case 3:
        return <StepSalles onNext={handleNext} onBack={handleBack} />;
      case 4:
        return <StepUEs onNext={handleNext} onBack={handleBack} anneeId={anneeId} />;
      case 5:
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
            <Step key={label} completed={index < activeStep}>
              <StepLabel
                sx={{
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
