import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Skeleton,
  Grid,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  NotificationsActive as AlertIcon,
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import { dashboardService, alertsService } from '../../api/services';
import toast from 'react-hot-toast';

function getMonday(d = new Date()) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  return date;
}

function formatDate(d) {
  return d.toISOString().split('T')[0];
}

function formatWeekLabel(mondayStr) {
  const monday = new Date(mondayStr + 'T00:00:00');
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const opts = { day: 'numeric', month: 'long', year: 'numeric' };
  return `Semaine du ${monday.toLocaleDateString('fr-FR', opts)} au ${sunday.toLocaleDateString('fr-FR', opts)}`;
}

const statutConfig = {
  validee: { label: 'Validee', color: '#10B981', bg: '#D1FAE5' },
  soumise: { label: 'Soumise', color: '#D97706', bg: '#FEF3C7' },
  aucune_fiche: { label: 'Manquante', color: '#DC2626', bg: '#FEE2E2' },
};

export default function WeeklyTrackingPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentMonday, setCurrentMonday] = useState(formatDate(getMonday()));

  // Alert dialog
  const [alertDialog, setAlertDialog] = useState({ open: false, enseignant: null, ue: null });
  const [alertMessage, setAlertMessage] = useState('');
  const [alertLoading, setAlertLoading] = useState(false);

  const loadData = async (semaine) => {
    setLoading(true);
    try {
      const res = await dashboardService.getWeeklyTracking(semaine);
      setData(res.data);
    } catch {
      toast.error('Erreur chargement du suivi hebdomadaire');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(currentMonday);
  }, [currentMonday]);

  const goToPrevWeek = () => {
    const d = new Date(currentMonday + 'T00:00:00');
    d.setDate(d.getDate() - 7);
    setCurrentMonday(formatDate(d));
  };

  const goToNextWeek = () => {
    const d = new Date(currentMonday + 'T00:00:00');
    d.setDate(d.getDate() + 7);
    setCurrentMonday(formatDate(d));
  };

  const handleAlert = (enseignant, ue) => {
    setAlertDialog({ open: true, enseignant, ue });
    setAlertMessage('');
  };

  const sendAlert = async () => {
    setAlertLoading(true);
    try {
      await alertsService.alertEnseignant({
        enseignant_id: alertDialog.enseignant.id,
        ue_id: alertDialog.ue.id,
        semaine: currentMonday,
        message: alertMessage || undefined,
      });
      toast.success('Alerte envoyee avec succes');
      setAlertDialog({ open: false, enseignant: null, ue: null });
    } catch {
      toast.error("Erreur lors de l'envoi de l'alerte");
    } finally {
      setAlertLoading(false);
    }
  };

  const stats = data?.stats || { total_ues: 0, validees: 0, soumises: 0, manquantes: 0 };

  return (
    <Box className="fade-in">
      <PageHeader title="Suivi hebdomadaire" description="Suivez les fiches de suivi par filiere et niveau" />

      {/* Selecteur de semaine */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, py: 1.5 }}>
          <IconButton onClick={goToPrevWeek}><ChevronLeftIcon /></IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, minWidth: 300, textAlign: 'center' }}>
            {formatWeekLabel(currentMonday)}
          </Typography>
          <IconButton onClick={goToNextWeek}><ChevronRightIcon /></IconButton>
        </CardContent>
      </Card>

      {/* Stats */}
      {loading ? (
        <Skeleton variant="rounded" height={80} sx={{ mb: 3, borderRadius: 3 }} />
      ) : (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#001EA6' }}>{stats.total_ues}</Typography>
                <Typography variant="caption" sx={{ color: '#7E7E7E' }}>Total UEs</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#10B981' }}>{stats.validees}</Typography>
                <Typography variant="caption" sx={{ color: '#7E7E7E' }}>Validees</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#D97706' }}>{stats.soumises}</Typography>
                <Typography variant="caption" sx={{ color: '#7E7E7E' }}>Soumises</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#DC2626' }}>{stats.manquantes}</Typography>
                <Typography variant="caption" sx={{ color: '#7E7E7E' }}>Manquantes</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filieres / Niveaux / UEs */}
      {loading ? (
        <>
          <Skeleton variant="rounded" height={60} sx={{ mb: 1, borderRadius: 2 }} />
          <Skeleton variant="rounded" height={60} sx={{ mb: 1, borderRadius: 2 }} />
        </>
      ) : data?.filieres?.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">Aucune UE trouvee pour cette semaine.</Typography>
          </CardContent>
        </Card>
      ) : (
        data?.filieres?.map((filiere) => (
          <Accordion key={filiere.id} defaultExpanded sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 700 }}>{filiere.nom}</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              {filiere.niveaux.map((niveau) => (
                <Accordion key={niveau.id} defaultExpanded sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: '#F8F9FA' }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{niveau.nom}</Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0 }}>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>UE</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Enseignant(s)</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Delegue</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Statut</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {niveau.ues.map((ue) => {
                            const cfg = statutConfig[ue.statut];
                            return (
                              <TableRow key={ue.id} hover>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{ue.code_ue}</Typography>
                                  <Typography variant="caption" sx={{ color: '#7E7E7E' }}>{ue.libelle_ue}</Typography>
                                </TableCell>
                                <TableCell>
                                  {ue.enseignants.map((e) => (
                                    <Typography key={e.id} variant="body2">{e.nom}</Typography>
                                  ))}
                                </TableCell>
                                <TableCell>
                                  {ue.delegue ? (
                                    <Typography variant="body2">{ue.delegue.nom}</Typography>
                                  ) : (
                                    <Typography variant="body2" sx={{ color: '#7E7E7E', fontStyle: 'italic' }}>
                                      Non assigne
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={cfg.label}
                                    size="small"
                                    sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 600 }}
                                  />
                                </TableCell>
                                <TableCell>
                                  {ue.statut === 'aucune_fiche' && ue.enseignants.length > 0 && (
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      color="error"
                                      startIcon={<AlertIcon />}
                                      onClick={() => handleAlert(ue.enseignants[0], ue)}
                                      sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                                    >
                                      Alerter
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
              ))}
            </AccordionDetails>
          </Accordion>
        ))
      )}

      {/* Alert Dialog */}
      <Dialog open={alertDialog.open} onClose={() => setAlertDialog({ open: false, enseignant: null, ue: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Alerter l'enseignant</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Envoyer une alerte a <strong>{alertDialog.enseignant?.nom}</strong> pour l'UE{' '}
            <strong>{alertDialog.ue?.code_ue}</strong> (semaine du {currentMonday}).
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Message optionnel"
            value={alertMessage}
            onChange={(e) => setAlertMessage(e.target.value)}
            placeholder="Ajouter un message personnalise..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlertDialog({ open: false, enseignant: null, ue: null })}>Annuler</Button>
          <Button variant="contained" color="error" onClick={sendAlert} disabled={alertLoading}>
            {alertLoading ? 'Envoi...' : 'Envoyer l\'alerte'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
