import { useState, useMemo, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Delete, PlaylistAddCheck } from '@mui/icons-material';

const COULEUR_STATUT = {
  ok: { label: 'A creer', bg: '#E8F5E9', fg: '#2E7D32' },
  doublon: { label: 'Deja presente', bg: '#F5F5F5', fg: '#757575' },
  parent_absent: { label: 'Rattachement manquant', bg: '#FFF4E5', fg: '#B26A00' },
  erreur: { label: 'Erreur', bg: '#FDECEA', fg: '#B3261E' },
};

/**
 * Apercu modifiable d'un import, avant ecriture en base.
 *
 * Alimente par la simulation du serveur (`dry_run`), il laisse l'administrateur
 * corriger les valeurs, affecter chaque ligne a son parent et retirer ce qui ne
 * doit pas etre importe. Les lignes validees repartent au serveur sous forme
 * JSON, avec des identifiants explicites : plus aucune resolution approximative.
 *
 * Props :
 *   ouvert          - visibilite
 *   onFermer        - fermeture sans importer
 *   lignes          - reponse de la simulation ({ lignes: [...] })
 *   colonnes        - [{ cle, libelle }] colonnes editables
 *   parentLibelle   - intitule de la colonne de rattachement (ex. "Departement")
 *   parentOptions   - [{ id, libelle }] parents selectionnables
 *   autoriserCreationParent - propose de creer un parent absent
 *   onValider       - (rows) => Promise ; rows au format attendu par l'API
 */
export default function ImportPreviewDialog({
  ouvert,
  onFermer,
  lignes: lignesInitiales,
  colonnes = [],
  parentLibelle,
  parentOptions = [],
  autoriserCreationParent = true,
  onValider,
}) {
  const [lignes, setLignes] = useState([]);
  const [envoi, setEnvoi] = useState(false);
  const [affectationGroupee, setAffectationGroupee] = useState('');

  useEffect(() => {
    if (!ouvert) return;
    setLignes(
      (lignesInitiales?.lignes || []).map((l, i) => ({
        _id: i,
        ligne: l.ligne,
        valeurs: { ...l.valeurs },
        parentId: l.parent?.id ?? '',
        parentLibelleFichier: l.parent?.libelle || '',
        creerParent: false,
        statut: l.statut,
        message: l.message,
      }))
    );
    setAffectationGroupee('');
  }, [ouvert, lignesInitiales]);

  const majLigne = (id, champ, valeur) => {
    setLignes((prev) =>
      prev.map((l) => {
        if (l._id !== id) return l;
        if (champ === 'parentId') {
          // Rattacher resout le probleme signale par la simulation.
          return {
            ...l,
            parentId: valeur,
            creerParent: false,
            statut: l.statut === 'parent_absent' && valeur ? 'ok' : l.statut,
          };
        }
        if (champ === 'creerParent') {
          return {
            ...l,
            creerParent: valeur,
            statut: l.statut === 'parent_absent' && valeur ? 'ok' : l.statut,
          };
        }
        return { ...l, valeurs: { ...l.valeurs, [champ]: valeur } };
      })
    );
  };

  const affecterToutes = (id) => {
    setAffectationGroupee(id);
    setLignes((prev) =>
      prev.map((l) => ({
        ...l,
        parentId: id,
        creerParent: false,
        statut: l.statut === 'parent_absent' ? 'ok' : l.statut,
      }))
    );
  };

  const retirer = (id) => setLignes((prev) => prev.filter((l) => l._id !== id));

  const bloquantes = useMemo(
    () => lignes.filter((l) => l.statut === 'parent_absent' || l.statut === 'erreur'),
    [lignes]
  );
  const aCreer = useMemo(() => lignes.filter((l) => l.statut === 'ok'), [lignes]);

  const valider = async () => {
    setEnvoi(true);
    try {
      // Les doublons sont transmis aussi : le serveur les ignorera, ce qui
      // garde le rapport final coherent avec ce que l'administrateur a vu.
      const rows = lignes
        .filter((l) => l.statut !== 'erreur')
        .map((l) => ({
          ligne: l.ligne,
          valeurs: l.valeurs,
          ...(l.parentId ? { parent_id: l.parentId } : {}),
          ...(l.creerParent ? { creer_parent: true } : {}),
        }));
      await onValider(rows);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <Dialog open={ouvert} onClose={() => !envoi && onFermer()} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        Verifiez avant d&apos;importer
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {lignes.length} ligne(s) lue(s). Rien n&apos;est encore enregistre : corrigez les
          valeurs et affectez les rattachements, puis validez.
        </Typography>
      </DialogTitle>

      <DialogContent>
        {bloquantes.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {bloquantes.length} ligne(s) sans rattachement. Choisissez un {parentLibelle?.toLowerCase()}
            {autoriserCreationParent ? ', cochez « creer »' : ''}, ou retirez la ligne.
          </Alert>
        )}

        {parentOptions.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <PlaylistAddCheck sx={{ color: '#001EA6' }} />
            <FormControl size="small" sx={{ minWidth: 300 }}>
              <InputLabel>Affecter toutes les lignes a...</InputLabel>
              <Select
                value={affectationGroupee}
                label="Affecter toutes les lignes a..."
                onChange={(e) => affecterToutes(e.target.value)}
              >
                {parentOptions.map((o) => (
                  <MenuItem key={o.id} value={o.id}>{o.libelle}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        <TableContainer sx={{ maxHeight: 460, border: '1px solid #EEE', borderRadius: 1 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, width: 60 }}>Ligne</TableCell>
                {colonnes.map((c) => (
                  <TableCell key={c.cle} sx={{ fontWeight: 700 }}>{c.libelle}</TableCell>
                ))}
                {parentLibelle && (
                  <TableCell sx={{ fontWeight: 700, minWidth: 220 }}>{parentLibelle}</TableCell>
                )}
                <TableCell sx={{ fontWeight: 700 }}>Etat</TableCell>
                <TableCell sx={{ width: 50 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {lignes.map((l) => {
                const st = COULEUR_STATUT[l.statut] || COULEUR_STATUT.erreur;
                return (
                  <TableRow key={l._id} hover>
                    <TableCell>{l.ligne}</TableCell>

                    {colonnes.map((c) => (
                      <TableCell key={c.cle}>
                        <TextField
                          variant="standard"
                          fullWidth
                          value={l.valeurs[c.cle] ?? ''}
                          onChange={(e) => majLigne(l._id, c.cle, e.target.value)}
                        />
                      </TableCell>
                    ))}

                    {parentLibelle && (
                      <TableCell>
                        <FormControl size="small" fullWidth>
                          <Select
                            displayEmpty
                            value={l.parentId || ''}
                            onChange={(e) => majLigne(l._id, 'parentId', e.target.value)}
                            variant="standard"
                          >
                            <MenuItem value="">
                              <em>{l.parentLibelleFichier || 'Non affecte'}</em>
                            </MenuItem>
                            {parentOptions.map((o) => (
                              <MenuItem key={o.id} value={o.id}>{o.libelle}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        {autoriserCreationParent && !l.parentId && l.parentLibelleFichier && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <Checkbox
                              size="small"
                              checked={l.creerParent}
                              onChange={(e) => majLigne(l._id, 'creerParent', e.target.checked)}
                            />
                            <Typography variant="caption" color="text.secondary">
                              Creer « {l.parentLibelleFichier} »
                            </Typography>
                          </Box>
                        )}
                      </TableCell>
                    )}

                    <TableCell>
                      <Tooltip title={l.message || ''} placement="left">
                        <Chip
                          size="small"
                          label={st.label}
                          sx={{ bgcolor: st.bg, color: st.fg, fontWeight: 600 }}
                        />
                      </Tooltip>
                    </TableCell>

                    <TableCell>
                      <IconButton size="small" onClick={() => retirer(l._id)}>
                        <Delete fontSize="small" sx={{ color: '#EF4444' }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">
          {aCreer.length} a enregistrer
          {bloquantes.length > 0 && ` — ${bloquantes.length} en attente de rattachement`}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={onFermer} color="inherit" disabled={envoi}>
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={valider}
            disabled={envoi || bloquantes.length > 0 || lignes.length === 0}
            sx={{ minWidth: 160, bgcolor: '#001EA6', '&:hover': { bgcolor: '#001080' } }}
          >
            {envoi ? <CircularProgress size={22} color="inherit" /> : 'Importer'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
