import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
} from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import RoleBadge from '../../components/common/RoleBadge';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { usersService } from '../../api/services';
import toast from 'react-hot-toast';

export default function DeleguesPage() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [confirmAction, setConfirmAction] = useState('');
  const [tab, setTab] = useState('ALL');

  const load = async () => {
    try {
      const res = await usersService.getAll();
      const pending = res.data.filter(
        (u) =>
          u.statut === 'EN_ATTENTE' &&
          u.roles?.some((r) => {
            const roleName = r.nom_role || r;
            return roleName === 'Délégué' || roleName === 'Enseignant';
          })
      );
      setPendingUsers(pending);
    } catch {
      toast.error('Erreur chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const getRoleName = (user) => {
    const role = user.roles?.find((r) => {
      const name = r.nom_role || r;
      return name === 'Délégué' || name === 'Enseignant';
    });
    return role?.nom_role || role || '-';
  };

  const filtered = tab === 'ALL'
    ? pendingUsers
    : pendingUsers.filter((u) => u.roles?.some((r) => (r.nom_role || r) === tab));

  const handleApprove = async () => {
    try {
      await usersService.approuver(selectedId);
      toast.success('Utilisateur approuve');
      setConfirmOpen(false);
      load();
    } catch {
      toast.error('Erreur approbation');
    }
  };

  const handleReject = async () => {
    try {
      await usersService.delete(selectedId);
      toast.success('Demande rejetee');
      setConfirmOpen(false);
      load();
    } catch {
      toast.error('Erreur rejet');
    }
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={48} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={300} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  return (
    <Box className="fade-in">
      <PageHeader title="Demandes en attente" description="Approuvez ou rejetez les demandes d'inscription des delegues et enseignants" />

      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ px: 3, pt: 2 }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)}>
              <Tab label={`Tous (${pendingUsers.length})`} value="ALL" sx={{ textTransform: 'none', fontWeight: 600 }} />
              <Tab
                label={`Delegues (${pendingUsers.filter((u) => u.roles?.some((r) => (r.nom_role || r) === 'Délégué')).length})`}
                value="Délégué"
                sx={{ textTransform: 'none', fontWeight: 600 }}
              />
              <Tab
                label={`Enseignants (${pendingUsers.filter((u) => u.roles?.some((r) => (r.nom_role || r) === 'Enseignant')).length})`}
                value="Enseignant"
                sx={{ textTransform: 'none', fontWeight: 600 }}
              />
            </Tabs>
          </Box>

          {filtered.length === 0 ? (
            <EmptyState message="Aucune demande en attente" />
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nom</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Niveau</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((d) => (
                    <TableRow key={d.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{d.first_name} {d.last_name}</TableCell>
                      <TableCell>{d.email}</TableCell>
                      <TableCell><RoleBadge role={getRoleName(d)} /></TableCell>
                      <TableCell>{d.nom_niveau || d.niveau_represente?.nom_niveau || '-'}</TableCell>
                      <TableCell><StatusBadge status={d.statut} /></TableCell>
                      <TableCell align="right">
                        <Tooltip title="Approuver">
                          <IconButton
                            size="small"
                            sx={{ color: '#10B981' }}
                            onClick={() => { setSelectedId(d.id); setConfirmAction('approve'); setConfirmOpen(true); }}
                          >
                            <CheckCircle />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Rejeter">
                          <IconButton
                            size="small"
                            sx={{ color: '#EF4444' }}
                            onClick={() => { setSelectedId(d.id); setConfirmAction('reject'); setConfirmOpen(true); }}
                          >
                            <Cancel />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmAction === 'approve' ? handleApprove : handleReject}
        title={confirmAction === 'approve' ? "Approuver l'utilisateur" : "Rejeter l'utilisateur"}
        message={confirmAction === 'approve'
          ? 'Voulez-vous approuver cet utilisateur ? Il pourra acceder a la plateforme.'
          : 'Voulez-vous rejeter cet utilisateur ? Cette action est irreversible.'
        }
        confirmText={confirmAction === 'approve' ? 'Approuver' : 'Rejeter'}
        confirmColor={confirmAction === 'approve' ? 'success' : 'error'}
      />
    </Box>
  );
}
