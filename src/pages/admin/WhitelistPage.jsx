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
  TextField,
  Button,
  Chip,
  Typography,
} from '@mui/material';
import { Delete, PlaylistAdd } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import DepartmentSelector from '../../components/common/DepartmentSelector';
import { whitelistService } from '../../api/services';
import toast from 'react-hot-toast';

export default function AdminWhitelistPage() {
  const [selectedDept, setSelectedDept] = useState('');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('ALL');

  // Bulk add
  const [bulkEmails, setBulkEmails] = useState('');
  const [bulkRoleType, setBulkRoleType] = useState('ENSEIGNANT');

  // Delete confirm
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const load = async () => {
    if (!selectedDept) return;
    setLoading(true);
    try {
      const res = await whitelistService.getAll({ departement: selectedDept });
      setEntries(res.data);
    } catch {
      toast.error('Erreur chargement de la whitelist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDept) {
      load();
    } else {
      setEntries([]);
    }
  }, [selectedDept]);

  const filtered = tab === 'ALL'
    ? entries
    : entries.filter((e) => e.role_type === tab);

  const handleBulkAdd = async () => {
    const emails = bulkEmails
      .split('\n')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (!emails.length) return;
    try {
      const res = await whitelistService.bulkCreate({ emails, role_type: bulkRoleType, departement: Number(selectedDept) });
      const { created, skipped } = res.data;
      if (created.length) toast.success(`${created.length} email(s) ajoute(s)`);
      if (skipped.length) toast(`Deja present(s) : ${skipped.join(', ')}`, { icon: '\u26A0\uFE0F', duration: 5000 });
      setBulkEmails('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur ajout en masse');
    }
  };

  const handleDelete = async () => {
    try {
      await whitelistService.delete(deleteId);
      toast.success('Email supprime');
      setConfirmOpen(false);
      setDeleteId(null);
      load();
    } catch {
      toast.error('Erreur suppression');
    }
  };

  return (
    <Box className="fade-in">
      <PageHeader
        title="Emails autorises"
        description="Gerez les emails autorises par departement"
      />

      <DepartmentSelector value={selectedDept} onChange={setSelectedDept} required />

      {!selectedDept ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              Selectionnez un departement pour voir et gerer ses emails autorises.
            </Typography>
          </CardContent>
        </Card>
      ) : loading ? (
        <Box>
          <Skeleton variant="rounded" height={48} sx={{ mb: 2 }} />
          <Skeleton variant="rounded" height={300} sx={{ borderRadius: 3 }} />
        </Box>
      ) : (
        <>
          {/* Ajout d'emails */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <TextField
                size="small"
                label="Emails a autoriser (un email par ligne)"
                multiline
                minRows={3}
                maxRows={8}
                value={bulkEmails}
                onChange={(e) => setBulkEmails(e.target.value)}
                fullWidth
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                  size="small"
                  select
                  label="Type"
                  value={bulkRoleType}
                  onChange={(e) => setBulkRoleType(e.target.value)}
                  SelectProps={{ native: true }}
                  sx={{ minWidth: 140 }}
                >
                  <option value="ENSEIGNANT">Enseignant</option>
                  <option value="DELEGUE">Delegue</option>
                </TextField>
                <Button
                  variant="outlined"
                  startIcon={<PlaylistAdd />}
                  onClick={handleBulkAdd}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Ajouter la liste
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Tableau */}
          <Card>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ px: 3, pt: 2 }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                  <Tab label={`Tous (${entries.length})`} value="ALL" sx={{ textTransform: 'none', fontWeight: 600 }} />
                  <Tab
                    label={`Enseignants (${entries.filter((e) => e.role_type === 'ENSEIGNANT').length})`}
                    value="ENSEIGNANT"
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  />
                  <Tab
                    label={`Delegues (${entries.filter((e) => e.role_type === 'DELEGUE').length})`}
                    value="DELEGUE"
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  />
                </Tabs>
              </Box>

              {filtered.length === 0 ? (
                <EmptyState message="Aucun email autorise" />
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Email</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Date ajout</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filtered.map((entry) => (
                        <TableRow key={entry.id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{entry.email}</TableCell>
                          <TableCell>
                            <Chip
                              label={entry.role_type === 'ENSEIGNANT' ? 'Enseignant' : 'Delegue'}
                              size="small"
                              sx={{
                                bgcolor: entry.role_type === 'ENSEIGNANT' ? '#001EA614' : '#10B98114',
                                color: entry.role_type === 'ENSEIGNANT' ? '#001EA6' : '#10B981',
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(entry.date_ajout).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="Supprimer">
                              <IconButton
                                size="small"
                                sx={{ color: '#EF4444' }}
                                onClick={() => { setDeleteId(entry.id); setConfirmOpen(true); }}
                              >
                                <Delete />
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
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setDeleteId(null); }}
        onConfirm={handleDelete}
        title="Supprimer l'email"
        message="Voulez-vous retirer cet email de la liste des emails autorises ?"
        confirmText="Supprimer"
        confirmColor="error"
      />
    </Box>
  );
}
