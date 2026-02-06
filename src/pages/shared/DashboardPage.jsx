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
} from '@mui/material';
import {
  Description as FichesIcon,
  CheckCircle as CheckIcon,
  AccessTime as PendingIcon,
  People as PeopleIcon,
  MenuBook as UEIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatsCard from '../../components/common/StatsCard';
import StatusBadge from '../../components/common/StatusBadge';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import { fichesSuiviService, dashboardService, usersService, unitesEnseignementService } from '../../api/services';
import toast from 'react-hot-toast';
import banniere from '../../assets/banniere.png';

function EnseignantDashboard() {
  const navigate = useNavigate();
  const [fiches, setFiches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fichesSuiviService.getAll();
        setFiches(res.data);
      } catch {
        toast.error('Erreur chargement des fiches');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await dashboardService.getStats();
        setStats(res.data);
      } catch {
        toast.error('Erreur chargement des statistiques');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <DashboardSkeleton count={3} />;

  const chartData = stats?.repartition_heures_par_ue_ce_mois?.map((item) => ({
    name: item.code_ue || item.ue__code_ue || 'UE',
    heures: parseFloat(item.total_heures || item.total || 0),
  })) || [];

  return (
    <Box className="fade-in">
      <PageHeader title="Tableau de bord" description="Vue d'ensemble de votre departement" />

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
            <Typography variant="h6" sx={{ mb: 2 }}>Repartition des heures par UE</Typography>
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
  const [fiches, setFiches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fichesSuiviService.getAll();
        setFiches(res.data);
      } catch {
        toast.error('Erreur chargement des fiches');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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
  const [data, setData] = useState({ users: 0, ues: 0, fiches: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [usersRes, uesRes, fichesRes] = await Promise.all([
          usersService.getAll(),
          unitesEnseignementService.getAll(),
          fichesSuiviService.getAll(),
        ]);
        setData({
          users: usersRes.data.length,
          ues: uesRes.data.length,
          fiches: fichesRes.data.length,
          pending: fichesRes.data.filter((f) => f.statut === 'SOUMISE').length,
        });
      } catch {
        toast.error('Erreur chargement des donnees');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <DashboardSkeleton count={4} />;

  return (
    <Box className="fade-in">
      <PageHeader title="Tableau de bord" description="Vue globale de la plateforme" />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard title="Utilisateurs" value={data.users} icon={<PeopleIcon />} color="#001EA6" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard title="Unites d'enseignement" value={data.ues} icon={<UEIcon />} color="#3B82F6" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard title="Total fiches" value={data.fiches} icon={<FichesIcon />} color="#10B981" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard title="Fiches en attente" value={data.pending} icon={<PendingIcon />} color="#F7B016" />
        </Grid>
      </Grid>
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
