import { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { School, MenuBook, Person } from '@mui/icons-material';
import toast from 'react-hot-toast';
import RoleBadge from './RoleBadge';
import StatusBadge from './StatusBadge';
import { niveauxService, usersService } from '../../api/services';

/**
 * Detail complet d'un utilisateur, et modification de sa classe.
 *
 * Un chef examinant une demande d'inscription ne voyait que le nom, l'email et
 * le role : rien n'indiquait de quelle classe relevait le delegue, alors que
 * c'est precisement ce qui fonde la decision d'approuver ou non.
 *
 * Props :
 *   ouvert       - visibilite
 *   onFermer     - fermeture
 *   utilisateur  - objet renvoye par l'API (porte `classe` et `enseignements`)
 *   onEnregistre - appele apres une modification, pour rafraichir la liste
 */
export default function UserDetailDialog({ ouvert, onFermer, utilisateur, onEnregistre }) {
  const [niveaux, setNiveaux] = useState([]);
  const [niveauChoisi, setNiveauChoisi] = useState('');
  const [enregistrement, setEnregistrement] = useState(false);

  const estDelegue = utilisateur?.roles?.some(
    (r) => (r.nom_role || r) === 'Délégué' || (r.nom_role || r) === 'Delegue'
  );

  useEffect(() => {
    if (!ouvert || !utilisateur) return;
    setNiveauChoisi(utilisateur.classe?.niveau_id || utilisateur.niveau_represente || '');
    if (!estDelegue) return;
    niveauxService
      .getAll()
      .then((res) => setNiveaux(res.data))
      .catch(() => toast.error('Impossible de charger la liste des classes'));
  }, [ouvert, utilisateur, estDelegue]);

  if (!utilisateur) return null;

  const modifie =
    estDelegue && niveauChoisi && niveauChoisi !== (utilisateur.classe?.niveau_id ?? null);

  const enregistrer = async () => {
    setEnregistrement(true);
    try {
      await usersService.update(utilisateur.id, { niveau_represente: niveauChoisi });
      toast.success('Classe mise a jour');
      onEnregistre?.();
      onFermer();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Modification impossible');
    } finally {
      setEnregistrement(false);
    }
  };

  const Ligne = ({ libelle, valeur }) => (
    <Box sx={{ display: 'flex', gap: 2, py: 0.75 }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 150 }}>
        {libelle}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {valeur || '—'}
      </Typography>
    </Box>
  );

  return (
    <Dialog open={ouvert} onClose={onFermer} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Person sx={{ color: '#001EA6' }} />
        {utilisateur.first_name} {utilisateur.last_name}
      </DialogTitle>

      <DialogContent>
        <Ligne libelle="Adresse email" valeur={utilisateur.email} />
        <Box sx={{ display: 'flex', gap: 2, py: 0.75, alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 150 }}>
            Roles
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {utilisateur.roles?.map((r, i) => <RoleBadge key={i} role={r.nom_role || r} />)}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, py: 0.75, alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 150 }}>
            Statut
          </Typography>
          <StatusBadge status={utilisateur.statut} />
        </Box>
        <Ligne
          libelle="Connexion"
          valeur={utilisateur.auth_provider === 'google' ? 'Google' : 'Mot de passe'}
        />

        {estDelegue && (
          <>
            <Divider sx={{ my: 2 }}>
              <Chip icon={<School />} label="Classe representee" size="small" />
            </Divider>

            {utilisateur.classe ? (
              <Ligne libelle="Rattachement actuel" valeur={utilisateur.classe.libelle} />
            ) : (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Ce delegue n&apos;est rattache a aucune classe. Choisissez-en une avant
                d&apos;approuver sa demande.
              </Alert>
            )}

            <FormControl fullWidth size="small" sx={{ mt: 1 }}>
              <InputLabel>Classe representee</InputLabel>
              <Select
                value={niveauChoisi}
                label="Classe representee"
                onChange={(e) => setNiveauChoisi(e.target.value)}
              >
                {niveaux.map((n) => (
                  <MenuItem key={n.id} value={n.id}>
                    {n.nom_filiere ? `${n.nom_filiere} > ${n.nom_niveau}` : n.nom_niveau}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </>
        )}

        {utilisateur.enseignements && (
          <>
            <Divider sx={{ my: 2 }}>
              <Chip icon={<MenuBook />} label="Enseignements" size="small" />
            </Divider>
            <Ligne
              libelle="Unites enseignees"
              valeur={`${utilisateur.enseignements.nombre_ues} UE(s)`}
            />
            <Ligne
              libelle="Niveaux couverts"
              valeur={utilisateur.enseignements.niveaux?.join(', ')}
            />
            {utilisateur.enseignements.ues?.length > 0 && (
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                {utilisateur.enseignements.ues.map((ue) => (
                  <Chip key={ue.id} size="small" variant="outlined" label={ue.code} />
                ))}
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onFermer} color="inherit">Fermer</Button>
        {estDelegue && (
          <Button
            variant="contained"
            onClick={enregistrer}
            disabled={!modifie || enregistrement}
            sx={{ minWidth: 150, bgcolor: '#001EA6', '&:hover': { bgcolor: '#001080' } }}
          >
            {enregistrement ? <CircularProgress size={22} color="inherit" /> : 'Enregistrer'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
