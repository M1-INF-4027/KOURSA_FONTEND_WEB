import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  TablePagination,
  TextField,
  Tabs,
  Tab,
  Chip,
  Button,
  InputAdornment,
  Skeleton,
} from '@mui/material';
import { Search as SearchIcon, Add as AddIcon } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { fichesSuiviService } from '../../api/services';
import toast from 'react-hot-toast';

const tabs = [
  { label: 'Toutes', value: 'ALL' },
  { label: 'En attente', value: 'SOUMISE' },
  { label: 'Validees', value: 'VALIDEE' },
  { label: 'Refusees', value: 'REFUSEE' },
];

export default function FichesListPage() {
  const navigate = useNavigate();
  const [fiches, setFiches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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

  const filtered = useMemo(() => {
    let result = fiches;
    if (tab !== 'ALL') result = result.filter((f) => f.statut === tab);
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (f) =>
          (f.titre_chapitre || '').toLowerCase().includes(s) ||
          (f.code_ue || f.ue?.code_ue || '').toLowerCase().includes(s) ||
          (f.libelle_ue || f.ue?.libelle_ue || '').toLowerCase().includes(s) ||
          (f.nom_enseignant || '').toLowerCase().includes(s) ||
          (f.contenu_aborde || '').toLowerCase().includes(s)
      );
    }
    return result;
  }, [fiches, tab, search]);

  const paged = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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
      <PageHeader
        title="Mes Fiches"
        description="Fiches de suivi de vos cours"
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/delegue/fiches/new')}
          >
            Nouvelle fiche
          </Button>
        }
      />

      <Card>
        <CardContent sx={{ p: 0 }}>
          {/* Tabs + Search */}
          <Box sx={{ px: 3, pt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Tabs value={tab} onChange={(_, v) => { setTab(v); setPage(0); }}>
              {tabs.map((t) => (
                <Tab key={t.value} label={t.label} value={t.value} sx={{ textTransform: 'none', fontWeight: 600 }} />
              ))}
            </Tabs>
            <TextField
              size="small"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start"><SearchIcon sx={{ color: '#7E7E7E' }} /></InputAdornment>
                  ),
                },
              }}
              sx={{ minWidth: 220 }}
            />
          </Box>

          {/* Table */}
          {filtered.length === 0 ? (
            <EmptyState message="Aucune fiche trouvee" />
          ) : (
            <>
              <TableContainer sx={{ mt: 1 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>UE</TableCell>
                      <TableCell>Classe</TableCell>
                      <TableCell>Chapitre</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Enseignant</TableCell>
                      <TableCell>Statut</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paged.map((f) => (
                      <TableRow
                        key={f.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/delegue/fiches/${f.id}`)}
                      >
                        <TableCell sx={{ fontWeight: 600 }}>
                          {f.code_ue || f.ue?.code_ue || '-'}
                        </TableCell>
                        <TableCell>
                          {f.classe ? <Chip label={f.classe} size="small" variant="outlined" sx={{ fontWeight: 600 }} /> : '-'}
                        </TableCell>
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
                        <TableCell>{f.nom_enseignant || `${f.enseignant?.first_name || ''} ${f.enseignant?.last_name || ''}`.trim() || '-'}</TableCell>
                        <TableCell><StatusBadge status={f.statut} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={filtered.length}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                labelRowsPerPage="Lignes par page"
              />
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
