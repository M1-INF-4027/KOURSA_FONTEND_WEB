import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Chip,
  Divider,
  TextField,
  Skeleton,
  IconButton,
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle,
  Cancel,
  CalendarToday,
  AccessTime,
  Room,
  Person,
  MenuBook,
  School,
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import PasswordDialog from '../../components/common/PasswordDialog';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { fichesSuiviService } from '../../api/services';
import toast from 'react-hot-toast';

function InfoRow({ icon, label, value }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
      <Box sx={{ color: '#7E7E7E' }}>{icon}</Box>
      <Box>
        <Typography variant="caption" sx={{ color: '#7E7E7E' }}>{label}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>{value || '-'}</Typography>
      </Box>
    </Box>
  );
}

export default function FicheDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [fiche, setFiche] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [refuseOpen, setRefuseOpen] = useState(false);
  const [motifRefus, setMotifRefus] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fichesSuiviService.getById(id);
        setFiche(res.data);
      } catch {
        toast.error('Fiche introuvable');
        navigate('/fiches');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleValider = async (validationToken) => {
    setActionLoading(true);
    try {
      const res = await fichesSuiviService.valider(id, validationToken);
      setFiche(res.data);
      toast.success('Fiche validee avec succes');
    } catch {
      toast.error('Erreur lors de la validation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefuser = async () => {
    if (!motifRefus.trim()) {
      toast.error('Veuillez indiquer un motif de refus');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fichesSuiviService.refuser(id, motifRefus);
      setFiche(res.data);
      setRefuseOpen(false);
      setMotifRefus('');
      toast.success('Fiche refusee');
    } catch {
      toast.error('Erreur lors du refus');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={48} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={400} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  if (!fiche) return null;

  return (
    <Box className="fade-in">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton onClick={() => navigate('/fiches')}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Detail de la fiche</Typography>
        </Box>
        <StatusBadge status={fiche.statut} />
      </Box>

      <Grid container spacing={3}>
        {/* Main Info */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                {fiche.titre_chapitre}
              </Typography>

              <Chip
                label={fiche.type_seance}
                size="small"
                sx={{
                  mb: 3,
                  bgcolor: fiche.type_seance === 'CM' ? '#001EA614' : fiche.type_seance === 'TD' ? '#3B82F614' : '#F7B01614',
                  color: fiche.type_seance === 'CM' ? '#001EA6' : fiche.type_seance === 'TD' ? '#3B82F6' : '#F7B016',
                  fontWeight: 600,
                }}
              />

              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <InfoRow icon={<CalendarToday fontSize="small" />} label="Date du cours" value={fiche.date_cours} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <InfoRow icon={<AccessTime fontSize="small" />} label="Horaire" value={`${fiche.heure_debut} - ${fiche.heure_fin}`} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <InfoRow icon={<Room fontSize="small" />} label="Salle" value={fiche.salle} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <InfoRow icon={<MenuBook fontSize="small" />} label="UE" value={`${fiche.code_ue || fiche.ue?.code_ue || ''} - ${fiche.nom_ue || fiche.ue?.libelle_ue || ''}`} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <InfoRow icon={<School fontSize="small" />} label="Classe" value={`${fiche.classe || '-'}${fiche.semestre ? ` (S${fiche.semestre})` : ''}`} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <InfoRow icon={<Person fontSize="small" />} label="Enseignant" value={fiche.nom_enseignant || `${fiche.enseignant?.first_name || ''} ${fiche.enseignant?.last_name || ''}`} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <InfoRow icon={<Person fontSize="small" />} label="Delegue" value={fiche.nom_delegue || `${fiche.delegue?.first_name || ''} ${fiche.delegue?.last_name || ''}`} />
                </Grid>
              </Grid>

              {fiche.contenu_aborde && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" sx={{ color: '#7E7E7E', mb: 1 }}>Contenu aborde</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{fiche.contenu_aborde}</Typography>
                </>
              )}

              {fiche.statut === 'REFUSEE' && fiche.motif_refus && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ p: 2, bgcolor: '#FEE2E2', borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: '#DC2626', mb: 0.5 }}>Motif du refus</Typography>
                    <Typography variant="body2" sx={{ color: '#DC2626' }}>{fiche.motif_refus}</Typography>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Actions */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Actions</Typography>

              {fiche.statut === 'SOUMISE' ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<CheckCircle />}
                    onClick={() => setPwdOpen(true)}
                    disabled={actionLoading}
                    sx={{ bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' } }}
                  >
                    Valider la fiche
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Cancel />}
                    onClick={() => setRefuseOpen(true)}
                    disabled={actionLoading}
                    color="error"
                  >
                    Refuser la fiche
                  </Button>
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: '#7E7E7E', textAlign: 'center' }}>
                  {fiche.statut === 'VALIDEE' ? 'Cette fiche a ete validee.' : 'Cette fiche a ete refusee.'}
                </Typography>
              )}

              <Divider sx={{ my: 2 }} />

              <Box>
                <Typography variant="caption" sx={{ color: '#7E7E7E' }}>Date de soumission</Typography>
                <Typography variant="body2">{fiche.date_soumission || '-'}</Typography>
              </Box>
              {fiche.date_validation && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" sx={{ color: '#7E7E7E' }}>Date de validation</Typography>
                  <Typography variant="body2">{fiche.date_validation}</Typography>
                </Box>
              )}
              {fiche.duree && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" sx={{ color: '#7E7E7E' }}>Duree</Typography>
                  <Typography variant="body2">{fiche.duree}h</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Password Dialog for Validation */}
      <PasswordDialog
        open={pwdOpen}
        onClose={() => setPwdOpen(false)}
        onConfirm={handleValider}
        title="Confirmer la validation"
      />

      {/* Refusal Dialog */}
      <ConfirmDialog
        open={refuseOpen}
        onClose={() => { setRefuseOpen(false); setMotifRefus(''); }}
        onConfirm={handleRefuser}
        title="Refuser la fiche"
        message={
          <Box>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Veuillez indiquer le motif du refus :
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Motif du refus..."
              value={motifRefus}
              onChange={(e) => setMotifRefus(e.target.value)}
            />
          </Box>
        }
        confirmText="Refuser"
        confirmColor="error"
      />
    </Box>
  );
}
