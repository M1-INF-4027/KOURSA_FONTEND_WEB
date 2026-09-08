import { useState, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Alert,
  AlertTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { FileUpload, FileDownload, CheckCircle, ErrorOutline } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

/**
 * Panneau d'import Excel reutilisable.
 *
 * Tous les endpoints d'import du backend repondent avec la meme forme
 * ({ created, updated, skipped, errors: [{ ligne, message }] }), ce qui permet
 * a ce composant de les traiter indifferemment.
 *
 * Props :
 *   titre        - intitule affiche
 *   description  - texte explicatif
 *   colonnes     - [{ cle, requis, exemple }] : colonnes attendues du fichier
 *   onImport     - (file) => Promise<axios response>
 *   onDone       - appele apres un import reussi (rechargement de la liste)
 *   disabled     - desactive le panneau (prerequis non remplis)
 *   raisonBlocage- message explicatif quand disabled est vrai
 */
export default function ImportPanel({
  titre = 'Importer un fichier Excel',
  description,
  colonnes = [],
  onImport,
  onDone,
  disabled = false,
  raisonBlocage,
}) {
  const [importing, setImporting] = useState(false);
  const [rapport, setRapport] = useState(null);
  const [survol, setSurvol] = useState(false);
  const inputRef = useRef(null);

  const telechargerModele = () => {
    const entetes = colonnes.map((c) => c.cle);
    const exemple = colonnes.map((c) => c.exemple ?? '');
    const ws = XLSX.utils.aoa_to_sheet([entetes, exemple]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Modele');
    XLSX.writeFile(wb, `modele_${titre.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.xlsx`);
  };

  const lancerImport = async (file) => {
    if (!file) return;
    setImporting(true);
    setRapport(null);
    try {
      const res = await onImport(file);
      setRapport(res.data);
      const { created = 0, updated = 0, skipped = 0, errors = [] } = res.data;
      if (errors.length && !created && !updated) {
        toast.error(`Aucune ligne importee : ${errors.length} erreur(s)`);
      } else {
        toast.success(
          `Import termine : ${created} creee(s), ${updated} mise(s) a jour, ${skipped} ignoree(s)`
        );
        onDone?.();
      }
    } catch (err) {
      const detail = err?.response?.data?.detail || "Erreur lors de l'import";
      setRapport({ created: 0, updated: 0, skipped: 0, errors: [{ ligne: '-', message: detail }] });
      toast.error(detail);
    } finally {
      setImporting(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setSurvol(false);
    if (disabled || importing) return;
    lancerImport(e.dataTransfer.files?.[0]);
  };

  return (
    <Card variant="outlined" sx={{ mb: 2, borderColor: disabled ? '#E0E0E0' : '#C7D0F0' }}>
      <CardContent>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#001EA6', mb: 0.5 }}>
          {titre}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {description}
          </Typography>
        )}

        {disabled && raisonBlocage && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {raisonBlocage}
          </Alert>
        )}

        {colonnes.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
            {colonnes.map((c) => (
              <Chip
                key={c.cle}
                size="small"
                label={c.requis ? `${c.cle} *` : c.cle}
                variant={c.requis ? 'filled' : 'outlined'}
                sx={c.requis ? { bgcolor: '#E8ECFB', color: '#001EA6', fontWeight: 600 } : undefined}
              />
            ))}
            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center', ml: 0.5 }}>
              * colonne obligatoire
            </Typography>
          </Box>
        )}

        <Box
          onDragOver={(e) => { e.preventDefault(); if (!disabled) setSurvol(true); }}
          onDragLeave={() => setSurvol(false)}
          onDrop={onDrop}
          sx={{
            border: '2px dashed',
            borderColor: survol ? '#001EA6' : '#D5DBE8',
            borderRadius: 2,
            bgcolor: survol ? '#F0F3FC' : '#FAFBFE',
            py: 3,
            textAlign: 'center',
            opacity: disabled ? 0.5 : 1,
            transition: 'all .15s',
          }}
        >
          <input
            type="file"
            accept=".xlsx,.xls"
            hidden
            ref={inputRef}
            onChange={(e) => lancerImport(e.target.files?.[0])}
          />
          {importing ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={26} />
              <Typography variant="body2" color="text.secondary">
                Import en cours...
              </Typography>
            </Box>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Glissez votre fichier Excel ici
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<FileUpload />}
                  disabled={disabled}
                  onClick={() => inputRef.current?.click()}
                  sx={{ bgcolor: '#001EA6', '&:hover': { bgcolor: '#001080' } }}
                >
                  Choisir un fichier
                </Button>
                {colonnes.length > 0 && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<FileDownload />}
                    onClick={telechargerModele}
                  >
                    Telecharger le modele
                  </Button>
                )}
              </Box>
            </>
          )}
        </Box>

        <Collapse in={!!rapport}>
          {rapport && <RapportImport rapport={rapport} />}
        </Collapse>
      </CardContent>
    </Card>
  );
}

function RapportImport({ rapport }) {
  const { created = 0, updated = 0, skipped = 0, errors = [] } = rapport;
  const succes = created + updated;

  return (
    <Box sx={{ mt: 2 }}>
      <Alert
        severity={errors.length ? (succes ? 'warning' : 'error') : 'success'}
        icon={errors.length ? <ErrorOutline /> : <CheckCircle />}
      >
        <AlertTitle sx={{ fontWeight: 700 }}>
          {errors.length
            ? `${succes} ligne(s) importee(s), ${errors.length} en erreur`
            : `${succes} ligne(s) importee(s)`}
        </AlertTitle>
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 0.5 }}>
          <Chip size="small" label={`${created} creee(s)`} />
          <Chip size="small" label={`${updated} mise(s) a jour`} />
          <Chip size="small" label={`${skipped} ignoree(s)`} />
        </Box>
      </Alert>

      {errors.length > 0 && (
        <Box sx={{ mt: 1.5, maxHeight: 240, overflow: 'auto', border: '1px solid #EEE', borderRadius: 1 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, width: 90 }}>Ligne</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Motif</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {errors.map((e, i) => (
                <TableRow key={i}>
                  <TableCell>{e.ligne}</TableCell>
                  <TableCell sx={{ color: '#B3261E' }}>{e.message}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Box>
  );
}
