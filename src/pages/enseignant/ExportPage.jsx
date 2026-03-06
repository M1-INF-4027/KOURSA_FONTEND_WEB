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

function downloadBlob(res, fallbackName) {
  const disposition = res.headers?.['content-disposition'] || '';
  const match = disposition.match(/filename="?(.+?)"?$/);
  const filename = match ? match[1] : fallbackName;
  const blob = new Blob([res.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

export default function EnseignantExportPage() {
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [selectedSemestre, setSelectedSemestre] = useState('');
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const filters = {
        dateDebut,
        dateFin,
        semestre: selectedSemestre,
      };
      const res = await dashboardService.exportMonRapport(filters);
      downloadBlob(res, 'mon_rapport.xlsx');
      toast.success('Rapport telecharge');
    } catch (err) {
      const status = err.response?.status;
      if (status === 404) {
        toast.error('Aucune fiche validee trouvee pour les filtres selectionnes');
      } else {
        toast.error('Erreur lors du telechargement');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setDateDebut('');
    setDateFin('');
    setSelectedSemestre('');
  };

  return (
    <Box className="fade-in">
      <PageHeader
        title="Mon rapport"
        description="Telechargez le bilan de vos heures de cours validees en format Excel"
      />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#7E7E7E' }}>
            Filtres
          </Typography>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                select
                fullWidth
                label="Semestre"
                value={selectedSemestre}
                onChange={(e) => setSelectedSemestre(e.target.value)}
                size="small"
              >
                <MenuItem value="">Tous les semestres</MenuItem>
                <MenuItem value="1">Semestre 1</MenuItem>
                <MenuItem value="2">Semestre 2</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                type="date"
                label="Date debut"
                fullWidth
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                type="date"
                label="Date fin"
                fullWidth
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 2 }}>
              <Button
                variant="outlined"
                fullWidth
                sx={{ height: 40 }}
                onClick={handleReset}
              >
                Reinitialiser
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 5 }}>
          <FileDownload sx={{ fontSize: 48, color: '#001EA6', mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            Exporter mon rapport
          </Typography>
          <Typography variant="body2" sx={{ color: '#7E7E7E', mb: 3, textAlign: 'center', maxWidth: 400 }}>
            Generez un fichier Excel contenant toutes vos fiches de cours validees, avec les dates, horaires, UEs et contenus abordes.
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : <FileDownload />}
            onClick={handleExport}
            disabled={loading}
            sx={{ px: 4 }}
          >
            {loading ? 'Telechargement...' : 'Telecharger mon rapport'}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
