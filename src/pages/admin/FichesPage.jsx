import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Tabs,
  Tab,
  Chip,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Divider,
  TextField,
  MenuItem,
} from '@mui/material';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { fichesSuiviService, departementsService, filieresService, niveauxService } from '../../api/services';
import { useConfig } from '../../contexts/ConfigContext';
import toast from 'react-hot-toast';

export default function AdminFichesPage() {
  const { refreshKey } = useConfig();
  const [fiches, setFiches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('ALL');
  const [selected, setSelected] = useState(null);

  // Hierarchical filters
  const [departements, setDepartements] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [niveaux, setNiveaux] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedFiliere, setSelectedFiliere] = useState('');
  const [selectedNiveau, setSelectedNiveau] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [fichesRes, deptRes, filRes, nivRes] = await Promise.all([
          fichesSuiviService.getAll(),
          departementsService.getAll(),
          filieresService.getAll(),
          niveauxService.getAll(),
        ]);
        setFiches(fichesRes.data);
        setDepartements(deptRes.data);
        setFilieres(filRes.data);
        setNiveaux(nivRes.data);
      } catch {
        toast.error('Erreur chargement des fiches');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [refreshKey]);

  // Cascade: filter filieres by selected dept
  const filteredFilieres = selectedDept
    ? filieres.filter((f) => f.departement === Number(selectedDept) || f.departement_id === Number(selectedDept))
    : filieres;

  // Cascade: filter niveaux by selected filiere
  const filteredNiveaux = selectedFiliere
    ? niveaux.filter((n) => n.filiere === Number(selectedFiliere) || n.filiere_id === Number(selectedFiliere))
    : selectedDept
      ? niveaux.filter((n) => filteredFilieres.some((f) => (f.id === n.filiere || f.id === n.filiere_id)))
      : niveaux;

  const handleDeptChange = (val) => {
    setSelectedDept(val);
    setSelectedFiliere('');
    setSelectedNiveau('');
  };

  const handleFiliereChange = (val) => {
    setSelectedFiliere(val);
    setSelectedNiveau('');
  };

  const filtered = useMemo(() => {
    let result = fiches;

    // Status filter
    if (tab !== 'ALL') {
      result = result.filter((f) => f.statut === tab);
    }

    // Hierarchical filters using niveaux_details
    if (selectedNiveau) {
      const niv = niveaux.find((n) => n.id === Number(selectedNiveau));
      if (niv) {
        const nivName = niv.nom_niveau;
        result = result.filter((f) =>
          f.niveaux_details?.some((nd) => nd.nom_niveau === nivName)
        );
      }
    } else if (selectedFiliere) {
      const fil = filieres.find((f) => f.id === Number(selectedFiliere));
      if (fil) {
        const filName = fil.nom_filiere;
        result = result.filter((f) =>
          f.niveaux_details?.some((nd) => nd.filiere_nom === filName)
        );
      }
    } else if (selectedDept) {
      const deptFiliereNames = filteredFilieres.map((f) => f.nom_filiere);
      result = result.filter((f) =>
        f.niveaux_details?.some((nd) => deptFiliereNames.includes(nd.filiere_nom))
      );
    }

    return result;
  }, [fiches, tab, selectedDept, selectedFiliere, selectedNiveau, niveaux, filieres, filteredFilieres]);

  const columns = [
    { field: 'code_ue', label: 'UE', render: (r) => <strong>{r.code_ue || r.ue?.code_ue || '-'}</strong> },
    { field: 'classe', label: 'Classe', render: (r) => r.classe ? <Chip label={r.classe} size="small" variant="outlined" sx={{ fontWeight: 600 }} /> : '-' },
    { field: 'titre_chapitre', label: 'Chapitre' },
    { field: 'date_cours', label: 'Date' },
    {
      field: 'type_seance',
      label: 'Type',
      render: (r) => (
        <Chip
          label={r.type_seance}
          size="small"
          sx={{
            bgcolor: r.type_seance === 'CM' ? '#001EA614' : r.type_seance === 'TD' ? '#3B82F614' : '#F7B01614',
            color: r.type_seance === 'CM' ? '#001EA6' : r.type_seance === 'TD' ? '#3B82F6' : '#F7B016',
            fontWeight: 600,
          }}
        />
      ),
    },
    { field: 'nom_enseignant', label: 'Enseignant', render: (r) => r.nom_enseignant || `${r.enseignant?.first_name || ''} ${r.enseignant?.last_name || ''}` },
    { field: 'nom_delegue', label: 'Delegue', render: (r) => r.nom_delegue || `${r.delegue?.first_name || ''} ${r.delegue?.last_name || ''}` },
    { field: 'statut', label: 'Statut', render: (r) => <StatusBadge status={r.statut} /> },
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
      <PageHeader title="Toutes les fiches" description="Vue globale de toutes les fiches de suivi" />

      {/* Filtres hierarchiques */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#7E7E7E' }}>
            Filtrer par structure
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                select
                fullWidth
                label="Departement"
                value={selectedDept}
                onChange={(e) => handleDeptChange(e.target.value)}
                size="small"
              >
                <MenuItem value="">Tous les departements</MenuItem>
                {departements.map((d) => (
                  <MenuItem key={d.id} value={d.id}>{d.nom_departement}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                select
                fullWidth
                label="Filiere"
                value={selectedFiliere}
                onChange={(e) => handleFiliereChange(e.target.value)}
                size="small"
                disabled={filteredFilieres.length === 0}
              >
                <MenuItem value="">Toutes les filieres</MenuItem>
                {filteredFilieres.map((f) => (
                  <MenuItem key={f.id} value={f.id}>{f.nom_filiere}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                select
                fullWidth
                label="Niveau"
                value={selectedNiveau}
                onChange={(e) => setSelectedNiveau(e.target.value)}
                size="small"
                disabled={filteredNiveaux.length === 0}
              >
                <MenuItem value="">Tous les niveaux</MenuItem>
                {filteredNiveaux.map((n) => (
                  <MenuItem key={n.id} value={n.id}>{n.nom_niveau}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ px: 3, pt: 2 }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)}>
              <Tab label="Toutes" value="ALL" sx={{ textTransform: 'none', fontWeight: 600 }} />
              <Tab label="Soumises" value="SOUMISE" sx={{ textTransform: 'none', fontWeight: 600 }} />
              <Tab label="Validees" value="VALIDEE" sx={{ textTransform: 'none', fontWeight: 600 }} />
              <Tab label="Refusees" value="REFUSEE" sx={{ textTransform: 'none', fontWeight: 600 }} />
            </Tabs>
          </Box>
          <DataTable
            columns={columns}
            rows={filtered}
            searchFields={['titre_chapitre', 'code_ue', 'nom_enseignant', 'nom_delegue']}
            onRowClick={(row) => setSelected(row)}
          />
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        {selected && (
          <>
            <DialogTitle sx={{ fontWeight: 700 }}>
              {selected.titre_chapitre}
              <Box sx={{ mt: 1 }}><StatusBadge status={selected.statut} /></Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 0 }}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" sx={{ color: '#7E7E7E' }}>UE</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{selected.code_ue || selected.ue?.code_ue}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" sx={{ color: '#7E7E7E' }}>Classe</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{selected.classe || '-'}{selected.semestre ? ` (S${selected.semestre})` : ''}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" sx={{ color: '#7E7E7E' }}>Type</Typography>
                  <Typography variant="body2">{selected.type_seance}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" sx={{ color: '#7E7E7E' }}>Date</Typography>
                  <Typography variant="body2">{selected.date_cours}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" sx={{ color: '#7E7E7E' }}>Horaire</Typography>
                  <Typography variant="body2">{selected.heure_debut} - {selected.heure_fin}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" sx={{ color: '#7E7E7E' }}>Salle</Typography>
                  <Typography variant="body2">{selected.salle || '-'}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" sx={{ color: '#7E7E7E' }}>Duree</Typography>
                  <Typography variant="body2">{selected.duree || '-'}h</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" sx={{ color: '#7E7E7E' }}>Enseignant</Typography>
                  <Typography variant="body2">{selected.nom_enseignant || '-'}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" sx={{ color: '#7E7E7E' }}>Delegue</Typography>
                  <Typography variant="body2">{selected.nom_delegue || '-'}</Typography>
                </Grid>
              </Grid>
              {selected.contenu_aborde && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="caption" sx={{ color: '#7E7E7E' }}>Contenu aborde</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{selected.contenu_aborde}</Typography>
                </>
              )}
              {selected.motif_refus && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ p: 2, bgcolor: '#FEE2E2', borderRadius: 2 }}>
                    <Typography variant="caption" sx={{ color: '#DC2626' }}>Motif du refus</Typography>
                    <Typography variant="body2" sx={{ color: '#DC2626' }}>{selected.motif_refus}</Typography>
                  </Box>
                </>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setSelected(null)}>Fermer</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
