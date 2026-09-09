import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Typography,
} from '@mui/material';
import { School, Info } from '@mui/icons-material';
import toast from 'react-hot-toast';
import ImportPanel from '../../../components/common/ImportPanel';
import { usersService, whitelistService, departementsService } from '../../../api/services';

/**
 * Etape « Enseignants » du wizard de configuration.
 *
 * Elle precede l'etape UEs : sans comptes enseignants, les affectations
 * importees avec les UEs ne peuvent aboutir.
 */
export default function StepEnseignants({ onNext, onBack }) {
  const [enseignants, setEnseignants] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [departement, setDepartement] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [usrRes, deptRes] = await Promise.all([
        usersService.getAll(),
        departementsService.getAll(),
      ]);
      setEnseignants(
        usrRes.data.filter((u) =>
          (u.roles_details || u.roles || []).some(
            (r) => (typeof r === 'object' ? r.nom_role : r) === 'Enseignant'
          )
        )
      );
      setDepartements(deptRes.data);
      if (deptRes.data.length === 1) setDepartement(deptRes.data[0].id);
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={180} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Enseignants
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Creez les comptes enseignants avant d'importer les unites d'enseignement :
        les affectations UE / enseignant ne peuvent aboutir que si les comptes existent.
      </Typography>

      <ImportPanel
        titre="Comptes enseignants"
        description={
          "Chaque enseignant recoit un compte actif dont le mot de passe initial est " +
          "sa propre adresse email. Un compte deja existant n'est pas modifie."
        }
        colonnes={[
          { cle: 'email', requis: true, exemple: 'enseignant@exemple.cm' },
          { cle: 'nom_complet', exemple: 'Adamou Hamza' },
        ]}
        colonnesApercu={[
          { cle: 'email', libelle: 'Adresse email' },
          { cle: 'nom_complet', libelle: 'Nom complet' },
        ]}
        onSimuler={(file) => usersService.simulerEnseignants(file)}
        onValiderLignes={(rows) => usersService.importerEnseignantsLignes(rows)}
        onDone={load}
      />

      <ImportPanel
        titre="Emails autorises (whitelist)"
        description={
          'Optionnel. Les emails autorises permettent une activation automatique ' +
          'des comptes crees ulterieurement par les interesses eux-memes.'
        }
        colonnes={[
          { cle: 'email', requis: true, exemple: 'enseignant@exemple.cm' },
          { cle: 'role', exemple: 'ENSEIGNANT' },
          { cle: 'nom_complet', exemple: 'Adamou Hamza' },
        ]}
        disabled={!departement}
        raisonBlocage="Choisissez d'abord le departement de rattachement."
        colonnesApercu={[
          { cle: 'email', libelle: 'Adresse email' },
          { cle: 'role', libelle: 'Role' },
        ]}
        onSimuler={(file) => whitelistService.simuler(file, departement)}
        onValiderLignes={(rows) => whitelistService.importerLignes(rows, departement)}
        onDone={load}
      />

      {departements.length > 0 && (
        <FormControl size="small" sx={{ minWidth: 280, mb: 3 }}>
          <InputLabel>Departement de rattachement</InputLabel>
          <Select
            value={departement}
            label="Departement de rattachement"
            onChange={(e) => setDepartement(e.target.value)}
          >
            {departements.map((d) => (
              <MenuItem key={d.id} value={d.id}>{d.nom_departement}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      <Card sx={{ mb: 2, bgcolor: enseignants.length ? '#F1F8F2' : '#F5F7FA' }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
          <School sx={{ color: enseignants.length ? '#2E7D32' : '#7E7E7E' }} />
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {enseignants.length} compte(s) enseignant
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {enseignants.length
                ? 'Vous pouvez passer aux unites d\'enseignement.'
                : "Aucun compte pour l'instant : les affectations resteront vides."}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {enseignants.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 3 }}>
          {enseignants.slice(0, 12).map((e) => (
            <Chip key={e.id} size="small" label={e.email} variant="outlined" />
          ))}
          {enseignants.length > 12 && (
            <Chip size="small" label={`+ ${enseignants.length - 12} autres`} />
          )}
        </Box>
      )}

      <Box
        sx={{
          display: 'flex', alignItems: 'flex-start', gap: 1, mb: 3,
          p: 1.5, borderRadius: 2, bgcolor: '#FFF8E1',
        }}
      >
        <Info sx={{ color: '#B26A00', fontSize: 20, mt: 0.2 }} />
        <Typography variant="caption" color="text.secondary">
          Le mot de passe initial etant l'adresse email, invitez les enseignants a le
          changer des leur premiere connexion, ou a utiliser la connexion Google.
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button variant="outlined" onClick={onBack}>
          Precedent
        </Button>
        <Button
          variant="contained"
          onClick={onNext}
          sx={{ minWidth: 160, bgcolor: '#001EA6', '&:hover': { bgcolor: '#001080' } }}
        >
          {enseignants.length ? 'Suivant' : 'Passer cette etape'}
        </Button>
      </Box>
    </Box>
  );
}
