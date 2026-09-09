import { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import toast from 'react-hot-toast';
import ImportPanel from '../../../components/common/ImportPanel';
import {
  configurationService,
  filieresService,
  unitesEnseignementService,
  usersService,
} from '../../../api/services';

/**
 * Etape « Reconduction », facultative.
 *
 * Affichee uniquement lorsqu'une annee precedente contient des donnees : elle
 * propose de reprendre sa structure plutot que de tout ressaisir, ou d'importer
 * directement les programmes si ceux-ci changent.
 */
export default function StepReconduction({ anneeId, onNext, onBack }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  // Import : alternative a la reconduction, pour une annee dont le programme change.
  const [filieres, setFilieres] = useState([]);
  const [filiereImport, setFiliereImport] = useState('');
  const [nbUes, setNbUes] = useState(0);
  const [enseignants, setEnseignants] = useState([]);

  const chargerContexte = async () => {
    try {
      const [filRes, ueRes, usrRes] = await Promise.all([
        filieresService.getAll(),
        unitesEnseignementService.getByAnnee(anneeId),
        usersService.getAll(),
      ]);
      setEnseignants(
        usrRes.data.filter((u) =>
          (u.roles || []).some((r) => (typeof r === 'object' ? r.nom_role : r) === 'Enseignant')
        )
      );
      setFilieres(filRes.data);
      setFiliereImport((prev) => prev || (filRes.data.length === 1 ? filRes.data[0].id : ''));
      setNbUes(ueRes.data.length);
    } catch {
      // Contexte optionnel : l'etape reste utilisable sans lui.
    }
  };

  useEffect(() => { chargerContexte(); }, [anneeId]);

  const handleReconduire = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await configurationService.reconduire(anneeId);
      setSummary(res.data);
      setDone(true);
      toast.success('Reconduction effectuee avec succes');
    } catch (err) {
      const detail = err.response?.data;
      if (detail && typeof detail === 'object') {
        const messages = Object.values(detail).flat().join(', ');
        setError(messages || 'Erreur lors de la reconduction');
      } else {
        setError('Erreur lors de la reconduction');
      }
      toast.error('Erreur lors de la reconduction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Reconduction des donnees
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Vous pouvez reconduire la structure academique (facultes, departements, filieres, niveaux,
        UEs) depuis l'annee precedente. Cette etape est facultative.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!done && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 3 }}>
          <Button
            variant="contained"
            onClick={handleReconduire}
            disabled={loading}
            sx={{
              minWidth: 300,
              bgcolor: '#001EA6',
              '&:hover': { bgcolor: '#001080' },
            }}
          >
            {loading ? (
              <CircularProgress size={22} color="inherit" />
            ) : (
              "Reconduire depuis l'annee precedente"
            )}
          </Button>
          <Typography variant="caption" color="text.secondary">
            Les programmes, UEs et assignations seront copies vers la nouvelle annee.
          </Typography>
        </Box>
      )}

      {done && summary && (
        <Box sx={{ mb: 3 }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            La reconduction a ete effectuee avec succes.
          </Alert>
          <Card variant="outlined" sx={{ bgcolor: '#F5F7FA' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 1.5, color: '#001EA6', fontWeight: 700 }}>
                Resume de la reconduction
              </Typography>
              {typeof summary === 'object' && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {Object.entries(summary).map(([key, value]) => (
                    <Chip
                      key={key}
                      label={`${key.replace(/_/g, ' ')}: ${value}`}
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Box>
              )}
              {typeof summary === 'string' && (
                <Typography variant="body2">{summary}</Typography>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      <Divider sx={{ my: 3 }}>
        <Chip label="ou importer les programmes" size="small" />
      </Divider>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Si le programme change d'une annee sur l'autre, importez directement les
        unites d'enseignement plutot que de les reconduire. La structure academique,
        les salles et les comptes enseignants restent acquis.
      </Typography>

      {filieres.length > 0 && (
        <FormControl size="small" sx={{ minWidth: 280, mb: 2 }}>
          <InputLabel>Filiere des fichiers importes</InputLabel>
          <Select
            value={filiereImport}
            label="Filiere des fichiers importes"
            onChange={(e) => setFiliereImport(e.target.value)}
          >
            {filieres.map((f) => (
              <MenuItem key={f.id} value={f.id}>{f.nom_filiere}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      <ImportPanel
        titre="Unites d'enseignement"
        prerequis={[
          { libelle: `${filieres.length} filiere(s)`, ok: filieres.length > 0 },
        ]}
        description="Les UEs sont rattachees aux semestres de la nouvelle annee."
        colonnes={[
          { cle: 'code', requis: true, exemple: 'INF3111' },
          { cle: 'libelle', requis: true, exemple: 'Compilation' },
          { cle: 'semestre', exemple: '1' },
          { cle: 'niveau', exemple: 'L3' },
        ]}
        avertissement={!filiereImport
          ? 'Sans filiere choisie, les niveaux deduits des codes UE ne seront pas '
            + 'rattaches. Les UEs, elles, seront bien creees.'
          : undefined}
        colonnesApercu={[
          { cle: 'code', libelle: 'Code' },
          { cle: 'libelle', libelle: 'Libelle' },
          { cle: 'semestre', libelle: 'Sem.' },
          { cle: 'niveau', libelle: 'Niveau' },
        ]}
        onSimuler={(file) =>
          unitesEnseignementService.simuler(file, {
            filiere: filiereImport,
            anneeAcademique: anneeId,
          })
        }
        onValiderLignes={(rows) =>
          unitesEnseignementService.importerLignes(rows, {
            filiere: filiereImport,
            anneeAcademique: anneeId,
          })
        }
        onDone={chargerContexte}
      />

      <ImportPanel
        titre="Affectations enseignant / UE"
        prerequis={[
          { libelle: `${nbUes} UE(s) pour cette annee`, ok: nbUes > 0 },
          { libelle: `${enseignants.length} compte(s) enseignant`, ok: enseignants.length > 0 },
        ]}
        colonnes={[
          { cle: 'code_ue', requis: true, exemple: 'INF3111' },
          { cle: 'enseignant_email', exemple: 'enseignant@exemple.cm' },
          { cle: 'enseignant_nom', exemple: 'ATSA' },
          { cle: 'semestre', exemple: '1' },
        ]}
        avertissement={nbUes === 0
          ? "Aucune UE pour cette annee : l'apercu signalera les lignes sans "
            + 'correspondance.'
          : undefined}
        colonnesApercu={[
          { cle: 'code', libelle: 'Code UE' },
          { cle: 'enseignant_email', libelle: 'Email enseignant' },
        ]}
        parentLibelle="Enseignant"
        parentOptions={enseignants.map((e) => ({ id: e.id, libelle: e.email }))}
        autoriserCreationParent={false}
        onSimuler={(file) =>
          unitesEnseignementService.simulerAffectations(file, {
            filiere: filiereImport,
            anneeAcademique: anneeId,
          })
        }
        onValiderLignes={(rows) =>
          unitesEnseignementService.importerAffectationsLignes(rows, {
            filiere: filiereImport,
            anneeAcademique: anneeId,
          })
        }
        onDone={chargerContexte}
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button variant="outlined" onClick={onBack}>
          Precedent
        </Button>
        <Button
          variant="contained"
          onClick={onNext}
          sx={{ minWidth: 160, bgcolor: '#001EA6', '&:hover': { bgcolor: '#001080' } }}
        >
          {done || nbUes > 0 ? 'Suivant' : 'Passer cette etape'}
        </Button>
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Step 3 -- Chefs de departement
// ---------------------------------------------------------------------------
