import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Skeleton,
  Chip,
  Autocomplete,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
  CircularProgress,
} from '@mui/material';
import { Add, Edit, Delete, FileUpload, Close, DeleteForever } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import DepartmentSelector from '../../components/common/DepartmentSelector';
import { unitesEnseignementService, usersService, niveauxService, semestresService, departementsService, filieresService } from '../../api/services';
import { useConfig } from '../../contexts/ConfigContext';
import toast from 'react-hot-toast';

export default function UEsPage() {
  const { anneeActive, refreshKey } = useConfig();
  const [items, setItems] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [niveaux, setNiveaux] = useState([]);
  const [semestres, setSemestres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ code_ue: '', libelle_ue: '', semestre_obj: '', enseignants: [], niveaux: [] });
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Department filter
  const [selectedDept, setSelectedDept] = useState('');
  const [departments, setDepartments] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [formFiliere, setFormFiliere] = useState('');

  // Import CSV/Excel state
  const fileInputRef = useRef(null);
  const [importRows, setImportRows] = useState([]);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importSemestre, setImportSemestre] = useState('');
  const [importNiveaux, setImportNiveaux] = useState([]);
  const [importFiliere, setImportFiliere] = useState('');
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);

  const load = async () => {
    try {
      const [ueRes, usrRes, nivRes, semRes, deptRes, filRes] = await Promise.all([
        unitesEnseignementService.getAll(),
        usersService.getAll(),
        niveauxService.getAll(),
        semestresService.getAll(anneeActive ? { annee_academique: anneeActive.id } : {}),
        departementsService.getAll(),
        filieresService.getAll(),
      ]);
      setItems(ueRes.data);
      setEnseignants(usrRes.data.filter((u) =>
        u.roles?.some((r) => (r.nom_role || r) === 'Enseignant')
      ));
      setNiveaux(nivRes.data);
      const semData = Array.isArray(semRes.data?.results) ? semRes.data.results : (Array.isArray(semRes.data) ? semRes.data : []);
      setSemestres(semData);
      setDepartments(deptRes.data);
      setFilieres(filRes.data);
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error('Session expiree, veuillez vous reconnecter');
      } else {
        toast.error('Erreur chargement des donnees');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [refreshKey]);

  // Filter UEs by department (client-side via niveaux_details filiere_nom)
  const filteredItems = useMemo(() => {
    if (!selectedDept) return items;
    const deptFiliereNames = filieres
      .filter((f) => f.departement === Number(selectedDept) || f.departement_id === Number(selectedDept))
      .map((f) => f.nom_filiere);
    return items.filter((ue) => {
      const nivs = ue.niveaux_details || [];
      return nivs.some((nd) => deptFiliereNames.includes(nd.filiere_nom));
    });
  }, [items, selectedDept, filieres]);

  // Filter niveaux by selected department for dialogs
  const filteredNiveaux = useMemo(() => {
    if (!selectedDept) return niveaux;
    const deptFiliereIds = filieres
      .filter((f) => f.departement === Number(selectedDept) || f.departement_id === Number(selectedDept))
      .map((f) => f.id);
    return niveaux.filter((n) => deptFiliereIds.includes(n.filiere || n.filiere_id));
  }, [niveaux, selectedDept, filieres]);

  const handleClose = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm({ code_ue: '', libelle_ue: '', semestre_obj: '', enseignants: [], niveaux: [] });
  };

  const handleOpen = (item = null) => {
    if (item && item.id) {
      setEditing(item);
      setForm({
        code_ue: item.code_ue || '',
        libelle_ue: item.libelle_ue || '',
        semestre_obj: item.semestre_obj || '',
        enseignants: item.enseignants || [],
        niveaux: item.niveaux || [],
      });
    } else {
      setEditing(null);
      setForm({ code_ue: '', libelle_ue: '', semestre_obj: semestres[0]?.id || '', enseignants: [], niveaux: [] });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.code_ue.trim() || !form.libelle_ue.trim()) return;
    setSaving(true);
    try {
      const data = {
        code_ue: form.code_ue.toUpperCase(),
        libelle_ue: form.libelle_ue,
        semestre_obj: form.semestre_obj || null,
        enseignants: form.enseignants.map((e) => (typeof e === 'object' ? e.id : e)),
        niveaux: form.niveaux.map((n) => (typeof n === 'object' ? n.id : n)),
      };
      if (editing && editing.id) {
        await unitesEnseignementService.update(editing.id, data);
        toast.success('UE modifiee');
      } else {
        await unitesEnseignementService.create(data);
        toast.success('UE creee');
      }
      handleClose();
      load();
    } catch (err) {
      const detail = err.response?.data;
      let msg = 'Erreur sauvegarde';
      if (typeof detail === 'string') {
        msg = detail;
      } else if (detail?.detail) {
        msg = detail.detail;
      } else if (detail?.non_field_errors?.[0]) {
        msg = detail.non_field_errors[0];
      } else if (detail && typeof detail === 'object') {
        msg = Object.entries(detail).map(([k, v]) => `${k}: ${[].concat(v).join(', ')}`).join(' | ');
      }
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await unitesEnseignementService.delete(deleteId);
      toast.success('UE supprimee');
      setDeleteOpen(false);
      load();
    } catch {
      toast.error('Erreur suppression');
    }
  };

  const handleDeleteAll = async () => {
    try {
      const res = await unitesEnseignementService.deleteAll();
      toast.success(`${res.data.deleted} UE(s) supprimee(s)`);
      setDeleteAllOpen(false);
      load();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  // --- Import CSV/Excel logic ---
  const normalizeHeader = (h) => {
    const key = String(h).trim().toLowerCase().replace(/[\s_-]+/g, '_');
    if (['code', 'code_ue', 'codes_2025_2026', 'code_ue_intitulé'].includes(key)) return 'code';
    if (['libelle', 'libelle_ue', 'libellé', 'libellé_ue', 'intitulé', 'intitule'].includes(key)) return 'libelle';
    if (['semestre', 'semestre_obj', 'sem'].includes(key)) return 'semestre';
    if (['niveau'].includes(key)) return 'niveau';
    if (['enseignant'].includes(key)) return 'enseignant';
    return key;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (!raw.length) {
          toast.error('Le fichier est vide');
          return;
        }

        const headerMap = {};
        Object.keys(raw[0]).forEach((h) => { headerMap[h] = normalizeHeader(h); });

        const rows = raw.map((row, idx) => {
          const mapped = {};
          Object.entries(row).forEach(([k, v]) => { mapped[headerMap[k]] = String(v).trim(); });
          return {
            _idx: idx,
            code: mapped.code || '',
            libelle: mapped.libelle || '',
            semestre: mapped.semestre || '',
            niveau: mapped.niveau || '',
            enseignant: mapped.enseignant || '',
          };
        });

        setImportRows(rows);
        setImportDialogOpen(true);
      } catch {
        toast.error('Impossible de lire le fichier');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const removeImportRow = (idx) => {
    setImportRows((prev) => prev.filter((r) => r._idx !== idx));
  };

  const isRowValid = (row) => row.code.trim() !== '' && row.libelle.trim() !== '';

  // La deduction du niveau depuis le code UE et la resolution du semestre sont
  // desormais assurees par le serveur (common/import_utils.py), afin que les
  // memes regles s'appliquent a tous les points d'entree.

  // Match enseignant by partial name (case-insensitive)
  const resolveEnseignant = (name) => {
    if (!name) return null;
    const lower = name.trim().toLowerCase();
    if (!lower) return null;
    return enseignants.find((e) => {
      const fullName = `${e.first_name} ${e.last_name}`.toLowerCase();
      const lastName = (e.last_name || '').toLowerCase();
      return fullName.includes(lower) || lastName.includes(lower) || lower.includes(lastName);
    }) || null;
  };

  const handleImport = async () => {
    const validRows = importRows.filter(isRowValid);
    if (!validRows.length) return;

    setImporting(true);

    // Les lignes eventuellement corrigees ou retirees dans l'apercu sont
    // renvoyees sous forme d'un classeur, traite en un seul appel par le
    // serveur (transaction unique, au lieu d'une requete par UE).
    const entetes = ['code', 'libelle', 'semestre', 'niveau', 'enseignant'];
    const donnees = validRows.map((row) => [
      row.code.trim(),
      row.libelle.trim(),
      row.semestre || importSemestre || '',
      row.niveau || '',
      row.enseignant || '',
    ]);
    const ws = XLSX.utils.aoa_to_sheet([entetes, ...donnees]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'UEs');
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const fichier = new File([buffer], 'import_ues.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    try {
      const semestreNumero = importSemestre
        ? semestres.find((s) => s.id === Number(importSemestre))?.numero
        : undefined;
      const res = await unitesEnseignementService.import(fichier, {
        filiere: importFiliere,
        semestre: semestreNumero,
        niveaux: importNiveaux
          .map((n) => (typeof n === 'object' ? n.id : n))
          .join(','),
      });

      const { created = 0, updated = 0, errors = [] } = res.data;
      const parts = [];
      if (created) parts.push(`${created} creee(s)`);
      if (updated) parts.push(`${updated} mise(s) a jour`);
      if (errors.length) parts.push(`${errors.length} en erreur`);

      if (created || updated) {
        toast.success(parts.join(', ') || 'Import termine');
      }
      if (errors.length) {
        toast.error(`Ligne ${errors[0].ligne} : ${errors[0].message}`);
      }

      setImportDialogOpen(false);
      setImportRows([]);
      setImportSemestre('');
      setImportNiveaux([]);
      setImportFiliere('');
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Erreur lors de l'import");
    } finally {
      setImporting(false);
      load();
    }
  };

  const validCount = importRows.filter(isRowValid).length;

  const columns = [
    { field: 'code_ue', label: 'Code' },
    { field: 'libelle_ue', label: 'Libelle' },
    {
      field: 'semestre_info',
      label: 'Semestre',
      render: (r) => {
        const info = r.semestre_info;
        if (info) return <Chip label={`S${info.numero}`} size="small" variant="outlined" />;
        return '-';
      },
    },
    {
      field: 'enseignants',
      label: 'Enseignants',
      sortable: false,
      render: (r) => {
        const names = r.enseignants_details || r.enseignants || [];
        return (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {names.slice(0, 2).map((e, i) => (
              <Chip key={i} label={typeof e === 'object' ? `${e.first_name} ${e.last_name}` : e} size="small" />
            ))}
            {names.length > 2 && <Chip label={`+${names.length - 2}`} size="small" />}
          </Box>
        );
      },
    },
    {
      field: 'niveaux',
      label: 'Niveaux',
      sortable: false,
      render: (r) => {
        const nivs = r.niveaux_details || r.niveaux || [];
        return (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {nivs.slice(0, 2).map((n, i) => (
              <Chip key={i} label={typeof n === 'object' ? `${n.filiere_nom || ''} ${n.nom_niveau}`.trim() : n} size="small" variant="outlined" />
            ))}
            {nivs.length > 2 && <Chip label={`+${nivs.length - 2}`} size="small" variant="outlined" />}
          </Box>
        );
      },
    },
  ];

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={48} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={300} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  return (
    <Box className="fade-in">
      <PageHeader
        title="Unites d'enseignement"
        description="Gestion des UEs"
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            {items.length > 0 && (
              <Button variant="outlined" color="error" startIcon={<DeleteForever />} onClick={() => setDeleteAllOpen(true)}>
                Tout supprimer
              </Button>
            )}
            <Button variant="outlined" startIcon={<FileUpload />} onClick={() => fileInputRef.current?.click()}>
              Importer
            </Button>
            <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
              Ajouter
            </Button>
          </Box>
        }
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        hidden
        onChange={handleFileSelect}
      />

      <DepartmentSelector value={selectedDept} onChange={setSelectedDept} departments={departments} />

      <Card>
        <CardContent sx={{ p: 0 }}>
          <DataTable
            columns={columns}
            rows={filteredItems}
            searchFields={['code_ue', 'libelle_ue']}
            actions={(row) => (
              <>
                <Tooltip title="Modifier">
                  <IconButton size="small" onClick={() => handleOpen(row)}>
                    <Edit fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Supprimer">
                  <IconButton size="small" sx={{ color: '#EF4444' }} onClick={() => { setDeleteId(row.id); setDeleteOpen(true); }}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editing ? 'Modifier l\'UE' : 'Nouvelle UE'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Code UE"
            fullWidth
            value={form.code_ue}
            onChange={(e) => setForm({ ...form, code_ue: e.target.value.toUpperCase() })}
            inputProps={{ style: { textTransform: 'uppercase' } }}
          />
          <TextField
            label="Libelle"
            fullWidth
            value={form.libelle_ue}
            onChange={(e) => setForm({ ...form, libelle_ue: e.target.value })}
          />
          <TextField
            select
            label="Semestre"
            fullWidth
            value={form.semestre_obj}
            onChange={(e) => setForm({ ...form, semestre_obj: e.target.value })}
          >
            {semestres.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                Semestre {s.numero}
              </MenuItem>
            ))}
          </TextField>
          <Autocomplete
            multiple
            options={enseignants}
            getOptionLabel={(o) => typeof o === 'object' ? `${o.first_name} ${o.last_name}` : String(o)}
            value={form.enseignants.map((e) => typeof e === 'object' ? e : enseignants.find((x) => x.id === e) || e)}
            onChange={(_, val) => setForm({ ...form, enseignants: val })}
            isOptionEqualToValue={(opt, val) => opt.id === (val?.id || val)}
            renderInput={(params) => <TextField {...params} label="Enseignants" />}
          />
          <TextField
            select
            label="Filtrer par filiere"
            fullWidth
            value={formFiliere}
            onChange={(e) => setFormFiliere(e.target.value)}
          >
            <MenuItem value="">Toutes les filieres</MenuItem>
            {filieres
              .filter((f) => !selectedDept || f.departement === Number(selectedDept) || f.departement_id === Number(selectedDept))
              .map((f) => (
                <MenuItem key={f.id} value={f.id}>
                  {f.nom_filiere}
                </MenuItem>
              ))}
          </TextField>
          <Autocomplete
            multiple
            options={formFiliere
              ? filteredNiveaux.filter((n) => (n.filiere || n.filiere_id) === Number(formFiliere))
              : filteredNiveaux
            }
            getOptionLabel={(o) => typeof o === 'object' ? `${o.nom_filiere || o.filiere_nom || ''} ${o.nom_niveau}`.trim() : String(o)}
            value={form.niveaux.map((n) => typeof n === 'object' ? n : niveaux.find((x) => x.id === n) || n)}
            onChange={(_, val) => setForm({ ...form, niveaux: val })}
            isOptionEqualToValue={(opt, val) => opt.id === (val?.id || val)}
            renderInput={(params) => <TextField {...params} label={`Niveaux${formFiliere ? ' (filtre par filiere)' : selectedDept ? ' (filtre par departement)' : ''}`} />}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} color="inherit">Annuler</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving || !form.code_ue.trim() || !form.libelle_ue.trim()}>
            {saving ? 'Sauvegarde...' : (editing ? 'Modifier' : 'Creer')}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer l'UE"
        message="Etes-vous sur de vouloir supprimer cette unite d'enseignement ?"
        confirmText="Supprimer"
        confirmColor="error"
      />

      <ConfirmDialog
        open={deleteAllOpen}
        onClose={() => setDeleteAllOpen(false)}
        onConfirm={handleDeleteAll}
        title="Supprimer toutes les UEs"
        message={`Etes-vous sur de vouloir supprimer les ${items.length} UE(s) ? Cette action est irreversible.`}
        confirmText="Tout supprimer"
        confirmColor="error"
      />

      {/* Import preview dialog */}
      <Dialog open={importDialogOpen} onClose={() => !importing && setImportDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Apercu de l&apos;import ({importRows.length} ligne{importRows.length > 1 ? 's' : ''})
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ px: 3, pt: 2, pb: 1 }}>
            <TextField
              select
              size="small"
              label="Semestre par defaut (applique si absent du fichier)"
              fullWidth
              value={importSemestre}
              onChange={(e) => setImportSemestre(e.target.value)}
            >
              <MenuItem value="">-- Aucun --</MenuItem>
              {semestres.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  Semestre {s.numero}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Filiere (pour detection auto du niveau)"
              fullWidth
              value={importFiliere}
              onChange={(e) => setImportFiliere(e.target.value)}
              sx={{ mt: 1.5 }}
              helperText={importFiliere ? 'Le niveau sera detecte automatiquement depuis le code UE (ex: INF3xx → L3)' : ''}
            >
              <MenuItem value="">-- Aucune (pas de detection auto) --</MenuItem>
              {filieres
                .filter((f) => !selectedDept || f.departement === Number(selectedDept) || f.departement_id === Number(selectedDept))
                .map((f) => (
                  <MenuItem key={f.id} value={f.id}>
                    {f.nom_filiere}
                  </MenuItem>
                ))}
            </TextField>
            <Autocomplete
              multiple
              size="small"
              options={filteredNiveaux}
              getOptionLabel={(o) => typeof o === 'object' ? `${o.nom_filiere || o.filiere_nom || ''} ${o.nom_niveau}`.trim() : String(o)}
              value={importNiveaux}
              onChange={(_, val) => setImportNiveaux(val)}
              isOptionEqualToValue={(opt, val) => opt.id === (val?.id || val)}
              renderInput={(params) => <TextField {...params} label={`Niveaux supplementaires (optionnel)${selectedDept ? ' - filtre par departement' : ''}`} />}
              sx={{ mt: 1.5 }}
            />
          </Box>
          {importRows.length === 0 ? (
            <Typography sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>Aucune ligne</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Libelle</TableCell>
                  <TableCell>Semestre</TableCell>
                  {importRows.some((r) => r.niveau) && <TableCell>Niveau</TableCell>}
                  {importRows.some((r) => r.enseignant) && <TableCell>Enseignant</TableCell>}
                  <TableCell align="center" sx={{ width: 80 }}>Statut</TableCell>
                  <TableCell align="center" sx={{ width: 50 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {importRows.map((row) => {
                  const valid = isRowValid(row);
                  return (
                    <TableRow key={row._idx} sx={!valid ? { bgcolor: 'error.50' } : undefined}>
                      <TableCell>{row.code || <Typography variant="body2" color="error">Manquant</Typography>}</TableCell>
                      <TableCell>{row.libelle || <Typography variant="body2" color="error">Manquant</Typography>}</TableCell>
                      <TableCell>{row.semestre || '-'}</TableCell>
                      {importRows.some((r) => r.niveau) && <TableCell>{row.niveau || '-'}</TableCell>}
                      {importRows.some((r) => r.enseignant) && (
                        <TableCell>
                          {row.enseignant ? (
                            resolveEnseignant(row.enseignant)
                              ? <Chip label={row.enseignant} size="small" color="success" variant="outlined" />
                              : <Tooltip title="Non trouve dans les utilisateurs"><Chip label={row.enseignant} size="small" color="warning" variant="outlined" /></Tooltip>
                          ) : '-'}
                        </TableCell>
                      )}
                      <TableCell align="center">
                        {valid ? (
                          <Chip label="OK" size="small" color="success" variant="outlined" />
                        ) : (
                          <Chip label="Invalide" size="small" color="error" />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => removeImportRow(row._idx)} disabled={importing}>
                          <Close fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setImportDialogOpen(false)} color="inherit" disabled={importing}>
            Annuler
          </Button>
          <Button
            onClick={handleImport}
            variant="contained"
            disabled={importing || validCount === 0}
            startIcon={importing ? <CircularProgress size={18} color="inherit" /> : <FileUpload />}
          >
            {importing ? 'Import en cours...' : `Importer ${validCount} UE(s)`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
