import { useState, useEffect } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Divider,
  Chip,
} from '@mui/material';
import {
  FileDownload,
  Assessment,
  MenuBook as UEIcon,
  Person as PersonIcon,
  ListAlt,
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import { dashboardService, unitesEnseignementService, usersService } from '../../api/services';
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

export default function ExportPage() {
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [selectedFiliere, setSelectedFiliere] = useState('');
  const [selectedNiveau, setSelectedNiveau] = useState('');
  const [selectedSemestre, setSelectedSemestre] = useState('');
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [recap, setRecap] = useState(null);
  const [recapLoading, setRecapLoading] = useState(false);

  // Pour les exports filtres
  const [ues, setUes] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [selectedUE, setSelectedUE] = useState('');
  const [selectedEnseignant, setSelectedEnseignant] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [ueRes, usrRes] = await Promise.all([
          unitesEnseignementService.getAll(),
          usersService.getAll(),
        ]);
        setUes(ueRes.data);
        const teachers = usrRes.data.filter((u) =>
          u.roles?.some((r) => (r.nom_role || r) === 'Enseignant')
        );
        setEnseignants(teachers);
      } catch { /* ignore */ }
    };
    loadData();
  }, []);

  // Build filters object
  const filters = {
    dateDebut,
    dateFin,
    filiere: selectedFiliere,
    niveau: selectedNiveau,
    semestre: selectedSemestre,
  };

  const loadRecap = async () => {
    setRecapLoading(true);
    try {
      const res = await dashboardService.getRecapitulatif(filters);
      setRecap(res.data);
    } catch {
      toast.error('Erreur chargement recapitulatif');
    } finally {
      setRecapLoading(false);
    }
  };

  useEffect(() => {
    loadRecap();
  }, [dateDebut, dateFin, selectedFiliere, selectedNiveau, selectedSemestre]);

  // Filter niveaux by selected filiere
  const filteredNiveaux = selectedFiliere
    ? (recap?.niveaux || []).filter((n) => n.filiere_id === Number(selectedFiliere))
    : recap?.niveaux || [];

  const handleFiliereChange = (val) => {
    setSelectedFiliere(val);
    setSelectedNiveau('');
    setSelectedSemestre('');
  };

  const handleNiveauChange = (val) => {
    setSelectedNiveau(val);
    setSelectedSemestre('');
  };

  const handleReset = () => {
    setDateDebut('');
    setDateFin('');
    setSelectedFiliere('');
    setSelectedNiveau('');
    setSelectedSemestre('');
  };

  // Current filter label for display
  const filterLabel = [
    recap?.filieres?.find((f) => f.id === Number(selectedFiliere))?.nom,
    recap?.niveaux?.find((n) => n.id === Number(selectedNiveau))?.nom,
    selectedSemestre ? `S${selectedSemestre}` : null,
  ].filter(Boolean).join(' - ');

  const handleExport = async (type) => {
    setLoading(true);
    try {
      let res;
      let fallback;
      switch (type) {
        case 'bilan':
          res = await dashboardService.exportBilan(filters);
          fallback = 'bilan_cours.xlsx';
          break;
        case 'par-ue':
          res = await dashboardService.exportParUE(filters, selectedUE);
          fallback = 'fiches_par_ue.xlsx';
          break;
        case 'par-enseignant':
          res = await dashboardService.exportParEnseignant(filters, selectedEnseignant);
          fallback = 'fiches_par_enseignant.xlsx';
          break;
      }
      downloadBlob(res, fallback);
      toast.success('Export telecharge');
    } catch {
      toast.error('Erreur export');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="fade-in">
      <PageHeader title="Export et recapitulatif" description="Telechargez les bilans de cours en format Excel" />

      {/* Filtres */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#7E7E7E' }}>
            Filtres
          </Typography>

          {/* Filiere / Niveau / Semestre */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                select
                fullWidth
                label="Filiere"
                value={selectedFiliere}
                onChange={(e) => handleFiliereChange(e.target.value)}
                size="small"
              >
                <MenuItem value="">Toutes les filieres</MenuItem>
                {(recap?.filieres || []).map((f) => (
                  <MenuItem key={f.id} value={f.id}>{f.nom}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                select
                fullWidth
                label="Niveau"
                value={selectedNiveau}
                onChange={(e) => handleNiveauChange(e.target.value)}
                size="small"
                disabled={filteredNiveaux.length === 0}
              >
                <MenuItem value="">Tous les niveaux</MenuItem>
                {filteredNiveaux.map((n) => (
                  <MenuItem key={n.id} value={n.id}>
                    {n.nom}{!selectedFiliere ? ` (${n.filiere_nom})` : ''}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
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
          </Grid>

          {/* Periode */}
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 5 }}>
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
            <Grid size={{ xs: 12, sm: 5 }}>
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

          {filterLabel && (
            <Box sx={{ mt: 2 }}>
              <Chip
                label={filterLabel}
                color="primary"
                variant="outlined"
                size="small"
                sx={{ fontWeight: 600 }}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Recapitulatif cards */}
      {recap && !recapLoading && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h3" sx={{ fontWeight: 800, color: '#001EA6' }}>
                  {recap.total_heures}h
                </Typography>
                <Typography variant="body2" sx={{ color: '#7E7E7E', mt: 0.5 }}>Heures totales validees</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h3" sx={{ fontWeight: 800, color: '#10B981' }}>
                  {recap.total_fiches}
                </Typography>
                <Typography variant="body2" sx={{ color: '#7E7E7E', mt: 0.5 }}>Fiches validees</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h3" sx={{ fontWeight: 800, color: '#7C3AED' }}>
                  {recap.par_ue?.length || 0}
                </Typography>
                <Typography variant="body2" sx={{ color: '#7E7E7E', mt: 0.5 }}>UEs actives</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs Recapitulatif / Export */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ px: 3, pt: 2 }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)}>
              <Tab icon={<Assessment sx={{ fontSize: 18 }} />} iconPosition="start" label="Recapitulatif" sx={{ textTransform: 'none', fontWeight: 600 }} />
              <Tab icon={<FileDownload sx={{ fontSize: 18 }} />} iconPosition="start" label="Export" sx={{ textTransform: 'none', fontWeight: 600 }} />
            </Tabs>
          </Box>
          <Divider />

          {/* Tab Recapitulatif */}
          {tab === 0 && (
            <Box sx={{ p: 3 }}>
              {recapLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : recap ? (
                <Grid container spacing={3}>
                  {/* Par UE */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                      <UEIcon sx={{ fontSize: 18, mr: 1, verticalAlign: 'text-bottom' }} />
                      Heures par UE
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>UE</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>Seances</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>Heures</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {recap.par_ue?.map((item) => (
                            <TableRow key={item.code_ue} hover>
                              <TableCell>
                                <Chip label={item.code_ue} size="small" sx={{ bgcolor: '#001EA614', color: '#001EA6', fontWeight: 600 }} />
                              </TableCell>
                              <TableCell align="center">{item.nb_fiches}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600 }}>{item.heures}h</TableCell>
                            </TableRow>
                          ))}
                          {recap.par_ue?.length > 0 && (
                            <TableRow sx={{ bgcolor: '#F5F5F5' }}>
                              <TableCell sx={{ fontWeight: 700 }}>TOTAL</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700 }}>
                                {recap.par_ue.reduce((s, i) => s + i.nb_fiches, 0)}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>
                                {recap.par_ue.reduce((s, i) => s + i.heures, 0).toFixed(2)}h
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>

                  {/* Par enseignant */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                      <PersonIcon sx={{ fontSize: 18, mr: 1, verticalAlign: 'text-bottom' }} />
                      Heures par enseignant
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Enseignant</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>Seances</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>Heures</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {recap.par_enseignant?.map((item) => (
                            <TableRow key={item.id} hover>
                              <TableCell>{item.nom}</TableCell>
                              <TableCell align="center">{item.nb_fiches}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600 }}>{item.heures}h</TableCell>
                            </TableRow>
                          ))}
                          {recap.par_enseignant?.length > 0 && (
                            <TableRow sx={{ bgcolor: '#F5F5F5' }}>
                              <TableCell sx={{ fontWeight: 700 }}>TOTAL</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700 }}>
                                {recap.par_enseignant.reduce((s, i) => s + i.nb_fiches, 0)}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>
                                {recap.par_enseignant.reduce((s, i) => s + i.heures, 0).toFixed(2)}h
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                </Grid>
              ) : (
                <Typography variant="body2" sx={{ color: '#7E7E7E', textAlign: 'center', py: 4 }}>
                  Aucune donnee disponible
                </Typography>
              )}
            </Box>
          )}

          {/* Tab Export */}
          {tab === 1 && (
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                {/* Bilan global */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <ListAlt sx={{ color: '#001EA6' }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Bilan global</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#7E7E7E', mb: 'auto', pb: 2 }}>
                        Toutes les fiches validees dans un seul tableau, triees par enseignant puis par date.
                        {filterLabel && <><br />Filtre : <strong>{filterLabel}</strong></>}
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={loading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <FileDownload />}
                        onClick={() => handleExport('bilan')}
                        disabled={loading}
                        fullWidth
                      >
                        Telecharger
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Par UE */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <UEIcon sx={{ color: '#3B82F6' }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Par UE</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#7E7E7E', mb: 2 }}>
                        Un onglet Excel par unite d'enseignement, avec un recapitulatif en premiere page.
                      </Typography>
                      <TextField
                        select
                        fullWidth
                        label="UE (optionnel)"
                        value={selectedUE}
                        onChange={(e) => setSelectedUE(e.target.value)}
                        sx={{ mb: 2 }}
                        size="small"
                      >
                        <MenuItem value="">Toutes les UEs</MenuItem>
                        {ues.map((u) => (
                          <MenuItem key={u.id} value={u.id}>{u.code_ue} - {u.libelle_ue}</MenuItem>
                        ))}
                      </TextField>
                      <Button
                        variant="contained"
                        startIcon={loading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <FileDownload />}
                        onClick={() => handleExport('par-ue')}
                        disabled={loading}
                        fullWidth
                        sx={{ bgcolor: '#3B82F6', '&:hover': { bgcolor: '#2563EB' }, mt: 'auto' }}
                      >
                        Telecharger
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Par enseignant */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <PersonIcon sx={{ color: '#7C3AED' }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Par enseignant</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#7E7E7E', mb: 2 }}>
                        Un onglet Excel par enseignant, avec un recapitulatif des heures en premiere page.
                      </Typography>
                      <TextField
                        select
                        fullWidth
                        label="Enseignant (optionnel)"
                        value={selectedEnseignant}
                        onChange={(e) => setSelectedEnseignant(e.target.value)}
                        sx={{ mb: 2 }}
                        size="small"
                      >
                        <MenuItem value="">Tous les enseignants</MenuItem>
                        {enseignants.map((e) => (
                          <MenuItem key={e.id} value={e.id}>{e.last_name} {e.first_name}</MenuItem>
                        ))}
                      </TextField>
                      <Button
                        variant="contained"
                        startIcon={loading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <FileDownload />}
                        onClick={() => handleExport('par-enseignant')}
                        disabled={loading}
                        fullWidth
                        sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' }, mt: 'auto' }}
                      >
                        Telecharger
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
