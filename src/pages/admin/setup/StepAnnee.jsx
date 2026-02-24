import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Grid,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import toast from 'react-hot-toast';
import { configurationService } from '../../../api/services';

dayjs.locale('fr');

export default function StepAnnee({ onNext }) {
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
        toast.error('Erreur lors de la creation de l\'annee academique');
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
          Renseignez le libelle et les dates des deux semestres pour cette annee academique.
        </Typography>

        <TextField
          label="Libelle de l'annee"
          placeholder="Ex: 2025-2026"
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
            sx={{ minWidth: 160 }}
          >
            {saving ? <CircularProgress size={22} color="inherit" /> : 'Suivant'}
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  );
}
