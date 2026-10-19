import { useCallback, useEffect, useState } from 'react';
import {
  Box, Button, Card, CardContent, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Stack, TextField, Typography,
} from '@mui/material';
import { CheckCircle, Close, HourglassEmpty } from '@mui/icons-material';
import { usersService } from '../../api/services';
import toast from 'react-hot-toast';

/**
 * Classes declarees par les delegues, en attente de validation.
 *
 * Une classe reelit son delegue chaque annee : les mandats ne sont pas
 * reconduits, chacun redeclare la sienne a l'ouverture de l'annee. C'est ici
 * que le chef tranche.
 *
 * La classe de l'annee precedente est rappelee en regard : un delegue qui
 * passe de L3 a M1 est attendu, un saut de filiere l'est moins.
 */
export default function MandatsAValider({ onChange }) {
  const [mandats, setMandats] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [refus, setRefus] = useState(null);
  const [motif, setMotif] = useState('');
  const [enCours, setEnCours] = useState(false);

  const charger = useCallback(async () => {
    try {
      const res = await usersService.mandatsEnAttente();
      setMandats(Array.isArray(res.data) ? res.data : []);
    } catch {
      // Un chef sans departement ou une annee non ouverte : rien a montrer.
      setMandats([]);
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const approuver = async (mandat) => {
    setEnCours(true);
    try {
      await usersService.approuverMandat(mandat.utilisateur_id);
      toast.success(`Classe de ${mandat.nom_complet} validee`);
      await charger();
      onChange?.();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Erreur lors de la validation');
    } finally {
      setEnCours(false);
    }
  };

  const confirmerRefus = async () => {
    if (!motif.trim()) return;
    setEnCours(true);
    try {
      await usersService.refuserMandat(refus.utilisateur_id, motif.trim());
      toast.success('Classe refusee');
      setRefus(null);
      setMotif('');
      await charger();
      onChange?.();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Erreur lors du refus');
    } finally {
      setEnCours(false);
    }
  };

  if (chargement) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={24} /></Box>;
  }
  // Rien a valider : la section disparait plutot que d'afficher un vide.
  if (mandats.length === 0) return null;

  return (
    <>
      <Card sx={{ mb: 3, borderLeft: 'none' }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
            <HourglassEmpty sx={{ color: '#C88A04' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Classes a valider
            </Typography>
            <Chip size="small" label={mandats.length} sx={{ bgcolor: '#FBF0D8', color: '#9A6A00', fontWeight: 700 }} />
          </Stack>
          <Typography variant="body2" sx={{ color: '#7E7E7E', mb: 2.5 }}>
            Ces delegues ont declare la classe qu&apos;ils representent cette annee.
            Tant qu&apos;elle n&apos;est pas validee, ils ne peuvent soumettre aucune fiche.
          </Typography>

          <Stack spacing={1.5}>
            {mandats.map((m) => (
              <Box
                key={m.id}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap',
                  p: 2, borderRadius: 2, bgcolor: '#FAFBFE', border: '1px solid #EDF0F7',
                }}
              >
                <Box sx={{ flex: 1, minWidth: 220 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{m.nom_complet}</Typography>
                  <Typography variant="body2" sx={{ color: '#7E7E7E' }}>{m.email}</Typography>
                </Box>
                <Box sx={{ minWidth: 200 }}>
                  <Typography variant="caption" sx={{ color: '#7E7E7E' }}>Classe declaree</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#001EA6' }}>
                    {m.classe_demandee}
                  </Typography>
                  {m.classe_precedente && (
                    <Typography variant="caption" sx={{ color: '#7E7E7E' }}>
                      L&apos;an passe : {m.classe_precedente}
                    </Typography>
                  )}
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small" variant="contained" startIcon={<CheckCircle />}
                    disabled={enCours} onClick={() => approuver(m)}
                  >
                    Valider
                  </Button>
                  <Button
                    size="small" variant="outlined" color="error" startIcon={<Close />}
                    disabled={enCours} onClick={() => { setRefus(m); setMotif(''); }}
                  >
                    Refuser
                  </Button>
                </Stack>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>

      <Dialog open={!!refus} onClose={() => setRefus(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Refuser la classe declaree</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#525252', mb: 2 }}>
            {refus?.nom_complet} sera prevenu et pourra declarer une autre classe.
            Le motif lui sera transmis.
          </Typography>
          <TextField
            label="Motif du refus"
            fullWidth multiline rows={3} autoFocus
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder="Cette classe a deja un delegue."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRefus(null)} color="inherit">Annuler</Button>
          <Button
            variant="contained" color="error"
            disabled={!motif.trim() || enCours}
            onClick={confirmerRefus}
          >
            Refuser
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
