import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Skeleton,
} from '@mui/material';
import { ToggleOn, ToggleOff, CheckCircle } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import RoleBadge from '../../components/common/RoleBadge';
import { usersService } from '../../api/services';
import toast from 'react-hot-toast';

export default function ChefUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('ALL');

  const load = async () => {
    try {
      const res = await usersService.getAll();
      setUsers(res.data);
    } catch {
      toast.error('Erreur chargement utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (tab === 'ALL') return users;
    return users.filter((u) => u.statut === tab);
  }, [users, tab]);

  const handleToggle = async (user) => {
    const newStatus = user.statut === 'ACTIF' ? 'INACTIF' : 'ACTIF';
    try {
      await usersService.update(user.id, { statut: newStatus });
      toast.success(`Utilisateur ${newStatus === 'ACTIF' ? 'active' : 'desactive'}`);
      load();
    } catch {
      toast.error('Erreur mise a jour');
    }
  };

  const handleApprove = async (userId) => {
    try {
      await usersService.approuver(userId);
      toast.success('Utilisateur approuve');
      load();
    } catch {
      toast.error('Erreur approbation');
    }
  };

  const columns = [
    { field: 'first_name', label: 'Prenom' },
    { field: 'last_name', label: 'Nom' },
    { field: 'email', label: 'Email' },
    {
      field: 'roles',
      label: 'Roles',
      sortable: false,
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {row.roles?.map((r, i) => <RoleBadge key={i} role={r.nom_role || r} />)}
        </Box>
      ),
    },
    {
      field: 'statut',
      label: 'Statut',
      render: (row) => <StatusBadge status={row.statut} />,
    },
  ];

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={48} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={400} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  return (
    <Box className="fade-in">
      <PageHeader title="Utilisateurs" description="Gestion des utilisateurs de votre departement" />

      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ px: 3, pt: 2 }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)}>
              <Tab label="Tous" value="ALL" sx={{ textTransform: 'none', fontWeight: 600 }} />
              <Tab label="Actifs" value="ACTIF" sx={{ textTransform: 'none', fontWeight: 600 }} />
              <Tab label="Inactifs" value="INACTIF" sx={{ textTransform: 'none', fontWeight: 600 }} />
              <Tab label="En attente" value="EN_ATTENTE" sx={{ textTransform: 'none', fontWeight: 600 }} />
            </Tabs>
          </Box>
          <DataTable
            columns={columns}
            rows={filtered}
            searchFields={['first_name', 'last_name', 'email']}
            actions={(row) => (
              <>
                {row.statut === 'EN_ATTENTE' && (
                  <Tooltip title="Approuver">
                    <IconButton size="small" sx={{ color: '#10B981' }} onClick={() => handleApprove(row.id)}>
                      <CheckCircle fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {row.statut !== 'EN_ATTENTE' && (
                  <Tooltip title={row.statut === 'ACTIF' ? 'Desactiver' : 'Activer'}>
                    <IconButton size="small" onClick={() => handleToggle(row)}>
                      {row.statut === 'ACTIF' ? (
                        <ToggleOn sx={{ color: '#10B981', fontSize: 28 }} />
                      ) : (
                        <ToggleOff sx={{ color: '#7E7E7E', fontSize: 28 }} />
                      )}
                    </IconButton>
                  </Tooltip>
                )}
              </>
            )}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
