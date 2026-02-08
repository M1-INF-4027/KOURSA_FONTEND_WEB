import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Typography,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { FileDownload } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import { dashboardService } from '../../api/services';
import toast from 'react-hot-toast';

const months = [
  { value: 1, label: 'Janvier' },
  { value: 2, label: 'Fevrier' },
  { value: 3, label: 'Mars' },
  { value: 4, label: 'Avril' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' },
  { value: 8, label: 'Aout' },
  { value: 9, label: 'Septembre' },
  { value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' },
  { value: 12, label: 'Decembre' },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

export default function ExportPage() {
  const [mois, setMois] = useState(new Date().getMonth() + 1);
  const [annee, setAnnee] = useState(currentYear);
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await dashboardService.exportHeures(annee, mois);
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `heures_${annee}_${String(mois).padStart(2, '0')}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Export telecharge avec succes');
    } catch {
      toast.error('Erreur lors de l\'export');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="fade-in">
      <PageHeader title="Export des heures" description="Telechargez le recapitulatif des heures en format Excel" />

      <Card sx={{ maxWidth: 600 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Parametres d'export
          </Typography>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="Mois"
                value={mois}
                onChange={(e) => setMois(e.target.value)}
              >
                {months.map((m) => (
                  <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="Annee"
                value={annee}
                onChange={(e) => setAnnee(e.target.value)}
              >
                {years.map((y) => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : <FileDownload />}
            onClick={handleExport}
            disabled={loading}
            fullWidth
            sx={{ mt: 4, py: 1.5 }}
          >
            {loading ? 'Export en cours...' : 'Telecharger le fichier Excel'}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
