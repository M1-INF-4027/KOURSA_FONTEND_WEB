import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoles } from '../../hooks/useRoles';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  Chip,
  Button,
  TextField,
  MenuItem,
} from '@mui/material';
import {
  Description as FichesIcon,
  CheckCircle as CheckIcon,
  AccessTime as PendingIcon,
  People as PeopleIcon,
  MenuBook as UEIcon,
  Warning as WarningIcon,
  AutorenewRounded as NewYearIcon,
  Cancel as RefusedIcon,
  Business as DeptIcon,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatsCard from '../../components/common/StatsCard';
import StatusBadge from '../../components/common/StatusBadge';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import { fichesSuiviService, dashboardService, usersService, unitesEnseignementService } from '../../api/services';
import { useConfig } from '../../contexts/ConfigContext';
import ChefChecklist from '../../components/common/ChefChecklist';
import toast from 'react-hot-toast';
import banniere from '../../assets/banniere.png';

function EnseignantDashboard() {
  const navigate = useNavigate();
  const { refreshKey } = useConfig();
  const [fiches, setFiches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fichesSuiviService.getAll();
        setFiches(Array.isArray(res.data) ? res.data : res.data?.results || []);
      } catch {
        toast.error('Erreur chargement des fiches');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [refreshKey]);

  const pending = fiches.filter((f) => f.statut === 'SOUMISE');
  const validated = fiches.filter((f) => f.statut === 'VALIDEE');
  const recentPending = pending.slice(0, 5);

  if (loading) return <DashboardSkeleton count={2} />;

  return (
    <Box className="fade-in">
      {/* Banner */}
      <Card sx={{ mb: 3, overflow: 'hidden', position: 'relative' }}>
        <Box
          sx={{
            backgroundImage: `url(${banniere})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            minHeight: 160,
            display: 'flex',
            alignItems: 'center',
            p: 4,
            position: 'relative',
          }}
        >
          <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,30,166,0.8), rgba(0,13,107,0.85))' }} />
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography variant="h4" sx={{ color: '#FFFFFF', fontWeight: 800, mb: 0.5 }}>
              Tableau de bord
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              Gerez vos fiches de suivi d'enseignement
            </Typography>
          </Box>
        </Box>
      </Card>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <StatsCard title="Fiches en attente" value={pending.length} icon={<PendingIcon />} color="#F7B016" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <StatsCard title="Fiches validees" value={validated.length} icon={<CheckIcon />} color="#10B981" />
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Fiches en attente de validation</Typography>
          {recentPending.length === 0 ? (
            <EmptyState message="Aucune fiche en attente" />
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>UE</TableCell>
                    <TableCell>Chapitre</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Statut</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentPending.map((f) => (
                    <TableRow
                      key={f.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/fiches/${f.id}`)}
                    >
                      <TableCell sx={{ fontWeight: 600 }}>{f.code_ue || f.ue?.code_ue || '-'}</TableCell>
                      <TableCell>{f.titre_chapitre}</TableCell>
                      <TableCell>{f.date_cours}</TableCell>
                      <TableCell>
                        <Chip
                          label={f.type_seance}
                          size="small"
                          sx={{
                            bgcolor: f.type_seance === 'CM' ? '#001EA614' : f.type_seance === 'TD' ? '#3B82F614' : '#F7B01614',
                            color: f.type_seance === 'CM' ? '#001EA6' : f.type_seance === 'TD' ? '#3B82F6' : '#F7B016',
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell><StatusBadge status={f.statut} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

function ChefDashboard() {
  const { refreshKey } = useConfig();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFiliere, setSelectedFiliere] = useState('');
  const [selectedNiveau, setSelectedNiveau] = useState('');
  const [selectedSemestre, setSelectedSemestre] = useState('');

  const loadStats = async (filiere, niveau, semestre) => {
    setLoading(true);
    try {
      const res = await dashboardService.getStats({ filiere, niveau, semestre });
      setStats(res.data);
    } catch {
      toast.error('Erreur chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats(selectedFiliere, selectedNiveau, selectedSemestre);
  }, [selectedFiliere, selectedNiveau, selectedSemestre, refreshKey]);

  // Filter niveaux by selected filiere
  const filteredNiveaux = selectedFiliere
    ? (stats?.niveaux || []).filter((n) => n.filiere_id === Number(selectedFiliere))
    : stats?.niveaux || [];

  // Reset niveau when filiere changes
  const handleFiliereChange = (val) => {
    setSelectedFiliere(val);
    setSelectedNiveau('');
    setSelectedSemestre('');
  };

  const handleNiveauChange = (val) => {
    setSelectedNiveau(val);
    setSelectedSemestre('');
  };

  const chartData = stats?.repartition_heures_par_ue_ce_mois?.map((item) => ({
    name: item.code_ue || item.ue__code_ue || 'UE',
    heures: parseFloat(item.heures_effectuees || item.total_heures || item.total || 0),
  })) || [];

  // Build current filter label
  const filterLabel = [
    stats?.filieres?.find((f) => f.id === Number(selectedFiliere))?.nom,
    stats?.niveaux?.find((n) => n.id === Number(selectedNiveau))?.nom,
    selectedSemestre ? `S${selectedSemestre}` : null,
  ].filter(Boolean).join(' - ') || 'Tout le departement';

  return (
    <Box className="fade-in">
      <PageHeader title="Tableau de bord" description="Vue d'ensemble de votre departement" />

      <ChefChecklist />

      {/* Filtres Filiere / Niveau / Semestre */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#7E7E7E' }}>
            Filtrer par classe
          </Typography>
          <Grid container spacing={2} alignItems="center">
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
                {(stats?.filieres || []).map((f) => (
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
        </CardContent>
      </Card>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatsCard
            title="Heures validees ce mois"
            value={stats?.heures_validees_ce_mois || 0}
            icon={<CheckIcon />}
            color="#10B981"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatsCard
            title="Fiches en retard"
            value={stats?.fiches_en_retard_de_validation || 0}
            icon={<WarningIcon />}
            color="#EF4444"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatsCard
            title="UEs actives"
            value={chartData.length}
            icon={<UEIcon />}
            color="#001EA6"
          />
        </Grid>
      </Grid>

      {chartData.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Repartition des heures par UE — {filterLabel}
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="heures" fill="#001EA6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

function DeleGueDashboard() {
  const navigate = useNavigate();
  const { refreshKey } = useConfig();
  const [fiches, setFiches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fichesSuiviService.getAll();
        setFiches(Array.isArray(res.data) ? res.data : res.data?.results || []);
      } catch {
        toast.error('Erreur chargement des fiches');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [refreshKey]);

  const soumises = fiches.filter((f) => f.statut === 'SOUMISE');
  const validees = fiches.filter((f) => f.statut === 'VALIDEE');
  const refusees = fiches.filter((f) => f.statut === 'REFUSEE');
  const recentPending = soumises.slice(0, 5);

  if (loading) return <DashboardSkeleton count={3} />;

  return (
    <Box className="fade-in">
      {/* Banner */}
      <Card sx={{ mb: 3, overflow: 'hidden', position: 'relative' }}>
        <Box
          sx={{
            backgroundImage: `url(${banniere})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            minHeight: 160,
            display: 'flex',
            alignItems: 'center',
            p: 4,
            position: 'relative',
          }}
        >
          <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(16,185,129,0.8), rgba(5,150,105,0.85))' }} />
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography variant="h4" sx={{ color: '#FFFFFF', fontWeight: 800, mb: 0.5 }}>
              Tableau de bord
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              Suivez vos fiches de suivi de cours
            </Typography>
          </Box>
        </Box>
      </Card>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatsCard title="Fiches soumises" value={fiches.length} icon={<FichesIcon />} color="#001EA6" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatsCard title="Fiches validees" value={validees.length} icon={<CheckIcon />} color="#10B981" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatsCard title="Fiches refusees" value={refusees.length} icon={<WarningIcon />} color="#EF4444" />
        </Grid>
      </Grid>

      {/* Quick action */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          onClick={() => navigate('/delegue/fiches/new')}
          sx={{ fontWeight: 600 }}
        >
          + Nouvelle fiche
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Dernieres fiches en attente</Typography>
          {recentPending.length === 0 ? (
            <EmptyState message="Aucune fiche en attente" />
          ) : (
            <Grid container spacing={2}>
              {recentPending.map((f) => (
                <Grid key={f.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card
                    variant="outlined"
                    sx={{ cursor: 'pointer', '&:hover': { borderColor: '#001EA6' } }}
                    onClick={() => navigate(`/delegue/fiches/${f.id}`)}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                        {f.code_ue || f.ue?.code_ue || '-'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#7E7E7E', mb: 0.5 }}>
                        {f.titre_chapitre}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#7E7E7E' }}>
                        {f.nom_enseignant || `${f.enseignant?.first_name || ''} ${f.enseignant?.last_name || ''}`.trim() || '-'} &middot; {f.date_cours}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

function AdminDashboard() {
  const navigate = useNavigate();
  const { anneeActive, semestreActif, isConfigured, refreshKey } = useConfig();
  const [overview, setOverview] = useState(null);
  const [recentFiches, setRecentFiches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [overviewRes, fichesRes] = await Promise.all([
          dashboardService.getAdminOverview(),
          fichesSuiviService.getAll(),
        ]);
        setOverview(overviewRes.data);
        const fiches = Array.isArray(fichesRes.data) ? fichesRes.data : fichesRes.data?.results || [];
        setRecentFiches(fiches.filter((f) => f.statut === 'SOUMISE').slice(0, 5));
      } catch {
        toast.error('Erreur chargement des donnees');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [refreshKey]);

  if (loading) return <DashboardSkeleton count={4} />;

  const totaux = overview?.totaux || { total: 0, soumises: 0, validees: 0, refusees: 0 };
  const departements = overview?.departements || [];

  const chartData = departements.map((d) => ({
    name: d.nom,
    total: d.total,
    validees: d.validees,
    soumises: d.soumises,
  }));

  return (
    <Box className="fade-in">
      <PageHeader
        title="Tableau de bord"
        description={anneeActive ? `${anneeActive.libelle} — Semestre ${semestreActif?.numero || '?'}` : 'Vue globale de la plateforme'}
      />

      {!isConfigured && (
        <Card sx={{ mb: 3, borderLeft: '4px solid #F7B016' }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              La plateforme n'est pas encore configuree.
            </Typography>
            <Button variant="contained" size="small" onClick={() => navigate('/setup')}>
              Configurer
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard title="Total fiches" value={totaux.total} icon={<FichesIcon />} color="#001EA6" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard title="En attente" value={totaux.soumises} icon={<PendingIcon />} color="#F7B016" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard title="Validees" value={totaux.validees} icon={<CheckIcon />} color="#10B981" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard title="Refusees" value={totaux.refusees} icon={<RefusedIcon />} color="#EF4444" />
        </Grid>
      </Grid>

      {/* Tableau departements */}
      {departements.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
              <DeptIcon sx={{ fontSize: 20, mr: 1, verticalAlign: 'text-bottom' }} />
              Fiches par departement
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Departement</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Faculte</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Chef</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Soumises</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Validees</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Refusees</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {departements.map((d) => (
                    <TableRow key={d.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{d.nom}</TableCell>
                      <TableCell>{d.faculte || '-'}</TableCell>
                      <TableCell>{d.chef || <Chip label="Non assigne" size="small" sx={{ bgcolor: '#FEE2E2', color: '#DC2626', fontSize: '0.7rem' }} />}</TableCell>
                      <TableCell align="center">
                        <Chip label={d.soumises} size="small" sx={{ bgcolor: '#FEF3C7', color: '#D97706', fontWeight: 700, minWidth: 36 }} />
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={d.validees} size="small" sx={{ bgcolor: '#D1FAE5', color: '#059669', fontWeight: 700, minWidth: 36 }} />
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={d.refusees} size="small" sx={{ bgcolor: '#FEE2E2', color: '#DC2626', fontWeight: 700, minWidth: 36 }} />
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>{d.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Bar chart */}
      {chartData.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
              Fiches par departement
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="validees" name="Validees" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="soumises" name="Soumises" fill="#F7B016" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Fiches recentes */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Dernieres fiches soumises</Typography>
          {recentFiches.length === 0 ? (
            <EmptyState message="Aucune fiche en attente" />
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>UE</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Chapitre</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Enseignant</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Statut</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentFiches.map((f) => (
                    <TableRow
                      key={f.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => navigate('/admin/fiches')}
                    >
                      <TableCell sx={{ fontWeight: 600 }}>{f.code_ue || f.ue?.code_ue || '-'}</TableCell>
                      <TableCell>{f.titre_chapitre}</TableCell>
                      <TableCell>{f.nom_enseignant || '-'}</TableCell>
                      <TableCell>{f.date_cours}</TableCell>
                      <TableCell><StatusBadge status={f.statut} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Action nouvelle annee */}
      {isConfigured && (
        <Card
          sx={{
            cursor: 'pointer',
            border: '1px solid #DFDFDF',
            transition: 'all 0.2s',
            '&:hover': { borderColor: '#001EA6', boxShadow: '0 2px 8px rgba(0,30,166,0.1)' },
          }}
          onClick={() => navigate('/admin/nouvelle-annee')}
        >
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                bgcolor: '#001EA614',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <NewYearIcon sx={{ color: '#001EA6' }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Preparer une nouvelle annee academique
              </Typography>
              <Typography variant="caption" sx={{ color: '#7E7E7E' }}>
                Creer une annee, reconduire les UEs et assigner les chefs de departement
              </Typography>
            </Box>
            <Button variant="outlined" size="small" sx={{ whiteSpace: 'nowrap' }}>
              Commencer
            </Button>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

function DashboardSkeleton({ count = 3 }) {
  return (
    <Box>
      <Skeleton variant="rounded" height={48} sx={{ mb: 3, borderRadius: 3 }} />
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {Array.from({ length: count }).map((_, i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 12 / count }}>
            <Skeleton variant="rounded" height={120} sx={{ borderRadius: 3 }} />
          </Grid>
        ))}
      </Grid>
      <Skeleton variant="rounded" height={300} sx={{ borderRadius: 3 }} />
    </Box>
  );
}

export default function DashboardPage() {
  const { isAdmin, isChef, isDelegue } = useRoles();

  if (isAdmin) return <AdminDashboard />;
  if (isChef) return <ChefDashboard />;
  if (isDelegue) return <DeleGueDashboard />;
  return <EnseignantDashboard />;
}
